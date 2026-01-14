"""
URL configuration for recommendations app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecommendationViewSet

router = DefaultRouter()
router.register(r'', RecommendationViewSet, basename='recommendation')

urlpatterns = router.urls
