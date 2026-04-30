# services/serializers.py - UPDATED WITH CLOUDINARY SUPPORT

from rest_framework import serializers
from .models import ServiceCategory, Service, ServiceBooking, ServiceReview
from users.serializers import UserSerializer


class ServiceCategorySerializer(serializers.ModelSerializer):
    service_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceCategory
        fields = '__all__'
        read_only_fields = ('id', 'created_at')
    
    def get_service_count(self, obj):
        return obj.services.filter(is_active=True).count()
    
    def get_image_url(self, obj):
        """Get Cloudinary URL for category image"""
        if obj.image:
            return obj.image.url if hasattr(obj.image, 'url') else str(obj.image)
        return None
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        
        return representation


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    gallery_images = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ('id', 'rating', 'reviews_count', 'created_at', 'updated_at')
    
    def get_image_url(self, obj):
        """Get Cloudinary URL for main service image"""
        if obj.image:
            return obj.image.url if hasattr(obj.image, 'url') else str(obj.image)
        return None
    
    def get_gallery_images(self, obj):
        """Get Cloudinary URLs for gallery images"""
        images = []
        for img in obj.gallery_images.all():
            image_url = None
            if img.image:
                image_url = img.image.url if hasattr(img.image, 'url') else str(img.image)
            
            images.append({
                'id': str(img.id),  # Convert UUID to string
                'image_url': image_url,
                'image': image_url,  # For backward compatibility
                'order': img.order,
                'is_main': img.is_main,
            })
        return images
    
    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return sum(r.rating for r in reviews) / reviews.count()
        return obj.rating
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        uuid_fields = ['id', 'category', 'provider_user']
        for field in uuid_fields:
            if field in representation and representation[field]:
                representation[field] = str(representation[field])
        
        return representation


class ServiceBookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_image = serializers.SerializerMethodField()
    service_image_url = serializers.SerializerMethodField()
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = ServiceBooking
        fields = '__all__'
        read_only_fields = ('id', 'user', 'status', 'total_price', 'created_at', 'updated_at')
    
    def get_service_image(self, obj):
        """Get Cloudinary URL for service image (backward compatibility)"""
        if obj.service.image:
            return obj.service.image.url if hasattr(obj.service.image, 'url') else str(obj.service.image)
        return None
    
    def get_service_image_url(self, obj):
        """Get Cloudinary URL for service image"""
        if obj.service.image:
            return obj.service.image.url if hasattr(obj.service.image, 'url') else str(obj.service.image)
        return None
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        uuid_fields = ['id', 'user', 'service']
        for field in uuid_fields:
            if field in representation and representation[field]:
                representation[field] = str(representation[field])
        
        return representation


class ServiceReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    user_avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceReview
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at')
    
    def get_user_avatar(self, obj):
        """Get Cloudinary URL for user avatar"""
        if obj.user.profile_picture:
            if hasattr(obj.user.profile_picture, 'url'):
                return obj.user.profile_picture.url
            return str(obj.user.profile_picture)
        return None
    
    def get_user_avatar_url(self, obj):
        """Get Cloudinary URL for user avatar"""
        if obj.user.profile_picture:
            if hasattr(obj.user.profile_picture, 'url'):
                return obj.user.profile_picture.url
            return str(obj.user.profile_picture)
        return None
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        uuid_fields = ['id', 'user', 'service']
        for field in uuid_fields:
            if field in representation and representation[field]:
                representation[field] = str(representation[field])
        
        return representation


# Optional: Additional serializers for specific operations
class ServiceBookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a service booking"""
    
    class Meta:
        model = ServiceBooking
        fields = ['service', 'booking_date', 'address', 'special_instructions']
    
    def validate_booking_date(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Booking date must be in the future")
        return value


class ServiceBookingStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating service booking status"""
    
    class Meta:
        model = ServiceBooking
        fields = ['status']
    
    def validate_status(self, value):
        valid_statuses = ['confirmed', 'in_progress', 'completed', 'cancelled']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value