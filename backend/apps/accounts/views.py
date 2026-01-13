"""
Views for accounts app.
"""

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our custom serializer.
    
    This view extends the default TokenObtainPairView to use our
    CustomTokenObtainPairSerializer, which includes user roles in the token.
    """
    
    serializer_class = CustomTokenObtainPairSerializer
