from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from pages.models import Order

# ✅ Sipariş oluşturulunca hem admin'e hem kullanıcıya gider
@receiver(post_save, sender=Order)
def notify_on_new_order(sender, instance, created, **kwargs):
    if created:
        # 📨 Admin'e gönder
        admin_subject = "Yeni Sipariş Oluşturuldu"
        admin_message = f"""
Yeni bir sipariş oluşturuldu!

Sipariş No: {instance.order_number}
Kullanıcı: {instance.user.username} ({instance.user.email})
Durum: {dict(Order.STATUS_CHOICES).get(instance.status, instance.status)}
Oluşturulma Tarihi: {instance.created_at.strftime('%Y-%m-%d %H:%M')}
"""
        try:
            send_mail(
                admin_subject,
                admin_message,
                settings.DEFAULT_FROM_EMAIL,
                ["selimaksnzz@gmail.com"],
                fail_silently=False,
            )
            print("✅ Admin'e sipariş maili gönderildi.")
        except Exception as e:
            print(f"❌ Admin maili hatası: {e}")

        # 📨 Kullanıcıya gönder
        user_subject = f"Siparişiniz Alındı - {instance.order_number}"
        user_message = f"""
Merhaba {instance.full_name},

Siparişiniz başarıyla oluşturuldu! En kısa sürede işleme alınacaktır.

Sipariş No: {instance.order_number}
Durum: {dict(Order.STATUS_CHOICES).get(instance.status, instance.status)}
"""
        try:
            send_mail(
                user_subject,
                user_message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.user.email],
                fail_silently=False,
            )
            print(f"✅ Kullanıcıya sipariş onay maili gönderildi: {instance.user.email}")
        except Exception as e:
            print(f"❌ Kullanıcı onay maili hatası: {e}")

# ✅ Durum güncellenince kullanıcıya mail gider
@receiver(pre_save, sender=Order)
def notify_user_order_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_order = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        return

    if old_order.status != instance.status:
        try:
            send_mail(
                subject=f'Sipariş Durumunuz Güncellendi - {instance.order_number}',
                message=f"""
Merhaba {instance.full_name},

Siparişinizin yeni durumu: {dict(Order.STATUS_CHOICES).get(instance.status, instance.status)}.

Sipariş No: {instance.order_number}
""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.user.email],
                fail_silently=False
            )
            print(f"✅ Kullanıcıya güncelleme maili gönderildi: {instance.user.email}")
        except Exception as e:
            print(f"❌ Durum maili hatası: {e}")
