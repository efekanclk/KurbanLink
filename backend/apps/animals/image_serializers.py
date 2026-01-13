"""
Serializers for animal images.
"""

from rest_framework import serializers
from .models import AnimalImage, AnimalListing


class AnimalImageSerializer(serializers.ModelSerializer):
    """
    Serializer for AnimalImage model.
    
    Handles image upload with ownership validation.
    """
    
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AnimalImage
        fields = ['id', 'listing', 'image', 'image_url', 'is_primary', 'created_at']
        read_only_fields = ['id', 'listing', 'created_at']
    
    def get_image_url(self, obj) -> str:
        """
        Get the full URL for the image.
        
        Args:
            obj: AnimalImage instance
            
        Returns:
            Full URL to the image file
        """
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return ''
    
    def validate(self, attrs):
        """
        Validate image upload rules.
        
        Args:
            attrs: Validated data
            
        Returns:
            Validated attributes
            
        Raises:
            serializers.ValidationError: If validation fails
        """
        listing = attrs.get('listing') or (self.instance.listing if self.instance else None)
        
        # Check if listing is active
        if listing and not listing.is_active:
            raise serializers.ValidationError("Cannot add images to inactive listing.")
        
        return attrs
