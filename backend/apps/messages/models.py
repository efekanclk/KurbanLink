"""
Models for messages app.
"""

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Conversation(models.Model):
    """
    Represents a conversation between a buyer and seller about an animal listing.
    
    A conversation is unique per (listing, buyer) pair.
    """
    
    listing = models.ForeignKey(
        'animals.AnimalListing',
        on_delete=models.CASCADE,
        related_name='conversations',
        help_text="The animal listing being discussed"
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_conversations',
        help_text="The buyer in this conversation"
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_conversations',
        help_text="The seller (owner of the listing)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'conversation'
        verbose_name_plural = 'conversations'
        unique_together = [['listing', 'buyer']]
        ordering = ['-created_at']
    
    def __str__(self) -> str:
        return f"Conversation about {self.listing.breed} between {self.buyer.email} and {self.seller.email}"
    
    def clean(self) -> None:
        """
        Validate conversation constraints.
        
        Raises:
            ValidationError: If seller is not the listing owner or buyer is the seller
        """
        super().clean()
        
        if self.listing and self.seller != self.listing.seller:
            raise ValidationError("Seller must be the owner of the listing.")
        
        if self.buyer == self.seller:
            raise ValidationError("Buyer and seller cannot be the same user.")


class Message(models.Model):
    """
    Represents a message in a conversation.
    
    Messages can only be sent by participants (buyer or seller) of the conversation.
    """
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text="The conversation this message belongs to"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        help_text="User who sent this message"
    )
    content = models.TextField(
        help_text="Message content"
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether message has been read"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'message'
        verbose_name_plural = 'messages'
        ordering = ['created_at']
    
    def __str__(self) -> str:
        return f"Message from {self.sender.email} at {self.created_at}"
    
    def clean(self) -> None:
        """
        Validate that sender is part of the conversation.
        
        Raises:
            ValidationError: If sender is not buyer or seller of the conversation
        """
        super().clean()
        
        if self.conversation and self.sender not in [self.conversation.buyer, self.conversation.seller]:
            raise ValidationError("Sender must be either the buyer or seller of this conversation.")


class GroupConversation(models.Model):
    """
    Represents a group conversation for a partnership.
    """
    
    partnership = models.OneToOneField(
        'partnerships.PartnershipListing',
        on_delete=models.CASCADE,
        related_name='group_conversation'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'group conversation'
        verbose_name_plural = 'group conversations'
    
    def __str__(self):
        return f"Group chat for partnership in {self.partnership.city}"


class GroupConversationParticipant(models.Model):
    """
    Represents a participant in a group conversation.
    """
    
    conversation = models.ForeignKey(
        GroupConversation,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = [['conversation', 'user']]
        ordering = ['joined_at']
    
    def __str__(self):
        return f"{self.user.email} in {self.conversation}"


class GroupMessage(models.Model):
    """
    Represents a message in a group conversation.
    """
    
    conversation = models.ForeignKey(
        GroupConversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Group message from {self.sender.email} at {self.created_at}"
