# properties/serializers.py - COMPLETE UPDATED VERSION WITH THUMBNAIL SUPPORT

from rest_framework import serializers
from .models import (
    Property, PropertyImage, PropertyLike, 
    PropertyVideo, PropertyDocument, PropertyReview, PropertyInquiry
)
from users.serializers import UserSerializer
import json
from cloudinary import CloudinaryImage
import cloudinary.uploader


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images with Cloudinary support"""
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    medium_url = serializers.SerializerMethodField()
    large_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyImage
        fields = ('id', 'image', 'image_url', 'thumbnail_url', 'medium_url', 'large_url', 
                  'is_main', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def _get_cloudinary_url(self, image, transformation=None):
        """Helper method to get Cloudinary URL with transformations"""
        if not image:
            return None
        
        if hasattr(image, 'url'):
            if transformation:
                if hasattr(image, 'build_url'):
                    return image.build_url(transformation=transformation)
                base_url = image.url
                if 'cloudinary.com' in base_url and '/upload/' in base_url:
                    parts = base_url.split('/upload/')
                    trans_str = ','.join([f"{k}_{v}" for k, v in transformation.items()])
                    return f"{parts[0]}/upload/{trans_str}/{parts[1]}"
            return image.url
        
        if isinstance(image, str):
            cloud_img = CloudinaryImage(image)
            if transformation:
                return cloud_img.build_url(transformation=transformation)
            return cloud_img.build_url()
        
        return None
    
    def get_image_url(self, obj):
        return self._get_cloudinary_url(obj.image)
    
    def get_thumbnail_url(self, obj):
        return self._get_cloudinary_url(obj.image, {
            'width': 150,
            'height': 150,
            'crop': 'thumb',
            'gravity': 'face',
            'quality': 'auto'
        })
    
    def get_medium_url(self, obj):
        return self._get_cloudinary_url(obj.image, {
            'width': 400,
            'height': 300,
            'crop': 'fill',
            'quality': 'auto'
        })
    
    def get_large_url(self, obj):
        return self._get_cloudinary_url(obj.image, {
            'width': 1200,
            'height': 800,
            'crop': 'fill',
            'quality': 'auto'
        })
    

class PropertyVideoSerializer(serializers.ModelSerializer):
    video_url_display = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    embed_url = serializers.SerializerMethodField()
    video_stream_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyVideo
        fields = ('id', 'video_file', 'video_url', 'video_url_display', 'embed_url', 
                  'video_stream_url', 'thumbnail', 'thumbnail_url', 'title', 'order', 
                  'is_main', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_video_url_display(self, obj):
        """Get the actual video URL (Cloudinary or direct)"""
        if obj.video_file:
            if hasattr(obj.video_file, 'url'):
                return obj.video_file.url
            return str(obj.video_file)
        return obj.video_url
    
    def get_video_stream_url(self, obj):
        """Get streaming URL for Cloudinary video"""
        if obj.video_file and hasattr(obj.video_file, 'url'):
            url = obj.video_file.url
            if 'cloudinary.com' in url:
                if '?' in url:
                    return f"{url}&streaming_profile=hd"
                else:
                    return f"{url}?streaming_profile=hd"
            return url
        return None
    
    def get_embed_url(self, obj):
        """Get embed URL for YouTube/Vimeo videos"""
        if obj.video_url:
            if 'youtube.com/watch' in obj.video_url:
                video_id = obj.video_url.split('v=')[1].split('&')[0]
                return f"https://www.youtube.com/embed/{video_id}"
            elif 'youtu.be' in obj.video_url:
                video_id = obj.video_url.split('/')[-1].split('?')[0]
                return f"https://www.youtube.com/embed/{video_id}"
            elif 'vimeo.com' in obj.video_url:
                video_id = obj.video_url.split('/')[-1]
                return f"https://player.vimeo.com/video/{video_id}"
        return obj.video_url
    
    def get_thumbnail_url(self, obj):
        """Get video thumbnail URL"""
        if obj.thumbnail:
            if hasattr(obj.thumbnail, 'url'):
                return obj.thumbnail.url
            return str(obj.thumbnail)
        
        if obj.video_file and hasattr(obj.video_file, 'url'):
            if hasattr(obj.video_file, 'build_url'):
                return obj.video_file.build_url(
                    resource_type='video',
                    transformation={'start_offset': '0', 'width': 640, 'crop': 'fill'}
                )
        
        return None
    

class PropertyDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyDocument
        fields = ('id', 'document_type', 'document_type_display', 'file', 'file_url', 
                  'file_size', 'title', 'description', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')
    
    def get_document_type_display(self, obj):
        return obj.get_document_type_display()
    
    def get_file_url(self, obj):
        if obj.file:
            if hasattr(obj.file, 'url'):
                return obj.file.url
            return str(obj.file)
        return None
    
    def get_file_size(self, obj):
        if obj.file and hasattr(obj.file, 'size'):
            return obj.file.size
        return None


class PropertyReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyReview
        fields = ('id', 'user', 'user_name', 'user_username', 'user_avatar', 
                  'rating', 'comment', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'user_name', 'user_username', 
                           'user_avatar', 'created_at', 'updated_at')
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def get_user_username(self, obj):
        return obj.user.username
    
    def get_user_avatar(self, obj):
        if obj.user.profile_picture:
            if hasattr(obj.user.profile_picture, 'url'):
                return obj.user.profile_picture.url
            return str(obj.user.profile_picture)
        return None


class PropertyInquirySerializer(serializers.ModelSerializer):
    inquiry_type_display = serializers.SerializerMethodField()
    property_title = serializers.SerializerMethodField()
    property_owner = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyInquiry
        fields = ('id', 'property', 'property_title', 'property_owner', 'user', 'name', 
                  'email', 'phone', 'inquiry_type', 'inquiry_type_display', 'message', 
                  'preferred_date', 'is_read', 'is_replied', 'created_at')
        read_only_fields = ('id', 'is_read', 'is_replied', 'created_at')
    
    def get_inquiry_type_display(self, obj):
        return obj.get_inquiry_type_display()
    
    def get_property_title(self, obj):
        return obj.property.title
    
    def get_property_owner(self, obj):
        return {
            'id': str(obj.property.owner.id),
            'username': obj.property.owner.username,
            'email': obj.property.owner.email
        }


class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    videos = PropertyVideoSerializer(many=True, read_only=True)
    video_url_display = serializers.SerializerMethodField()
    video_thumbnail_url = serializers.SerializerMethodField()
    documents = PropertyDocumentSerializer(many=True, read_only=True)
    reviews = PropertyReviewSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    
    main_image = PropertyImageSerializer(source='get_main_image', read_only=True)
    main_image_url = serializers.SerializerMethodField()
    all_image_urls = serializers.SerializerMethodField()
    gallery_images = serializers.SerializerMethodField()
    main_video = PropertyVideoSerializer(source='get_main_video', read_only=True)
    
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
    
    def get_is_favorited(self, obj):
        return self.get_is_liked(obj)
    
    def get_main_image_url(self, obj):
        main_image = obj.images.filter(is_main=True).first()
        if not main_image:
            main_image = obj.images.first()
        if main_image and main_image.image:
            if hasattr(main_image.image, 'url'):
                return main_image.image.url
            return str(main_image.image)
        return None
    
    def get_all_image_urls(self, obj):
        urls = []
        for img in obj.images.all():
            if img.image:
                if hasattr(img.image, 'url'):
                    urls.append(img.image.url)
                else:
                    urls.append(str(img.image))
        return urls
    
    def get_gallery_images(self, obj):
        return PropertyImageSerializer(obj.images.all(), many=True, context=self.context).data
    
    def get_amenities_list(self, obj):
        amenities = obj.get_amenities_list()
        if isinstance(amenities, str):
            try:
                return json.loads(amenities)
            except:
                return [a.strip() for a in amenities.split(',') if a.strip()]
        return amenities if isinstance(amenities, list) else []
    
    def get_nearby_schools_list(self, obj):
        schools = obj.get_nearby_schools_list()
        return schools if isinstance(schools, list) else []
    
    def get_nearby_roads_list(self, obj):
        roads = obj.get_nearby_roads_list()
        return roads if isinstance(roads, list) else []
    
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
    
    def get_video_url_display(self, obj):
        """Get video URL from property"""
        if obj.video_file:
            if hasattr(obj.video_file, 'url'):
                return obj.video_file.url
            return str(obj.video_file)
        return obj.video_url
    
    def get_video_thumbnail_url(self, obj):
        """Get video thumbnail URL from property"""
        if obj.video_thumbnail:
            if hasattr(obj.video_thumbnail, 'url'):
                return obj.video_thumbnail.url
            return str(obj.video_thumbnail)
        
        # Generate thumbnail from video if no thumbnail exists
        if obj.video_file and hasattr(obj.video_file, 'url'):
            if hasattr(obj.video_file, 'build_url'):
                return obj.video_file.build_url(
                    resource_type='video',
                    transformation={'start_offset': '0', 'width': 640, 'height': 480, 'crop': 'fill'}
                )
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        if 'id' in representation and representation['id']:
            representation['id'] = str(representation['id'])
        
        numeric_fields = [
            'views_count', 'likes_count', 'shares_count', 'bedrooms', 
            'bathrooms', 'square_meters', 'parking_spaces', 
            'year_built', 'reviews_count', 'number_of_buildings',
            'number_of_floors', 'floor_number', 'total_floors',
            'number_of_meeting_rooms'
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
            'school_rating', 'distance_to_mall', 'distance_to_hospital',
            'interest_rate', 'min_down_payment'
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
    
    def get_main_image(self, obj):
        return obj.images.filter(is_main=True).first() or obj.images.first()
    
    def get_main_video(self, obj):
        return obj.videos.filter(is_main=True).first() or obj.videos.first()


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
        extra_kwargs = {
            'video_file': {'write_only': True},
            'images': {'write_only': True},
        }
    
    def validate_images(self, value):
        if len(value) > 50:
            raise serializers.ValidationError("Maximum 50 images allowed per property")
        
        for image in value:
            if image.size > 10 * 1024 * 1024:
                raise serializers.ValidationError(f"Image {image.name} exceeds 10MB limit")
        
        return value
    
    def validate_video_file(self, value):
        if value:
            if value.size > 100 * 1024 * 1024:
                raise serializers.ValidationError("Video file exceeds 100MB limit")
            
            valid_extensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
            if not any(value.name.lower().endswith(ext) for ext in valid_extensions):
                raise serializers.ValidationError("Invalid video format. Supported: MP4, MOV, AVI, WEBM, MKV")
        
        return value
    
    def validate_price(self, value):
        if value and value <= 0:
            raise serializers.ValidationError("Price must be greater than zero")
        return value
    
    def create(self, validated_data):
        video_file = validated_data.pop('video_file', None)
        images_data = validated_data.pop('images', [])
        amenities_data = validated_data.pop('amenities', [])
        nearby_schools_data = validated_data.pop('nearby_schools', '')
        nearby_roads_data = validated_data.pop('nearby_roads', '')
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        else:
            raise serializers.ValidationError({"owner": "User must be authenticated to create a property"})
        
        if amenities_data:
            validated_data['amenities'] = amenities_data
        if nearby_schools_data:
            validated_data['nearby_schools'] = nearby_schools_data
        if nearby_roads_data:
            validated_data['nearby_roads'] = nearby_roads_data
        
        # Create property
        property_obj = Property.objects.create(**validated_data)
        
        # Handle video file with thumbnail generation
        if video_file:
            try:
                # Upload video to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    video_file,
                    folder='properties/videos/',
                    resource_type='video',
                    transformation={'quality': 'auto'},
                    overwrite=True
                )
                property_obj.video_file = upload_result['public_id']
                
                # Generate thumbnail from video (at 0.5 seconds)
                try:
                    thumbnail_result = cloudinary.uploader.upload(
                        video_file,
                        folder='properties/videos/thumbnails/',
                        resource_type='image',
                        transformation=[
                            {'start_offset': '0.5'},
                            {'width': 640, 'height': 360, 'crop': 'fill'}
                        ],
                        overwrite=True
                    )
                    property_obj.video_thumbnail = thumbnail_result['public_id']
                except Exception as e:
                    print(f"Error generating video thumbnail: {e}")
                
                property_obj.save(update_fields=['video_file', 'video_thumbnail'])
            except Exception as e:
                print(f"Error uploading video to Cloudinary: {e}")
        
        # Handle images
        for i, image in enumerate(images_data):
            try:
                PropertyImage.objects.create(
                    property=property_obj,
                    image=image,
                    is_main=(i == 0),
                    order=i
                )
            except Exception as e:
                print(f"Error uploading image to Cloudinary: {e}")
        
        return property_obj
    
    def update(self, instance, validated_data):
        video_file = validated_data.pop('video_file', None)
        images_data = validated_data.pop('images', None)
        amenities_data = validated_data.pop('amenities', None)
        nearby_schools_data = validated_data.pop('nearby_schools', None)
        nearby_roads_data = validated_data.pop('nearby_roads', None)
        
        if amenities_data is not None:
            instance.amenities = amenities_data
        if nearby_schools_data is not None:
            instance.nearby_schools = nearby_schools_data
        if nearby_roads_data is not None:
            instance.nearby_roads = nearby_roads_data
        
        # Update video file with thumbnail
        if video_file:
            try:
                # Upload video to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    video_file,
                    folder='properties/videos/',
                    resource_type='video',
                    transformation={'quality': 'auto'},
                    overwrite=True
                )
                instance.video_file = upload_result['public_id']
                
                # Generate thumbnail from video
                try:
                    thumbnail_result = cloudinary.uploader.upload(
                        video_file,
                        folder='properties/videos/thumbnails/',
                        resource_type='image',
                        transformation=[
                            {'start_offset': '0.5'},
                            {'width': 640, 'height': 360, 'crop': 'fill'}
                        ],
                        overwrite=True
                    )
                    instance.video_thumbnail = thumbnail_result['public_id']
                except Exception as e:
                    print(f"Error generating video thumbnail: {e}")
                
            except Exception as e:
                print(f"Error uploading video to Cloudinary: {e}")
        
        # Update regular fields
        for attr, value in validated_data.items():
            if attr not in ['video_file', 'images']:
                setattr(instance, attr, value)
        
        instance.save()
        
        # Add new images
        if images_data:
            current_image_count = instance.images.count()
            for i, image in enumerate(images_data):
                try:
                    PropertyImage.objects.create(
                        property=instance,
                        image=image,
                        is_main=(i == 0 and not instance.images.filter(is_main=True).exists()),
                        order=current_image_count + i
                    )
                except Exception as e:
                    print(f"Error uploading image to Cloudinary: {e}")
        
        return instance
    
    def to_representation(self, instance):
        return PropertySerializer(instance, context=self.context).data