"""
Views for messages app.
"""

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Q
from django.db import IntegrityError
from django.utils import timezone
from .models import Conversation, Message, GroupConversation, GroupMessage, GroupConversationParticipant
from .serializers import ConversationSerializer, MessageSerializer, GroupMessageSerializer, InboxItemSerializer


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
        
        # Validate serializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        listing = serializer.validated_data.get('listing')
        
        if listing:
            # Determine roles based on listing
            if request.user == listing.seller:
                # Seller is initiating conversation with a buyer
                buyer_id = request.data.get('buyer')
                if not buyer_id:
                    return Response(
                        {'buyer': ['This field is required when a seller initiates a conversation.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                from apps.accounts.models import User
                try:
                    buyer = User.objects.get(pk=buyer_id)
                except User.DoesNotExist:
                    return Response({'buyer': ['User not found.']}, status=status.HTTP_404_NOT_FOUND)
                seller = request.user
            else:
                # Buyer is initiating conversation (standard flow)
                buyer = request.user
                seller = listing.seller
            
            # Check if conversation already exists (unique per listing and buyer)
            existing_conversation = Conversation.objects.filter(
                listing=listing,
                buyer=buyer
            ).first()
        else:
            # No listing - General conversation between two users
            # Usually initiated by one user towards another
            # We need both buyer and seller IDs if it's new
            # If initiated by Butcher, we use 'buyer' param as the customer
            buyer_id = request.data.get('buyer')
            seller_id = request.data.get('seller')
            
            if not buyer_id:
                return Response({'buyer': ['This field is required for general conversations.']}, status=status.HTTP_400_BAD_REQUEST)
            
            from apps.accounts.models import User
            try:
                buyer = User.objects.get(pk=buyer_id)
            except User.DoesNotExist:
                return Response({'buyer': ['Buyer not found.']}, status=status.HTTP_404_NOT_FOUND)
            
            # Seller defaults to current user if not provided
            if seller_id:
                try:
                    seller = User.objects.get(pk=seller_id)
                except User.DoesNotExist:
                    return Response({'seller': ['Seller not found.']}, status=status.HTTP_404_NOT_FOUND)
            else:
                seller = request.user
                
            # Uniqueness for general conversations: (buyer, seller)
            # Check both directions to be safe, or stick to one convention
            # Let's assume buyer is the recipient of service, seller is provider
            existing_conversation = Conversation.objects.filter(
                listing__isnull=True,
                buyer=buyer,
                seller=seller
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
            # Handle race condition
            if listing:
                existing_conversation = Conversation.objects.get(listing=listing, buyer=buyer)
            else:
                existing_conversation = Conversation.objects.get(listing__isnull=True, buyer=buyer, seller=seller)
            
            serializer = self.get_serializer(existing_conversation)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_all_read(self, request, pk=None):
        """
        Mark all messages in conversation as read.
        
        Only marks messages where receiver is request.user.
        """
        conversation = self.get_object()
        
        # Determine which messages to mark (received by this user)
        if request.user == conversation.buyer:
            # Mark messages from seller
            marked = Message.objects.filter(
                conversation=conversation,
                sender=conversation.seller,
                is_read=False
            ).update(is_read=True)
        else:
            # Mark messages from buyer
            marked = Message.objects.filter(
                conversation=conversation,
                sender=conversation.buyer,
                is_read=False
            ).update(is_read=True)
        
        return Response({
            'status': 'ok',
            'marked': marked
        })


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for messages.
    
    - CREATE: Send message in conversation
    - LIST: Get messages (filtered by conversation)
    """
    
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Message.objects.filter(
            Q(conversation__buyer=user) | Q(conversation__seller=user)
        ).select_related('conversation', 'sender').order_by('created_at')
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Allow any conversation participant to delete any message."""
        message = self.get_object()
        user = request.user
        conv = message.conversation
        # Only participants (buyer/seller) may delete
        if user not in [conv.buyer, conv.seller]:
            return Response({'detail': 'Bu mesajı silemezsiniz.'}, status=status.HTTP_403_FORBIDDEN)
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inbox(request):
    """
    Unified inbox combining direct (1-1) and group conversations.
    Returns sorted list by most recent activity.
    """
    user = request.user
    inbox_items = []
    
    # Get direct conversations (where user is buyer or seller)
    direct_convs = Conversation.objects.filter(
        Q(buyer=user) | Q(seller=user)
    )
    
    for conv in direct_convs:
        last_msg = conv.messages.order_by('-created_at').first()
        
        # Determine counterparty
        counterparty = conv.seller if user == conv.buyer else conv.buyer
        counterparty_username = counterparty.username if counterparty.username else counterparty.email.split('@')[0]
        
        # Calculate unread count
        if user == conv.buyer:
            unread = conv.messages.filter(sender=conv.seller, is_read=False).count()
        else:
            unread = conv.messages.filter(sender=conv.buyer, is_read=False).count()
        
        inbox_items.append({
            'type': 'DIRECT',
            'id': conv.id,
            'title': counterparty_username,
            'partnership_id': None,
            'last_message': {
                'content': last_msg.content,
                'sender_id': last_msg.sender.id,
                'sender_username': last_msg.sender.username or last_msg.sender.email.split('@')[0],
                'created_at': last_msg.created_at
            } if last_msg else None,
            'unread_count': unread,
            'updated_at': last_msg.created_at if last_msg else conv.created_at
        })
    
    # Get group conversations (where user is active participant)
    group_participants = GroupConversationParticipant.objects.filter(
        user=user,
        is_active=True
    ).select_related('conversation__partnership')
    
    for participant in group_participants:
        conv = participant.conversation
        last_msg = conv.messages.order_by('-created_at').first()
        
        # Calculate unread count
        if participant.last_read_at:
            unread = conv.messages.filter(
                created_at__gt=participant.last_read_at
            ).exclude(sender=user).count()
        else:
            unread = conv.messages.exclude(sender=user).count()
        
        # Get member count
        member_count = conv.participants.filter(is_active=True).count()
        
        inbox_items.append({
            'type': 'GROUP',
            'id': conv.id,
            'title': f"{conv.partnership.city} Ortaklığı ({member_count}/{conv.partnership.person_count})",
            'partnership_id': conv.partnership.id,
            'last_message': {
                'content': last_msg.content,
                'sender_id': last_msg.sender.id,
                'sender_username': last_msg.sender.username or last_msg.sender.email.split('@')[0],
                'created_at': last_msg.created_at
            } if last_msg else None,
            'unread_count': unread,
            'updated_at': last_msg.created_at if last_msg else conv.created_at
        })
    
    # Sort by updated_at descending
    inbox_items.sort(key=lambda x: x['updated_at'], reverse=True)
    
    serializer = InboxItemSerializer(inbox_items, many=True)
    return Response(serializer.data)


class GroupConversationViewSet(viewsets.ViewSet):
    """
    ViewSet for group conversations (partnership chat).
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'], url_path='messages')
    def messages(self, request, pk=None):
        """Get all messages in a group conversation."""
        try:
            conversation = GroupConversation.objects.get(pk=pk)
        except GroupConversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is participant
        if not conversation.participants.filter(user=request.user, is_active=True).exists():
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        messages = conversation.messages.all()
        serializer = GroupMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='messages/send')
    def send_message(self, request, pk=None):
        """Send a message to a group conversation."""
        try:
            conversation = GroupConversation.objects.get(pk=pk)
        except GroupConversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is participant
        if not conversation.participants.filter(user=request.user, is_active=True).exists():
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        message = GroupMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        serializer = GroupMessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='mark_all_read')
    def mark_all_read(self, request, pk=None):
        """Mark all messages in group as read by updating last_read_at."""
        try:
            conversation = GroupConversation.objects.get(pk=pk)
        except GroupConversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is participant
        try:
            participant = conversation.participants.get(user=request.user, is_active=True)
        except GroupConversationParticipant.DoesNotExist:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        participant.last_read_at = timezone.now()
        participant.save()
        
        return Response({'status': 'marked as read'})
