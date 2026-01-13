"""
Serializers for accounts app.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from typing import Dict, Any


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that adds user role information to the access token.
    
    Extends the default TokenObtainPairSerializer to include a 'roles' field
    in the access token payload containing the user's active role codes.
    """
    
    @classmethod
    def get_token(cls, user) -> Dict[str, Any]:
        """
        Override to add custom claims to the access token.
        
        Adds a 'roles' field containing a list of the user's active role codes.
        
        Args:
            user: The User instance for whom to generate the token
            
        Returns:
            Token with added role information
        """
        token = super().get_token(user)
        
        # Get active role codes for the user
        active_roles = user.user_roles.filter(is_active=True).select_related('role')
        role_codes = [user_role.role.code for user_role in active_roles]
        
        # Add roles to the access token payload
        token['roles'] = role_codes
        
        return token
