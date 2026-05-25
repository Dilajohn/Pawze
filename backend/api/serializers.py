import re
from datetime import date, time as dtime

import bleach
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

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

PHONE_RE = re.compile(r'^\+?[1-9]\d{1,14}$')
WORKING_START = dtime(9, 0)
WORKING_END = dtime(18, 0)


def sanitize(value: str) -> str:
    """Strip all HTML tags and attributes to prevent XSS."""
    return bleach.clean(value, tags=[], attributes={}, strip=True)


# ---------------------------------------------------------------------------
# User / Auth serializers
# ---------------------------------------------------------------------------

class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'location', 'avatar', 'must_change_password']
        read_only_fields = ['id', 'role', 'must_change_password']


class UserAdminCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
            'location',
            'avatar',
            'role',
            'must_change_password',
        ]
        read_only_fields = ['id']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_phone(self, value):
        if value and not PHONE_RE.match(value):
            raise serializers.ValidationError('Enter a valid phone number (e.g. +256712345678).')
        return value

    def validate_role(self, value):
        if value not in {'admin', 'groomer'}:
            raise serializers.ValidationError('Admins can only create admin or groomer accounts here.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone', 'location']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_phone(self, value):
        if value and not PHONE_RE.match(value):
            raise serializers.ValidationError('Enter a valid phone number (e.g. +256712345678).')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            location=validated_data.get('location', ''),
            role='customer',
        )


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'new_password': list(exc.messages)})
        return attrs


class UserSelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'location', 'avatar', 'must_change_password']
        read_only_fields = ['id', 'username', 'email', 'role', 'must_change_password']


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Price must be non-negative.')
        return value

    def validate_duration(self, value):
        if value < 1:
            raise serializers.ValidationError('Duration must be at least 1 minute.')
        return value


# ---------------------------------------------------------------------------
# Pet
# ---------------------------------------------------------------------------

class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = '__all__'
        read_only_fields = ['owner']

    def validate_notes(self, value):
        return sanitize(value)


# ---------------------------------------------------------------------------
# Appointment
# ---------------------------------------------------------------------------

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['created_at', 'customer']

    def validate_notes(self, value):
        return sanitize(value)

    def validate_customer_name(self, value):
        return sanitize(value)

    def validate_pet_name(self, value):
        return sanitize(value)

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError('Appointment date must be today or in the future.')
        return value

    def validate_time(self, value):
        if not (WORKING_START <= value <= WORKING_END):
            raise serializers.ValidationError('Appointment time must be between 09:00 and 18:00.')
        return value

    def validate(self, attrs):
        groomer = attrs.get('groomer')
        appt_date = attrs.get('date')
        appt_time = attrs.get('time')
        instance_id = self.instance.id if self.instance else None

        if groomer and appt_date and appt_time:
            conflict_qs = Appointment.objects.filter(
                groomer=groomer,
                date=appt_date,
                time=appt_time,
            ).exclude(status__in=['cancelled', 'completed'])

            if instance_id:
                conflict_qs = conflict_qs.exclude(id=instance_id)

            if conflict_qs.exists():
                raise serializers.ValidationError(
                    {'groomer': 'This groomer already has a booking at the selected date and time.'}
                )

        return attrs


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

class AppointmentFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentFeedback
        fields = '__all__'
        read_only_fields = ['created_at', 'appointment']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError('Rating must be an integer between 1 and 5.')
        return value

    def validate_comments(self, value):
        return sanitize(value)


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at', 'user']


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = '__all__'

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity must be non-negative.')
        return value

    def validate_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError('Threshold must be non-negative.')
        return value

    def validate_name(self, value):
        return sanitize(value)


class RestockRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestockRequest
        fields = '__all__'
        read_only_fields = ['created_at', 'status']

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Restock quantity must be at least 1.')
        return value


class InventoryUsageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryUsageLog
        fields = '__all__'
        read_only_fields = ['timestamp', 'groomer']

    def validate_quantity_used(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity used must be at least 1.')
        return value

    def validate_notes(self, value):
        return sanitize(value)
