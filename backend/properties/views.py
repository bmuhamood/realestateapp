# properties/views.py - UPDATED FOR UUID SUPPORT
from datetime import timedelta
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import (
    Property, PropertyImage, PropertyLike, PropertyView, 
    PropertyVideo, PropertyDocument, PropertyReview, PropertyInquiry
)
from .serializers import (
    PropertySerializer, PropertyCreateSerializer, 
    PropertyVideoSerializer, PropertyDocumentSerializer,
    PropertyReviewSerializer, PropertyInquirySerializer
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json
from django_filters import rest_framework as django_filters
import cloudinary.uploader
import cloudinary.api
import uuid

# Import BoostPackage from payments.models
try:
    from payments.models import BoostPackage
except ImportError:
    BoostPackage = None


# ========== FILTER CLASS ==========
class PropertyFilter(django_filters.FilterSet):
    owner = django_filters.NumberFilter(field_name='owner__id')  # ✅ Accepts integers
    user = django_filters.NumberFilter(field_name='owner__id')
    agent = django_filters.NumberFilter(field_name='owner__id')
    
    # New filters for upgraded features
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_bedrooms = django_filters.NumberFilter(field_name='bedrooms', lookup_expr='gte')
    min_bathrooms = django_filters.NumberFilter(field_name='bathrooms', lookup_expr='gte')
    has_video = django_filters.BooleanFilter(method='filter_has_video')
    has_pool = django_filters.BooleanFilter(field_name='has_swimming_pool')
    has_security = django_filters.BooleanFilter(field_name='has_security')
    has_parking = django_filters.BooleanFilter(field_name='parking_spaces', lookup_expr='gt')
    furnishing = django_filters.ChoiceFilter(choices=Property.FURNISHING_STATUS)
    
    class Meta:
        model = Property
        fields = [
            'property_type', 'transaction_type', 'bedrooms', 'bathrooms', 
            'owner', 'user', 'agent', 'city', 'district', 'furnishing_status',
            'has_swimming_pool', 'has_security', 'has_cctv', 'has_gated_community',
            'pets_allowed', 'has_title_deed'
        ]
    
    def filter_has_video(self, queryset, name, value):
        if value:
            return queryset.filter(Q(video_url__isnull=False) | Q(video_file__isnull=False))
        return queryset


# ========== PROPERTY RECOMMENDATIONS VIEW ==========
class PropertyRecommendationsView(APIView):
    """Get property recommendations - homepage and property detail page"""
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request, pk=None):
        limit = int(request.query_params.get('limit', 4))
        
        try:
            if pk:
                try:
                    # Handle UUID string conversion
                    if isinstance(pk, str):
                        pk = uuid.UUID(pk)
                    current_property = Property.objects.get(pk=pk, is_available=True)
                    price_range = 0.3
                    min_price = float(current_property.price) * (1 - price_range)
                    max_price = float(current_property.price) * (1 + price_range)
                    
                    queryset = Property.objects.filter(
                        is_available=True,
                        expires_at__gt=timezone.now()
                    ).filter(
                        Q(property_type=current_property.property_type) |
                        Q(city=current_property.city) |
                        Q(district=current_property.district) |
                        Q(price__gte=min_price, price__lte=max_price)
                    ).exclude(id=pk).order_by('-is_boosted', '-views_count', '-created_at')[:limit]
                    
                    if queryset.count() < limit:
                        popular = Property.objects.filter(
                            is_available=True,
                            expires_at__gt=timezone.now()
                        ).exclude(id=pk).order_by('-is_boosted', '-views_count')[:limit - queryset.count()]
                        queryset = list(queryset) + list(popular)
                    
                    serializer = PropertySerializer(queryset, many=True, context={'request': request})
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except (Property.DoesNotExist, ValueError):
                    pass
            
            queryset = Property.objects.filter(
                is_available=True,
                expires_at__gt=timezone.now()
            )
            
            if not queryset.exists():
                return Response([], status=status.HTTP_200_OK)
            
            if request.user and request.user.is_authenticated:
                try:
                    liked_types = PropertyLike.objects.filter(
                        user=request.user
                    ).values_list('property__property_type', flat=True).distinct()[:3]
                    
                    if liked_types:
                        queryset = queryset.filter(property_type__in=liked_types)
                    
                    if not queryset.exists():
                        queryset = Property.objects.filter(
                            is_available=True,
                            expires_at__gt=timezone.now()
                        )
                except Exception as e:
                    print(f"Error personalizing recommendations: {e}")
            
            recommendations = queryset.distinct().order_by('-is_boosted', '-views_count', '-created_at')[:limit]
            
            if not recommendations.exists():
                recommendations = Property.objects.filter(
                    is_available=True,
                    expires_at__gt=timezone.now()
                ).order_by('-created_at')[:limit]
            
            serializer = PropertySerializer(recommendations, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in PropertyRecommendationsView: {e}")
            return Response([], status=status.HTTP_200_OK)


# ========== PROPERTY LIST VIEW ==========
class PropertyListView(generics.ListCreateAPIView):
    """List all properties or create a new property"""
    serializer_class = PropertySerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ['title', 'description', 'address', 'city', 'district', 'neighborhood_name']
    ordering_fields = ['price', 'created_at', 'views_count', 'likes_count', 'bedrooms', 'bathrooms', 'square_meters']
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_queryset(self):
        queryset = Property.objects.filter(
            is_available=True, 
            expires_at__gt=timezone.now()
        )
        
        # Filter by owner (handle UUID string)
        # owner_id = self.request.query_params.get('owner')
        # if owner_id:
        #     try:
        #         owner_uuid = uuid.UUID(owner_id)
        #         queryset = queryset.filter(owner_id=owner_uuid)
        #     except ValueError:
        #         pass
        
        # Filter by authenticated user's properties
        my_properties = self.request.query_params.get('my_properties')
        if my_properties == 'true' and self.request.user.is_authenticated:
            queryset = queryset.filter(owner=self.request.user)
        
        # Location filters
        city = self.request.query_params.get('city')
        district = self.request.query_params.get('district')
        location = self.request.query_params.get('location')
        neighborhood = self.request.query_params.get('neighborhood')
        
        if neighborhood:
            queryset = queryset.filter(neighborhood_name__icontains=neighborhood)
        elif location:
            queryset = queryset.filter(
                Q(city__icontains=location) | 
                Q(district__icontains=location) |
                Q(neighborhood_name__icontains=location)
            )
        elif city and district:
            queryset = queryset.filter(
                Q(city__icontains=city) | 
                Q(district__icontains=district)
            )
        elif city:
            queryset = queryset.filter(city__icontains=city)
        elif district:
            queryset = queryset.filter(district__icontains=district)
        
        # Property features filters
        property_type = self.request.query_params.get('property_type')
        if property_type:
            queryset = queryset.filter(property_type=property_type)
        
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        bedrooms = self.request.query_params.get('bedrooms')
        if bedrooms:
            queryset = queryset.filter(bedrooms__gte=bedrooms)
        
        bathrooms = self.request.query_params.get('bathrooms')
        if bathrooms:
            queryset = queryset.filter(bathrooms__gte=bathrooms)
        
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # New amenity filters
        if self.request.query_params.get('has_pool') == 'true':
            queryset = queryset.filter(has_swimming_pool=True)
        
        if self.request.query_params.get('has_security') == 'true':
            queryset = queryset.filter(has_security=True)
        
        if self.request.query_params.get('has_parking') == 'true':
            queryset = queryset.filter(parking_spaces__gt=0)
        
        if self.request.query_params.get('furnished') == 'true':
            queryset = queryset.exclude(furnishing_status='unfurnished')
        
        furnishing = self.request.query_params.get('furnishing_status')
        if furnishing:
            queryset = queryset.filter(furnishing_status=furnishing)
        
        # School rating filter
        min_school_rating = self.request.query_params.get('min_school_rating')
        if min_school_rating:
            queryset = queryset.filter(school_rating__gte=min_school_rating)
        
        # Distance filters
        max_distance_to_city = self.request.query_params.get('max_distance_to_city')
        if max_distance_to_city:
            queryset = queryset.filter(distance_to_city_center__lte=max_distance_to_city)
        
        # Video filter
        if self.request.query_params.get('has_video') == 'true':
            queryset = queryset.filter(Q(video_url__isnull=False) | Q(video_file__isnull=False))
        
        return queryset.order_by('-is_boosted', '-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PropertyCreateSerializer
        return PropertySerializer
    
    def perform_create(self, serializer):
        """Create property with Cloudinary upload handling"""
        serializer.save(owner=self.request.user)


# ========== PROPERTY DETAIL VIEW ==========
class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a property"""
    queryset = Property.objects.all()
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    lookup_field = 'pk'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PropertyCreateSerializer
        return PropertySerializer
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # Track view
            PropertyView.objects.create(
                property=instance,
                user=request.user if request.user.is_authenticated else None,
                ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
            )
            
            # Increment view count
            instance.views_count = F('views_count') + 1
            instance.save(update_fields=['views_count'])
            instance.refresh_from_db()
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error retrieving property: {e}")
            return Response(
                {'error': 'Property not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            if request.user != instance.owner and not request.user.is_staff:
                return Response(
                    {'error': 'You don\'t have permission to edit this property'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Process existing images first
            existing_images = request.data.get('existing_images')
            if existing_images:
                try:
                    existing_image_ids = json.loads(existing_images)
                    # Delete images that are no longer in the list
                    images_to_delete = instance.images.exclude(id__in=existing_image_ids)
                    for img in images_to_delete:
                        # Delete from Cloudinary
                        if img.image:
                            try:
                                cloudinary.uploader.destroy(img.image.public_id)
                            except:
                                pass
                        img.delete()
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"Error parsing existing_images: {e}")
            
            # Use the serializer directly with request.data
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            
            if serializer.is_valid():
                self.perform_update(serializer)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle main image after save (UUID handling)
            main_image_id = request.data.get('main_image_id')
            if main_image_id and main_image_id != 'new':
                try:
                    # Convert string to UUID if needed
                    if isinstance(main_image_id, str):
                        main_image_uuid = uuid.UUID(main_image_id)
                    else:
                        main_image_uuid = main_image_id
                    instance.images.filter(id=main_image_uuid).update(is_main=True)
                    instance.images.exclude(id=main_image_uuid).update(is_main=False)
                except (ValueError, TypeError, AttributeError) as e:
                    print(f"Error setting main image: {e}")
            
            # Handle video file if uploaded
            if 'video_file' in request.FILES:
                # Delete old video from Cloudinary if exists
                if instance.video_file:
                    try:
                        cloudinary.uploader.destroy(instance.video_file.public_id, resource_type='video')
                    except:
                        pass
                instance.video_file = request.FILES['video_file']
                instance.save(update_fields=['video_file'])
            
            # Refresh and return
            instance.refresh_from_db()
            response_serializer = PropertySerializer(instance, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error updating property: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to update property: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_update(self, serializer):
        serializer.save()
    
    def delete(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            if request.user != instance.owner and not request.user.is_staff:
                return Response(
                    {'error': 'You don\'t have permission to delete this property'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check for active bookings
            try:
                from bookings.models import Booking
                active_bookings = Booking.objects.filter(
                    property=instance,
                    status__in=['pending', 'confirmed']
                ).exists()
                
                if active_bookings:
                    return Response(
                        {'error': 'Cannot delete property with active bookings'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ImportError:
                pass
            
            # Delete all associated images from Cloudinary
            for image in instance.images.all():
                if image.image:
                    try:
                        cloudinary.uploader.destroy(image.image.public_id)
                    except:
                        pass
            
            # Delete video from Cloudinary
            if instance.video_file:
                try:
                    cloudinary.uploader.destroy(instance.video_file.public_id, resource_type='video')
                except:
                    pass
            
            # Delete documents from Cloudinary
            for doc in instance.documents.all():
                if doc.file:
                    try:
                        cloudinary.uploader.destroy(doc.file.public_id, resource_type='raw')
                    except:
                        pass
            
            instance.delete()
            return Response(
                {'message': 'Property deleted successfully'}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            print(f"Error deleting property: {e}")
            return Response(
                {'error': f'Failed to delete property: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========== PROPERTY LIKE VIEW ==========
class PropertyLikeView(APIView):
    """Like or unlike a property"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            # Handle UUID conversion
            if isinstance(pk, str):
                pk = uuid.UUID(pk)
            property_obj = Property.objects.get(pk=pk, is_available=True)
            like, created = PropertyLike.objects.get_or_create(
                user=request.user,
                property=property_obj
            )
            
            if created:
                property_obj.likes_count = F('likes_count') + 1
                property_obj.save(update_fields=['likes_count'])
                property_obj.refresh_from_db()
                return Response({
                    'liked': True, 
                    'likes_count': property_obj.likes_count
                }, status=status.HTTP_200_OK)
            else:
                like.delete()
                property_obj.likes_count = F('likes_count') - 1
                property_obj.save(update_fields=['likes_count'])
                property_obj.refresh_from_db()
                return Response({
                    'liked': False, 
                    'likes_count': property_obj.likes_count
                }, status=status.HTTP_200_OK)
                
        except (Property.DoesNotExist, ValueError):
            return Response(
                {'error': 'Property not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in PropertyLikeView: {e}")
            return Response(
                {'error': 'Failed to process like'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========== MY PROPERTIES VIEW ==========
class MyPropertiesView(generics.ListAPIView):
    """Get all properties owned by the authenticated user"""
    serializer_class = PropertySerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Property.objects.filter(owner=self.request.user).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in MyPropertiesView: {e}")
            return Response([], status=status.HTTP_200_OK)


# ========== BOOST PROPERTY VIEW ==========
class BoostPropertyView(APIView):
    """Boost a property"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            if isinstance(pk, str):
                pk = uuid.UUID(pk)
            property_obj = Property.objects.get(pk=pk, owner=request.user, is_available=True)
            property_obj.is_boosted = True
            property_obj.boosted_until = timezone.now() + timedelta(days=7)
            property_obj.save(update_fields=['is_boosted', 'boosted_until'])
            
            return Response({
                'message': 'Property boosted successfully',
                'boosted_until': property_obj.boosted_until
            }, status=status.HTTP_200_OK)
        except (Property.DoesNotExist, ValueError):
            return Response(
                {'error': 'Property not found or you don\'t have permission'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in BoostPropertyView: {e}")
            return Response(
                {'error': 'Failed to boost property'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========== BOOST PACKAGE LIST VIEW ==========
class BoostPackageListView(APIView):
    """Get all available boost packages"""
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        try:
            if BoostPackage is None:
                # Return default packages if model doesn't exist yet
                default_packages = [
                    {'id': 1, 'name': 'Standard', 'duration_days': 7, 'price': 29.99, 'priority': 1},
                    {'id': 2, 'name': 'Premium', 'duration_days': 14, 'price': 49.99, 'priority': 2},
                    {'id': 3, 'name': 'VIP', 'duration_days': 30, 'price': 99.99, 'priority': 3},
                ]
                return Response(default_packages, status=status.HTTP_200_OK)
            
            packages = BoostPackage.objects.filter(is_active=True).order_by('price')
            
            if not packages.exists():
                return Response([], status=status.HTTP_200_OK)
            
            data = []
            for pkg in packages:
                data.append({
                    'id': pkg.id,
                    'name': pkg.name,
                    'description': pkg.description,
                    'duration_days': pkg.duration_days,
                    'price': float(pkg.price),
                    'priority': pkg.priority,
                })
            
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error fetching boost packages: {e}")
            return Response([], status=status.HTTP_200_OK)


# ========== USER FAVORITES VIEW ==========
class UserFavoritesView(generics.ListAPIView):
    """Get all properties liked by the authenticated user"""
    serializer_class = PropertySerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        liked_property_ids = PropertyLike.objects.filter(
            user=self.request.user
        ).values_list('property_id', flat=True)
        
        return Property.objects.filter(
            id__in=liked_property_ids,
            is_available=True,
            expires_at__gt=timezone.now()
        ).select_related('owner').prefetch_related('images', 'videos')
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True, context={'request': request})
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error fetching favorites: {e}")
            return Response({'count': 0, 'results': []}, status=status.HTTP_200_OK)


# ========== PROPERTY VIDEO VIEWS ==========
class PropertyVideoView(APIView):
    """Handle video uploads for properties"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, property_id):
        try:
            # Handle UUID conversion
            if isinstance(property_id, str):
                property_uuid = uuid.UUID(property_id)
            else:
                property_uuid = property_id
            property_obj = Property.objects.get(id=property_uuid, owner=request.user)
            serializer = PropertyVideoSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(property=property_obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except (Property.DoesNotExist, ValueError):
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, property_id, video_id):
        try:
            if isinstance(video_id, str):
                video_uuid = uuid.UUID(video_id)
            else:
                video_uuid = video_id
            video = PropertyVideo.objects.get(id=video_uuid, property__owner=request.user)
            
            # Delete from Cloudinary
            if video.video_file:
                try:
                    cloudinary.uploader.destroy(video.video_file.public_id, resource_type='video')
                except:
                    pass
            
            video.delete()
            return Response({'message': 'Video deleted'}, status=status.HTTP_200_OK)
        except (PropertyVideo.DoesNotExist, ValueError):
            return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)


# ========== PROPERTY DOCUMENT VIEWS ==========
class PropertyDocumentView(APIView):
    """Handle document uploads for properties"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, property_id):
        try:
            if isinstance(property_id, str):
                property_uuid = uuid.UUID(property_id)
            else:
                property_uuid = property_id
            property_obj = Property.objects.get(id=property_uuid, owner=request.user)
            serializer = PropertyDocumentSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(property=property_obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except (Property.DoesNotExist, ValueError):
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, property_id, document_id):
        try:
            if isinstance(document_id, str):
                doc_uuid = uuid.UUID(document_id)
            else:
                doc_uuid = document_id
            doc = PropertyDocument.objects.get(id=doc_uuid, property__owner=request.user)
            
            # Delete from Cloudinary
            if doc.file:
                try:
                    cloudinary.uploader.destroy(doc.file.public_id, resource_type='raw')
                except:
                    pass
            
            doc.delete()
            return Response({'message': 'Document deleted'}, status=status.HTTP_200_OK)
        except (PropertyDocument.DoesNotExist, ValueError):
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)


# ========== PROPERTY REVIEW VIEWS ==========
class PropertyReviewView(generics.ListCreateAPIView):
    """List and create reviews for properties"""
    serializer_class = PropertyReviewSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    
    def get_queryset(self):
        property_id = self.kwargs.get('property_id')
        try:
            if isinstance(property_id, str):
                property_uuid = uuid.UUID(property_id)
            else:
                property_uuid = property_id
            return PropertyReview.objects.filter(property_id=property_uuid).order_by('-created_at')
        except ValueError:
            return PropertyReview.objects.none()
    
    def perform_create(self, serializer):
        property_id = self.kwargs.get('property_id')
        if isinstance(property_id, str):
            property_uuid = uuid.UUID(property_id)
        else:
            property_uuid = property_id
        property_obj = Property.objects.get(id=property_uuid)
        serializer.save(user=self.request.user, property=property_obj)
        
        # Update property average rating
        reviews = PropertyReview.objects.filter(property=property_obj)
        avg_rating = sum(r.rating for r in reviews) / reviews.count()
        property_obj.school_rating = avg_rating
        property_obj.save(update_fields=['school_rating'])
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ========== PROPERTY INQUIRY VIEW ==========
class PropertyInquiryView(generics.CreateAPIView):
    """Create an inquiry about a property"""
    serializer_class = PropertyInquirySerializer
    permission_classes = (permissions.AllowAny,)
    
    def perform_create(self, serializer):
        property_id = self.kwargs.get('property_id')
        if isinstance(property_id, str):
            property_uuid = uuid.UUID(property_id)
        else:
            property_uuid = property_id
        property_obj = Property.objects.get(id=property_uuid)
        
        if self.request.user.is_authenticated:
            serializer.save(
                property=property_obj,
                user=self.request.user,
                name=self.request.user.get_full_name() or self.request.user.username,
                email=self.request.user.email
            )
        else:
            serializer.save(property=property_obj)


# ========== PROPERTY IMAGE DELETE VIEW ==========
class PropertyImageView(APIView):
    """Delete a specific property image"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def delete(self, request, image_id):
        try:
            if isinstance(image_id, str):
                image_uuid = uuid.UUID(image_id)
            else:
                image_uuid = image_id
            image = PropertyImage.objects.get(id=image_uuid)
            # Check if user owns the property
            if image.property.owner != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'You do not have permission to delete this image'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete from Cloudinary
            if image.image:
                try:
                    cloudinary.uploader.destroy(image.image.public_id)
                except Exception as e:
                    print(f"Error deleting from Cloudinary: {e}")
            
            # If this was the main image, set another image as main
            if image.is_main:
                other_image = image.property.images.exclude(id=image_uuid).first()
                if other_image:
                    other_image.is_main = True
                    other_image.save()
            
            image.delete()
            return Response({'message': 'Image deleted successfully'}, status=status.HTTP_200_OK)
        except (PropertyImage.DoesNotExist, ValueError):
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)


# ========== BULK IMAGE UPLOAD VIEW ==========
class BulkPropertyImageUploadView(APIView):
    """Upload multiple images at once"""
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser,)
    
    def post(self, request, property_id):
        try:
            if isinstance(property_id, str):
                property_uuid = uuid.UUID(property_id)
            else:
                property_uuid = property_id
            property_obj = Property.objects.get(id=property_uuid, owner=request.user)
            images = request.FILES.getlist('images')
            
            if not images:
                return Response(
                    {'error': 'No images provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(images) > 20:
                return Response(
                    {'error': 'Maximum 20 images per upload'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            uploaded_images = []
            current_count = property_obj.images.count()
            
            for i, image in enumerate(images):
                # Validate file size (max 10MB)
                if image.size > 10 * 1024 * 1024:
                    return Response(
                        {'error': f'Image {image.name} exceeds 10MB limit'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                is_main = (i == 0 and current_count == 0)
                prop_image = PropertyImage.objects.create(
                    property=property_obj,
                    image=image,
                    is_main=is_main,
                    order=current_count + i
                )
                
                uploaded_images.append({
                    'id': str(prop_image.id),  # Convert UUID to string
                    'url': prop_image.image.url if prop_image.image else None,
                    'is_main': prop_image.is_main,
                    'order': prop_image.order
                })
            
            return Response({
                'message': f'Successfully uploaded {len(uploaded_images)} images',
                'images': uploaded_images
            }, status=status.HTTP_201_CREATED)
            
        except (Property.DoesNotExist, ValueError):
            return Response(
                {'error': 'Property not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in bulk upload: {e}")
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )