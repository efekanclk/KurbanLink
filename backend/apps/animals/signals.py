import os
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import AnimalImage

@receiver(post_delete, sender=AnimalImage)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem when corresponding `AnimalImage` object is deleted.
    """
    if instance.image:
        if os.path.isfile(instance.image.path):
            try:
                os.remove(instance.image.path)
            except Exception as e:
                print(f"Error deleting file {instance.image.path}: {e}")

@receiver(pre_save, sender=AnimalImage)
def auto_delete_file_on_change(sender, instance, **kwargs):
    """
    Deletes old file from filesystem when corresponding `AnimalImage` object is updated
    with new file.
    """
    if not instance.pk:
        return False

    try:
        old_file = AnimalImage.objects.get(pk=instance.pk).image
    except AnimalImage.DoesNotExist:
        return False

    new_file = instance.image
    if not old_file == new_file:
        if old_file and os.path.isfile(old_file.path):
            try:
                os.remove(old_file.path)
            except Exception as e:
                print(f"Error deleting old file {old_file.path}: {e}")
