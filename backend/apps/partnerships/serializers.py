from rest_framework import serializers
from .models import PartnershipListing, PartnershipMembership, PartnershipJoinRequest
from django.contrib.auth import get_user_model

User = get_user_model()


class PartnershipSerializer(serializers.ModelSerializer):
    """
    Serializer for Partnership listings with membership info.
    """
    
    creator_username = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    user_is_member = serializers.SerializerMethodField()
    user_is_creator = serializers.SerializerMethodField()
    user_request_status = serializers.SerializerMethodField()
    
    class Meta:
        model = PartnershipListing
        fields = [
            'id',
            'creator',
            'creator_username',
            'city',
            'person_count',
            'description',
            'status',
            'member_count',
            'is_full',
            'user_is_member',
            'user_is_creator',
            'user_request_status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'creator', 'created_at', 'updated_at']
    
    def get_creator_username(self, obj):
        if obj.creator.username:
            return obj.creator.username
        return obj.creator.email.split('@')[0] if obj.creator.email else None
    
    def get_member_count(self, obj):
        """Count of active members including creator."""
        return obj.memberships.filter(is_active=True).count()
    
    def get_is_full(self, obj):
        """Check if partnership has reached capacity."""
        return self.get_member_count(obj) >= obj.person_count
    
    def get_user_is_member(self, obj):
        """Check if current user is an active member."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.memberships.filter(user=request.user, is_active=True).exists()
    
    def get_user_is_creator(self, obj):
        """Check if current user is the creator."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.creator == request.user
    
    def get_user_request_status(self, obj):
        """Get current user's join request status if any."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        join_request = obj.join_requests.filter(user=request.user).first()
        return join_request.status if join_request else None


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer for partnership members (minimal info).
    """
    
    username = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()
    city = serializers.CharField(source='profile.city', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_photo_url', 'city']
    
    def get_username(self, obj):
        if obj.username:
            return obj.username
        return obj.email.split('@')[0] if obj.email else None
    
    def get_profile_photo_url(self, obj):
        # Assuming profile has photo field
        if hasattr(obj, 'profile') and obj.profile.profile_photo:
            return obj.profile.profile_photo.url
        return None


class JoinRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for partnership join requests.
    """
    
    user_username = serializers.SerializerMethodField()
    partnership_city = serializers.CharField(source='partnership.city', read_only=True)
    
    class Meta:
        model = PartnershipJoinRequest
        fields = [
            'id',
            'partnership',
            'user',
            'user_username',
            'partnership_city',
            'status',
            'created_at',
            'decided_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'created_at', 'decided_at']
    
    def get_user_username(self, obj):
        if obj.user.username:
            return obj.user.username
        return obj.user.email.split('@')[0] if obj.user.email else None
