# bookings/models.py - WITH BOOKINGHISTORY

from django.db import models
from django.conf import settings
from properties.models import Property
import uuid
from django.utils import timezone


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    # UUID primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    property_obj = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='bookings', db_column='property_id')  # ✅ Renamed to property_obj
    visit_date = models.DateTimeField()
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    booking_fee = models.DecimalField(max_digits=10, decimal_places=2, default=10000)
    
    # ✅ Add these fields
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['property_obj', '-created_at']),  # ✅ Updated field name
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.property_obj.title} - {self.visit_date}"
    
    # ✅ Use different method names (not @property to avoid conflict)
    def can_cancel(self):
        """Check if booking can be cancelled"""
        if self.status != 'confirmed':
            return False
        # Can cancel if more than 24 hours before visit
        hours_until = (self.visit_date - timezone.now()).total_seconds() / 3600
        return hours_until > 24
    
    def days_until_visit(self):
        """Get days until visit date"""
        if self.visit_date > timezone.now():
            delta = self.visit_date - timezone.now()
            return delta.days
        return 0
    
    def get_status_display_custom(self):
        """Get status display name"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)


# BookingHistory model remains the same
class BookingHistory(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.booking} - {self.action} - {self.created_at}"