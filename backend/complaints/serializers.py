from rest_framework import serializers
from .models import Complaint, ComplaintMessage, ComplaintDocument, ComplaintResolution
from users.serializers import UserSerializer
from properties.serializers import PropertySerializer
from services.serializers import ServiceSerializer


class ComplaintMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_type = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ComplaintMessage
        fields = ['id', 'sender', 'sender_name', 'sender_type', 'content', 
                  'attachment', 'is_admin_response', 'is_read', 'created_at', 'time_ago']
        read_only_fields = ['id', 'sender', 'created_at', 'is_read']
    
    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username
    
    def get_sender_type(self, obj):
        if obj.sender.is_staff:
            return 'admin'
        elif obj.sender == obj.complaint.complainant:
            return 'complainant'
        elif obj.sender == obj.complaint.defendant:
            return 'defendant'
        return 'other'
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)


class ComplaintDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ComplaintDocument
        fields = ['id', 'title', 'file', 'file_url', 'file_name', 'file_size', 
                  'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class ComplaintResolutionSerializer(serializers.ModelSerializer):
    action_by_name = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ComplaintResolution
        fields = ['id', 'action_taken', 'action_type', 'action_display', 
                  'action_by', 'action_by_name', 'created_at']
        read_only_fields = ['id', 'action_by', 'created_at']
    
    def get_action_by_name(self, obj):
        return obj.action_by.get_full_name() or obj.action_by.username
    
    def get_action_display(self, obj):
        return dict(ComplaintResolution.ACTION_TYPES).get(obj.action_type, obj.action_type)


class ComplaintSerializer(serializers.ModelSerializer):
    complaint_number = serializers.ReadOnlyField()
    complainant_data = UserSerializer(source='complainant', read_only=True)
    defendant_data = UserSerializer(source='defendant', read_only=True)
    property_data = PropertySerializer(source='property', read_only=True)
    service_data = ServiceSerializer(source='service', read_only=True)
    
    category_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    priority_display = serializers.SerializerMethodField()
    
    messages = ComplaintMessageSerializer(many=True, read_only=True)
    documents = ComplaintDocumentSerializer(many=True, read_only=True)
    resolutions = ComplaintResolutionSerializer(many=True, read_only=True)
    
    time_ago = serializers.SerializerMethodField()
    can_be_cancelled = serializers.SerializerMethodField()
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'category', 'category_display', 'title', 
            'description', 'evidence', 'priority', 'priority_display',
            'status', 'status_display', 'admin_notes', 'admin_response',
            'resolution_details', 'resolved_in_favor', 'compensation_amount',
            'complainant', 'complainant_data', 'defendant', 'defendant_data',
            'property_obj', 'property_data', 'service_obj', 'service_data',
            'messages', 'documents', 'resolutions',
            'created_at', 'updated_at', 'resolved_at', 'time_ago',
            'assigned_to', 'can_be_cancelled'
        ]
        read_only_fields = [
            'id', 'complaint_number', 'status', 'admin_notes', 'admin_response',
            'resolution_details', 'created_at', 'updated_at', 'resolved_at',
            'assigned_to'
        ]
    
    def get_category_display(self, obj):
        return dict(Complaint.CATEGORY_CHOICES).get(obj.category, obj.category)
    
    def get_status_display(self, obj):
        return dict(Complaint.STATUS_CHOICES).get(obj.status, obj.status)
    
    def get_priority_display(self, obj):
        return dict(Complaint.PRIORITY_CHOICES).get(obj.priority, obj.priority)
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)
    
    def get_can_be_cancelled(self, obj):
        return obj.status in ['pending']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['complainant'] = request.user
        return super().create(validated_data)


class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = [
            'defendant', 'property_obj', 'service_obj', 'category', 'title', 
            'description', 'evidence', 'priority'
        ]
    
    def validate(self, data):
        # Check at least one target is specified
        if not data.get('defendant') and not data.get('property_obj') and not data.get('service_obj'):
            raise serializers.ValidationError(
                "Please specify either a defendant, property, or service related to this complaint"
            )
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['complainant'] = request.user
        return super().create(validated_data)


class ComplaintUpdateSerializer(serializers.ModelSerializer):
    """For admin updates to complaints"""
    class Meta:
        model = Complaint
        fields = [
            'status', 'priority', 'admin_notes', 'admin_response', 
            'resolution_details', 'resolved_in_favor', 'compensation_amount',
            'assigned_to'
        ]


class ComplaintFilterSerializer(serializers.Serializer):
    status = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.CharField(required=False, allow_blank=True)
    from_date = serializers.DateField(required=False)
    to_date = serializers.DateField(required=False)