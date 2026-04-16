# properties/serializers.py - COMPLETE UPGRADED VERSION
from rest_framework import serializers
from .models import (
    Property, PropertyImage, PropertyLike, 
    PropertyVideo, PropertyDocument, PropertyReview, PropertyInquiry
)
from users.serializers import UserSerializer


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ('id', 'image', 'is_main', 'order')


class PropertyVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyVideo
        fields = ('id', 'video_file', 'video_url', 'thumbnail', 'title', 'order', 'is_main', 'created_at')
        read_only_fields = ('id', 'created_at')


class PropertyDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyDocument
        fields = ('id', 'document_type', 'document_type_display', 'file', 'title', 'description', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')
    
    def get_document_type_display(self, obj):
        return obj.get_document_type_display()


class PropertyReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyReview
        fields = ('id', 'user', 'user_name', 'user_avatar', 'rating', 'comment', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def get_user_avatar(self, obj):
        if obj.user.profile_picture:
            return obj.user.profile_picture.url
        return None


class PropertyInquirySerializer(serializers.ModelSerializer):
    inquiry_type_display = serializers.SerializerMethodField()
    property_title = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyInquiry
        fields = ('id', 'property', 'property_title', 'user', 'name', 'email', 'phone', 
                  'inquiry_type', 'inquiry_type_display', 'message', 'preferred_date', 
                  'is_read', 'is_replied', 'created_at')
        read_only_fields = ('id', 'is_read', 'is_replied', 'created_at')
    
    def get_inquiry_type_display(self, obj):
        return obj.get_inquiry_type_display()
    
    def get_property_title(self, obj):
        return obj.property.title


class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    videos = PropertyVideoSerializer(many=True, read_only=True)
    documents = PropertyDocumentSerializer(many=True, read_only=True)
    reviews = PropertyReviewSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    # New fields for upgraded features
    amenities_list = serializers.SerializerMethodField()
    nearby_schools_list = serializers.SerializerMethodField()
    nearby_roads_list = serializers.SerializerMethodField()
    has_video = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = (
            'owner', 'views_count', 'likes_count', 'shares_count', 
            'is_verified', 'created_at', 'expires_at'
        )
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PropertyLike.objects.filter(user=request.user, property=obj).exists()
        return False
    
    def get_amenities_list(self, obj):
        return obj.get_amenities_list()
    
    def get_nearby_schools_list(self, obj):
        return obj.get_nearby_schools_list()
    
    def get_nearby_roads_list(self, obj):
        return obj.get_nearby_roads_list()
    
    def get_has_video(self, obj):
        return obj.has_video
    
    def get_full_address(self, obj):
        return obj.full_address
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            avg = sum(r.rating for r in reviews) / reviews.count()
            return round(avg, 1)
        return 0
    
    def get_reviews_count(self, obj):
        return obj.reviews.count()
    
    def to_representation(self, instance):
        """Convert CombinedExpression and other values to proper Python types"""
        representation = super().to_representation(instance)
        
        # Convert numeric fields to integers
        numeric_fields = [
            'views_count', 'likes_count', 'shares_count', 'bedrooms', 
            'bathrooms', 'square_meters', 'id', 'parking_spaces', 
            'year_built', 'reviews_count'
        ]
        for field in numeric_fields:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = int(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0
        
        # Convert decimal fields to float
        decimal_fields = [
            'price', 'latitude', 'longitude', 'distance_to_city_center',
            'distance_to_airport', 'distance_to_highway', 'distance_to_nearest_school',
            'school_rating', 'distance_to_mall', 'distance_to_hospital'
        ]
        for field in decimal_fields:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = float(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0.0
        
        # Convert amenities and lists
        if 'amenities' in representation and representation['amenities']:
            if isinstance(representation['amenities'], str):
                try:
                    import json
                    representation['amenities'] = json.loads(representation['amenities'])
                except:
                    representation['amenities'] = []
        
        return representation


class PropertyCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    
    # New fields for upgraded features
    amenities = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        default=list
    )
    nearby_schools = serializers.CharField(write_only=True, required=False, allow_blank=True)
    nearby_roads = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = (
            'owner', 'views_count', 'likes_count', 'shares_count', 
            'is_verified', 'created_at', 'expires_at'
        )
    
    def create(self, validated_data):
        # Remove related data
        images_data = validated_data.pop('images', [])
        amenities_data = validated_data.pop('amenities', [])
        nearby_schools_data = validated_data.pop('nearby_schools', '')
        nearby_roads_data = validated_data.pop('nearby_roads', '')
        
        # Set JSON fields
        if amenities_data:
            validated_data['amenities'] = amenities_data
        if nearby_schools_data:
            validated_data['nearby_schools'] = nearby_schools_data
        if nearby_roads_data:
            validated_data['nearby_roads'] = nearby_roads_data
        
        # Create property
        property_obj = Property.objects.create(**validated_data)
        
        # Create image records
        for i, image in enumerate(images_data):
            PropertyImage.objects.create(
                property=property_obj,
                image=image,
                is_main=(i == 0),
                order=i
            )
        
        return property_obj
    
    def update(self, instance, validated_data):
        # Handle images if present
        images_data = validated_data.pop('images', None)
        
        # Handle JSON fields
        if 'amenities' in validated_data:
            validated_data['amenities'] = validated_data['amenities']
        if 'nearby_schools' in validated_data:
            validated_data['nearby_schools'] = validated_data['nearby_schools']
        if 'nearby_roads' in validated_data:
            validated_data['nearby_roads'] = validated_data['nearby_roads']
        
        # Update property fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle new images
        if images_data:
            for i, image in enumerate(images_data):
                PropertyImage.objects.create(
                    property=instance,
                    image=image,
                    is_main=(i == 0 and not instance.images.filter(is_main=True).exists()),
                    order=instance.images.count() + i
                )
        
        return instance
    
    def to_representation(self, instance):
        """Same conversion for create serializer"""
        representation = super().to_representation(instance)
        
        # Convert numeric fields
        numeric_fields = [
            'views_count', 'likes_count', 'shares_count', 'bedrooms', 
            'bathrooms', 'square_meters', 'id', 'parking_spaces', 'year_built'
        ]
        for field in numeric_fields:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = int(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0
        
        # Convert decimal fields
        decimal_fields = [
            'price', 'latitude', 'longitude', 'distance_to_city_center',
            'distance_to_airport', 'distance_to_highway', 'distance_to_nearest_school',
            'school_rating', 'distance_to_mall', 'distance_to_hospital'
        ]
        for field in decimal_fields:
            if field in representation and representation[field] is not None:
                try:
                    representation[field] = float(representation[field])
                except (TypeError, ValueError):
                    representation[field] = 0.0
        
        return representation