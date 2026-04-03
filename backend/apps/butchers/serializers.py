"""
Serializers for butchers app.
"""

from rest_framework import serializers
from apps.accounts.models import Role
from apps.core.hashids_util import encode_id
from .models import ButcherProfile, Appointment


class ButcherProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for ButcherProfile model.
    Phase 10: Uses first_name, last_name instead of business_name.
    """
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    butcher_name = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    hashed_id = serializers.SerializerMethodField()
    
    class Meta:
        model = ButcherProfile
        fields = [
            'id',
            'hashed_id',
            'user',
            'user_email',
            'profile_image_url',
            'first_name',
            'last_name',
            'butcher_name',  # Computed field for display
            'city',
            'district',
            'services',
            'price_range',
            'rating',
            'is_active'
        ]
        labels = {
            'user': 'Kullanıcı',
            'first_name': 'Ad',
            'last_name': 'Soyad',
            'city': 'Şehir',
            'district': 'İlçe',
            'services': 'Hizmetler',
            'price_range': 'Fiyat Aralığı',
            'rating': 'Değerlendirme',
            'is_active': 'Aktif'
        }
        read_only_fields = ['id', 'user', 'rating', 'created_at', 'butcher_name']
    
    def get_butcher_name(self, obj):
        """Return full name for display."""
        return f"{obj.first_name} {obj.last_name}"
    
    def get_profile_image_url(self, obj):
        """Return associated user's profile image URL."""
        if obj.user.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_image.url)
            return obj.user.profile_image.url
        return None
    
    def get_hashed_id(self, obj):
        return encode_id(obj.id)
    
    def validate(self, attrs):
        """
        Validate that user has BUTCHER role.
        """
        request = self.context.get('request')
        if request and request.user:
            # Check if user has BUTCHER role
            has_butcher_role = request.user.user_roles.filter(
                role__code='BUTCHER',
                is_active=True
            ).exists()
            
            if not has_butcher_role:
                raise serializers.ValidationError("Only users with BUTCHER role can create a profile.")
        
        return attrs


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Appointment model.
    """
    
    butcher_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()
    listing_title = serializers.CharField(source='listing.title', read_only=True, required=False)
    
    def get_butcher_name(self, obj):
        """Return butcher's full name."""
        return f"{obj.butcher.first_name} {obj.butcher.last_name}"
    
    def get_user_name(self, obj):
        """Return customer's username or email."""
        return obj.user.username if obj.user.username else obj.user.email.split('@')[0]
    
    def get_user_full_name(self, obj):
        """Return customer's first and last name."""
        if obj.user.first_name or obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return self.get_user_name(obj)
    
    class Meta:
        model = Appointment
        fields = [
            'id',
            'butcher',
            'butcher_name',
            'user',
            'user_email',
            'user_name',
            'user_full_name',
            'listing',
            'listing_title',
            'date',
            'time',
            'note',
            'status',
            'created_at'
        ]
        labels = {
            'butcher': 'Kasap',
            'listing': 'İlan',
            'date': 'Tarih',
            'time': 'Saat',
            'note': 'Not',
            'status': 'Durum',
            'created_at': 'Oluşturulma Tarihi'
        }
        read_only_fields = ['id', 'user', 'status', 'created_at']
    
    def validate_butcher(self, value):
        """
        Validate that butcher profile is active.
        """
        if not value.is_active:
            raise serializers.ValidationError("Cannot book appointment with inactive butcher.")
        return value
    
    def validate(self, attrs):
        """
        Additional validation.
        """
        # Ensure listing is active if provided
        listing = attrs.get('listing')
        if listing and not listing.is_active:
            raise serializers.ValidationError("Cannot book appointment for inactive listing.")
        
        # Check for slot conflicts (only on create, not update)
        if not self.instance:  # Creating new appointment
            butcher = attrs.get('butcher')
            date = attrs.get('date')
            time = attrs.get('time')
            
            if butcher and date and time:
                # Check if slot is already taken
                conflicting = Appointment.objects.filter(
                    butcher=butcher,
                    date=date,
                    time=time
                ).exists()
                
                if conflicting:
                    raise serializers.ValidationError(
                        "Bu saat dilimi dolu. Lütfen başka bir saat seçin."
                    )
        
        return attrs
