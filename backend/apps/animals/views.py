"""
Views for animals app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsSeller, IsSellerAndOwner
from .models import AnimalListing
from .serializers import AnimalListingSerializer
from .filters import AnimalListingFilter
from .pagination import AnimalListingPagination


class AnimalListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for animal listings.
    
    - location: partial match (case-insensitive)
    - age range: min_age, max_age
    - weight range: min_weight, max_weight
    
    Pagination:
    - Default page size: 10
    - Configurable with ?page_size= (max 50)
    """
    
    serializer_class = AnimalListingSerializer
    queryset = AnimalListing.objects.filter(is_active=True)
    filterset_class = AnimalListingFilter
    filter_backends = [DjangoFilterBackend]  # CRITICAL: Enable filtering
    pagination_class = AnimalListingPagination
    
    def get_permissions(self):
        """
        Set different permissions for different actions.
        
        - create: Requires IsSeller
        - update/partial_update/destroy: Requires IsSellerAndOwner
        - list/retrieve: Requires IsAuthenticated only
        """
        from rest_framework.permissions import IsAuthenticated
        
        if self.action == 'create':
            return [IsAuthenticated(), IsSeller()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSellerAndOwner()]
        else:
            return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Override to allow sellers to see all their listings (including inactive)
        when updating/deleting, but only active listings for list view.
        """
        if self.action in ['update', 'partial_update', 'destroy', 'retrieve']:
            # For update/delete/retrieve, show all listings (including inactive)
            # Permission check will ensure only owner can access
            return AnimalListing.objects.all()
        
        # For list, only show active listings
        return AnimalListing.objects.filter(is_active=True)
    
    def perform_create(self, serializer) -> None:
        """
        Automatically set the seller to the authenticated user.
        
        Args:
            serializer: The validated serializer instance
        """
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Creating listing for user: {self.request.user.id}")
        serializer.save(seller=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Override update to add debug logging"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"UPDATE called by user {request.user.id} for listing {kwargs.get('pk')}")
        logger.info(f"Request data: {request.data}")
        try:
            result = super().update(request, *args, **kwargs)
            logger.info("Update successful")
            return result
        except Exception as e:
            logger.error(f"Update failed: {str(e)}", exc_info=True)
            raise
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to add debug logging"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"PARTIAL_UPDATE called by user {request.user.id} for listing {kwargs.get('pk')}")
        logger.info(f"Request data: {request.data}")
        try:
            result = super().partial_update(request, *args, **kwargs)
            logger.info("Partial update successful")
            return result
        except Exception as e:
            logger.error(f"Partial update failed: {str(e)}", exc_info=True)
            raise
    
    def perform_destroy(self, instance) -> None:
        """
        Soft delete: set is_active to False instead of deleting the record.
        
        Args:
            instance: The AnimalListing instance to soft delete
        """
        instance.is_active = False
        instance.save()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new animal listing.
        
        Returns:
            201 Created if successful
            403 Forbidden if user is not a seller
        """
        return super().create(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        """
        List all active animal listings.
        
        Returns:
            200 OK with list of active listings
        """
        return super().list(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Update an animal listing (PUT).
        
        Returns:
            200 OK if successful
            403 Forbidden if user is not the seller or doesn't have SELLER role
            404 Not Found if listing doesn't exist
        """
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update an animal listing (PATCH).
        
        Returns:
            200 OK if successful
            403 Forbidden if user is not the seller or doesn't have SELLER role
            404 Not Found if listing doesn't exist
        """
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """
        Soft delete an animal listing (sets is_active=False).
        
        Returns:
            204 No Content if successful
            403 Forbidden if user is not the seller or doesn't have SELLER role
            404 Not Found if listing doesn't exist
        """
        return super().destroy(request, *args, **kwargs)
