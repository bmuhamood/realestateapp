from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    phone = models.CharField(max_length=15, unique=True)
    is_agent = models.BooleanField(default=False)
    is_service_provider = models.BooleanField(default=False)  # Add this line
    is_verified = models.BooleanField(default=False)
    verification_document = models.FileField(upload_to='verifications/', null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    cover_photo = models.ImageField(upload_to='covers/', null=True, blank=True)  # Add this
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    followers_count = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def is_verified_agent(self):
        return self.is_agent and self.is_verified
    
    @property
    def is_verified_service_provider(self):
        return self.is_service_provider and self.is_verified
    
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'following')
    
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

# users/models.py - Update the Status model

class Status(models.Model):
    """Status story like WhatsApp/Instagram"""
    STATUS_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('text', 'Text'),
    )
    
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='statuses')
    media = models.FileField(upload_to='statuses/%Y/%m/%d/', null=True, blank=True)
    media_type = models.CharField(max_length=10, choices=STATUS_TYPES, default='image')
    text_content = models.TextField(blank=True, null=True)
    background_color = models.CharField(max_length=7, default='#1DA1F2')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # CHANGE THIS - allow null
    views_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            from django.utils import timezone
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.username}'s status - {self.created_at}"

class StatusView(models.Model):
    """Track who viewed each status"""
    status = models.ForeignKey(Status, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey('User', on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['status', 'viewer']
    
    def __str__(self):
        return f"{self.viewer.username} viewed {self.status.user.username}'s status"
    