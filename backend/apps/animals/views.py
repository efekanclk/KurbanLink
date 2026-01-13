"""
Views for animals app.
"""

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.accounts.permissions import IsSeller
from .models import AnimalListing
from .serializers import AnimalListingSerializer


class AnimalListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for animal listings.
    
    - CREATE: Only sellers can create listings (POST /api/animals/)
    - LIST: Any authenticated user can view listings (GET /api/animals/)
    - Only active listings are returned
    """
    
    serializer_class = AnimalListingSerializer
    queryset = AnimalListing.objects.filter(is_active=True)
    
    def get_permissions(self):
        """
        Set different permissions for different actions.
        
        - create: Requires IsSeller permission
        - list: Requires IsAuthenticated only
        """
        if self.action == 'create':
            permission_classes = [IsAuthenticated, IsSeller]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer) -> None:
        """
        Automatically set the seller to the authenticated user.
        
        Args:
            serializer: The validated serializer instance
        """
        serializer.save(seller=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new animal listing.
        
        Returns:
            201 Created with listing data if successful
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
