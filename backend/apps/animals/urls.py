"""
URL configuration for animals app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnimalListingViewSet

router = DefaultRouter()
router.register(r'', AnimalListingViewSet, basename='animal')

urlpatterns = router.urls
