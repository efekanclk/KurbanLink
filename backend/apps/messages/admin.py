"""
Admin configuration for messages app.
"""

from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    """
    Admin interface for Conversation model.
    """
    
    list_display = ('listing', 'buyer', 'seller', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('listing__breed', 'buyer__email', 'seller__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """
    Admin interface for Message model.
    """
    
    list_display = ('conversation', 'sender', 'created_at', 'content_preview')
    list_filter = ('created_at',)
    search_fields = ('sender__email', 'content')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    def content_preview(self, obj):
        """Show first 50 characters of message content."""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'


from .models import GroupConversation, GroupMessage, GroupConversationParticipant

@admin.register(GroupConversation)
class GroupConversationAdmin(admin.ModelAdmin):
    list_display = ('pk', 'partnership', 'created_at')

@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'sender', 'content', 'created_at')

@admin.register(GroupConversationParticipant)
class GroupConversationParticipantAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'user', 'is_active', 'joined_at')
