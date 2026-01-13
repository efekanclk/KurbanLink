"""
Models for animals app.
"""

from django.db import models
from django.conf import settings


class AnimalListing(models.Model):
    """
    Represents an animal listing created by a seller.
    
    Sellers can create listings for animals they want to sell.
    Each listing contains details about the animal including type, breed,
    age, weight, price, and location.
    """
    
    ANIMAL_TYPE_CHOICES = [
        ('SMALL', 'Small Animal'),
        ('LARGE', 'Large Animal'),
    ]
    
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='animal_listings',
        help_text="User who created this listing"
    )
    animal_type = models.CharField(
        max_length=10,
        choices=ANIMAL_TYPE_CHOICES,
        help_text="Type of animal (small or large)"
    )
    breed = models.CharField(
        max_length=100,
        help_text="Breed of the animal"
    )
    age = models.PositiveIntegerField(
        help_text="Age of the animal in months"
    )
    weight = models.PositiveIntegerField(
        help_text="Weight of the animal in kilograms"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price in currency"
    )
    location = models.CharField(
        max_length=200,
        help_text="Location of the animal"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the animal"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this listing is currently active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'animal listing'
        verbose_name_plural = 'animal listings'
        ordering = ['-created_at']
    
    def __str__(self) -> str:
        return f"{self.animal_type} - {self.breed} by {self.seller.email}"
