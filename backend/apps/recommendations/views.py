"""
Views for recommendations app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Recommendation
from .serializers import RecommendationSerializer
from .services import generate_recommendations_for_user


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
        Generate new recommendations for the authenticated user.
        
        Args:
            request: HTTP request
            
        Returns:
            200 OK with newly generated recommendations
        """
        recommendations = generate_recommendations_for_user(request.user)
        
        serializer = self.get_serializer(recommendations, many=True)
        return Response({
            'count': len(recommendations),
            'recommendations': serializer.data
        })
