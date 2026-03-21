"""
Models for reviews app.

Users can leave a 1-5 star rating + optional comment on a ButcherProfile.
Each user can only review a specific butcher once.
After every save/delete, the butcher's aggregate rating is recalculated.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class ButcherReview(models.Model):
    """
    A review left by a customer for a butcher profile.

    Constraints:
    - One review per (user, butcher) pair (unique_together).
    - Rating must be between 1 and 5.
    """

    butcher = models.ForeignKey(
        'butchers.ButcherProfile',
        on_delete=models.CASCADE,
        related_name='reviews',
        help_text="The butcher being reviewed"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='butcher_reviews',
        help_text="Customer who left the review"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating between 1 (worst) and 5 (best)"
    )
    comment = models.TextField(
        blank=True,
        default='',
        help_text="Optional written comment"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'butcher review'
        verbose_name_plural = 'butcher reviews'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['butcher', 'user'],
                name='unique_review_per_user_per_butcher'
            )
        ]
        indexes = [
            models.Index(fields=['butcher', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} → {self.butcher} ({self.rating}★)"
