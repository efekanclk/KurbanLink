"""
Signal handlers for reviews app.

Recalculates ButcherProfile.rating whenever a ButcherReview is saved or deleted.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from .models import ButcherReview


def _recalculate_rating(butcher_profile):
    """Recalculate and save the aggregate rating for a butcher profile."""
    result = ButcherReview.objects.filter(butcher=butcher_profile).aggregate(
        avg=Avg('rating')
    )
    avg = result['avg'] or 0.0
    # Round to 1 decimal place
    butcher_profile.rating = round(avg, 1)
    butcher_profile.save(update_fields=['rating'])


@receiver(post_save, sender=ButcherReview)
def update_rating_on_save(sender, instance, **kwargs):
    """Recalculate rating after a review is created or updated."""
    _recalculate_rating(instance.butcher)


@receiver(post_delete, sender=ButcherReview)
def update_rating_on_delete(sender, instance, **kwargs):
    """Recalculate rating after a review is deleted."""
    _recalculate_rating(instance.butcher)
