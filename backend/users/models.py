# users/models.py - CORRECTED (User uses default integer ID)

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from cloudinary.models import CloudinaryField
import uuid


class User(AbstractUser):
    # DO NOT add UUID field - keep default AutoField for User
    # Django's auth system expects integer primary keys
    # id = models.AutoField(primary_key=True) - this is default
    
    phone = models.CharField(max_length=15, unique=True)
    is_agent = models.BooleanField(default=False)
    is_service_provider = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Cloudinary fields
    verification_document = CloudinaryField('verification_document', 
                                           folder='verifications/',
                                           null=True, blank=True,
                                           resource_type='auto')
    
    profile_picture = CloudinaryField('profile_picture',
                                     folder='profiles/',
                                     null=True, blank=True,
                                     transformation={'width': 500, 'height': 500, 'crop': 'fill'})
    
    cover_photo = CloudinaryField('cover_photo',
                                 folder='covers/',
                                 null=True, blank=True,
                                 transformation={'width': 1500, 'height': 500, 'crop': 'fill'})
    
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
    
    def get_profile_picture_url(self):
        """Get optimized profile picture URL"""
        if self.profile_picture:
            return self.profile_picture.url
        return None
    
    def get_cover_photo_url(self):
        """Get optimized cover photo URL"""
        if self.cover_photo:
            return self.cover_photo.url
        return None


class Status(models.Model):
    """Status story like WhatsApp/Instagram"""
    # Keep UUID for Status
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    STATUS_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('text', 'Text'),
    )
    
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='statuses')
    
    media = CloudinaryField('status_media',
                           folder='statuses/',
                           null=True, blank=True,
                           resource_type='auto')
    
    media_type = models.CharField(max_length=10, choices=STATUS_TYPES, default='image')
    text_content = models.TextField(blank=True, null=True)
    background_color = models.CharField(max_length=7, default='#1DA1F2')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
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
    
    def get_media_url(self, transformation=None):
        if self.media:
            if transformation:
                return self.media.build_url(transformation=transformation)
            return self.media.url
        return None
    
    def get_thumbnail_url(self):
        if self.media_type == 'image' and self.media:
            return self.media.build_url(transformation={
                'width': 150,
                'height': 150,
                'crop': 'thumb'
            })
        return self.get_media_url()


class StatusView(models.Model):
    """Track who viewed each status"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    status = models.ForeignKey(Status, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey('User', on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['status', 'viewer']
        indexes = [
            models.Index(fields=['status', 'viewer']),
        ]
    
    def __str__(self):
        return f"{self.viewer.username} viewed {self.status.user.username}'s status"


class Follow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'following')
        indexes = [
            models.Index(fields=['follower', 'following']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class KYCSubmission(models.Model):
    """KYC document submission"""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('requires_update', 'Requires Update'),
    ]
    
    DOCUMENT_TYPES = [
        ('national_id', 'National ID'),
        ('passport', 'Passport'),
        ('driving_license', 'Driving License'),
        ('tin', 'Tax Identification Number'),
        ('business_reg', 'Business Registration'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kyc_submissions')
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document_number = models.CharField(max_length=100)
    
    # Front and back images
    front_image = CloudinaryField('kyc_front', folder='kyc/', null=True, blank=True)
    back_image = CloudinaryField('kyc_back', folder='kyc/', null=True, blank=True)
    selfie = CloudinaryField('kyc_selfie', folder='kyc/', null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='kyc_reviews')
    
    class Meta:
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_document_type_display()}"
