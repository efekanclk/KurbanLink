"""
Serializers for animals app.
"""

from rest_framework import serializers
from apps.core.hashids_util import encode_id
from .models import AnimalListing


class AnimalListingSerializer(serializers.ModelSerializer):
    """
    Serializer for animal listings with comprehensive field support.
    
    Includes computed fields for display and seller information.
    """
    # Computed/extra fields
    hashed_id = serializers.SerializerMethodField()
    seller_email = serializers.EmailField(source='seller.email', read_only=True)
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    seller_phone_number = serializers.CharField(source='seller.phone_number', read_only=True)
    age_display = serializers.SerializerMethodField()
    primary_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AnimalListing
        fields = [
            'id',
            'hashed_id',
            'seller',
            'seller_email',
            'seller_username',
            'seller_phone_number',
            'title',
            'species',
            'animal_type',
            'breed',
            'gender',
            'age_months',
            'age_display',
            'weight',
            'price',
            'location',
            'city',
            'district',
            'ear_tag_no',
            'company',
            'description',
            'is_active',
            'view_count',
            'primary_image_url',
            'created_at',
        ]
        read_only_fields = ['id', 'seller', 'created_at']
    
    def get_hashed_id(self, obj):
        return encode_id(obj.id)
    
    def get_age_display(self, obj):
        """
        Format age_months as human-readable string.
        - < 12 months: "X ay"
        - >= 12 months: "Y yaş" or "Y yaş Z ay"
        """
        if obj.age_months is None:
            return None
        
        if obj.age_months < 12:
            return f"{obj.age_months} ay"
        
        years = obj.age_months // 12
        months = obj.age_months % 12
        
        if months == 0:
            return f"{years} yaş"
        else:
            return f"{years} yaş {months} ay"
    
    def get_primary_image_url(self, obj):
        """Return URL for the primary image if it exists."""
        primary_image = obj.images.filter(is_primary=True).first()
        if not primary_image:
            # Fallback to first image if no primary is set
            primary_image = obj.images.first()
            
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        return None
    

    
    def validate_age_months(self, value):
        """Age must be non-negative."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Yaş negatif olamaz.")
        return value
    
    def validate_weight(self, value):
        """Weight must be positive."""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Ağırlık pozitif olmalıdır.")
        return value
    
    def validate_price(self, value):
        """Price must be positive."""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Fiyat pozitif olmalıdır.")
        return value
    
    def validate_ear_tag_no(self, value):
        """Ear tag must be unique if provided."""
        if value and value.strip():
            # Check uniqueness (excluding current instance if updating)
            qs = AnimalListing.objects.filter(ear_tag_no=value.strip())
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Bu kulak numarası zaten kullanılıyor.")
            return value.strip()
        return None
    
    def validate(self, attrs):
        """Cross-field validation for new listings."""
        # For new listings (POST), require certain fields
        if not self.instance:  # Creating new listing
            required_for_new = ['age_months', 'city', 'district']
            for field in required_for_new:
                if not attrs.get(field):
                    field_names = {
                        'age_months': 'Yaş',
                        'city': 'Şehir',
                        'district': 'İlçe'
                    }
                    raise serializers.ValidationError({
                        field: f"{field_names[field]} yeni ilanlar için gereklidir."
                    })
        
        # Auto-fill location from city+district if not provided
        if attrs.get('city') and attrs.get('district'):
            attrs['location'] = f"{attrs['city']}, {attrs['district']}"
        
        return attrs
