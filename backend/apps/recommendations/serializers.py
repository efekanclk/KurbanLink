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
        fields = ['id', 'type', 'object_id', 'score', 'reason', 'created_at']
        read_only_fields = ['id', 'type', 'object_id', 'score', 'reason', 'created_at']
