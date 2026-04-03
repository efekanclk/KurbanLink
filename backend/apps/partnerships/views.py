from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from .models import PartnershipListing, PartnershipMembership, PartnershipJoinRequest
from .serializers import PartnershipSerializer, MemberSerializer, JoinRequestSerializer
from .permissions import IsCreator
from apps.messages.models import GroupConversation, GroupConversationParticipant


class PartnershipListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for partnership listings with membership management.
    """
    serializer_class = PartnershipSerializer
    
    def get_permissions(self):
        """
        Public read access for list/retrieve, authenticated for actions.
        """
        from rest_framework.permissions import AllowAny
        
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on query params."""
        queryset = PartnershipListing.objects.all()
        
        # Filter by user membership
        my_partnerships = self.request.query_params.get('my_partnerships', 'false')
        is_my_partnerships = my_partnerships.lower() == 'true' and self.request.user.is_authenticated

        # Filter by status
        # If showing my partnerships, show ALL status (including CLOSED)
        # Otherwise, default to OPEN unless show_closed=true
        show_closed = self.request.query_params.get('show_closed', 'false')
        if not is_my_partnerships and show_closed.lower() != 'true':
            queryset = queryset.filter(status=PartnershipListing.OPEN)
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        if is_my_partnerships:
            queryset = queryset.filter(memberships__user=self.request.user, memberships__is_active=True).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Create partnership and auto-create membership + group chat.
        """
        partnership = serializer.save(creator=self.request.user)
        
        # Auto-create membership for creator
        PartnershipMembership.objects.create(
            partnership=partnership,
            user=self.request.user,
            is_active=True
        )
        
        # Auto-create group conversation
        group_conv = GroupConversation.objects.create(partnership=partnership)
        GroupConversationParticipant.objects.create(
            conversation=group_conv,
            user=self.request.user,
            is_active=True
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCreator])
    def close(self, request, pk=None):
        """Close a partnership listing (creator only)."""
        partnership = self.get_object()
        partnership.status = PartnershipListing.CLOSED
        partnership.save()
        serializer = self.get_serializer(partnership)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def request_join(self, request, pk=None):
        """
        Request to join a partnership.
        Validates: not full, not member, not already requested, no other active membership.
        """
        partnership = self.get_object()
        user = request.user
        
        # Check if partnership is closed
        if partnership.status == PartnershipListing.CLOSED:
            return Response(
                {'error': 'Bu ortaklık kapatılmış.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a member
        if partnership.memberships.filter(user=user, is_active=True).exists():
            return Response(
                {'error': 'Zaten bu ortaklığın üyesisiniz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has another active membership
        active_memberships = PartnershipMembership.objects.filter(user=user, is_active=True)
        
        # CLEANUP: Check for orphan memberships (linked to non-existent partnerships)
        # Also ignore memberships for CLOSED partnerships
        valid_memberships = []
        for membership in active_memberships:
            # Check if partnership actually exists in DB
            partnership_exists = PartnershipListing.objects.filter(id=membership.partnership_id).exists()
            if not partnership_exists:
                # Orphan membership found! Delete it.
                membership.delete()
                continue
                
            # Check if partnership is CLOSED
            # If closed, this membership shouldn't block new applications.
            # Ideally user should have left, but we can treat closed partnership memberships as "archived"
            partnership_obj = PartnershipListing.objects.get(id=membership.partnership_id)
            if partnership_obj.status == PartnershipListing.CLOSED:
                continue
                
            valid_memberships.append(membership)
        
        if valid_memberships:
             return Response(
                {'error': 'Zaten başka bir ortaklığın üyesisiniz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already requested
        # Check for existing request
        existing_request = partnership.join_requests.filter(user=user).first()
        
        if existing_request:
            if existing_request.status == 'PENDING':
                return Response(
                    {'error': 'Zaten katılım isteği gönderdiniz.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_request.status == 'APPROVED':
                return Response(
                    {'error': 'Zaten kabul edilmiş bir isteğiniz var.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_request.status == 'REJECTED':
                return Response(
                    {'error': 'Bu ortaklık için isteğiniz reddedildi. Tekrar başvuru yapamazsınız.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Create new join request
        join_request = PartnershipJoinRequest.objects.create(
            partnership=partnership,
            user=user,
            status='PENDING'
        )
        
        serializer = JoinRequestSerializer(join_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsCreator])
    def requests(self, request, pk=None):
        """Get pending join requests (creator only)."""
        partnership = self.get_object()
        pending_requests = partnership.join_requests.filter(status='PENDING')
        serializer = JoinRequestSerializer(pending_requests, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCreator],
            url_path='requests/(?P<request_id>[^/.]+)/approve')
    def approve_request(self, request, pk=None, request_id=None):
        """Approve a join request (creator only)."""
        partnership = self.get_object()
        
        try:
            join_request = partnership.join_requests.get(id=request_id, status='PENDING')
        except PartnershipJoinRequest.DoesNotExist:
            return Response(
                {'error': 'İstek bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if partnership is full
        member_count = partnership.memberships.filter(is_active=True).count()
        if member_count >= partnership.person_count:
            return Response(
                {'error': 'Kontenajan dolu.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Approve request
            join_request.status = 'APPROVED'
            join_request.decided_at = timezone.now()
            join_request.save()
            
            # Create membership
            PartnershipMembership.objects.create(
                partnership=partnership,
                user=join_request.user,
                is_active=True
            )
            
            # Add to group conversation
            try:
                group_conv = partnership.group_conversation
            except Exception:
                # If group conversation is missing (e.g. old partnership), create it
                group_conv = GroupConversation.objects.create(partnership=partnership)
                # Ensure creator is in it
                GroupConversationParticipant.objects.get_or_create(
                    conversation=group_conv,
                    user=partnership.creator,
                    defaults={'is_active': True}
                )

            # Check if user is already a participant (e.g. re-joining)
            participant, created = GroupConversationParticipant.objects.get_or_create(
                conversation=group_conv,
                user=join_request.user,
                defaults={'is_active': True}
            )
            if not created and not participant.is_active:
                participant.is_active = True
                participant.save()
        
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCreator],
            url_path='requests/(?P<request_id>[^/.]+)/reject')
    def reject_request(self, request, pk=None, request_id=None):
        """Reject a join request (creator only)."""
        partnership = self.get_object()
        
        try:
            join_request = partnership.join_requests.get(id=request_id, status='PENDING')
        except PartnershipJoinRequest.DoesNotExist:
            return Response(
                {'error': 'İstek bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        join_request.status = 'REJECTED'
        join_request.decided_at = timezone.now()
        join_request.save()
        
        return Response({'status': 'rejected'})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a partnership (member only)."""
        partnership = self.get_object()
        user = request.user
        
        # Check if user is a member
        try:
            membership = partnership.memberships.get(user=user, is_active=True)
        except PartnershipMembership.DoesNotExist:
            return Response(
                {'error': 'Bu ortaklığın üyesi değilsiniz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cannot leave if creator
        if partnership.creator == user:
            return Response(
                {'error': 'Oluşturucu ortaklıktan ayrılamaz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            membership.is_active = False
            membership.save()
            
            # Deactivate group conversation participation
            try:
                if hasattr(partnership, 'group_conversation'):
                    participant = partnership.group_conversation.participants.get(user=user)
                    participant.is_active = False
                    participant.save()
            except (GroupConversationParticipant.DoesNotExist, Exception):
                pass
        
        return Response({'status': 'left'})
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get partnership members (members only)."""
        partnership = self.get_object()
        user = request.user
        
        # Check if user is a member
        if not partnership.memberships.filter(user=user, is_active=True).exists():
            return Response(
                {'error': 'Sadece üyeler bu listeyi görebilir.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get active members
        member_ids = partnership.memberships.filter(is_active=True).values_list('user_id', flat=True)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        members = User.objects.filter(id__in=member_ids)
        
        serializer = MemberSerializer(members, many=True)
        return Response(serializer.data)
