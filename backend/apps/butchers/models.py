"""
Models for butchers app.
"""

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class ButcherProfile(models.Model):
    """
    Butcher service profile.
    
    Only users with BUTCHER role can have a profile.
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='butcher_profile',
        help_text="User with BUTCHER role"
    )
    first_name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Kasabın adı"
    )
    last_name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Kasabın soyadı"
    )
    city = models.CharField(
        max_length=100,
        help_text="Şehir (zorunlu)"
    )
    district = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="İlçe (opsiyonel)"
    )
    services = models.JSONField(
        default=list,
        help_text="List of services offered"
    )
    price_range = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Price range (e.g., '500-1000')"
    )
    rating = models.FloatField(
        default=0.0,
        help_text="Average rating (0-5)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether accepting appointments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'butcher profile'
        verbose_name_plural = 'butcher profiles'
        ordering = ['-rating', '-created_at']
    
    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.city})"
    
    def clean(self):
        """
        Validate that user has BUTCHER role.
        """
        from apps.accounts.models import Role
        
        if self.user_id:
            has_butcher_role = self.user.user_roles.filter(
                role__code=Role.BUTCHER,
                is_active=True
            ).exists()
            
            if not has_butcher_role:
                raise ValidationError("User must have BUTCHER role to create a profile.")


class Appointment(models.Model):
    """
    Appointment request for butcher services.
    """
    
    # Status choices
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    CANCELLED = 'CANCELLED'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled'),
    ]
    
    butcher = models.ForeignKey(
        ButcherProfile,
        on_delete=models.CASCADE,
        related_name='appointments',
        help_text="Butcher profile"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments',
        help_text="Customer requesting appointment"
    )
    listing = models.ForeignKey(
        'animals.AnimalListing',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        help_text="Related animal listing (optional)"
    )
    date = models.DateField(
        help_text="Appointment date"
    )
    time = models.TimeField(
        help_text="Appointment time"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
        help_text="Appointment status"
    )
    note = models.TextField(
        blank=True,
        help_text="Additional notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'appointment'
        verbose_name_plural = 'appointments'
        ordering = ['-created_at']
        unique_together = [['butcher', 'date', 'time']]
        indexes = [
            models.Index(fields=['butcher', 'status']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['butcher', 'date', 'time']),
        ]
    
    def __str__(self) -> str:
        butcher_name = f"{self.butcher.first_name} {self.butcher.last_name}"
        return f"Appointment with {butcher_name} on {self.date}"
    
    def clean(self):
        """
        Validate appointment rules.
        """
        # Cannot book with inactive butcher
        if self.butcher_id and not self.butcher.is_active:
            raise ValidationError("Cannot book appointment with inactive butcher.")
    
    def approve(self) -> None:
        """Approve the appointment."""
        if self.status == self.PENDING:
            self.status = self.APPROVED
            self.save(update_fields=['status'])
    
    def reject(self) -> None:
        """Reject the appointment."""
        if self.status == self.PENDING:
            self.status = self.REJECTED
            self.save(update_fields=['status'])
    
    def cancel(self) -> None:
        """Cancel the appointment."""
        if self.status in [self.PENDING, self.APPROVED]:
            self.status = self.CANCELLED
            self.save(update_fields=['status'])
