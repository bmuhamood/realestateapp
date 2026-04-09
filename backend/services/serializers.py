from rest_framework import serializers
from .models import ServiceCategory, Service, ServiceBooking, ServiceReview
from users.serializers import UserSerializer

class ServiceCategorySerializer(serializers.ModelSerializer):
    service_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceCategory
        fields = '__all__'
    
    def get_service_count(self, obj):
        return obj.services.filter(is_active=True).count()

class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    gallery_images = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = '__all__'
    
    def get_gallery_images(self, obj):
        request = self.context.get('request')
        images = []
        for img in obj.gallery_images.all():
            images.append({
                'id': img.id,
                'image': request.build_absolute_uri(img.image.url) if request else img.image.url,
                'order': img.order,
                'is_main': img.is_main,
            })
        return images
    
    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return sum(r.rating for r in reviews) / reviews.count()
        return obj.rating

class ServiceBookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_image = serializers.ImageField(source='service.image', read_only=True)
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = ServiceBooking
        fields = '__all__'
        read_only_fields = ('user', 'status', 'total_price', 'created_at', 'updated_at')

class ServiceReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile_picture', read_only=True)
    
    class Meta:
        model = ServiceReview
        fields = '__all__'
        read_only_fields = ('user', 'created_at')