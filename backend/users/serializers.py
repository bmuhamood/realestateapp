# users/serializers.py - COMPLETE FINAL VERSION

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Count
from cloudinary import CloudinaryImage

from .models import Status, StatusView, KYCSubmission
from properties.models import Property
from services.models import Service
from .models import Follow


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    listings_count = serializers.SerializerMethodField()
    
    # Add URL fields for Cloudinary images
    profile_picture_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()
    verification_document_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone', 'first_name', 'last_name', 
                  'profile_picture', 'profile_picture_url', 'cover_photo', 'cover_photo_url',
                  'verification_document', 'verification_document_url',
                  'is_agent', 'is_service_provider', 'is_verified', 
                  'bio', 'location', 'district', 'city', 'followers_count', 
                  'following_count', 'listings_count', 'full_name', 'created_at', 'is_following')
        read_only_fields = ('is_verified', 'followers_count', 'following_count', 'created_at', 
                           'listings_count', 'profile_picture_url', 'cover_photo_url', 
                           'verification_document_url')
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False
    
    def get_listings_count(self, obj):
        """Get total listings count (properties + services)"""
        try:
            if obj.is_agent:
                return Property.objects.filter(owner=obj, is_available=True).count()
            elif obj.is_service_provider:
                return Service.objects.filter(provider_email=obj.email, is_active=True).count()
        except Exception as e:
            print(f"Error getting listings count for {obj.username}: {e}")
        return 0
    
    def get_profile_picture_url(self, obj):
        """Get Cloudinary URL for profile picture"""
        if obj.profile_picture:
            # Check if it's already a URL (from social login)
            if isinstance(obj.profile_picture, str) and obj.profile_picture.startswith('http'):
                return obj.profile_picture
            
            # Handle CloudinaryField
            try:
                if hasattr(obj.profile_picture, 'url'):
                    return obj.profile_picture.url
                elif isinstance(obj.profile_picture, str):
                    # Build Cloudinary URL with optimizations
                    return CloudinaryImage(obj.profile_picture).build_url(
                        transformation={'width': 500, 'height': 500, 'crop': 'fill'}
                    )
            except Exception as e:
                print(f"Error getting profile picture URL: {e}")
        return None
    
    def get_cover_photo_url(self, obj):
        """Get Cloudinary URL for cover photo"""
        if obj.cover_photo:
            try:
                if hasattr(obj.cover_photo, 'url'):
                    return obj.cover_photo.url
                elif isinstance(obj.cover_photo, str):
                    return CloudinaryImage(obj.cover_photo).build_url(
                        transformation={'width': 1500, 'height': 500, 'crop': 'fill'}
                    )
            except Exception as e:
                print(f"Error getting cover photo URL: {e}")
        return None
    
    def get_verification_document_url(self, obj):
        """Get Cloudinary URL for verification document"""
        if obj.verification_document:
            try:
                if hasattr(obj.verification_document, 'url'):
                    return obj.verification_document.url
                elif isinstance(obj.verification_document, str):
                    return CloudinaryImage(obj.verification_document).build_url()
            except Exception as e:
                print(f"Error getting verification document URL: {e}")
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True)
    is_service_provider = serializers.BooleanField(default=False, required=False)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'phone', 
                  'first_name', 'last_name', 'is_agent', 'is_service_provider')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class FollowSerializer(serializers.ModelSerializer):
    follower_username = serializers.CharField(source='follower.username', read_only=True)
    following_username = serializers.CharField(source='following.username', read_only=True)
    follower_full_name = serializers.SerializerMethodField()
    following_full_name = serializers.SerializerMethodField()
    follower_profile_picture = serializers.SerializerMethodField()
    following_profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'follower_username', 'following_username',
                  'follower_full_name', 'following_full_name', 'follower_profile_picture',
                  'following_profile_picture', 'created_at')
        read_only_fields = ('follower', 'created_at')
    
    def get_follower_full_name(self, obj):
        return f"{obj.follower.first_name} {obj.follower.last_name}".strip() or obj.follower.username
    
    def get_following_full_name(self, obj):
        return f"{obj.following.first_name} {obj.following.last_name}".strip() or obj.following.username
    
    def get_follower_profile_picture(self, obj):
        if obj.follower.profile_picture:
            try:
                if hasattr(obj.follower.profile_picture, 'url'):
                    return obj.follower.profile_picture.url
                elif isinstance(obj.follower.profile_picture, str):
                    from cloudinary import CloudinaryImage
                    return CloudinaryImage(obj.follower.profile_picture).build_url(
                        transformation={'width': 100, 'height': 100, 'crop': 'thumb'}
                    )
            except:
                pass
        return None
    
    def get_following_profile_picture(self, obj):
        if obj.following.profile_picture:
            try:
                if hasattr(obj.following.profile_picture, 'url'):
                    return obj.following.profile_picture.url
                elif isinstance(obj.following.profile_picture, str):
                    from cloudinary import CloudinaryImage
                    return CloudinaryImage(obj.following.profile_picture).build_url(
                        transformation={'width': 100, 'height': 100, 'crop': 'thumb'}
                    )
            except:
                pass
        return None
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        
        return representation


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match."})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match."})
        return attrs


class StatusSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_profile_picture = serializers.SerializerMethodField()
    user_is_agent = serializers.BooleanField(source='user.is_agent', read_only=True)
    user_is_service_provider = serializers.BooleanField(source='user.is_service_provider', read_only=True)
    has_viewed = serializers.SerializerMethodField()
    
    # Add URL field for media
    media_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Status
        fields = [
            'id', 'user', 'user_name', 'user_first_name', 'user_last_name',
            'user_profile_picture', 'user_is_agent', 'user_is_service_provider',
            'media', 'media_url', 'thumbnail_url', 'media_type', 'text_content', 
            'background_color', 'created_at', 'expires_at', 'views_count', 
            'has_viewed', 'is_active'
        ]
        read_only_fields = ['user', 'created_at', 'views_count', 'has_viewed', 
                           'media_url', 'thumbnail_url']
        extra_kwargs = {
            'expires_at': {'required': False, 'allow_null': True},
            'media': {'required': False},
            'text_content': {'required': False},
            'background_color': {'required': False},
        }
    
    def get_user_profile_picture(self, obj):
        if obj.user.profile_picture:
            try:
                if hasattr(obj.user.profile_picture, 'url'):
                    return obj.user.profile_picture.url
                elif isinstance(obj.user.profile_picture, str):
                    if obj.user.profile_picture.startswith('http'):
                        return obj.user.profile_picture
                    from cloudinary import CloudinaryImage
                    return CloudinaryImage(obj.user.profile_picture).build_url(
                        transformation={'width': 150, 'height': 150, 'crop': 'thumb'}
                    )
            except Exception as e:
                print(f"Error getting user profile picture: {e}")
        return None
    
    def get_has_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return StatusView.objects.filter(status=obj, viewer=request.user).exists()
        return False
    
    def get_media_url(self, obj):
        """Get Cloudinary URL for status media"""
        if obj.media:
            try:
                # Handle different media types
                if obj.media_type == 'video':
                    resource_type = 'video'
                else:
                    resource_type = 'image'
                
                if hasattr(obj.media, 'url'):
                    return obj.media.url
                elif isinstance(obj.media, str):
                    if obj.media.startswith('http'):
                        return obj.media
                    
                    from cloudinary import CloudinaryImage
                    # Build URL based on media type
                    if obj.media_type == 'video':
                        return CloudinaryImage(obj.media).build_url(resource_type='video')
                    else:
                        # Optimize images for status viewing
                        return CloudinaryImage(obj.media).build_url(
                            transformation={'quality': 'auto', 'fetch_format': 'auto'}
                        )
            except Exception as e:
                print(f"Error getting media URL: {e}")
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL for status preview"""
        if obj.media and obj.media_type == 'image':
            try:
                if hasattr(obj.media, 'url'):
                    # If it's already a CloudinaryField, build thumbnail
                    if hasattr(obj.media, 'build_url'):
                        return obj.media.build_url(
                            transformation={'width': 150, 'height': 150, 'crop': 'thumb'}
                        )
                    return obj.media.url
                elif isinstance(obj.media, str) and not obj.media.startswith('http'):
                    from cloudinary import CloudinaryImage
                    return CloudinaryImage(obj.media).build_url(
                        transformation={'width': 150, 'height': 150, 'crop': 'thumb'}
                    )
            except:
                pass
        return self.get_media_url(obj)
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        if 'user' in representation and representation['user']:
            representation['user'] = str(representation['user'])
        
        return representation


class StatusViewSerializer(serializers.ModelSerializer):
    viewer_name = serializers.CharField(source='viewer.username', read_only=True)
    viewer_full_name = serializers.SerializerMethodField()
    viewer_profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = StatusView
        fields = ['id', 'viewer', 'viewer_name', 'viewer_full_name', 
                 'viewer_profile_picture', 'viewed_at']
    
    def get_viewer_full_name(self, obj):
        return f"{obj.viewer.first_name} {obj.viewer.last_name}".strip() or obj.viewer.username
    
    def get_viewer_profile_picture(self, obj):
        if obj.viewer.profile_picture:
            try:
                if hasattr(obj.viewer.profile_picture, 'url'):
                    return obj.viewer.profile_picture.url
                elif isinstance(obj.viewer.profile_picture, str):
                    if obj.viewer.profile_picture.startswith('http'):
                        return obj.viewer.profile_picture
                    from cloudinary import CloudinaryImage
                    return CloudinaryImage(obj.viewer.profile_picture).build_url(
                        transformation={'width': 50, 'height': 50, 'crop': 'thumb'}
                    )
            except:
                pass
        return None
    
    def to_representation(self, instance):
        """Convert UUID to string for JSON serialization"""
        representation = super().to_representation(instance)
        
        # Convert UUID fields to string
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        if 'status' in representation and representation['status']:
            representation['status'] = str(representation['status'])
        if 'viewer' in representation and representation['viewer']:
            representation['viewer'] = str(representation['viewer'])
        
        return representation

class KYCSerializer(serializers.ModelSerializer):
    front_image_url = serializers.SerializerMethodField()
    back_image_url = serializers.SerializerMethodField()
    selfie_url = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = KYCSubmission
        fields = [
            'id', 'user', 'user_name', 'document_type', 'document_number', 
            'front_image', 'front_image_url', 'back_image', 'back_image_url',
            'selfie', 'selfie_url', 'status', 'admin_notes', 'rejection_reason',
            'submitted_at', 'reviewed_at', 'reviewed_by'
        ]
        read_only_fields = ['id', 'status', 'admin_notes', 'submitted_at', 'reviewed_at', 'reviewed_by']
    
    def get_front_image_url(self, obj):
        # obj.front_image is already a URL string (secure_url from Cloudinary)
        return obj.front_image if obj.front_image else None
    
    def get_back_image_url(self, obj):
        return obj.back_image if obj.back_image else None
    
    def get_selfie_url(self, obj):
        return obj.selfie if obj.selfie else None
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
