# services/views.py - WITH CLOUDINARY IMAGE UPLOAD SUPPORT

from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from django.db.models import Q
from django.core.files.uploadedfile import UploadedFile
from .models import ServiceCategory, Service, ServiceBooking, ServiceReview, ServiceGalleryImage
from .serializers import (
    ServiceCategorySerializer, ServiceSerializer, 
    ServiceBookingSerializer, ServiceReviewSerializer
)
import cloudinary.uploader
import uuid


# Service Filter Class
class ServiceFilter(django_filters.FilterSet):
    provider_user = django_filters.UUIDFilter(field_name='provider_user__id')
    provider = django_filters.CharFilter(field_name='provider', lookup_expr='icontains')
    category = django_filters.UUIDFilter(field_name='category__id')
    
    class Meta:
        model = Service
        fields = ['category', 'service_type', 'provider_user', 'is_featured']


class ServiceCategoryListView(generics.ListAPIView):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = (permissions.AllowAny,)


class ServiceListView(generics.ListCreateAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ServiceFilter
    search_fields = ['name', 'description', 'provider']
    ordering_fields = ['price', 'rating', 'created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by provider_user (UUID)
        provider_id = self.request.query_params.get('provider_user')
        if provider_id:
            try:
                uuid.UUID(provider_id)
                queryset = queryset.filter(provider_user_id=provider_id)
            except ValueError:
                pass
        
        # Filter by category (UUID)
        category_id = self.request.query_params.get('category')
        if category_id:
            try:
                uuid.UUID(category_id)
                queryset = queryset.filter(category_id=category_id)
            except ValueError:
                pass
        
        # Also support 'provider' parameter for backward compatibility
        provider_name = self.request.query_params.get('provider')
        if provider_name:
            queryset = queryset.filter(provider__icontains=provider_name)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by featured
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create service with Cloudinary image upload"""
        service = serializer.save()
        
        # Handle main image upload to Cloudinary
        if 'image' in self.request.FILES:
            try:
                image_file = self.request.FILES['image']
                upload_result = cloudinary.uploader.upload(
                    image_file,
                    folder='services/',
                    transformation={'width': 800, 'height': 600, 'crop': 'fill'},
                    format='jpg', # Force convert to jpg
                    overwrite=True
                )
                service.image = upload_result['public_id']
                service.save(update_fields=['image'])
            except Exception as e:
                print(f"Error uploading main image to Cloudinary: {e}")
        
        # Handle gallery images upload to Cloudinary
        gallery_images = self.request.FILES.getlist('gallery_images')
        for i, img in enumerate(gallery_images):
            try:
                upload_result = cloudinary.uploader.upload(
                    img,
                    folder='services/gallery/',
                    transformation={'width': 600, 'height': 400, 'crop': 'fill'},
                    overwrite=True
                )
                ServiceGalleryImage.objects.create(
                    service=service,
                    image=upload_result['public_id'],
                    order=i,
                    is_main=(i == 0 and not service.image)
                )
            except Exception as e:
                print(f"Error uploading gallery image to Cloudinary: {e}")
        
        # Handle existing gallery images (if any)
        existing_gallery_ids = self.request.data.get('existing_gallery_ids')
        if existing_gallery_ids:
            try:
                import json
                ids_to_keep = json.loads(existing_gallery_ids)
                service.gallery_images.exclude(id__in=ids_to_keep).delete()
            except (json.JSONDecodeError, TypeError):
                pass
    
    def create(self, request, *args, **kwargs):
        """Override create to handle image uploads"""
        # Validate required fields
        if not request.data.get('name'):
            return Response({'error': 'Service name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Convert UUIDs to strings in response
        data = serializer.data
        for item in data:
            if 'id' in item:
                item['id'] = str(item['id'])
            if 'category' in item and item['category']:
                item['category'] = str(item['category'])
            if 'provider_user' in item and item['provider_user']:
                item['provider_user'] = str(item['provider_user'])
        
        return Response(data)


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """Update service with Cloudinary image handling"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle main image upload to Cloudinary
        if 'image' in request.FILES:
            try:
                # Delete old image from Cloudinary if exists
                if instance.image:
                    cloudinary.uploader.destroy(instance.image)
                
                image_file = request.FILES['image']
                upload_result = cloudinary.uploader.upload(
                    image_file,
                    folder='services/',
                    transformation={'width': 800, 'height': 600, 'crop': 'fill'},
                    overwrite=True
                )
                request.data._mutable = True
                request.data['image'] = upload_result['public_id']
                request.data._mutable = False
            except Exception as e:
                print(f"Error updating main image to Cloudinary: {e}")
        
        # Handle gallery images upload to Cloudinary
        gallery_images = request.FILES.getlist('gallery_images')
        current_image_count = instance.gallery_images.count()
        for i, img in enumerate(gallery_images):
            try:
                upload_result = cloudinary.uploader.upload(
                    img,
                    folder='services/gallery/',
                    transformation={'width': 600, 'height': 400, 'crop': 'fill'},
                    overwrite=True
                )
                ServiceGalleryImage.objects.create(
                    service=instance,
                    image=upload_result['public_id'],
                    order=current_image_count + i,
                    is_main=False
                )
            except Exception as e:
                print(f"Error uploading gallery image to Cloudinary: {e}")
        
        # Handle existing gallery images to keep
        existing_gallery_ids = request.data.get('existing_gallery_ids')
        if existing_gallery_ids:
            try:
                import json
                ids_to_keep = json.loads(existing_gallery_ids)
                # Delete images not in the keep list from Cloudinary
                images_to_delete = instance.gallery_images.exclude(id__in=ids_to_keep)
                for img in images_to_delete:
                    if img.image:
                        try:
                            cloudinary.uploader.destroy(img.image)
                        except:
                            pass
                images_to_delete.delete()
            except (json.JSONDecodeError, TypeError):
                pass
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def destroy(self, request, *args, **kwargs):
        """Delete service and its images from Cloudinary"""
        instance = self.get_object()
        
        # Delete main image from Cloudinary
        if instance.image:
            try:
                cloudinary.uploader.destroy(instance.image)
            except:
                pass
        
        # Delete gallery images from Cloudinary
        for img in instance.gallery_images.all():
            if img.image:
                try:
                    cloudinary.uploader.destroy(img.image)
                except:
                    pass
        
        # Delete video from Cloudinary if exists
        if hasattr(instance, 'video') and instance.video and instance.video.video_file:
            try:
                cloudinary.uploader.destroy(instance.video.video_file, resource_type='video')
            except:
                pass
        
        return super().destroy(request, *args, **kwargs)


class ServiceBookingView(generics.ListCreateAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return ServiceBooking.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        service = serializer.validated_data.get('service')
        total_price = service.price if service.price else 0
        serializer.save(user=self.request.user, total_price=total_price)
    
    def create(self, request, *args, **kwargs):
        service_id = request.data.get('service')
        if service_id:
            try:
                uuid.UUID(str(service_id))
            except ValueError:
                return Response(
                    {'error': 'Invalid service ID format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().create(request, *args, **kwargs)


class ServiceBookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'pk'
    
    def get_queryset(self):
        return ServiceBooking.objects.filter(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


class ServiceReviewView(generics.ListCreateAPIView):
    serializer_class = ServiceReviewSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    
    def get_queryset(self):
        service_id = self.request.query_params.get('service')
        if service_id:
            try:
                uuid.UUID(service_id)
                return ServiceReview.objects.filter(service_id=service_id).order_by('-created_at')
            except ValueError:
                return ServiceReview.objects.none()
        return ServiceReview.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
        # Update service rating
        service = serializer.validated_data.get('service')
        reviews = service.reviews.all()
        if reviews.exists():
            avg_rating = sum(r.rating for r in reviews) / reviews.count()
            service.rating = avg_rating
            service.reviews_count = reviews.count()
            service.save()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Convert UUIDs to strings
        data = serializer.data
        for item in data:
            if 'id' in item:
                item['id'] = str(item['id'])
            if 'user' in item and item['user']:
                item['user'] = str(item['user'])
            if 'service' in item and item['service']:
                item['service'] = str(item['service'])
        
        return Response(data)


class AgentServiceBookingsView(generics.ListAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        # Get all bookings for services owned by the current user as provider
        return ServiceBooking.objects.filter(
            service__provider_user=self.request.user
        ).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Convert UUIDs to strings
        data = serializer.data
        for item in data:
            if 'id' in item:
                item['id'] = str(item['id'])
            if 'user' in item and item['user']:
                item['user'] = str(item['user'])
            if 'service' in item and item['service']:
                item['service'] = str(item['service'])
        
        return Response(data)


class UpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def patch(self, request, pk):
        try:
            # Validate UUID
            try:
                booking_uuid = uuid.UUID(str(pk))
            except ValueError:
                return Response(
                    {'error': 'Invalid booking ID format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            booking = ServiceBooking.objects.get(pk=booking_uuid)
            new_status = request.data.get('status')
            
            # Check permission (only provider or staff can update status)
            if booking.service.provider_user != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'You do not have permission to update this booking'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            valid_statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Invalid status. Must be one of: {valid_statuses}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            booking.status = new_status
            booking.save()
            
            serializer = ServiceBookingSerializer(booking)
            return Response({
                'message': f'Booking status updated to {new_status}',
                'booking': serializer.data
            })
            
        except ServiceBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )