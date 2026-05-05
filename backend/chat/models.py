from django.db import models
from django.conf import settings
from properties.models import Property
import uuid

class Conversation(models.Model):
    """Chat between users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, null=True, blank=True, related_name='conversations')
    
    last_message = models.TextField(blank=True)
    last_message_time = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-last_message_time']
    
    def __str__(self):
        return f"Conversation {self.id}"
    
    def get_other_participant(self, user):
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    """Individual message"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    content = models.TextField()
    attachment = models.FileField(upload_to='chat_attachments/%Y/%m/%d/', null=True, blank=True)
    attachment_type = models.CharField(max_length=20, blank=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']