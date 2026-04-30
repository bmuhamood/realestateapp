# bookings/serializers.py - COMPLETE WITH BOTH SERIALIZERS

from rest_framework import serializers
from .models import Booking, BookingHistory
from properties.serializers import PropertySerializer
from users.serializers import UserSerializer


class BookingSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source='property', read_only=True)
    user_detail = UserSerializer(source='user', read_only=True)
    
    # Add computed fields
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('id', 'user', 'status', 'booking_fee', 'created_at', 'updated_at')
    
    def validate_visit_date(self, value):
        """Validate that visit date is in the future"""
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Visit date must be in the future")
        return value
    
    def create(self, validated_data):
        """Create booking with auto-assigned user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """Convert to representation with proper nested objects"""
        representation = super().to_representation(instance)
        
        # Convert UUID to string for JSON serialization
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        
        # Replace property_detail with property
        if 'property_detail' in representation:
            representation['property'] = representation.pop('property_detail')
        
        # Replace user_detail with user
        if 'user_detail' in representation:
            representation['user'] = representation.pop('user_detail')
        
        # Add formatted visit date
        if 'visit_date' in representation and representation['visit_date']:
            from django.utils import timezone
            visit_date = instance.visit_date
            representation['visit_date_formatted'] = visit_date.strftime('%B %d, %Y at %I:%M %p')
        
        return representation


# Add BookingHistorySerializer
class BookingHistorySerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    
    class Meta:
        model = BookingHistory
        fields = ('id', 'booking', 'booking_reference', 'action', 'action_display', 
                  'old_status', 'new_status', 'changed_by', 'changed_by_name', 
                  'notes', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Convert UUID to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        if 'booking' in representation and representation['booking']:
            representation['booking'] = str(representation['booking'])
        
        return representation