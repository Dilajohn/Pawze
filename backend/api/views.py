from django.contrib.auth import update_session_auth_hash
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Appointment,
    AppointmentFeedback,
    InventoryItem,
    InventoryUsageLog,
    Notification,
    Pet,
    RestockRequest,
    Service,
    User,
)
from .permissions import IsAdminUserRole, IsGroomerUserRole, IsOwnerOrStaff, IsStaffRole
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
    UserPublicSerializer,
)


class AuthRateThrottle(AnonRateThrottle):
    rate = '5/minute'
    scope = 'auth'


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create a customer account, return tokens."""
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
                'user': UserPublicSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class ChangePasswordView(generics.UpdateAPIView):
    """POST /api/auth/change-password/ — change own password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.must_change_password = False
        user.save()

        return Response({'detail': 'Password updated successfully.'})


# ---------------------------------------------------------------------------
# Services (public read, admin write)
# ---------------------------------------------------------------------------

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminUserRole()]


# ---------------------------------------------------------------------------
# Pets — customers own their own pets; staff can read all
# ---------------------------------------------------------------------------

class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            return Pet.objects.filter(owner=user)
        return Pet.objects.all()

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy', 'retrieve'):
            return [IsOwnerOrStaff()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Customers always own their own pets
        if self.request.user.role == 'customer':
            serializer.save(owner=self.request.user)
        else:
            serializer.save()


# ---------------------------------------------------------------------------
# Appointments — scoped by role
# ---------------------------------------------------------------------------

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Appointment.objects.select_related('customer', 'pet', 'service', 'groomer').all()
        if user.role == 'groomer':
            return Appointment.objects.filter(groomer=user)
        # customer
        return Appointment.objects.filter(customer=user)

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]   # public booking
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsOwnerOrStaff()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(customer=user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def feedback(self, request, pk=None):
        """POST /api/appointments/{id}/feedback/ — submit feedback."""
        appointment = self.get_object()

        if appointment.status != 'completed':
            return Response(
                {'detail': 'Feedback can only be submitted for completed appointments.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(appointment, 'feedback'):
            return Response(
                {'detail': 'Feedback has already been submitted for this appointment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AppointmentFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(appointment=appointment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[IsStaffRole])
    def update_status(self, request, pk=None):
        """PATCH /api/appointments/{id}/update_status/ — staff can change status."""
        appointment = self.get_object()
        new_status = request.data.get('status')
        allowed = [s[0] for s in Appointment.STATUS_CHOICES]

        if new_status not in allowed:
            return Response({'status': f'Must be one of {allowed}.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = new_status
        appointment.save()

        # Notify the customer
        if appointment.customer:
            Notification.objects.create(
                user=appointment.customer,
                title='Appointment status updated',
                message=f'Your appointment for {appointment.pet_name} is now {new_status}.',
                notification_type='status',
            )

        return Response(AppointmentSerializer(appointment).data)


# ---------------------------------------------------------------------------
# Notifications — customers see their own only
# ---------------------------------------------------------------------------

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Notification.objects.all()
        return Notification.objects.filter(user=user)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'detail': 'Notification marked as read.'})


# ---------------------------------------------------------------------------
# Inventory — staff only
# ---------------------------------------------------------------------------

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsStaffRole]

    def perform_destroy(self, instance):
        # Check low-stock email before deletion
        instance.delete()

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """GET /api/inventory/low_stock/ — items at or below their threshold."""
        items = [item for item in InventoryItem.objects.all() if item.is_low_stock]
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class RestockRequestViewSet(viewsets.ModelViewSet):
    queryset = RestockRequest.objects.select_related('item').all()
    serializer_class = RestockRequestSerializer
    permission_classes = [IsStaffRole]


class InventoryUsageLogViewSet(viewsets.ModelViewSet):
    queryset = InventoryUsageLog.objects.select_related('item', 'groomer').all()
    serializer_class = InventoryUsageLogSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsStaffRole()]
        return [IsGroomerUserRole()]

    def perform_create(self, serializer):
        log = serializer.save(groomer=self.request.user)

        # Deduct from inventory
        item = log.item
        item.quantity = max(0, item.quantity - log.quantity_used)
        item.save()

        # Low-stock email alert
        if item.is_low_stock:
            send_mail(
                subject=f'[Pawze] Low stock alert: {item.name}',
                message=(
                    f'{item.name} is running low.\n'
                    f'Current quantity: {item.quantity} {item.unit}\n'
                    f'Threshold: {item.threshold} {item.unit}\n'
                    f'Please restock soon.'
                ),
                from_email='noreply@pawze.local',
                recipient_list=['admin@pawze.local'],
                fail_silently=True,
            )


# ---------------------------------------------------------------------------
# User management — admin only
# ---------------------------------------------------------------------------

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserPublicSerializer
    permission_classes = [IsAdminUserRole]

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """POST /api/users/{id}/reset_password/ — admin resets a staff password."""
        target = self.get_object()
        new_password = request.data.get('new_password')

        if not new_password or len(new_password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.set_password(new_password)
        target.must_change_password = True
        target.save()
        return Response({'detail': f'Password reset for {target.username}. They must change it on next login.'})

