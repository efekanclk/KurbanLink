"""
Views for animals app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsOwner
from .models import AnimalListing
from .serializers import AnimalListingSerializer
from .filters import AnimalListingFilter
from .pagination import AnimalListingPagination


class AnimalListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for animal listings.
    
    All authenticated users can create listings.
    Only owners can update/delete their listings.
    """
    
    serializer_class = AnimalListingSerializer
    queryset = AnimalListing.objects.filter(is_active=True)
    filterset_class = AnimalListingFilter
    filter_backends = [DjangoFilterBackend]  # CRITICAL: Enable filtering
    pagination_class = AnimalListingPagination
    
    def get_permissions(self):
        """
        Set different permissions for different actions.
        
        - list/retrieve: IsAuthenticated
        - create: IsAuthenticated (any user can create)
        - update/partial_update/destroy: IsAuthenticated + IsOwner
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action == 'create':
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Override to allow sellers to see their listings.
        - mine=true: Active listings (default)
        - mine=true & deleted=true: Inactive (soft deleted) listings
        """
        if self.action in ['update', 'partial_update', 'destroy', 'retrieve']:
            # For update/delete/retrieve, show all listings (including inactive)
            # Permission check will ensure only owner can access
            return AnimalListing.objects.all()
        
        # Check for 'mine=true' filter
        if self.request.query_params.get('mine') == 'true':
            qs = AnimalListing.objects.filter(seller=self.request.user)
            
            # Check for 'deleted=true' to show trash bin
            if self.request.query_params.get('deleted') == 'true':
                return qs.filter(is_active=False)
            
            # Default: Show active listings
            return qs.filter(is_active=True)
            
        # For public list, only show active listings
        return AnimalListing.objects.filter(is_active=True)
    
    # ... (perform_create, update, partial_update methods remain same) ...

    def destroy(self, request, *args, **kwargs):
        """
        Delete an animal listing.
        
        - Default: Soft delete (sets is_active=False)
        - force=true: Hard delete (removes from DB)
        """
        if request.query_params.get('force') == 'true':
            try:
                # Hard delete
                instance = self.get_object()
                self.perform_hard_delete(instance)
                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Hard delete failed: {str(e)}", exc_info=True)
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Soft delete (via perform_destroy)
        return super().destroy(request, *args, **kwargs)

    def perform_hard_delete(self, instance):
        """Perform actual database deletion"""
        instance.delete()
