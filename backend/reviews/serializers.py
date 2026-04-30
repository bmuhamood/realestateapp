# reviews/serializers.py - WITH UUID SUPPORT

from rest_framework import serializers
from .models import Review
from users.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    agent_detail = UserSerializer(source='agent', read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        if 'user' in representation and representation['user']:
            representation['user'] = str(representation['user'])
        if 'agent' in representation and representation['agent']:
            representation['agent'] = str(representation['agent'])
        if 'property' in representation and representation['property']:
            representation['property'] = str(representation['property'])
        
        return representation
    
    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate(self, data):
        """Ensure user doesn't review themselves"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if data.get('agent') == request.user:
                raise serializers.ValidationError("You cannot review yourself")
        return data