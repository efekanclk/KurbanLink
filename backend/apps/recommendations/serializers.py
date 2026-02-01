"""
Serializers for recommendations app.
"""

from rest_framework import serializers
from .models import Recommendation, ListingInteraction
from apps.animals.serializers import AnimalListingSerializer


class RecommendationSerializer(serializers.ModelSerializer):
    """
    Serializer for Recommendation model.
    
    Read-only serializer.
    """
    
    class Meta:
        model = Recommendation
        fields = ['id', 'user', 'animal', 'animal_details', 'score', 'reason', 'created_at']
        read_only_fields = ['id', 'user', 'score', 'reason', 'created_at']
        labels = {
            'user': 'Kullanıcı',
            'animal': 'Önerilen İlan',
            'score': 'Puan',
            'reason': 'Öneri Nedeni',
            'created_at': 'Oluşturulma Tarihi'
        }


class ListingInteractionSerializer(serializers.ModelSerializer):
    """
    Serializer for logging user interactions.
    """
    
    class Meta:
        model = ListingInteraction
        fields = ['listing', 'interaction_type', 'created_at']
        read_only_fields = ['created_at']


class RecommendedListingSerializer(serializers.Serializer):
    """
    Serializer for dynamic recommendations (calculated on the fly).
    """
    score = serializers.FloatField()
    reasons = serializers.ListField(child=serializers.CharField())
    listing = AnimalListingSerializer()
