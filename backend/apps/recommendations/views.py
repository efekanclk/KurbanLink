"""
Views for recommendations app.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Recommendation
from .serializers import RecommendationSerializer
from .models import Recommendation
from .serializers import RecommendationSerializer


class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for recommendations.
    
    - LIST: Get all user's recommendations
    - generate: Custom action to generate new recommendations
    """
    
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only recommendations belonging to the authenticated user.
        
        Returns:
            QuerySet of user's recommendations ordered by score and created_at
        """
        return Recommendation.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate new recommendations (Legacy/Stub).
        """
        return Response({
            'count': 0,
            'recommendations': []
        })


class ListingRecommendationViewSet(viewsets.ViewSet):
    """
    ViewSet for dynamic "Animal Listing" recommendations.
    Calculated on-the-fly based on rules.
    """
    permission_classes = [permissions.AllowAny] # Allow anon
    
    def list(self, request):
        """
        GET /api/recommendations/listings/
        Query Params:
        - city (str)
        - district (str)
        - limit (int, default 20)
        - exclude_ids (str, comma-separated)
        """
        from .services import RecommendationEngine
        from .serializers import RecommendedListingSerializer
        
        # Parse params
        city = request.query_params.get('city')
        district = request.query_params.get('district')
        limit = int(request.query_params.get('limit', 20))
        limit = min(limit, 50) # Max 50
        
        exclude_param = request.query_params.get('exclude_ids', '')
        exclude_ids = []
        if exclude_param:
            try:
                exclude_ids = [int(x) for x in exclude_param.split(',') if x.strip().isdigit()]
            except ValueError:
                pass
            
        engine = RecommendationEngine()
        results = engine.get_recommendations(
            user=request.user,
            city=city,
            district=district,
            limit=limit,
            exclude_ids=exclude_ids
        )
        
        # Serialize
        serializer = RecommendedListingSerializer(results, many=True)
        return Response({
            'items': serializer.data
        })


class ListingInteractionViewSet(viewsets.ViewSet):
    """
    ViewSet for logging interactions (clicks/views).
    """
    permission_classes = [permissions.AllowAny]
    
    def create(self, request):
        """
        POST /api/recommendations/interactions/
        Body: { listing: ID, interaction_type: 'VIEW'|... }
        """
        from .serializers import ListingInteractionSerializer
        from .services import RecommendationEngine
        
        serializer = ListingInteractionSerializer(data=request.data)
        if serializer.is_valid():
            # Log it via Engine (handles logic like update view count)
            engine = RecommendationEngine()
            
            # Since serializer only validates fields, we manually extract needed data
            # Or assume serializer.validated_data is correct
            listing = serializer.validated_data['listing']
            interaction_type = serializer.validated_data['interaction_type']
            
            # Get IP for anon users
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
                
            engine.log_interaction(
                user=request.user,
                listing_id=listing.id,
                interaction_type=interaction_type,
                ip_address=ip
            )
            
            return Response({'status': 'logged'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
