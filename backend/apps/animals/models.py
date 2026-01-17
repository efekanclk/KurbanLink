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
        ('KUCUKBAS', 'Küçükbaş'),
        ('BUYUKBAS', 'Büyükbaş'),
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
        verbose_name='Hayvan Türü',
        help_text="Küçükbaş veya Büyükbaş"
    )
    breed = models.CharField(
        max_length=100,
        verbose_name='Cins',
        help_text="Hayvanın cinsi (örn: Merinos, Kıvırcık)"
    )
    age = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Yaş (ay)',
        help_text="Hayvanın yaşı (ay cinsinden)"
    )
    weight = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Ağırlık (kg)',
        help_text="Tahmini ağırlık (kg)"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Fiyat (TL)',
        help_text="Satış fiyatı (TL)"
    )
    location = models.CharField(
        max_length=200,
        verbose_name='Konum',
        help_text="İlanın bulunduğu şehir/bölge"
    )
    description = models.TextField(
        blank=True,
        verbose_name='Açıklama',
        help_text="İlan detayları (isteğe bağlı)"
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


class AnimalImage(models.Model):
    """
    Represents an image for an animal listing.
    
    Sellers can upload multiple images per listing.
    Only one image per listing can be marked as primary.
    """
    
    listing = models.ForeignKey(
        AnimalListing,
        on_delete=models.CASCADE,
        related_name='images',
        help_text="The animal listing this image belongs to"
    )
    image = models.ImageField(
        upload_to='animal_images/',
        help_text="Image file"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the primary image for the listing"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'animal image'
        verbose_name_plural = 'animal images'
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self) -> str:
        status = "Primary" if self.is_primary else "Secondary"
        return f"{status} image for {self.listing.breed}"
    
    def save(self, *args, **kwargs) -> None:
        """
        Override save to enforce single primary image per listing.
        
        If this image is being set as primary, unset all other primary images
        for the same listing.
        """
        if self.is_primary:
            # Unset other primary images for this listing
            AnimalImage.objects.filter(
                listing=self.listing,
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        
        super().save(*args, **kwargs)
