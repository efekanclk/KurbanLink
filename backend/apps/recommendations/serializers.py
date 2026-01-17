"""
Serializers for recommendations app.
"""

from rest_framework import serializers
from .models import Recommendation


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
