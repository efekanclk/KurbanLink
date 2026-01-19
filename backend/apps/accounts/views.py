"""
Views for accounts app.
"""

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer, RegisterSerializer, MeSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our custom serializer.
    
    This view extends the default TokenObtainPairView to use our
    CustomTokenObtainPairSerializer, which includes user roles in the token.
    """
    
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    """
    API endpoint for user registration.
    
    POST /api/auth/register/
    
    Request body:
    {
        "email": "user@example.com",
        "password": "secure12345",
        "roles": ["SELLER", "BUTCHER"],  // optional
        "butcher_profile": {  // required if BUTCHER selected
            "business_name": "Example Butcher",
            "city": "Ankara",
            "services": ["Kurban kesimi"],  // optional
            "price_range": "1000-2000"  // optional
        }
    }
    
    Response (201 Created):
    {
        "id": 1,
        "email": "user@example.com",
        "roles": ["BUYER", "SELLER", "BUTCHER"],
        "access": "<jwt_access_token>",
        "refresh": "<jwt_refresh_token>"
    }
    
    Test cases:
    1. Register with email+password only => roles: ["BUYER"]
    2. Register with roles ["SELLER"] => roles: ["BUYER", "SELLER"]
    3. Register with roles ["BUTCHER"] + butcher_profile => Success + ButcherProfile created
    4. Register with roles ["BUTCHER"] without butcher_profile => 400
    5. Register with invalid role => 400
    6. Duplicate email => 400
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle user registration."""
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.parsers import MultiPartParser, JSONParser

class MeAPIView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/me/
    Returns current authenticated user's id, email, and active roles.
    
    PATCH /api/auth/me/
    Update user profile (profile_image, city, district, etc.)
    """
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser]
    
    def get_object(self):
        return self.request.user
        
    def partial_update(self, request, *args, **kwargs):
        """
        Handle partial updates including file uploads.
        """
        user = self.get_object()
        
        # If profile_image is in data (even if empty/null), it might be an attempt to clear it
        # But for now standard partial_update should handle it if serializer is correct
        
        return super().partial_update(request, *args, **kwargs)
