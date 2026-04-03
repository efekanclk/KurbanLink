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
            title='Yeni Randevu Talebi',
            message=f'{instance.date} tarihinde saat {instance.time} için yeni bir randevu talebiniz var',
            data={
                'appointment_id': instance.id,
                'butcher_id': instance.butcher.id,
                'date': str(instance.date),
                'time': str(instance.time),
            }
        )
    else:
        # Status changed, determine what happened
        if instance.status == Appointment.APPROVED:
            # Appointment approved → notify user
            butcher_name = f"{instance.butcher.first_name} {instance.butcher.last_name}"
            Notification.objects.create(
                user=instance.user,
                type=Notification.APPOINTMENT_APPROVED,
                title='Randevu Onaylandı',
                message=f'Kasap {butcher_name} ile olan randevunuz onaylandı',
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
                title='Randevu Reddedildi',
                message=f'Kasap {butcher_name} ile olan randevunuz reddedildi',
                data={
                    'appointment_id': instance.id,
                    'butcher_id': instance.butcher.id,
                    'date': str(instance.date),
                    'time': str(instance.time),
                }
            )
        
        elif instance.status == Appointment.CANCELLED:
            # Appointment cancelled → notify the other party
            Notification.objects.create(
                user=instance.butcher.user,
                type=Notification.APPOINTMENT_CANCELLED,
                title='Randevu İptal Edildi',
                message=f'{instance.date} tarihinde saat {instance.time} için olan randevu iptal edildi',
                data={
                    'appointment_id': instance.id,
                    'butcher_id': instance.butcher.id,
                    'date': str(instance.date),
                    'time': str(instance.time),
                }
            )
