"""
Serializers for notifications app.
"""

from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    
    Read-only except for is_read field.
    """
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'data', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
        labels = {
            'user': 'Kullanıcı',
            'type': 'Bildirim Türü',
            'title': 'Başlık',
            'message': 'Mesaj',
            'data': 'Veri',
            'is_read': 'Okundu',
            'created_at': 'Oluşturulma Tarihi'
        }
