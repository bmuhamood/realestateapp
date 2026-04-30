# favorites/serializers.py - WITH UUID SUPPORT

from rest_framework import serializers
from .models import Favorite
from properties.serializers import PropertySerializer


class FavoriteSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source='property', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ('id', 'user', 'property', 'property_detail', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        
        return representation