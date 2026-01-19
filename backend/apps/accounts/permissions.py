"""
Custom permission classes for role-based access control.

These permissions check user roles from the JWT access token payload,
not from the database or Django's built-in permission system.
"""

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from typing import Any


class IsButcher(BasePermission):
    """
    Permission class that allows access only to users with the BUTCHER role.
    
    This permission checks the 'roles' field in the JWT access token payload.
    If the user is not authenticated or does not have the BUTCHER role,
    access is denied with a 403 Forbidden response.
    
    Usage:
        permission_classes = [IsAuthenticated, IsButcher]
    """
    
    def has_permission(self, request: Request, view: Any) -> bool:
        """
        Check if the user has the BUTCHER role in their JWT token.
        
        Args:
            request: The request object containing authentication data
            view: The view being accessed
            
        Returns:
            True if user is authenticated and has BUTCHER role, False otherwise
        """
        # Deny access if user is not authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Get roles from JWT token payload
        # request.auth contains the validated token payload when using JWT
        if not request.auth:
            return False
        
        roles = request.auth.get('roles', [])
        
        # Check if BUTCHER role is present
        return 'BUTCHER' in roles


class IsOwner(BasePermission):
    """
    Permission class that allows access only to the owner of an object.
    
    Works with any model that has a 'seller' or 'user' ForeignKey field.
    Checks if request.user matches the owner.
    
    Usage:
        permission_classes = [IsAuthenticated, IsOwner]
    """
    
    def has_object_permission(self, request: Request, view: Any, obj: Any) -> bool:
        """
        Check if the requesting user is the owner of the object.
        
        Checks 'seller' field first (for listings), then 'user' field.
        """
        # Check seller field (for AnimalListing)
        if hasattr(obj, 'seller'):
            return obj.seller == request.user
        
        # Check user field (for other models)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # If no owner field found, deny access
        return False
