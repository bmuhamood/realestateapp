from rest_framework import serializers
from .models import Booking
from properties.serializers import PropertySerializer
from users.serializers import UserSerializer

class BookingSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source='property', read_only=True)
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'status', 'booking_fee', 'created_at', 'updated_at')
    
    def to_representation(self, instance):
        """Convert to representation with proper nested objects"""
        representation = super().to_representation(instance)
        
        # Replace property_detail with property
        if 'property_detail' in representation:
            representation['property'] = representation.pop('property_detail')
        
        # Replace user_detail with user
        if 'user_detail' in representation:
            representation['user'] = representation.pop('user_detail')
        
        return representation