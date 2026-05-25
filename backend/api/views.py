from django.contrib.auth import get_user_model
from django.db.models import F
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
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


class ChangePasswordView(generics.UpdateAPIView):
    """POST /api/auth/change-password/ - change own password."""

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
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
        return [IsAdminUserRole()]


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

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
            return [IsOwnerOrStaff()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(customer=user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def feedback(self, request, pk=None):
        appointment = self.get_object()

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

    @action(detail=True, methods=["patch"], permission_classes=[IsStaffRole])
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.select_related("user")
        if user.role == "admin":
            return queryset
        return queryset.filter(user=user)

    @action(detail=True, methods=["patch"])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"detail": "Notification marked as read."})


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsStaffRole]

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        items = InventoryItem.objects.filter(quantity__lte=F("threshold"))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class RestockRequestViewSet(viewsets.ModelViewSet):
    queryset = RestockRequest.objects.select_related("item").all()
    serializer_class = RestockRequestSerializer
    permission_classes = [IsStaffRole]


class InventoryUsageLogViewSet(viewsets.ModelViewSet):
    queryset = InventoryUsageLog.objects.select_related("item", "groomer").all()
    serializer_class = InventoryUsageLogSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffRole()]
        return [IsGroomerUserRole()]

    def perform_create(self, serializer):
        log = serializer.save(groomer=self.request.user)
        item = log.item
        item.quantity = max(0, item.quantity - log.quantity_used)
        item.save(update_fields=["quantity"])


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")

    def get_queryset(self):
        queryset = User.objects.all().order_by("username")
        if getattr(self.request.user, "role", None) == "admin":
            return queryset
        return queryset.filter(pk=self.request.user.pk)

    def get_permissions(self):
        if self.action in ("list", "create", "destroy", "reset_password"):
            return [IsAdminUserRole()]
        if self.action == "me":
            return [IsAuthenticated()]
        return [IsSelfOrAdmin()]

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

        if not new_password or len(new_password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.set_password(new_password)
        target.must_change_password = True
        target.save(update_fields=["password", "must_change_password"])
        return Response({"detail": f"Password reset for {target.username}. They must change it on next login."})
