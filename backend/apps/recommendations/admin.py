"""
Admin configuration for recommendations app.
"""

from django.contrib import admin
from .models import Recommendation


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    """
    Admin interface for Recommendation model.
    """
    
    list_display = ('user', 'type', 'object_id', 'score', 'reason', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('user__email', 'reason')
    ordering = ('-created_at',)
    readonly_fields = ('user', 'type', 'object_id', 'score', 'reason', 'created_at')
    
    def has_add_permission(self, request):
        """Disable manual creation in admin."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing in admin."""
        return False
