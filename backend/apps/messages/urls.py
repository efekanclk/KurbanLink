"""
URL configuration for messages app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'groups', views.GroupConversationViewSet, basename='group')
router.register(r'', views.MessageViewSet, basename='message')

urlpatterns = [
    path('inbox/', views.inbox, name='inbox'),
] + router.urls
