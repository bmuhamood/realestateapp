# services/models.py - WITH CLOUDINARY SUPPORT

from django.db import models
from django.conf import settings
from django.utils import timezone
from cloudinary.models import CloudinaryField
import uuid


class ServiceCategory(models.Model):
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, help_text="FontAwesome or Material icon name")
    description = models.TextField(blank=True)
    # Change to CloudinaryField
    image = CloudinaryField('image', folder='services/categories/', null=True, blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "Service Categories"
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        return self.name


class ServiceGalleryImage(models.Model):
    """Gallery images for services"""
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    service = models.ForeignKey('Service', on_delete=models.CASCADE, related_name='gallery_images')
    # Change to CloudinaryField
    image = CloudinaryField('image', folder='services/gallery/')
    order = models.IntegerField(default=0)
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['service', 'order']),
            models.Index(fields=['is_main']),
        ]
    
    def __str__(self):
        return f"{self.service.name} - Image {self.order}"


class ServiceVideo(models.Model):
    """Video for service (like TikTok style)"""
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    service = models.OneToOneField('Service', on_delete=models.CASCADE, related_name='video')
    # Change to CloudinaryField for video
    video_file = CloudinaryField('video', folder='services/videos/', resource_type='video', null=True, blank=True)
    video_url = models.URLField(blank=True, help_text="YouTube or Vimeo URL")
    # Change to CloudinaryField for thumbnail
    thumbnail = CloudinaryField('thumbnail', folder='services/videos/thumbnails/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.service.name} - Video"


class Service(models.Model):
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    SERVICE_TYPES = [
        ('decoration', 'Home Decoration'),
        ('cleaning', 'Cleaning Services'),
        ('moving', 'Moving & Relocation'),
        ('renovation', 'Renovation'),
        ('furniture', 'Furniture Supply'),
        ('security', 'Security Systems'),
        ('landscaping', 'Landscaping'),
        ('maintenance', 'Maintenance'),
        ('interior_design', 'Interior Design'),
        ('electrical', 'Electrical Services'),
        ('plumbing', 'Plumbing'),
        ('painting', 'Painting'),
        ('other', 'Other'),
    ]
    
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    service_type = models.CharField(max_length=50, choices=SERVICE_TYPES, default='other')
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_unit = models.CharField(max_length=50, blank=True, help_text="e.g., per hour, per room, per sqm")
    # Change to CloudinaryField for main image
    image = CloudinaryField('image', folder='services/', null=True, blank=True)
    duration = models.CharField(max_length=100, blank=True, help_text="e.g., 2-3 hours, 1 day")
    provider = models.CharField(max_length=200, blank=True)
    provider_phone = models.CharField(max_length=20, blank=True)
    provider_email = models.EmailField(blank=True)
    
    provider_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='services',
        null=True, 
        blank=True
    )
    
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    rating = models.FloatField(default=0)
    reviews_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['service_type', 'is_active']),
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['is_featured', 'is_active']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return self.name


class ServiceBooking(models.Model):
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateTimeField()
    address = models.TextField()
    special_instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['service', '-created_at']),
            models.Index(fields=['status', 'booking_date']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.service.name} - {self.booking_date}"


class ServiceReview(models.Model):
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_reviews')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'service')
        indexes = [
            models.Index(fields=['service', '-created_at']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.service.name} - {self.rating}★"