"""
Serializers for reviews app.
"""

from rest_framework import serializers
from .models import ButcherReview


class ButcherReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for ButcherReview model.

    - On read:  shows reviewer's username/email and computed fields.
    - On write: only requires `rating` (and optionally `comment`).
                `butcher` comes from the URL, `user` from request.user.
    """

    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = ButcherReview
        fields = [
            'id',
            'butcher',
            'user',
            'reviewer_name',
            'rating',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'reviewer_name', 'created_at', 'updated_at']

    def get_reviewer_name(self, obj):
        """Return reviewer's display name."""
        if obj.user.username:
            return obj.user.username
        return obj.user.email.split('@')[0]

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Puan 1 ile 5 arasında olmalıdır.")
        return value
