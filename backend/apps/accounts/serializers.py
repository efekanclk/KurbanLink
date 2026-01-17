"""
Serializers for accounts app.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from typing import Dict, Any
from .models import User, Role, UserRole
from apps.butchers.models import ButcherProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that adds user role information to the access token.
    
    Extends the default TokenObtainPairSerializer to include a 'roles' field
    in the access token payload containing the user's active role codes.
    """
    
    @classmethod
    def get_token(cls, user) -> Dict[str, Any]:
        """
        Override to add custom claims to the access token.
        
        Adds a 'roles' field containing a list of the user's active role codes.
        
        Args:
            user: The User instance for whom to generate the token
            
        Returns:
            Token with added role information
        """
        token = super().get_token(user)
        
        # Get active role codes for the user
        active_roles = user.user_roles.filter(is_active=True).select_related('role')
        role_codes = [user_role.role.code for user_role in active_roles]
        
        # Add roles to the access token payload
        token['roles'] = role_codes
        
        return token


class RegisterSerializer(serializers.Serializer):
    """
    Serializer for user registration with role selection.
    
    Handles user creation, role assignment, and optional butcher profile creation.
    Always assigns BUYER role automatically.
    """
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    roles = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=list
    )
    butcher_profile = serializers.DictField(required=False, allow_null=True)
    
    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Bu e-posta adresi zaten kullanılıyor.")
        return value
    
    def validate_password(self, value):
        """Validate password using Django validators."""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_roles(self, value):
        """Validate and normalize roles."""
        if not value:
            return []
        
        # Normalize to uppercase
        normalized_roles = [role.upper() for role in value]
        
        # Validate against allowed roles
        allowed_roles = {'BUYER', 'SELLER', 'BUTCHER'}
        invalid_roles = set(normalized_roles) - allowed_roles
        
        if invalid_roles:
            raise serializers.ValidationError(
                f"Geçersiz rol(ler): {', '.join(invalid_roles)}. "
                f"İzin verilen roller: {', '.join(allowed_roles)}"
            )
        
        return normalized_roles
    
    def validate_butcher_profile(self, value):
        """Validate butcher profile structure if provided."""
        if not value:
            return value
        
        # Validate required fields
        if 'business_name' not in value or not value['business_name'].strip():
            raise serializers.ValidationError({
                'business_name': 'İşletme adı zorunludur.'
            })
        
        if 'city' not in value or not value['city'].strip():
            raise serializers.ValidationError({
                'city': 'Şehir zorunludur.'
            })
        
        # Validate services if provided
        if 'services' in value:
            if not isinstance(value['services'], list):
                raise serializers.ValidationError({
                    'services': 'Hizmetler bir liste olmalıdır.'
                })
            # Ensure all services are strings
            if not all(isinstance(s, str) for s in value['services']):
                raise serializers.ValidationError({
                    'services': 'Tüm hizmetler metin olmalıdır.'
                })
        
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        roles = attrs.get('roles', [])
        
        # Build final roles (always include BUYER)
        final_roles = set(roles)
        final_roles.add('BUYER')
        attrs['final_roles'] = final_roles
        
        # Butcher profile is optional - can be added later in profile settings
        
        return attrs
    
    def create(self, validated_data):
        """Create user, assign roles, and create butcher profile if needed."""
        email = validated_data['email']
        password = validated_data['password']
        final_roles = validated_data['final_roles']
        butcher_profile_data = validated_data.get('butcher_profile')
        
        # Create user
        user = User.objects.create(
            email=email,
            is_active=True
        )
        user.set_password(password)
        user.save()
        
        # Assign roles
        for role_code in final_roles:
            role, _ = Role.objects.get_or_create(
                code=role_code,
                defaults={'name': role_code.capitalize()}
            )
            UserRole.objects.create(
                user=user,
                role=role,
                is_active=True
            )
        
        # Create butcher profile if BUTCHER role
        if 'BUTCHER' in final_roles and butcher_profile_data:
            ButcherProfile.objects.create(
                user=user,
                business_name=butcher_profile_data['business_name'].strip(),
                city=butcher_profile_data['city'].strip(),
                services=butcher_profile_data.get('services', []),
                price_range=butcher_profile_data.get('price_range', '').strip() or ''
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Get roles for response
        role_codes = list(final_roles)
        
        return {
            'id': user.id,
            'email': user.email,
            'roles': role_codes,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
