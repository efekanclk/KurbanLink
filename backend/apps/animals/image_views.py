"""
Views for animal images.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsOwner
from .models import AnimalListing, AnimalImage
from .image_serializers import AnimalImageSerializer


from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)

class AnimalImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for animal listing images.
    
    Permissions:
        - list/retrieve: IsAuthenticated
        - create/destroy: IsOwner (via listing)
    """
    serializer_class = AnimalImageSerializer
    queryset = AnimalImage.objects.all()
    
    def get_permissions(self):
        """Owner can manage images of their listings."""
        if self.action in ['create', 'destroy']:
            permission_classes = [IsAuthenticated, IsOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Return images for the listing specified in URL.
        
        Returns:
            QuerySet of images for the listing
        """
        listing_id = self.kwargs.get('listing_pk')
        if listing_id:
            return AnimalImage.objects.filter(listing_id=listing_id).select_related('listing')
        return AnimalImage.objects.select_related('listing')
    
    def create(self, request, *args, **kwargs):
        """
        Upload image to listing.
        
        Returns:
            201 Created if successful
            403 Forbidden if not the seller
        """
        try:
            listing_id = self.kwargs.get('listing_pk')
            listing = get_object_or_404(AnimalListing, pk=listing_id)
            
            # Check ownership via IsSellerAndOwner permission
            self.check_object_permissions(request, listing)
            
            # Create serializer with listing
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(listing=listing)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Image upload failed: {str(e)}", exc_info=True)
            return Response(
                {'detail': f"Upload failed: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete image.
        
        Returns:
            204 No Content if successful
            403 Forbidden if not the seller
        """
        instance = self.get_object()
        
        # Check ownership via IsSellerAndOwner permission on the listing
        self.check_object_permissions(request, instance.listing)
        
        # Delete the file and database record
        instance.image.delete(save=False)
        instance.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
