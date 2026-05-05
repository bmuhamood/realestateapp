from datetime import timezone
from rest_framework import serializers
from .models import (
    DealRoom, DealMessage, DealDocument, DealMilestone, 
    DealOffer, DealActivityLog
)
from users.serializers import UserSerializer
from properties.serializers import PropertySerializer


class DealMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    is_sender = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DealMessage
        fields = [
            'id', 'sender', 'sender_name', 'sender_avatar', 'is_sender',
            'message_type', 'content', 'attachment', 'attachment_url',
            'attachment_name', 'is_read', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'sender', 'is_read', 'created_at']
    
    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username
    
    def get_sender_avatar(self, obj):
        if obj.sender.profile_picture:
            return obj.sender.profile_picture.url
        return None
    
    def get_is_sender(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)
    
    def get_attachment_url(self, obj):
        if obj.attachment:
            return obj.attachment.url
        return None


class DealDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    document_type_display = serializers.SerializerMethodField()
    can_sign = serializers.SerializerMethodField()
    all_signed = serializers.SerializerMethodField()
    
    class Meta:
        model = DealDocument
        fields = [
            'id', 'document_type', 'document_type_display', 'title', 'description',
            'file', 'file_url', 'file_name', 'file_size', 'uploaded_by', 'uploaded_by_name',
            'requires_signature', 'signed_by_buyer', 'signed_by_seller', 'signed_by_agent',
            'all_signed', 'can_sign', 'signed_at', 'is_confidential', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at', 'signed_at']
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None
    
    def get_document_type_display(self, obj):
        return dict(DealDocument.DOCUMENT_TYPES).get(obj.document_type, obj.document_type)
    
    def get_can_sign(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if not obj.requires_signature:
            return False
        if request.user == obj.deal_room.buyer and not obj.signed_by_buyer:
            return True
        if request.user == obj.deal_room.seller and not obj.signed_by_seller:
            return True
        if obj.deal_room.agent and request.user == obj.deal_room.agent and not obj.signed_by_agent:
            return True
        return False
    
    def get_all_signed(self, obj):
        return obj.all_signatures_complete


class DealMilestoneSerializer(serializers.ModelSerializer):
    status_badge = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DealMilestone
        fields = [
            'id', 'title', 'description', 'due_date', 'completed_date',
            'is_completed', 'completed_by', 'completed_by_name', 'order', 'status_badge'
        ]
    
    def get_status_badge(self, obj):
        if obj.is_completed:
            return 'completed'
        if obj.due_date and obj.due_date < timezone.now():
            return 'overdue'
        return 'pending'
    
    def get_completed_by_name(self, obj):
        if obj.completed_by:
            return obj.completed_by.get_full_name() or obj.completed_by.username
        return None


class DealOfferSerializer(serializers.ModelSerializer):
    made_by_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    amount_formatted = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = DealOffer
        fields = [
            'id', 'made_by', 'made_by_name', 'amount', 'amount_formatted',
            'terms', 'expiry_date', 'status', 'status_display',
            'responded_at', 'response_notes', 'created_at', 'time_ago'
        ]
    
    def get_made_by_name(self, obj):
        return obj.made_by.get_full_name() or obj.made_by.username
    
    def get_status_display(self, obj):
        return dict(DealOffer.OFFER_STATUS).get(obj.status, obj.status)
    
    def get_amount_formatted(self, obj):
        return f"UGX {obj.amount:,.0f}"
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)


class DealActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    activity_display = serializers.SerializerMethodField()
    
    class Meta:
        model = DealActivityLog
        fields = [
            'id', 'user', 'user_name', 'activity_type', 'activity_display',
            'description', 'old_value', 'new_value', 'created_at'
        ]
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def get_activity_display(self, obj):
        return dict(DealActivityLog.ACTIVITY_TYPES).get(obj.activity_type, obj.activity_type)


class DealRoomSerializer(serializers.ModelSerializer):
    property_data = PropertySerializer(source='property_obj', read_only=True)
    buyer_data = UserSerializer(source='buyer', read_only=True)
    seller_data = UserSerializer(source='seller', read_only=True)
    agent_data = UserSerializer(source='agent', read_only=True)
    
    status_display = serializers.SerializerMethodField()
    status_color = serializers.SerializerMethodField()
    progress_percentage = serializers.ReadOnlyField()
    agreed_price_formatted = serializers.SerializerMethodField()
    deposit_amount_formatted = serializers.SerializerMethodField()
    
    messages = DealMessageSerializer(many=True, read_only=True)
    documents = DealDocumentSerializer(many=True, read_only=True)
    milestones = DealMilestoneSerializer(many=True, read_only=True)
    offers = DealOfferSerializer(many=True, read_only=True)
    activity_logs = DealActivityLogSerializer(many=True, read_only=True)
    
    unread_messages_count = serializers.SerializerMethodField()
    pending_documents_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = DealRoom
        fields = [
            'id', 'deal_number', 'property_obj', 'property_data', 'booking',
            'buyer', 'buyer_data', 'seller', 'seller_data', 'agent', 'agent_data',
            'agreed_price', 'agreed_price_formatted', 'original_listing_price',
            'price_reduction', 'deposit_amount', 'deposit_amount_formatted',
            'deposit_percentage', 'deposit_paid', 'deposit_paid_at', 'deposit_reference',
            'agent_commission', 'commission_percentage', 'commission_paid',
            'status', 'status_display', 'status_color', 'current_step',
            'progress_percentage', 'offer_date', 'acceptance_date', 'closing_date',
            'possession_date', 'special_conditions', 'contingencies',
            'messages', 'documents', 'milestones', 'offers', 'activity_logs',
            'unread_messages_count', 'pending_documents_count', 'user_role',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'deal_number', 'offer_date', 'created_at', 'updated_at',
            'completed_at', 'property_data', 'buyer_data', 'seller_data', 'agent_data'
        ]
    
    def get_status_display(self, obj):
        return dict(DealRoom.STATUS_CHOICES).get(obj.status, obj.status)
    
    def get_status_color(self, obj):
        colors = {
            'negotiation': '#f59e0b',
            'deposit': '#8b5cf6',
            'contract': '#3b82f6',
            'inspection': '#10b981',
            'closing': '#6366f1',
            'completed': '#22c55e',
            'cancelled': '#ef4444',
            'disputed': '#dc2626',
        }
        return colors.get(obj.status, '#64748b')
    
    def get_agreed_price_formatted(self, obj):
        if obj.agreed_price:
            return f"UGX {obj.agreed_price:,.0f}"
        return None
    
    def get_deposit_amount_formatted(self, obj):
        if obj.deposit_amount:
            return f"UGX {obj.deposit_amount:,.0f}"
        return None
    
    def get_unread_messages_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
    
    def get_pending_documents_count(self, obj):
        return obj.documents.filter(requires_signature=True, signed_at__isnull=True).count()
    
    def get_user_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        if request.user == obj.buyer:
            return 'buyer'
        if request.user == obj.seller:
            return 'seller'
        if request.user == obj.agent:
            return 'agent'
        if request.user.is_staff:
            return 'admin'
        return None

class DealRoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealRoom
        fields = ['property_obj', 'booking', 'buyer', 'seller', 'agent', 'special_conditions']
    
    def validate(self, data):
        property_obj = data.get('property_obj')
        buyer = data.get('buyer')
        seller = data.get('seller')
        
        if buyer == seller:
            raise serializers.ValidationError("Buyer and seller cannot be the same person")
        
        if property_obj.owner != seller:
            raise serializers.ValidationError("Property owner must be the seller")
        
        if DealRoom.objects.filter(
            property_obj=property_obj, 
            buyer=buyer, 
            status__in=['negotiation', 'deposit', 'contract', 'inspection', 'closing']
        ).exists():
            raise serializers.ValidationError("An active deal already exists for this property and buyer")
        
        return data
    
    def create(self, validated_data):
        property_obj = validated_data.get('property_obj')
        validated_data['original_listing_price'] = property_obj.price
        # ✅ Set initial agreed_price to original listing price
        validated_data['agreed_price'] = property_obj.price
        return super().create(validated_data)

class DealUpdateSerializer(serializers.ModelSerializer):
    """For updating deal details (status, price, etc.)"""
    class Meta:
        model = DealRoom
        fields = [
            'agreed_price', 'deposit_amount', 'deposit_percentage', 'deposit_paid',
            'deposit_paid_at', 'deposit_reference', 'agent_commission',
            'commission_percentage', 'commission_paid', 'status', 'closing_date',
            'possession_date', 'special_conditions', 'contingencies'
        ]


class DealMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealMessage
        fields = ['message_type', 'content', 'attachment', 'attachment_name']


class DealDocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealDocument
        fields = ['document_type', 'title', 'description', 'file', 'requires_signature', 'is_confidential']


class DealSignatureSerializer(serializers.Serializer):
    """For signing documents"""
    document_id = serializers.UUIDField()
    
    def validate_document_id(self, value):
        try:
            document = DealDocument.objects.get(id=value)
        except DealDocument.DoesNotExist:
            raise serializers.ValidationError("Document not found")
        return value


class DealOfferCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealOffer
        fields = ['amount', 'terms', 'expiry_date']


class DealOfferResponseSerializer(serializers.Serializer):
    """For responding to offers"""
    offer_id = serializers.UUIDField()
    action = serializers.ChoiceField(choices=['accept', 'reject', 'counter'])
    counter_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    counter_terms = serializers.CharField(required=False)