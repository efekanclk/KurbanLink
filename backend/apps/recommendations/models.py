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


class ListingInteraction(models.Model):
    """
    Tracks user interactions with listings for recommendation signals.
    
    Used to build user interest profiles and determine listing popularity.
    """
    
    # Interaction types
    VIEW = 'VIEW'
    PHONE_CLICK = 'PHONE_CLICK'
    WHATSAPP_CLICK = 'WHATSAPP_CLICK'
    FAVORITE = 'FAVORITE'  # Redundant with Favorite model but useful for unified log
    
    INTERACTION_CHOICES = [
        (VIEW, 'Viewed Listing'),
        (PHONE_CLICK, 'Clicked Phone'),
        (WHATSAPP_CLICK, 'Clicked WhatsApp'),
        (FAVORITE, 'Favorited'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='listing_interactions',
        help_text="User who performed the interaction (null for anonymous)"
    )
    listing = models.ForeignKey(
        'animals.AnimalListing',
        on_delete=models.CASCADE,
        related_name='interactions',
        help_text="The listing that was interacted with"
    )
    interaction_type = models.CharField(
        max_length=20,
        choices=INTERACTION_CHOICES,
        default=VIEW,
        help_text="Type of interaction"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address for anonymous user tracking"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'listing interaction'
        verbose_name_plural = 'listing interactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'interaction_type']),
            models.Index(fields=['listing', 'interaction_type']),
            models.Index(fields=['ip_address', 'created_at']),  # For anon cold-start analysis
        ]
    
    def __str__(self) -> str:
        user_str = self.user.email if self.user else f"Anon({self.ip_address})"
        return f"{user_str} {self.interaction_type} {self.listing.id}"
