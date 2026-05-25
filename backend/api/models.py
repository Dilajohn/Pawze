from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('groomer', 'Groomer'),
        ('customer', 'Customer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    avatar = models.CharField(max_length=500, blank=True)
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.username} ({self.role})'


class Service(models.Model):
    name = models.CharField(max_length=100)
    duration = models.IntegerField(help_text='Duration in minutes', validators=[MinValueValidator(1)])
    price = models.IntegerField(help_text='Price in lowest currency unit (e.g. UGX cents)', validators=[MinValueValidator(0)])
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Pet(models.Model):
    owner = models.ForeignKey(
        User,
        related_name='pets',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    breed = models.CharField(max_length=100, blank=True)
    age = models.CharField(max_length=50, blank=True)
    weight = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.name} ({self.breed})'


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    customer = models.ForeignKey(
        User,
        related_name='customer_appointments',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    customer_name = models.CharField(max_length=255)
    pet = models.ForeignKey(
        Pet,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    pet_name = models.CharField(max_length=100)
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    date = models.DateField()
    time = models.TimeField()
    groomer = models.ForeignKey(
        User,
        related_name='groomer_appointments',
        limit_choices_to={'role': 'groomer'},
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.pet_name} – {self.date} at {self.time}'


class AppointmentFeedback(models.Model):
    appointment = models.OneToOneField(
        Appointment,
        related_name='feedback',
        on_delete=models.CASCADE,
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Integer from 1 to 5',
    )
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Feedback for {self.appointment} – {self.rating}/5'


class Notification(models.Model):
    TYPE_CHOICES = [
        ('pickup', 'Pickup'),
        ('payment', 'Payment'),
        ('advice', 'Advice'),
        ('status', 'Status'),
    ]

    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='status')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.notification_type}] {self.title} → {self.user}'


class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('Consumable', 'Consumable'),
        ('Tools', 'Tools'),
        ('Accessories', 'Accessories'),
    ]

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity = models.IntegerField(validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=50)
    threshold = models.IntegerField(validators=[MinValueValidator(0)], help_text='Low-stock warning threshold')
    supplier_name = models.CharField(max_length=255, blank=True)
    expiry_date = models.DateField(null=True, blank=True, help_text='For consumables only')

    def __str__(self):
        return f'{self.name} ({self.quantity} {self.unit})'

    @property
    def is_low_stock(self):
        return self.quantity <= self.threshold


class RestockRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
    ]

    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='restock_requests')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Restock {self.item.name} x{self.quantity} [{self.status}]'


class InventoryUsageLog(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='usage_logs')
    groomer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'groomer'},
    )
    quantity_used = models.IntegerField(validators=[MinValueValidator(1)])
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.groomer} used {self.quantity_used} × {self.item.name}'


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    changes = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'[{self.timestamp}] {self.action} on {self.model_name} #{self.object_id} by {self.user}'
