"""
Admin configuration for butchers app.
"""

from django.contrib import admin
from .models import ButcherProfile, Appointment


@admin.register(ButcherProfile)
class ButcherProfileAdmin(admin.ModelAdmin):
    """Admin for butcher profiles."""
    list_display = ['butcher_name', 'city', 'district', 'rating', 'is_active', 'created_at']
    list_filter = ['is_active', 'city']
    search_fields = ['first_name', 'last_name', 'city', 'user__email']
    ordering = ['-rating', '-created_at']
    
    def butcher_name(self, obj):
        """Display full name."""
        return f"{obj.first_name} {obj.last_name}"
    butcher_name.short_description = 'Kasap Adı'
    readonly_fields = ('created_at',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """
    Admin interface for Appointment model.
    """
    
    list_display = ('butcher', 'user', 'date', 'time', 'status', 'created_at')
    list_filter = ('status', 'date', 'created_at')
    search_fields = ('butcher__first_name', 'butcher__last_name', 'user__email', 'note')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
