"""Automated test suite for the Pawze backend API."""

from datetime import date, time, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Appointment, AuditLog, Notification, Pet, Service, User


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


class RegisterThrottleTest(APITestCase):
    def test_throttle_fires_on_sixth_request(self):
        url = reverse("auth-register")
        for i in range(5):
            self.client.post(
                url,
                {
                    "username": f"user{i}",
                    "email": f"user{i}@test.com",
                    "password": "TestPass123!",
                    "password_confirm": "TestPass123!",
                },
            )

        resp = self.client.post(
            url,
            {
                "username": "user6",
                "email": "user6@test.com",
                "password": "TestPass123!",
                "password_confirm": "TestPass123!",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class LoginResponseTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="login_user",
            email="login@test.com",
            password="Pass1234!",
            role="customer",
        )

    def test_login_returns_inline_user_payload(self):
        resp = self.client.post(
            reverse("auth-login"),
            {"username": "login_user", "password": "Pass1234!"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("user", resp.data)
        self.assertEqual(resp.data["user"]["username"], "login_user")

    def test_login_accepts_email_address(self):
        resp = self.client.post(
            reverse("auth-login"),
            {"username": "login@test.com", "password": "Pass1234!"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["user"]["email"], "login@test.com")


class UserEndpointTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_test",
            email="admin@test.com",
            password="AdminPass1!",
            role="admin",
        )
        self.customer = User.objects.create_user(
            username="customer_test",
            email="customer@test.com",
            password="CustomerPass1!",
            role="customer",
        )

    def test_me_endpoint_returns_current_user(self):
        token, _ = get_tokens_for_user(self.customer)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resp = self.client.get(reverse("user-me"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], self.customer.username)

    def test_admin_can_create_staff_account(self):
        token, _ = get_tokens_for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resp = self.client.post(
            reverse("user-list"),
            {
                "username": "groomer_one",
                "email": "groomer@test.com",
                "password": "GroomerPass1!",
                "first_name": "Groom",
                "last_name": "One",
                "role": "groomer",
                "must_change_password": True,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        created = User.objects.get(username="groomer_one")
        self.assertEqual(created.role, "groomer")
        self.assertTrue(created.must_change_password)


class XSSInputTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_xss",
            email="adminxss@test.com",
            password="AdminPass1!",
            role="admin",
        )
        self.token, _ = get_tokens_for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_xss_stripped_from_appointment_notes(self):
        service = Service.objects.create(name="Bath", duration=45, price=35000)
        groomer = User.objects.create_user(
            username="groomer_xss",
            email="g@test.com",
            password="GPass1!",
            role="groomer",
        )
        resp = self.client.post(
            reverse("appointment-list"),
            {
                "customer_name": "<script>alert(1)</script>Test",
                "pet_name": "Doggo",
                "service": service.id,
                "date": str(date.today() + timedelta(days=1)),
                "time": "10:00:00",
                "groomer": groomer.id,
                "status": "pending",
                "notes": "<b>bold</b><script>evil()</script>Normal text",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("<script>", resp.data["notes"])
        self.assertNotIn("<script>", resp.data["customer_name"])


class QuerysetScopingTest(APITestCase):
    def setUp(self):
        self.customer_a = User.objects.create_user(
            username="cust_a",
            email="a@test.com",
            password="Pass1234!",
            role="customer",
        )
        self.customer_b = User.objects.create_user(
            username="cust_b",
            email="b@test.com",
            password="Pass1234!",
            role="customer",
        )
        self.pet_a = Pet.objects.create(owner=self.customer_a, name="Fido", breed="Lab")
        self.pet_b = Pet.objects.create(owner=self.customer_b, name="Rex", breed="GSD")

    def test_customer_cannot_list_other_pets(self):
        token_a, _ = get_tokens_for_user(self.customer_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_a}")
        resp = self.client.get(reverse("pet-list"))
        ids = [pet["id"] for pet in resp.data]
        self.assertIn(self.pet_a.id, ids)
        self.assertNotIn(self.pet_b.id, ids)

    def test_customer_cannot_retrieve_other_pet(self):
        token_a, _ = get_tokens_for_user(self.customer_a)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_a}")
        resp = self.client.get(reverse("pet-detail", args=[self.pet_b.id]))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class FeedbackRatingValidationTest(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="cust_rate",
            email="rate@test.com",
            password="Pass1234!",
            role="customer",
        )
        groomer = User.objects.create_user(
            username="groom_rate",
            email="gr@test.com",
            password="Pass1234!",
            role="groomer",
        )
        service = Service.objects.create(name="Bath", duration=45, price=35000)
        self.appt = Appointment.objects.create(
            customer=self.customer,
            customer_name="Rate Test",
            pet_name="Pup",
            service=service,
            date=date.today() - timedelta(days=1),
            time=time(10, 0),
            groomer=groomer,
            status="completed",
        )
        self.token, _ = get_tokens_for_user(self.customer)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_rating_above_5_rejected(self):
        resp = self.client.post(reverse("appointment-feedback", args=[self.appt.id]), {"rating": 6})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_rating_accepted(self):
        resp = self.client.post(
            reverse("appointment-feedback", args=[self.appt.id]),
            {"rating": 4, "comments": "Great!"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class AppointmentDateTimeValidationTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="adm_dt",
            email="admdt@test.com",
            password="Admin123!",
            role="admin",
        )
        self.groomer = User.objects.create_user(
            username="grm_dt",
            email="grmdt@test.com",
            password="Admin123!",
            role="groomer",
        )
        self.service = Service.objects.create(name="Bath", duration=45, price=35000)
        self.token, _ = get_tokens_for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def _post(self, d, t):
        return self.client.post(
            reverse("appointment-list"),
            {
                "customer_name": "Tester",
                "pet_name": "Buddy",
                "service": self.service.id,
                "date": str(d),
                "time": t,
                "groomer": self.groomer.id,
                "status": "pending",
            },
        )

    def test_past_date_rejected(self):
        resp = self._post(date.today() - timedelta(days=1), "10:00:00")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_appointment_accepted(self):
        resp = self._post(date.today() + timedelta(days=1), "10:00:00")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class AppointmentStatusNotificationTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_notify",
            email="admin_notify@test.com",
            password="Admin123!",
            role="admin",
        )
        self.customer = User.objects.create_user(
            username="customer_notify",
            email="customer_notify@test.com",
            password="Customer123!",
            role="customer",
        )
        self.groomer = User.objects.create_user(
            username="groomer_notify",
            email="groomer_notify@test.com",
            password="Groomer123!",
            role="groomer",
        )
        service = Service.objects.create(name="Bath", duration=45, price=35000)
        self.appointment = Appointment.objects.create(
            customer=self.customer,
            customer_name="Notify Test",
            pet_name="Buddy",
            service=service,
            date=date.today() + timedelta(days=1),
            time=time(10, 0),
            groomer=self.groomer,
            status="pending",
        )
        token, _ = get_tokens_for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_status_change_creates_single_notification(self):
        resp = self.client.patch(
            reverse("appointment-update-status", args=[self.appointment.id]),
            {"status": "confirmed"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user=self.customer).count(), 1)


class AuditLogAndDashboardActionTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_audit",
            email="admin_audit@test.com",
            password="AdminPass123!",
            role="admin",
        )
        self.customer = User.objects.create_user(
            username="customer_audit",
            email="cust_audit@test.com",
            password="CustPass123!",
            role="customer",
        )

    def test_audit_log_creation_helper(self):
        log = AuditLog.log_action(
            user=self.admin,
            action="test_action",
            model_name="User",
            object_id=self.customer.id,
            changes={"role": "customer"}
        )
        self.assertEqual(AuditLog.objects.count(), 1)
        self.assertEqual(log.action, "test_action")
        self.assertEqual(log.user, self.admin)
        self.assertEqual(log.changes["role"], "customer")

    def test_must_change_password_flag_on_staff_creation(self):
        token, _ = get_tokens_for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resp = self.client.post(
            reverse("user-list"),
            {
                "username": "new_groomer_staff",
                "email": "staff@test.com",
                "password": "Temporary123!",
                "first_name": "Groom",
                "last_name": "Staff",
                "role": "groomer",
                "must_change_password": True,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(username="new_groomer_staff")
        self.assertTrue(new_user.must_change_password)

