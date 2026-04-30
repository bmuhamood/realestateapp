# favorites/models.py - WITH UUID SUPPORT

from django.db import models
from django.conf import settings
from properties.models import Property
import uuid


class Favorite(models.Model):
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'property')
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['property', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.property.title}"