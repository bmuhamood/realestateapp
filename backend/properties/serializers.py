# properties/serializers.py - COMPLETE CLOUDINARY VERSION

from rest_framework import serializers
from .models import (
    Property, PropertyImage, PropertyLike, 
    PropertyVideo, PropertyDocument, PropertyReview, PropertyInquiry
)
from users.serializers import UserSerializer
import json


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images with Cloudinary support"""
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyImage
        fields = ('id', 'image', 'image_url', 'thumbnail_url', 'is_main', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_image_url(self, obj):
        """Get the full Cloudinary URL for the image"""
        if obj.image:
            # CloudinaryField returns a CloudinaryResource object
            if hasattr(obj.image, 'url'):
                return obj.image.url
            # If it's a string (already migrated), return as is
            return str(obj.image)
        return None
    
    def get_thumbnail_url(self, obj):
        """Get a thumbnail version of the image (optimized for lists)"""
        if obj.image and hasattr(obj.image, 'url'):
            # Add Cloudinary transformations for thumbnail
            # This creates a 300x200 thumbnail with quality optimization
            base_url = obj.image.url
            # Insert transformations before the upload path
            if 'cloudinary.com' in base_url:
                parts = base_url.split('/upload/')
                if len(parts) == 2:
                    return f"{parts[0]}/upload/c_fill,g_auto,w_300,h_200,q_auto,f_auto/{parts[1]}"
            return base_url
        return None


class PropertyVideoSerializer(serializers.ModelSerializer):
    video_url_display = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyVideo
        fields = ('id', 'video_file', 'video_url', 'video_url_display', 'thumbnail', 'thumbnail_url', 'title', 'order', 'is_main', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_video_url_display(self, obj):
        """Get the actual video URL (Cloudinary or direct)"""
        if obj.video_file and hasattr(obj.video_file, 'url'):
            return obj.video_file.url
        return obj.video_url
    
    def get_thumbnail_url(self, obj):
        """Get video thumbnail URL"""
        if obj.thumbnail and hasattr(obj.thumbnail, 'url'):
            return obj.thumbnail.url
        return None


class PropertyDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyDocument
        fields = ('id', 'document_type', 'document_type_display', 'file', 'file_url', 'title', 'description', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')
    
    def get_document_type_display(self, obj):
        return obj.get_document_type_display()
    
    def get_file_url(self, obj):
        if obj.file and hasattr(obj.file, 'url'):
            return obj.file.url
        return None


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
            if hasattr(obj.user.profile_picture, 'url'):
                return obj.user.profile_picture.url
            return str(obj.user.profile_picture)
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
    """Main Property serializer with Cloudinary image support"""
    images = PropertyImageSerializer(many=True, read_only=True)
    videos = PropertyVideoSerializer(many=True, read_only=True)
    documents = PropertyDocumentSerializer(many=True, read_only=True)
    reviews = PropertyReviewSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    # Image helper fields
    main_image_url = serializers.SerializerMethodField()
    all_image_urls = serializers.SerializerMethodField()
    
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
    
    def get_main_image_url(self, obj):
        """Get the main/primary image URL for the property"""
        # Try to get the main image from gallery
        main_image = obj.images.filter(is_main=True).first()
        if main_image and main_image.image:
            if hasattr(main_image.image, 'url'):
                return main_image.image.url
            return str(main_image.image)
        
        # Fallback to first image
        first_image = obj.images.first()
        if first_image and first_image.image:
            if hasattr(first_image.image, 'url'):
                return first_image.image.url
            return str(first_image.image)
        
        return None
    
    def get_all_image_urls(self, obj):
        """Get all image URLs for the property"""
        urls = []
        for img in obj.images.all():
            if img.image:
                if hasattr(img.image, 'url'):
                    urls.append(img.image.url)
                else:
                    urls.append(str(img.image))
        return urls
    
    def get_amenities_list(self, obj):
        amenities = obj.get_amenities_list()
        if isinstance(amenities, str):
            try:
                return json.loads(amenities)
            except:
                return [a.strip() for a in amenities.split(',') if a.strip()]
        return amenities if isinstance(amenities, list) else []
    
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
        representation = super().to_representation(instance)
        
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
        
        if 'amenities' in representation:
            amenities = representation['amenities']
            if isinstance(amenities, str):
                try:
                    representation['amenities'] = json.loads(amenities)
                except:
                    representation['amenities'] = [a.strip() for a in amenities.split(',') if a.strip()]
            elif not isinstance(amenities, list):
                representation['amenities'] = []
        
        if 'amenities_list' in representation:
            amenities_list = representation['amenities_list']
            if isinstance(amenities_list, str):
                try:
                    representation['amenities_list'] = json.loads(amenities_list)
                except:
                    representation['amenities_list'] = [a.strip() for a in amenities_list.split(',') if a.strip()]
            elif not isinstance(amenities_list, list):
                representation['amenities_list'] = []
        
        return representation


class PropertyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating properties with Cloudinary support"""
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    video_file = serializers.FileField(write_only=True, required=False, allow_null=True)
    
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
        # Remove file/image data
        video_file = validated_data.pop('video_file', None)
        images_data = validated_data.pop('images', [])
        amenities_data = validated_data.pop('amenities', [])
        nearby_schools_data = validated_data.pop('nearby_schools', '')
        nearby_roads_data = validated_data.pop('nearby_roads', '')
        
        # Set owner from request
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        else:
            raise serializers.ValidationError({"owner": "User must be authenticated to create a property"})
        
        # Set JSON fields
        if amenities_data:
            validated_data['amenities'] = amenities_data
        if nearby_schools_data:
            validated_data['nearby_schools'] = nearby_schools_data
        if nearby_roads_data:
            validated_data['nearby_roads'] = nearby_roads_data
        
        # Create property
        property_obj = Property.objects.create(**validated_data)
        
        # Handle video file (will go to Cloudinary automatically)
        if video_file and hasattr(video_file, 'name'):
            property_obj.video_file = video_file
            property_obj.save(update_fields=['video_file'])
        
        # Create image records (will go to Cloudinary automatically)
        for i, image in enumerate(images_data):
            PropertyImage.objects.create(
                property=property_obj,
                image=image,
                is_main=(i == 0),
                order=i
            )
        
        return property_obj
    
    def update(self, instance, validated_data):
        # Remove file/image data
        video_file = validated_data.pop('video_file', None)
        images_data = validated_data.pop('images', None)
        amenities_data = validated_data.pop('amenities', None)
        nearby_schools_data = validated_data.pop('nearby_schools', None)
        nearby_roads_data = validated_data.pop('nearby_roads', None)
        
        # Update JSON fields if provided
        if amenities_data is not None:
            instance.amenities = amenities_data
        if nearby_schools_data is not None:
            instance.nearby_schools = nearby_schools_data
        if nearby_roads_data is not None:
            instance.nearby_roads = nearby_roads_data
        
        # Handle video file
        if video_file and hasattr(video_file, 'name'):
            instance.video_file = video_file
        
        # Update regular fields
        for attr, value in validated_data.items():
            if attr not in ['video_file', 'images']:
                setattr(instance, attr, value)
        
        # Save the instance
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
        return PropertySerializer(instance, context=self.context).data