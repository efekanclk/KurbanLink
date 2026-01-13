"""
Views for messages app.
"""

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.db import IntegrityError
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for conversations.
    
    - CREATE: Start or get existing conversation
    - LIST: User's conversations (as buyer or seller)
    """
    
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # Disable PUT/PATCH/DELETE
    
    def get_queryset(self):
        """
        Return conversations where user is buyer or seller.
        
        Returns:
            QuerySet of user's conversations
        """
        user = self.request.user
        return Conversation.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related('listing', 'buyer', 'seller').order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Start or get existing conversation.
        
        If conversation exists, return it (200 OK).
        If not, create new conversation (201 Created).
        
        Returns:
            200 OK with existing conversation, or
            201 Created with new conversation
        """
        # Get listing from request
        listing_id = request.data.get('listing')
        
        if not listing_id:
            return Response(
                {'listing': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate serializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        listing = serializer.validated_data['listing']
        buyer = request.user
        seller = listing.seller
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            listing=listing,
            buyer=buyer
        ).first()
        
        if existing_conversation:
            # Return existing conversation
            serializer = self.get_serializer(existing_conversation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Create new conversation
        try:
            conversation = Conversation.objects.create(
                listing=listing,
                buyer=buyer,
                seller=seller
            )
            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except IntegrityError:
            # Handle race condition - conversation was just created
            existing_conversation = Conversation.objects.get(
                listing=listing,
                buyer=buyer
            )
            serializer = self.get_serializer(existing_conversation)
            return Response(serializer.data, status=status.HTTP_200_OK)


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for messages.
    
    - CREATE: Send message in conversation
    - LIST: Get messages (filtered by conversation)
    """
    
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # Disable PUT/PATCH/DELETE
    
    def get_queryset(self):
        """
        Return messages from conversations user is part of.
        
        Filtered by conversation query parameter if provided.
        
        Returns:
            QuerySet of accessible messages
        """
        user = self.request.user
        
        # Only messages from user's conversations
        queryset = Message.objects.filter(
            Q(conversation__buyer=user) | Q(conversation__seller=user)
        ).select_related('conversation', 'sender').order_by('created_at')
        
        # Filter by conversation if specified
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        
        return queryset
    
    def perform_create(self, serializer) -> None:
        """
        Automatically set sender to authenticated user.
        
        Args:
            serializer: The validated serializer instance
        """
        serializer.save(sender=self.request.user)
