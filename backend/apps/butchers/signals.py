"""
Signal handlers for appointment notifications.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.butchers.models import Appointment
from apps.notifications.models import Notification


@receiver(post_save, sender=Appointment)
def notify_on_appointment_change(sender, instance, created, **kwargs):
    """
    Create notifications for appointment lifecycle events.
    
    - Created (PENDING) → notify butcher
    - Approved → notify user
    - Rejected → notify user
    - Cancelled → notify other party
    """
    
    if created:
        # New appointment request → notify butcher
        Notification.objects.create(
            user=instance.butcher.user,
            type=Notification.APPOINTMENT_REQUESTED,
            title='New Appointment Request',
            message=f'You have a new appointment request for {instance.date} at {instance.time}',
            data={
                'appointment_id': instance.id,
                'butcher_id': instance.butcher.id,
                'date': str(instance.date),
                'time': str(instance.time),
            }
        )
    else:
        # Status changed, determine what happened
        # We need to track previous status to know what changed
        # For now, we'll use simple status-based logic
        
        if instance.status == Appointment.APPROVED:
            # Appointment approved → notify user
            butcher_name = f"{instance.butcher.first_name} {instance.butcher.last_name}"
            Notification.objects.create(
                user=instance.user,
                type=Notification.APPOINTMENT_APPROVED,
                title='Appointment Approved',
                message=f'Your appointment with {butcher_name} has been approved',
                data={
                    'appointment_id': instance.id,
                    'butcher_id': instance.butcher.id,
                    'date': str(instance.date),
                    'time': str(instance.time),
                }
            )
        
        elif instance.status == Appointment.REJECTED:
            # Appointment rejected → notify user
            butcher_name = f"{instance.butcher.first_name} {instance.butcher.last_name}"
            Notification.objects.create(
                user=instance.user,
                type=Notification.APPOINTMENT_REJECTED,
                title='Appointment Rejected',
                message=f'Your appointment with {butcher_name} has been rejected',
                data={
                    'appointment_id': instance.id,
                    'butcher_id': instance.butcher.id,
                    'date': str(instance.date),
                    'time': str(instance.time),
                }
            )
        
        elif instance.status == Appointment.CANCELLED:
            # Appointment cancelled → notify the other party
            # We can't determine who cancelled without tracking, so notify butcher
            # In a real system, you'd track who performed the action
            Notification.objects.create(
                user=instance.butcher.user,
                type=Notification.APPOINTMENT_CANCELLED,
                title='Appointment Cancelled',
                message=f'An appointment for {instance.date} at {instance.time} has been cancelled',
                data={
                    'appointment_id': instance.id,
                    'butcher_id': instance.butcher.id,
                    'date': str(instance.date),
                    'time': str(instance.time),
                }
            )
