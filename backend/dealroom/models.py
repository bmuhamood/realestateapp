from django.db import models
from django.conf import settings
from properties.models import Property
from bookings.models import Booking
from cloudinary.models import CloudinaryField
import uuid


class DealRoom(models.Model):
    """Private room for property transaction between buyer, seller, and agent"""
    
    STATUS_CHOICES = [
        ('negotiation', '🤝 Negotiation'),
        ('deposit', '💰 Deposit Paid'),
        ('contract', '📄 Contract Signed'),
        ('inspection', '🔍 Property Inspection'),
        ('closing', '🏁 Closing'),
        ('completed', '✅ Completed'),
        ('cancelled', '❌ Cancelled'),
        ('disputed', '⚖️ Under Dispute'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Related objects - RENAMED to property_obj to avoid conflict with Python built-in
    property_obj = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='deal_rooms', db_column='property_id')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='deal_room')
    
    # Participants
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buying_deals')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='selling_deals')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_deals')
    
    # Deal details
    agreed_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    original_listing_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_reduction = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Deposit information
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deposit_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    deposit_paid = models.BooleanField(default=False)
    deposit_paid_at = models.DateTimeField(null=True, blank=True)
    deposit_reference = models.CharField(max_length=255, blank=True)
    
    # Commission
    agent_commission = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=3.0)
    commission_paid = models.BooleanField(default=False)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='negotiation')
    current_step = models.IntegerField(default=1, help_text="Current milestone step")
    
    # Important dates
    offer_date = models.DateTimeField(auto_now_add=True)
    acceptance_date = models.DateTimeField(null=True, blank=True)
    closing_date = models.DateTimeField(null=True, blank=True)
    possession_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Terms
    special_conditions = models.TextField(blank=True, help_text="Any special conditions agreed upon")
    contingencies = models.TextField(blank=True, help_text="Sale contingencies (financing, inspection, etc.)")
    
    # Metadata
    deal_number = models.CharField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['buyer', '-created_at']),
            models.Index(fields=['seller', '-created_at']),
            models.Index(fields=['deal_number']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.deal_number:
            from django.utils import timezone
            self.deal_number = f"DEAL-{timezone.now().strftime('%Y%m')}-{str(uuid.uuid4())[:8].upper()}"
        if not self.original_listing_price and self.property_obj:
            self.original_listing_price = self.property_obj.price
        if not self.agent and self.property_obj and self.property_obj.owner == self.seller:
            self.agent = self.property_obj.owner
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.deal_number} - {self.property_obj.title if self.property_obj else 'No Property'}"
    
    @property
    def progress_percentage(self):
        """Calculate deal progress percentage based on current step"""
        total_steps = 7
        step_map = {
            'negotiation': 1,
            'deposit': 2,
            'contract': 3,
            'inspection': 4,
            'closing': 5,
            'completed': 7,
        }
        step = step_map.get(self.status, 1)
        return int((step / total_steps) * 100)
    
    @property
    def can_edit(self):
        """Check if deal can still be edited"""
        return self.status not in ['completed', 'cancelled', 'disputed']


class DealMessage(models.Model):
    """Messages within deal room"""
    MESSAGE_TYPES = [
        ('general', 'General'),
        ('offer', 'Offer Related'),
        ('document', 'Document Discussion'),
        ('inspection', 'Inspection Discussion'),
        ('closing', 'Closing Discussion'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal_room = models.ForeignKey(DealRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='general')
    content = models.TextField()
    
    # File attachments
    attachment = CloudinaryField('deal_attachment', folder='deals/attachments/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.deal_room.deal_number}"


class DealDocument(models.Model):
    """Documents shared in deal room"""
    DOCUMENT_TYPES = [
        ('offer_letter', '📄 Offer Letter'),
        ('counter_offer', '🔄 Counter Offer'),
        ('purchase_agreement', '✍️ Purchase Agreement'),
        ('title_deed', '📜 Title Deed'),
        ('survey_report', '🗺️ Survey Report'),
        ('valuation_report', '💰 Valuation Report'),
        ('inspection_report', '🔍 Inspection Report'),
        ('deposit_receipt', '💵 Deposit Receipt'),
        ('commission_agreement', '🤝 Commission Agreement'),
        ('closing_document', '🏁 Closing Document'),
        ('tax_document', '📊 Tax Document'),
        ('other', '📎 Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal_room = models.ForeignKey(DealRoom, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    file = CloudinaryField('deal_document', folder='deals/documents/', resource_type='auto')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="Size in bytes", null=True, blank=True)
    
    requires_signature = models.BooleanField(default=False)
    signed_by_buyer = models.BooleanField(default=False)
    signed_by_seller = models.BooleanField(default=False)
    signed_by_agent = models.BooleanField(default=False)
    signed_at = models.DateTimeField(null=True, blank=True)
    
    is_confidential = models.BooleanField(default=False)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.deal_room.deal_number} - {self.title}"
    
    @property
    def all_signatures_complete(self):
        """Check if all required signatures are collected"""
        required = [self.signed_by_buyer, self.signed_by_seller]
        if self.deal_room.agent:
            required.append(self.signed_by_agent)
        return all(required)


class DealMilestone(models.Model):
    """Track deal progress milestones"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal_room = models.ForeignKey(DealRoom, on_delete=models.CASCADE, related_name='milestones')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    due_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.deal_room.deal_number} - {self.title}"


class DealOffer(models.Model):
    """Track offer and counter-offer history"""
    OFFER_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('countered', 'Countered'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal_room = models.ForeignKey(DealRoom, on_delete=models.CASCADE, related_name='offers')
    
    made_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    terms = models.TextField(blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=OFFER_STATUS, default='pending')
    responded_at = models.DateTimeField(null=True, blank=True)
    response_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Offer of {self.amount} for {self.deal_room.deal_number}"


class DealActivityLog(models.Model):
    """Log all activities in deal room for audit trail"""
    ACTIVITY_TYPES = [
        ('status_change', 'Status Changed'),
        ('document_upload', 'Document Uploaded'),
        ('document_signed', 'Document Signed'),
        ('message_sent', 'Message Sent'),
        ('offer_made', 'Offer Made'),
        ('offer_accepted', 'Offer Accepted'),
        ('milestone_completed', 'Milestone Completed'),
        ('price_updated', 'Price Updated'),
        ('deposit_paid', 'Deposit Paid'),
        ('deal_completed', 'Deal Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal_room = models.ForeignKey(DealRoom, on_delete=models.CASCADE, related_name='activity_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    description = models.TextField()
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.activity_type} - {self.deal_room.deal_number}"