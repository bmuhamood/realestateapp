# users/serializers.py - FIXED VERSION
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Count

from .models import Status, StatusView
from properties.models import Property
from services.models import Service
from .models import Follow

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    listings_count = serializers.SerializerMethodField()  # Add this field
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone', 'first_name', 'last_name', 
                  'profile_picture', 'cover_photo', 'is_agent', 'is_service_provider', 'is_verified', 
                  'bio', 'location', 'district', 'city', 'followers_count', 
                  'following_count', 'listings_count', 'full_name', 'created_at', 'is_following')
        read_only_fields = ('is_verified', 'followers_count', 'following_count', 'created_at', 'listings_count')
    
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
    
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'follower_username', 'following_username',
                  'follower_full_name', 'following_full_name', 'created_at')
        read_only_fields = ('follower', 'created_at')
    
    def get_follower_full_name(self, obj):
        return f"{obj.follower.first_name} {obj.follower.last_name}".strip() or obj.follower.username
    
    def get_following_full_name(self, obj):
        return f"{obj.following.first_name} {obj.following.last_name}".strip() or obj.following.username


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
    
    class Meta:
        model = Status
        fields = [
            'id', 'user', 'user_name', 'user_first_name', 'user_last_name',
            'user_profile_picture', 'user_is_agent', 'user_is_service_provider',
            'media', 'media_type', 'text_content', 'background_color',
            'created_at', 'expires_at', 'views_count', 'has_viewed', 'is_active'
        ]
        read_only_fields = ['user', 'created_at', 'views_count', 'has_viewed']
        extra_kwargs = {
            'expires_at': {'required': False, 'allow_null': True},  # Add this
            'media': {'required': False},
            'text_content': {'required': False},
            'background_color': {'required': False},
        }
    
    def get_user_profile_picture(self, obj):
        if obj.user.profile_picture:
            return obj.user.profile_picture.url
        return None
    
    def get_has_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return StatusView.objects.filter(status=obj, viewer=request.user).exists()
        return False
    
class StatusViewSerializer(serializers.ModelSerializer):
    viewer_name = serializers.CharField(source='viewer.username', read_only=True)
    viewer_profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = StatusView
        fields = ['id', 'viewer', 'viewer_name', 'viewer_profile_picture', 'viewed_at']
    
    def get_viewer_profile_picture(self, obj):
        if obj.viewer.profile_picture:
            return obj.viewer.profile_picture.url
        return None