"""
Serializers for messages app.
"""

from rest_framework import serializers
from django.db import IntegrityError
from .models import Conversation, Message
from apps.animals.models import AnimalListing


class AnimalListingBasicSerializer(serializers.ModelSerializer):
    """Basic animal listing info for conversations."""
    
    class Meta:
        model = AnimalListing
        fields = ['id', 'animal_type', 'breed', 'price', 'location']
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer for Conversation model.
    
    Automatically handles conversation creation with validation.
    """
    
    listing_details = AnimalListingBasicSerializer(source='listing', read_only=True)
    buyer_email = serializers.EmailField(source='buyer.email', read_only=True)
    seller_email = serializers.EmailField(source='seller.email', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id',
            'listing',
            'listing_details',
            'buyer',
            'buyer_email',
            'seller',
            'seller_email',
            'created_at'
        ]
        read_only_fields = ['id', 'buyer', 'seller', 'created_at']
    
    def validate_listing(self, value: AnimalListing) -> AnimalListing:
        """
        Validate listing exists and is active.
        
        Args:
            value: The AnimalListing instance
            
        Returns:
            The validated AnimalListing
            
        Raises:
            serializers.ValidationError: If validation fails
        """
        if not value.is_active:
            raise serializers.ValidationError("Cannot start conversation about inactive listing.")
        
        request = self.context.get('request')
        if request and request.user == value.seller:
            raise serializers.ValidationError("You cannot start a conversation about your own listing.")
        
        return value


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for Message model.
    
    Automatically sets sender from request user.
    """
    
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'sender',
            'sender_email',
            'content',
            'created_at'
        ]
        read_only_fields = ['id', 'sender', 'sender_email', 'created_at']
    
    def validate_content(self, value: str) -> str:
        """
        Validate message content is not empty.
        
        Args:
            value: Message content
            
        Returns:
            Validated content
            
        Raises:
            serializers.ValidationError: If content is empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Message content cannot be empty.")
        
        return value.strip()
    
    def validate_conversation(self, value: Conversation) -> Conversation:
        """
        Validate user is part of the conversation.
        
        Args:
            value: The Conversation instance
            
        Returns:
            Validated conversation
            
        Raises:
            serializers.ValidationError: If user not in conversation
        """
        request = self.context.get('request')
        if request and request.user not in [value.buyer, value.seller]:
            raise serializers.ValidationError("You are not part of this conversation.")
        
        return value
