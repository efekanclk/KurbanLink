"""
Admin configuration for animals app.
"""

from django.contrib import admin
from .models import AnimalListing, AnimalImage


@admin.register(AnimalListing)
class AnimalListingAdmin(admin.ModelAdmin):
    """
    Admin interface for AnimalListing model.
    """
    
    list_display = ('animal_type', 'breed', 'seller', 'price', 'location', 'is_active', 'created_at')
    list_filter = ('animal_type', 'is_active', 'created_at')
    search_fields = ('breed', 'seller__email', 'location', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Animal Information', {
            'fields': ('animal_type', 'breed', 'age', 'weight')
        }),
        ('Listing Details', {
            'fields': ('seller', 'price', 'location', 'description')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at')
        }),
    )


@admin.register(AnimalImage)
class AnimalImageAdmin(admin.ModelAdmin):
    """
    Admin interface for AnimalImage model.
    """
    
    list_display = ('listing', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('listing__breed', 'listing__location')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
