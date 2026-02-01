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


class MeSerializer(serializers.ModelSerializer):
    """
    Serializer for current user identity.
    Returns id, email, username, phone, country, city, district, profile image, and active roles.
    """
    roles = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'phone_number', 'country_code', 'city', 'district', 'profile_image', 'profile_image_url', 'roles']
        read_only_fields = ['id', 'email', 'roles']
        extra_kwargs = {
            'profile_image': {'write_only': True},
        }
    
    def to_representation(self, instance):
        """Fallback to email prefix if username is missing."""
        ret = super().to_representation(instance)
        if not ret.get('username') and instance.email:
            ret['username'] = instance.email.split('@')[0]
        return ret
    
    def get_roles(self, obj):
        """Extract role codes from active UserRole relationships"""
        return [ur.role.code for ur in obj.user_roles.filter(is_active=True)]
    
    def get_profile_image_url(self, obj):
        """Return full URL for profile image if exists."""
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    
    Phase 10: Uses is_butcher checkbox instead of role selection.
            'id', 'email', 'password', 'username', 'phone_number', 'country_code', 'city', 'district',
    """
    password = serializers.CharField(write_only=True, required=True)
    is_butcher = serializers.BooleanField(required=False, default=False, write_only=True)
    butcher_profile = serializers.DictField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'password', 'username', 'phone_number', 'country_code',
            'city', 'district', 'profile_image',
            'is_butcher', 'butcher_profile'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'profile_image': {'write_only': True, 'required': False},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'username': {'required': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'country_code': {'required': False, 'allow_blank': True},
            'city': {'required': False, 'allow_blank': True},
            'district': {'required': False, 'allow_blank': True},
        }
    
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
    
    def validate_username(self, value):
        """Validate and normalize username."""
        # Normalize username
        normalized = User.normalize_username(value)
        
        # Check uniqueness
        if User.objects.filter(username=normalized).exists():
            raise serializers.ValidationError("Bu kullanıcı adı zaten kullanılıyor.")
        
        # Validate length
        if len(normalized) < 3 or len(normalized) > 20:
            raise serializers.ValidationError("Kullanıcı adı 3-20 karakter arasında olmalıdır.")
        
        return normalized
    
    def validate_phone_number(self, value):
        """Validate phone number is not empty if provided."""
        if not value or not value.strip():
            return ""
        return value.strip()
    
    def validate(self, attrs):
        # Butcher profile is optional - can be added later in profile settings
        return attrs
    
    def create(self, validated_data):
        """
        Create user with USER role, and optionally BUTCHER role + profile.
        """
        is_butcher = validated_data.pop('is_butcher', False)
        butcher_profile_data = validated_data.pop('butcher_profile', None)
        
        # Extract password
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Always assign USER role
        user_role, _ = Role.objects.get_or_create(code='USER', defaults={'name': 'Kullanıcı'})
        UserRole.objects.create(user=user, role=user_role, is_active=True)
        
        # If butcher, assign BUTCHER role and create profile
        if is_butcher and butcher_profile_data:
            butcher_role, _ = Role.objects.get_or_create(code='BUTCHER', defaults={'name': 'Kasap'})
            UserRole.objects.create(user=user, role=butcher_role, is_active=True)
            
            # Create butcher profile
            from apps.butchers.models import ButcherProfile
            
            # Use provided profile data or default to empty dict
            profile_data = butcher_profile_data or {}
            
            ButcherProfile.objects.create(
                user=user,
                # Default to empty strings if not provided, allowing user to fill later
                first_name=profile_data.get('first_name') or "",
                last_name=profile_data.get('last_name') or "",
                # Use user's location as default for business location
                city=profile_data.get('city') or user.city,
                district=profile_data.get('district') or user.district or "",
                services=profile_data.get('services', []),
                price_range=profile_data.get('price_range', ''),
            )
        
        return user
