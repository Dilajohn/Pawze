"""
Django signals for Pawze.

- Notifies a customer when their appointment status changes.
- Sends a low-stock email when inventory drops to or below the threshold.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail

from .models import Appointment, Notification


@receiver(post_save, sender=Appointment)
def notify_customer_on_status_change(sender, instance, created, **kwargs):
    """Create an in-app notification when an appointment status changes."""
    if created:
        return  # Skip on first creation — handled at booking time

    if instance.customer:
        Notification.objects.get_or_create(
            user=instance.customer,
            title=f'Appointment {instance.status.replace("-", " ").title()}',
            message=(
                f'Your appointment for {instance.pet_name} on {instance.date} '
                f'at {instance.time} is now {instance.status}.'
            ),
            notification_type='status',
            is_read=False,
        )
