from django.contrib import admin
from .models import UserProfile, Address

admin.site.register(Address)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'address')
    search_fields = ('user__username', 'user__email', 'phone')
    list_filter = ('user__date_joined', 'user__last_login')
