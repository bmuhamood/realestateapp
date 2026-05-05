from django.db import models
from django.conf import settings
from properties.models import Property
from services.models import Service
import uuid


class Complaint(models.Model):
    """User complaint/dispute against agents, properties, or services"""
    
    CATEGORY_CHOICES = [
        ('fraud', 'Fraud / Scam'),
        ('fake_listing', 'Fake Listing'),
        ('misrepresentation', 'Property Misrepresentation'),
        ('agent_misconduct', 'Agent Misconduct'),
        ('service_issue', 'Service Issue'),
        ('payment_dispute', 'Payment Dispute'),
        ('privacy_violation', 'Privacy Violation'),
        ('harassment', 'Harassment'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('investigating', 'Under Investigation'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
        ('escalated', 'Escalated to Legal'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Parties involved
    complainant = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='complaints_made'
    )
    defendant = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='complaints_received'
    )
    
    # Related items - RENAMED to property_obj and service_obj to avoid conflicts
    property_obj = models.ForeignKey(
        Property, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='complaints',
        db_column='property_id'
    )
    service_obj = models.ForeignKey(
        Service, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='complaints',
        db_column='service_id'
    )
    
    # Complaint details
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    evidence = models.JSONField(default=list, blank=True)  # Store Cloudinary URLs
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    admin_response = models.TextField(blank=True)
    resolution_details = models.TextField(blank=True)
    
    # Resolution
    resolved_in_favor = models.CharField(
        max_length=20, 
        null=True, 
        blank=True,
        choices=[
            ('complainant', 'In favor of Complainant'),
            ('defendant', 'In favor of Defendant'),
            ('partial', 'Partially Resolved'),
        ]
    )
    compensation_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Admin assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_complaints'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['complainant', '-created_at']),
            models.Index(fields=['priority', 'status']),
        ]
    
    def __str__(self):
        return f"Complaint #{str(self.id)[:8]}: {self.title}"
    
    @property
    def complaint_number(self):
        return f"CMP-{self.created_at.strftime('%Y%m')}-{str(self.id)[:6]}"


class ComplaintMessage(models.Model):
    """Messages within a complaint thread (for back-and-forth communication)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    content = models.TextField()
    attachment = models.FileField(upload_to='complaints/attachments/%Y/%m/%d/', null=True, blank=True)
    is_admin_response = models.BooleanField(default=False)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message on {self.complaint.complaint_number} from {self.sender.username}"


class ComplaintDocument(models.Model):
    """Additional documents for complaint evidence"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='complaints/documents/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="Size in bytes")
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.complaint.complaint_number} - {self.title}"


class ComplaintResolution(models.Model):
    """Track resolution steps and actions taken"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='resolutions')
    
    action_taken = models.TextField()
    action_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Actions that can be taken
    ACTION_TYPES = [
        ('warning', 'Warning Issued'),
        ('listing_removed', 'Listing Removed'),
        ('agent_suspended', 'Agent Suspended'),
        ('agent_verified', 'Agent Verification Revoked'),
        ('refund_issued', 'Refund Issued'),
        ('compensation', 'Compensation Paid'),
        ('account_ban', 'Account Banned'),
        ('escalated', 'Escalated to Legal'),
    ]
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Resolution for {self.complaint.complaint_number}"