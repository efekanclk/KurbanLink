"""
Admin configuration for accounts app.
Clean admin UX with single butcher checkbox.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role
from .forms import UserAdminForm


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin for custom User model with simplified role management.
    
    USER role: always active, hidden from UI
    BUTCHER role: controlled by single checkbox
    """
    
    form = UserAdminForm
    
    list_display = ['email', 'username', 'phone_number', 'country_code', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_staff', 'is_active', 'country_code']
    search_fields = ['email', 'username', 'phone_number']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'phone_number', 'country_code')}),
        ('Roles', {'fields': ('is_butcher_role',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'phone_number', 'country_code', 'password1', 'password2', 'is_butcher_role', 'is_staff', 'is_active'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    
    def save_model(self, request, obj, form, change):
        """
        Override save to handle role sync from custom form.
        """
        # Save the user instance
        super().save_model(request, obj, form, change)
        
        # Sync roles based on checkbox (form already has this logic)
        if hasattr(form, '_sync_user_roles'):
            is_butcher = form.cleaned_data.get('is_butcher_role', False)
            form._sync_user_roles(obj, is_butcher)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """
    Read-only admin for Role model.
    System roles (USER, BUTCHER) should not be modified via admin.
    """
    list_display = ('code', 'name')
    search_fields = ('code', 'name')
    ordering = ('code',)
    
    def has_add_permission(self, request):
        """Prevent adding new roles via admin."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting roles via admin."""
        return False
    
    def get_readonly_fields(self, request, obj=None):
        """Make all fields read-only."""
        return ['code', 'name']
