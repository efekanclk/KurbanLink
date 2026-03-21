from django.contrib import admin
from .models import ButcherReview


@admin.register(ButcherReview)
class ButcherReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'butcher', 'user', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['user__email', 'butcher__first_name', 'butcher__last_name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
