# payments/serializers.py - WITH UUID SUPPORT

from rest_framework import serializers
from .models import BoostPackage, Payment
import uuid


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('id', 'user', 'reference', 'status', 'created_at', 'updated_at')
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        if 'user' in representation and representation['user']:
            representation['user'] = str(representation['user'])
        if 'property' in representation and representation['property']:
            representation['property'] = str(representation['property'])
        if 'booking' in representation and representation['booking']:
            representation['booking'] = str(representation['booking'])
        
        return representation


class BoostPackageSerializer(serializers.ModelSerializer):
    price_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = BoostPackage
        fields = '__all__'
    
    def get_price_formatted(self, obj):
        return f"UGX {obj.price:,.0f}"


class InitiatePaymentSerializer(serializers.Serializer):
    property_id = serializers.CharField(max_length=100)  # Changed from IntegerField to CharField for UUID
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=['mtn', 'airtel', 'card'])
    phone_number = serializers.CharField(max_length=15, required=False)
    
    def validate_property_id(self, value):
        """Validate that property_id is a valid UUID"""
        try:
            uuid.UUID(str(value))
        except ValueError:
            raise serializers.ValidationError("Invalid property ID format")
        return value
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class VerifyPaymentSerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=255)