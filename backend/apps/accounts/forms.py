"""
Custom forms for accounts admin.
"""

from django import forms
from .models import User, Role, UserRole


class UserAdminForm(forms.ModelForm):
    """
    Custom form for User admin with simplified role management.
    Shows single checkbox for BUTCHER role instead of complex UserRole inline.
    """
    
    is_butcher_role = forms.BooleanField(
        required=False,
        label="Kasaplık yapıyor",
        help_text="İşaretlenirse kullanıcıya Kasap rolü verilir."
    )
    
    class Meta:
        model = User
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Set initial value based on existing BUTCHER role
        if self.instance and self.instance.pk:
            has_butcher = UserRole.objects.filter(
                user=self.instance,
                role__code='BUTCHER',
                is_active=True
            ).exists()
            self.fields['is_butcher_role'].initial = has_butcher
    
    def save(self, commit=True):
        """
        Save user and sync roles based on checkbox state.
        """
        user = super().save(commit=commit)
        
        if commit:
            is_butcher = self.cleaned_data.get('is_butcher_role', False)
            self._sync_user_roles(user, is_butcher)
        
        return user
    
    def _sync_user_roles(self, user, is_butcher):
        """
        Sync user roles based on admin input.
        
        - USER role: always active (enforced)
        - BUTCHER role: controlled by checkbox
        """
        # Ensure USER role exists and is active
        user_role, _ = Role.objects.get_or_create(
            code='USER',
            defaults={'name': 'Kullanıcı'}
        )
        UserRole.objects.update_or_create(
            user=user,
            role=user_role,
            defaults={'is_active': True}
        )
        
        # Handle BUTCHER role based on checkbox
        butcher_role, _ = Role.objects.get_or_create(
            code='BUTCHER',
            defaults={'name': 'Kasap'}
        )
        
        if is_butcher:
            # Activate or create BUTCHER role
            UserRole.objects.update_or_create(
                user=user,
                role=butcher_role,
                defaults={'is_active': True}
            )
        else:
            # Deactivate BUTCHER role if exists (don't delete)
            UserRole.objects.filter(
                user=user,
                role=butcher_role
            ).update(is_active=False)
