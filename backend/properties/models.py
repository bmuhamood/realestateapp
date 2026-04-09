from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class Property(models.Model):
    PROPERTY_TYPES = [
        ('house', 'House'),
        ('apartment', 'Apartment'),
        ('land', 'Land'),
        ('commercial', 'Commercial'),
        ('condo', 'Condo'),
    ]
    
    TRANSACTION_TYPES = [
        ('sale', 'For Sale'),
        ('rent', 'For Rent'),
        ('shortlet', 'Shortlet'),
    ]
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=255)
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES, default='house')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='sale')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    square_meters = models.IntegerField(null=True, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=timezone.now() + timedelta(days=30))
    is_boosted = models.BooleanField(default=False)
    boosted_until = models.DateTimeField(null=True, blank=True)
    boost_level = models.CharField(max_length=20, choices=[
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('vip', 'VIP'),
    ], default='standard')
    boost_price_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    boost_payment_ref = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['-is_boosted', '-created_at']
    
    def __str__(self):
        return self.title
    
    def is_boosted_active(self):
        """Check if boost is still active"""
        if self.is_boosted and self.boosted_until:
            return self.boosted_until > timezone.now()
        return False
    
    def get_boost_days_left(self):
        """Get remaining boost days"""
        if self.boosted_until:
            days_left = (self.boosted_until - timezone.now()).days
            return max(0, days_left)
        return 0

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='properties/%Y/%m/')
    is_main = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.property.title} - Image"

class PropertyLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'property')
    
    def __str__(self):
        return f"{self.user.username} likes {self.property.title}"

class PropertyView(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='views')
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"View for {self.property.title}"