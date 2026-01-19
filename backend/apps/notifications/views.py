"""
Views for notifications app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for notifications.
    
    - LIST: Get all user's notifications
    - RETRIEVE: Get single notification
    - mark_as_read: Custom action to mark notification as read
    """
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only notifications belonging to the authenticated user.
        
        Returns:
            QuerySet of user's notifications ordered by created_at DESC
        """
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read.
        
        Args:
            request: HTTP request
            pk: Notification ID
            
        Returns:
            200 OK with updated notification
            404 Not Found if notification doesn't exist or doesn't belong to user
        """
        notification = self.get_object()
        notification.mark_as_read()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications for the current user as read.
        
        POST /api/notifications/mark_all_read/
        """
        self.get_queryset().update(is_read=True)
        return Response({'status': 'success', 'message': 'All notifications marked as read'})
