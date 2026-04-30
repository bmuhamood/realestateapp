# payments/models.py - WITH UUID SUPPORT

from django.db import models
from django.conf import settings
from properties.models import Property
from bookings.models import Booking
import uuid


class Payment(models.Model):
    # Add UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    PAYMENT_METHODS = [
        ('mtn', 'MTN Mobile Money'),
        ('airtel', 'Airtel Money'),
        ('card', 'Credit/Debit Card'),
        ('cash', 'Cash'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    reference = models.CharField(max_length=255, unique=True)
    phone_number = models.CharField(max_length=15, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reference']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.reference} - {self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)


class BoostPackage(models.Model):
    # Keep AutoField for BoostPackage (not sensitive)
    id = models.AutoField(primary_key=True)
    
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    duration_days = models.IntegerField(help_text="Duration in days")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    priority = models.IntegerField(default=0, help_text="Higher priority = better placement")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - {self.duration_days} days - UGX {self.price}"