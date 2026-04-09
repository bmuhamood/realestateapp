# chatbot/models.py
from django.db import models
from django.conf import settings
from django.db.models import JSONField
import uuid

class ChatSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_sessions', null=True, blank=True)
    session_id = models.UUIDField(default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Context tracking
    context = models.JSONField(default=dict, blank=True)
    user_preferences = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['session_id']),
            models.Index(fields=['user', '-updated_at']),
        ]
    
    def __str__(self):
        return f"Session {self.session_id} - {self.user.username if self.user else 'Anonymous'}"

class ChatMessage(models.Model):
    MESSAGE_TYPES = [
        ('user', 'User'),
        ('bot', 'Bot'),
        ('system', 'System'),
    ]
    
    INTENTS = [
        ('property_search', 'Property Search'),
        ('booking', 'Booking'),
        ('services', 'Services'),
        ('price_inquiry', 'Price Inquiry'),
        ('location_inquiry', 'Location Inquiry'),
        ('favorites', 'Favorites'),
        ('greeting', 'Greeting'),
        ('help', 'Help'),
        ('general', 'General'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='user')
    intent = models.CharField(max_length=50, choices=INTENTS, null=True, blank=True)
    content = models.TextField()
    entities = models.JSONField(default=dict, blank=True)  # Extracted entities like location, price, etc.
    suggestions = models.JSONField(default=list, blank=True)
    property_data = models.JSONField(null=True, blank=True)
    service_data = models.JSONField(null=True, blank=True)
    confidence_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session', '-created_at']),
            models.Index(fields=['intent']),
        ]
    
    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}"

class UserChatPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_preferences')
    
    # Learned preferences
    preferred_locations = models.JSONField(default=list)
    preferred_property_types = models.JSONField(default=list)
    budget_min = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    preferred_bedrooms = models.IntegerField(null=True, blank=True)
    
    # Behavior patterns
    frequent_intents = models.JSONField(default=dict)
    average_message_length = models.FloatField(default=0)
    total_interactions = models.IntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preferences for {self.user.username}"

class ConversationAnalytics(models.Model):
    """Track conversation patterns for improvement"""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    user_message = models.TextField()
    bot_response = models.TextField()
    intent = models.CharField(max_length=50)
    response_time_ms = models.IntegerField()
    user_rating = models.IntegerField(null=True, blank=True)  # 1-5 stars
    created_at = models.DateTimeField(auto_now_add=True)