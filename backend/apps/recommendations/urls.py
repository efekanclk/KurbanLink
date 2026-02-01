"""
URL configuration for recommendations app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecommendationViewSet, ListingRecommendationViewSet, ListingInteractionViewSet

router = DefaultRouter()
router.register(r'listings', ListingRecommendationViewSet, basename='listing-recommendation')
router.register(r'interactions', ListingInteractionViewSet, basename='listing-interaction')
router.register(r'', RecommendationViewSet, basename='recommendation')

urlpatterns = router.urls
