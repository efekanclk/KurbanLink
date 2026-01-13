"""
Serializers for animals app.
"""

from rest_framework import serializers
from .models import AnimalListing


class AnimalListingSerializer(serializers.ModelSerializer):
    """
    Serializer for AnimalListing model.
    
    The seller field is read-only and automatically set to the authenticated user.
    """
    
    seller_email = serializers.EmailField(source='seller.email', read_only=True)
    
    class Meta:
        model = AnimalListing
        fields = [
            'id',
            'seller',
            'seller_email',
            'animal_type',
            'breed',
            'age',
            'weight',
            'price',
            'location',
            'description',
            'is_active',
            'created_at'
        ]
        read_only_fields = ['id', 'seller', 'seller_email', 'created_at']
