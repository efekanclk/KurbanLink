"""
Serializers for butchers app.
"""

from rest_framework import serializers
from apps.accounts.models import Role
from .models import ButcherProfile, Appointment


class ButcherProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for ButcherProfile model.
    Phase 10: Uses first_name, last_name instead of business_name.
    """
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    butcher_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ButcherProfile
        fields = [
            'id',
            'user',
            'user_email',
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
    listing_title = serializers.CharField(source='listing.title', read_only=True, required=False)
    
    def get_butcher_name(self, obj):
        """Return butcher's full name."""
        return f"{obj.butcher.first_name} {obj.butcher.last_name}"
    
    class Meta:
        model = Appointment
        fields = [
            'id',
            'butcher',
            'butcher_name',
            'user',
            'user_email',
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
