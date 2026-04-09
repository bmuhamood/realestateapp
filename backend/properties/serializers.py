from rest_framework import serializers
from .models import Property, PropertyImage, PropertyLike
from users.serializers import UserSerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ('id', 'image', 'is_main', 'order')

class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('owner', 'views_count', 'likes_count', 'shares_count', 
                           'is_verified', 'created_at', 'expires_at')
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PropertyLike.objects.filter(user=request.user, property=obj).exists()
        return False
    
    def to_representation(self, instance):
        """Convert CombinedExpression and other values to proper Python types"""
        representation = super().to_representation(instance)
        
        # Convert all numeric fields to integers
        for field in ['views_count', 'likes_count', 'shares_count', 'bedrooms', 
                      'bathrooms', 'square_meters', 'id']:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = int(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0
        
        # Convert price to float
        if 'price' in representation and representation['price'] is not None:
            try:
                representation['price'] = float(representation['price'])
            except (TypeError, ValueError):
                representation['price'] = 0.0
        
        # Convert coordinates to float
        for field in ['latitude', 'longitude']:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = float(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0.0
        
        return representation

class PropertyCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('owner', 'views_count', 'likes_count', 'shares_count', 
                           'is_verified', 'created_at', 'expires_at')
    
    def create(self, validated_data):
        # Remove images from validated_data as they are handled separately
        images_data = validated_data.pop('images', [])
        property_obj = Property.objects.create(**validated_data)
        
        # Create image records
        for i, image in enumerate(images_data):
            PropertyImage.objects.create(
                property=property_obj,
                image=image,
                is_main=(i == 0),  # First image is main by default
                order=i
            )
        
        return property_obj
    
    def to_representation(self, instance):
        """Same conversion for create serializer"""
        representation = super().to_representation(instance)
        
        for field in ['views_count', 'likes_count', 'shares_count', 'bedrooms', 
                      'bathrooms', 'square_meters', 'id']:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = int(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0
        
        if 'price' in representation and representation['price'] is not None:
            try:
                representation['price'] = float(representation['price'])
            except (TypeError, ValueError):
                representation['price'] = 0.0
        
        for field in ['latitude', 'longitude']:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = float(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0.0
        
        return representation