"""
URL configuration for animals app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnimalListingViewSet
from .image_views import AnimalImageViewSet

router = DefaultRouter()
router.register(r'', AnimalListingViewSet, basename='animal')

# Image endpoints (manually defined for nested routes)
image_list = AnimalImageViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

image_detail = AnimalImageViewSet.as_view({
    'delete': 'destroy'
})

urlpatterns = [
    path('', include(router.urls)),
    path('<int:listing_pk>/images/', image_list, name='animal-images-list'),
    path('images/<int:pk>/', image_detail, name='animal-image-detail'),
]
