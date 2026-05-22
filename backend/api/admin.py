from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    Appointment,
    AppointmentFeedback,
    AuditLog,
    InventoryItem,
    InventoryUsageLog,
    Notification,
    Pet,
    RestockRequest,
    Service,
    User,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'must_change_password', 'is_active']
    list_filter = ['role', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Pawze', {'fields': ('role', 'phone', 'location', 'avatar', 'must_change_password')}),
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration', 'price']


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ['name', 'breed', 'owner', 'age', 'weight']
    list_filter = ['breed']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['pet_name', 'customer_name', 'date', 'time', 'status', 'groomer']
    list_filter = ['status', 'date']
    date_hierarchy = 'date'


@admin.register(AppointmentFeedback)
class AppointmentFeedbackAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'rating', 'created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'quantity', 'unit', 'threshold', 'is_low_stock']
    list_filter = ['category']


@admin.register(RestockRequest)
class RestockRequestAdmin(admin.ModelAdmin):
    list_display = ['item', 'quantity', 'status', 'created_at']
    list_filter = ['status']


@admin.register(InventoryUsageLog)
class InventoryUsageLogAdmin(admin.ModelAdmin):
    list_display = ['item', 'groomer', 'quantity_used', 'timestamp']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'model_name', 'object_id', 'user', 'timestamp']
    list_filter = ['action', 'model_name']
    readonly_fields = ['timestamp']
