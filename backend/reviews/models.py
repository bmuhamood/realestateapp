# reviews/models.py - WITH UUID SUPPORT

from django.db import models
from django.conf import settings
from properties.models import Property
import uuid


class Review(models.Model):
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_reviews')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, null=True, blank=True)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'agent')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['agent', '-created_at']),
            models.Index(fields=['rating']),
            models.Index(fields=['user', 'agent']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.agent.username} - {self.rating} stars"