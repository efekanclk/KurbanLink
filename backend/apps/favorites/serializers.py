"""
Serializers for favorites app.
"""

from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Favorite
from apps.animals.models import AnimalListing


class AnimalListingBasicSerializer(serializers.ModelSerializer):
    """
    Basic serializer for animal listing information in favorites.
    """
    
    class Meta:
        model = AnimalListing
        fields = ['id', 'title', 'animal_type', 'breed', 'price', 'location', 'is_active']
        read_only_fields = fields


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for Favorite model.
    
    The user field is automatically set to the authenticated user.
    Includes basic animal listing information in the response.
    """
    
    animal_details = AnimalListingBasicSerializer(source='animal', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Favorite
        fields = [
            'id',
            'user',
            'user_email',
            'animal',
            'animal_details',
            'created_at'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'created_at']
        labels = {
            'user': 'Kullanıcı',
            'animal': 'Hayvan İlanı',
            'created_at': 'Favorilere Eklenme Tarihi'
        }
    
    def validate_animal(self, value: AnimalListing) -> AnimalListing:
        """
        Validate that the animal listing is active and not owned by the user.
        
        Args:
            value: The AnimalListing instance
            
        Returns:
            The validated AnimalListing instance
            
        Raises:
            serializers.ValidationError: If validation fails
        """
        # Check if listing is active
        if not value.is_active:
            raise serializers.ValidationError("Cannot favorite an inactive listing.")
        
        # Check if user is trying to favorite their own listing
        request = self.context.get('request')
        if request and request.user == value.seller:
            raise serializers.ValidationError("You cannot favorite your own listing.")
        
        return value
    
    def validate(self, attrs):
        """
        Additional validation to prevent duplicate favorites.
        
        Args:
            attrs: The validated data
            
        Returns:
            The validated attributes
            
        Raises:
            serializers.ValidationError: If user already favorited this animal
        """
        request = self.context.get('request')
        animal = attrs.get('animal')
        
        if request and Favorite.objects.filter(user=request.user, animal=animal).exists():
            raise serializers.ValidationError("You have already favorited this listing.")
        
        return attrs
