"""Django signals for Pawze."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Appointment, Notification


@receiver(pre_save, sender=Appointment)
def capture_previous_appointment_status(sender, instance, **kwargs):
    """Stash the previous status so notifications only fire on real changes."""
    if not instance.pk:
        instance._previous_status = None
        return

    instance._previous_status = (
        sender.objects.filter(pk=instance.pk).values_list("status", flat=True).first()
    )


@receiver(post_save, sender=Appointment)
def notify_customer_on_status_change(sender, instance, created, **kwargs):
    """Create an in-app notification when an appointment status changes."""
    if created or not instance.customer:
        return

    if getattr(instance, "_previous_status", None) == instance.status:
        return

    Notification.objects.create(
        user=instance.customer,
        title=f'Appointment {instance.status.replace("-", " ").title()}',
        message=(
            f"Your appointment for {instance.pet_name} on {instance.date} "
            f"at {instance.time} is now {instance.status}."
        ),
        notification_type="status",
        is_read=False,
    )
