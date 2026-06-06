from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import F
from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Appointment,
    InventoryItem,
    InventoryUsageLog,
    Notification,
    Pet,
    RestockRequest,
    Service,
    User,
)
from .permissions import (
    IsAdminUserRole,
    IsGroomerUserRole,
    IsOwnerOrStaff,
    IsPasswordChangeComplete,
    IsSelfOrAdmin,
    IsStaffRole,
)
from .serializers import (
    AppointmentFeedbackSerializer,
    AppointmentSerializer,
    ChangePasswordSerializer,
    InventoryItemSerializer,
    InventoryUsageLogSerializer,
    NotificationSerializer,
    PetSerializer,
    RegisterSerializer,
    RestockRequestSerializer,
    ServiceSerializer,
    UserAdminCreateSerializer,
    UserPublicSerializer,
    UserSelfSerializer,
)


class AuthRateThrottle(AnonRateThrottle):
    rate = "5/minute"
    scope = "auth"


class PawzeTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow login with username or email and return the user payload inline."""

    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        username = attrs.get(self.username_field, "")
        if username and "@" in username:
            matched = get_user_model().objects.filter(email__iexact=username).first()
            if matched:
                attrs[self.username_field] = matched.get_username()

        data = super().validate(attrs)
        data["user"] = UserPublicSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    serializer_class = PawzeTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - create a customer account, return tokens."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserPublicSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ - change own password."""

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        return Response({"detail": "Password updated successfully."})


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUserRole(), IsPasswordChangeComplete()]


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Pet.objects.select_related("owner")
        if user.role == "customer":
            return queryset.filter(owner=user)
        return queryset

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy", "retrieve"):
            return [IsOwnerOrStaff(), IsPasswordChangeComplete()]
        return [IsAuthenticated(), IsPasswordChangeComplete()]

    def perform_create(self, serializer):
        if self.request.user.role == "customer":
            serializer.save(owner=self.request.user)
            return
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        queryset = Pet.objects.select_related("owner")
        if user.role == "customer":
            return queryset.filter(owner=user)
        return queryset

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy", "retrieve"):
            return [IsOwnerOrStaff()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        if self.request.user.role == "customer":
            serializer.save(owner=self.request.user)
            return
        serializer.save()


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = Appointment.objects.select_related("customer", "pet", "service", "groomer")
        user = self.request.user
        if user.role == "admin":
            return queryset
        if user.role == "groomer":
            return queryset.filter(groomer=user)
        return queryset.filter(customer=user)

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action in ("update", "partial_update", "destroy"):
            return [IsOwnerOrStaff(), IsPasswordChangeComplete()]
        if self.action in ("feedback", "update_status"):
            return [IsAuthenticated(), IsPasswordChangeComplete()]
        return [IsAuthenticated(), IsPasswordChangeComplete()]

    def perform_create(self, serializer):
        user = self.request.user if (self.request.user.is_authenticated and self.request.user.role == "customer") else None
        serializer.save(customer=user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsPasswordChangeComplete])
    def feedback(self, request, pk=None):
        appointment = self.get_object()

        if appointment.customer != request.user:
            return Response({"detail": "You may only submit feedback for your own completed appointment."}, status=status.HTTP_403_FORBIDDEN)

        if appointment.status != "completed":
            return Response(
                {"detail": "Feedback can only be submitted for completed appointments."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(appointment, "feedback"):
            return Response(
                {"detail": "Feedback has already been submitted for this appointment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AppointmentFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(appointment=appointment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], permission_classes=[IsStaffRole, IsPasswordChangeComplete])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get("status")
        allowed = [choice for choice, _ in Appointment.STATUS_CHOICES]

        if new_status not in allowed:
            return Response({"status": f"Must be one of {allowed}."}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = new_status
        appointment.save(update_fields=["status"])
        return Response(AppointmentSerializer(appointment).data)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "mark_read"):
            return [IsAuthenticated(), IsPasswordChangeComplete()]
        return [IsAdminUserRole(), IsPasswordChangeComplete()]

    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.select_related("user")
        if user.role == "admin":
            return queryset
        return queryset.filter(user=user)

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated, IsPasswordChangeComplete])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"detail": "Notification marked as read."})


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsStaffRole, IsPasswordChangeComplete]

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        items = InventoryItem.objects.filter(quantity__lte=F("threshold"))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class RestockRequestViewSet(viewsets.ModelViewSet):
    queryset = RestockRequest.objects.select_related("item").all()
    serializer_class = RestockRequestSerializer
    permission_classes = [IsStaffRole, IsPasswordChangeComplete]

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUserRole, IsPasswordChangeComplete])
    def approve(self, request, pk=None):
        req = self.get_object()
        if req.status != "pending":
            return Response({"detail": "Restock request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        req.status = "approved"
        req.save(update_fields=["status"])
        return Response(RestockRequestSerializer(req).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUserRole, IsPasswordChangeComplete])
    def complete(self, request, pk=None):
        req = self.get_object()
        if req.status != "approved":
            return Response({"detail": "Restock request must be approved first."}, status=status.HTTP_400_BAD_REQUEST)

        item = req.item
        item.quantity += req.quantity
        item.save(update_fields=["quantity"])

        req.status = "completed"
        req.save(update_fields=["status"])
        return Response(RestockRequestSerializer(req).data)


class InventoryUsageLogViewSet(viewsets.ModelViewSet):
    queryset = InventoryUsageLog.objects.select_related("item", "groomer").all()
    serializer_class = InventoryUsageLogSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffRole(), IsPasswordChangeComplete()]
        return [IsGroomerUserRole(), IsPasswordChangeComplete()]

    def perform_create(self, serializer):
        item = serializer.validated_data["item"]
        quantity_used = serializer.validated_data["quantity_used"]

        with transaction.atomic():
            item = InventoryItem.objects.select_for_update().get(pk=item.pk)
            if item.quantity < quantity_used:
                raise serializers.ValidationError(
                    {"quantity_used": "Not enough stock to log this usage."}
                )

            log = serializer.save(groomer=self.request.user)
            item.quantity -= quantity_used
            item.save(update_fields=["quantity"])
            return log


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")

    def get_queryset(self):
        queryset = User.objects.all().order_by("username")
        if getattr(self.request.user, "role", None) == "admin":
            return queryset
        return queryset.filter(pk=self.request.user.pk)

    def get_permissions(self):
        if self.action in ("list", "create", "destroy", "reset_password"):
            return [IsAdminUserRole(), IsPasswordChangeComplete()]
        if self.action == "me":
            return [IsAuthenticated(), IsPasswordChangeComplete()]
        return [IsSelfOrAdmin(), IsPasswordChangeComplete()]

    def get_serializer_class(self):
        if self.action == "create":
            return UserAdminCreateSerializer
        if self.action in ("update", "partial_update", "me"):
            return UserSelfSerializer
        return UserPublicSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=["get", "patch"], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method.lower() == "get":
            return Response(UserSelfSerializer(request.user).data)

        serializer = UserSelfSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        target = self.get_object()
        new_password = request.data.get("new_password")

        if not new_password:
            return Response(
                {"detail": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, target)
        except DjangoValidationError as exc:
            return Response({"new_password": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        target.set_password(new_password)
        target.must_change_password = True
        target.save(update_fields=["password", "must_change_password"])
        return Response({"detail": f"Password reset for {target.username}. They must change it on next login."})
