"""
Automated test suite for the Pawze backend API.

Run with: python manage.py test
"""

from datetime import date, time, timedelta

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Appointment, InventoryItem, Pet, Service, User


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


class RegisterThrottleTest(APITestCase):
    """Registration endpoint must throttle after 5 requests/minute."""

    def test_throttle_fires_on_sixth_request(self):
        url = reverse('auth-register')
        for i in range(5):
            self.client.post(url, {
                'username': f'user{i}',
                'email': f'user{i}@test.com',
                'password': 'TestPass123!',
                'password_confirm': 'TestPass123!',
            })
        resp = self.client.post(url, {
            'username': 'user6',
            'email': 'user6@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
        })
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class XSSInputTest(APITestCase):
    """Text inputs must be sanitized of HTML/script tags."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_test', email='admin@test.com', password='AdminPass1!', role='admin'
        )
        self.token, _ = get_tokens_for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_xss_stripped_from_appointment_notes(self):
        service = Service.objects.create(name='Bath', duration=45, price=35000)
        groomer = User.objects.create_user(
            username='groomer_xss', email='g@test.com', password='GPass1!', role='groomer'
        )
        url = reverse('appointment-list')
        payload = {
            'customer_name': '<script>alert(1)</script>Test',
            'pet_name': 'Doggo',
            'service': service.id,
            'date': str(date.today() + timedelta(days=1)),
            'time': '10:00:00',
            'groomer': groomer.id,
            'status': 'pending',
            'notes': '<b>bold</b><script>evil()</script>Normal text',
        }
        resp = self.client.post(url, payload)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('<script>', resp.data['notes'])
        self.assertNotIn('<script>', resp.data['customer_name'])

    def test_xss_stripped_from_inventory_name(self):
        url = reverse('inventory-list')
        payload = {
            'name': '<img src=x onerror=alert(1)>Shampoo',
            'category': 'Consumable',
            'quantity': 10,
            'unit': 'bottles',
            'threshold': 2,
        }
        resp = self.client.post(url, payload)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('<img', resp.data['name'])


class QuerysetScopingTest(APITestCase):
    """Customers must NOT be able to access other customers' records."""

    def setUp(self):
        self.customer_a = User.objects.create_user(
            username='cust_a', email='a@test.com', password='Pass1234!', role='customer'
        )
        self.customer_b = User.objects.create_user(
            username='cust_b', email='b@test.com', password='Pass1234!', role='customer'
        )
        self.pet_a = Pet.objects.create(owner=self.customer_a, name='Fido', breed='Lab')
        self.pet_b = Pet.objects.create(owner=self.customer_b, name='Rex', breed='GSD')

    def test_customer_cannot_list_other_pets(self):
        token_a, _ = get_tokens_for_user(self.customer_a)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
        resp = self.client.get(reverse('pet-list'))
        ids = [p['id'] for p in resp.data]
        self.assertIn(self.pet_a.id, ids)
        self.assertNotIn(self.pet_b.id, ids)

    def test_customer_cannot_retrieve_other_pet(self):
        token_a, _ = get_tokens_for_user(self.customer_a)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
        resp = self.client.get(reverse('pet-detail', args=[self.pet_b.id]))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class FeedbackRatingValidationTest(APITestCase):
    """Feedback rating must be rejected if outside 1–5."""

    def setUp(self):
        self.customer = User.objects.create_user(
            username='cust_rate', email='rate@test.com', password='Pass1234!', role='customer'
        )
        groomer = User.objects.create_user(
            username='groom_rate', email='gr@test.com', password='Pass1234!', role='groomer'
        )
        service = Service.objects.create(name='Bath', duration=45, price=35000)
        self.appt = Appointment.objects.create(
            customer=self.customer,
            customer_name='Rate Test',
            pet_name='Pup',
            service=service,
            date=date.today() - timedelta(days=1),
            time=time(10, 0),
            groomer=groomer,
            status='completed',
        )
        self.token, _ = get_tokens_for_user(self.customer)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_rating_above_5_rejected(self):
        url = reverse('appointment-feedback', args=[self.appt.id])
        resp = self.client.post(url, {'rating': 6})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_rating_rejected(self):
        url = reverse('appointment-feedback', args=[self.appt.id])
        resp = self.client.post(url, {'rating': -1})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_rating_accepted(self):
        url = reverse('appointment-feedback', args=[self.appt.id])
        resp = self.client.post(url, {'rating': 4, 'comments': 'Great!'})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class AppointmentDateTimeValidationTest(APITestCase):
    """Past dates and out-of-hours times must be rejected."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='adm_dt', email='admdt@test.com', password='Admin123!', role='admin'
        )
        self.groomer = User.objects.create_user(
            username='grm_dt', email='grmdt@test.com', password='Admin123!', role='groomer'
        )
        self.service = Service.objects.create(name='Bath', duration=45, price=35000)
        self.token, _ = get_tokens_for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def _post(self, d, t):
        return self.client.post(reverse('appointment-list'), {
            'customer_name': 'Tester',
            'pet_name': 'Buddy',
            'service': self.service.id,
            'date': str(d),
            'time': t,
            'groomer': self.groomer.id,
            'status': 'pending',
        })

    def test_past_date_rejected(self):
        resp = self._post(date.today() - timedelta(days=1), '10:00:00')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_before_hours_rejected(self):
        resp = self._post(date.today() + timedelta(days=1), '07:00:00')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_after_hours_rejected(self):
        resp = self._post(date.today() + timedelta(days=1), '20:00:00')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_appointment_accepted(self):
        resp = self._post(date.today() + timedelta(days=1), '10:00:00')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
