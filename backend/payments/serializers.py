from rest_framework import serializers
from .models import BoostPackage, Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('user', 'reference', 'status', 'created_at', 'updated_at')

class BoostPackageSerializer(serializers.ModelSerializer):
    price_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = BoostPackage
        fields = '__all__'
    
    def get_price_formatted(self, obj):
        return f"UGX {obj.price:,.0f}"
    
class InitiatePaymentSerializer(serializers.Serializer):
    property_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=['mtn', 'airtel', 'card'])
    phone_number = serializers.CharField(max_length=15, required=False)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value

class VerifyPaymentSerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=255)