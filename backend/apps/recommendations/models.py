"""
Models for recommendations app.
"""

from django.db import models
from django.conf import settings


class Recommendation(models.Model):
    """
    Represents a recommendation for a user.
    
    Recommendations are immutable once created.
    Based on rule-based/heuristic logic (not ML).
    """
    
    # Recommendation types
    ANIMAL = 'ANIMAL'
    SELLER = 'SELLER'
    BUTCHER = 'BUTCHER'
    
    TYPE_CHOICES = [
        (ANIMAL, 'Animal Listing'),
        (SELLER, 'Seller'),
        (BUTCHER, 'Butcher'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recommendations',
        help_text="User who receives this recommendation"
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Type of recommendation"
    )
    object_id = models.PositiveIntegerField(
        help_text="ID of the recommended object"
    )
    score = models.FloatField(
        help_text="Relevance score (higher is better)"
    )
    reason = models.CharField(
        max_length=255,
        help_text="Short explanation for the recommendation"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'recommendation'
        verbose_name_plural = 'recommendations'
        ordering = ['-score', '-created_at']
        indexes = [
            models.Index(fields=['user', '-score', '-created_at']),
            models.Index(fields=['user', 'type']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'type', 'object_id'],
                name='unique_recommendation'
            )
        ]
    
    def __str__(self) -> str:
        return f"{self.type} recommendation for {self.user.email} (score: {self.score:.2f})"
