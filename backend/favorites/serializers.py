from rest_framework import serializers
from .models import Favorite
from properties.serializers import PropertySerializer

class FavoriteSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source='property', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ('id', 'user', 'property', 'property_detail', 'created_at')
        read_only_fields = ('user', 'created_at')