from rest_framework import serializers
from .models import Conversation, Message
from users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'content', 'attachment', 
                  'attachment_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'is_read', 'created_at']
    
    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username
    
    # ✅ Add this validation
    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Message content cannot be empty")
        return value.strip()


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'other_participant', 'property', 'last_message', 
                  'last_message_preview', 'last_message_time', 'unread_count', 'is_active']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other).data
        return None
    
    def get_last_message_preview(self, obj):
        if obj.last_message:
            return obj.last_message[:50] + ('...' if len(obj.last_message) > 50 else '')
        return "No messages yet"
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'other_participant', 'property', 'last_message', 
                  'last_message_preview', 'last_message_time', 'unread_count', 'is_active']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other).data
        return None
    
    def get_last_message_preview(self, obj):
        if obj.last_message:
            return obj.last_message[:50] + ('...' if len(obj.last_message) > 50 else '')
        return "No messages yet"
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0