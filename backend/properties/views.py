from datetime import timedelta
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, Q
from django.utils import timezone
from .models import Property, PropertyImage, PropertyLike, PropertyView
from .serializers import PropertySerializer, PropertyCreateSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json

# Import BoostPackage from payments.models, not from properties.models
from payments.models import BoostPackage


class PropertyRecommendationsView(APIView):
    """Get property recommendations - homepage and property detail page"""
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request, pk=None):
        limit = int(request.query_params.get('limit', 4))
        
        try:
            # If pk is provided, get recommendations for that specific property
            if pk:
                try:
                    current_property = Property.objects.get(pk=pk, is_available=True)
                    # Get similar properties based on type, city, district, or price range
                    price_range = 0.3  # 30% price range
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
                    
                    # If not enough recommendations, add popular properties
                    if queryset.count() < limit:
                        popular = Property.objects.filter(
                            is_available=True,
                            expires_at__gt=timezone.now()
                        ).exclude(id=pk).order_by('-is_boosted', '-views_count')[:limit - queryset.count()]
                        queryset = list(queryset) + list(popular)
                    
                    serializer = PropertySerializer(queryset, many=True, context={'request': request})
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except Property.DoesNotExist:
                    pass
            
            # If no pk or property not found, return general recommendations for homepage
            queryset = Property.objects.filter(
                is_available=True,
                expires_at__gt=timezone.now()
            )
            
            # If no properties exist, return empty list
            if not queryset.exists():
                return Response([], status=status.HTTP_200_OK)
            
            # For authenticated users, personalize based on their liked properties
            if request.user and request.user.is_authenticated:
                try:
                    # Get user's liked property types
                    liked_types = PropertyLike.objects.filter(
                        user=request.user
                    ).values_list('property__property_type', flat=True).distinct()[:3]
                    
                    if liked_types:
                        queryset = queryset.filter(property_type__in=liked_types)
                    
                    # If still no results, fallback to general recommendations
                    if not queryset.exists():
                        queryset = Property.objects.filter(
                            is_available=True,
                            expires_at__gt=timezone.now()
                        )
                except Exception as e:
                    print(f"Error personalizing recommendations: {e}")
            
            # Order by boosted first, then by views and creation date
            recommendations = queryset.distinct().order_by('-is_boosted', '-views_count', '-created_at')[:limit]
            
            # If no recommendations, get the most recent properties
            if not recommendations.exists():
                recommendations = Property.objects.filter(
                    is_available=True,
                    expires_at__gt=timezone.now()
                ).order_by('-created_at')[:limit]
            
            serializer = PropertySerializer(recommendations, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in PropertyRecommendationsView: {e}")
            import traceback
            traceback.print_exc()
            # Return empty list on error to avoid breaking the frontend
            return Response([], status=status.HTTP_200_OK)


class PropertyListView(generics.ListCreateAPIView):
    """List all properties or create a new property"""
    serializer_class = PropertySerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'transaction_type', 'bedrooms', 'bathrooms', 'city', 'district']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['price', 'created_at', 'views_count', 'likes_count']
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_queryset(self):
        """Return only available properties that haven't expired"""
        return Property.objects.filter(
            is_available=True, 
            expires_at__gt=timezone.now()
        ).order_by('-is_boosted', '-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PropertyCreateSerializer
        return PropertySerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new property with images"""
        try:
            mutable_data = request.data.copy()
            
            # Extract images
            images = request.FILES.getlist('images')
            if images:
                mutable_data['images'] = images
            
            serializer = self.get_serializer(data=mutable_data)
            serializer.is_valid(raise_exception=True)
            
            # Save property with images
            property_obj = serializer.save(owner=request.user, is_available=True)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"Error creating property: {e}")
            return Response(
                {'error': f'Failed to create property: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a property"""
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
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
            
            # Check permission
            if request.user != instance.owner and not request.user.is_staff:
                return Response(
                    {'error': 'You don\'t have permission to edit this property'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            mutable_data = request.data.copy()
            
            # Handle existing images deletion
            if 'existing_images' in mutable_data:
                try:
                    existing_images = json.loads(mutable_data['existing_images'])
                    instance.images.exclude(id__in=existing_images).delete()
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"Error parsing existing_images: {e}")
                mutable_data.pop('existing_images', None)
            
            # Update property fields
            serializer = self.get_serializer(instance, data=mutable_data, partial=True)
            if serializer.is_valid():
                self.perform_update(serializer)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle new image uploads
            if 'images' in request.FILES:
                files = request.FILES.getlist('images')
                main_image_index = request.data.get('main_image_index')
                
                for i, file in enumerate(files):
                    image = PropertyImage.objects.create(
                        property=instance,
                        image=file,
                        is_main=(str(i) == main_image_index) if main_image_index else (i == 0)
                    )
                    image.order = i
                    image.save()
            
            # Set main image from existing images
            if 'main_image_id' in mutable_data and mutable_data['main_image_id'] != 'new':
                try:
                    main_image_id = int(mutable_data['main_image_id'])
                    instance.images.filter(id=main_image_id).update(is_main=True)
                    instance.images.exclude(id=main_image_id).update(is_main=False)
                except (ValueError, TypeError) as e:
                    print(f"Error setting main image: {e}")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error updating property: {e}")
            return Response(
                {'error': f'Failed to update property: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_update(self, serializer):
        serializer.save()


class PropertyLikeView(APIView):
    """Like or unlike a property"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
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
                
        except Property.DoesNotExist:
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


class MyPropertiesView(generics.ListAPIView):
    """Get all properties owned by the authenticated user"""
    serializer_class = PropertySerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Property.objects.filter(owner=self.request.user).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in MyPropertiesView: {e}")
            return Response([], status=status.HTTP_200_OK)


class BoostPropertyView(APIView):
    """Boost a property for 7 days"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            property_obj = Property.objects.get(pk=pk, owner=request.user, is_available=True)
            property_obj.is_boosted = True
            property_obj.boosted_until = timezone.now() + timedelta(days=7)
            property_obj.save(update_fields=['is_boosted', 'boosted_until'])
            
            return Response({
                'message': 'Property boosted successfully',
                'boosted_until': property_obj.boosted_until
            }, status=status.HTTP_200_OK)
        except Property.DoesNotExist:
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


class BoostPackageListView(APIView):
    """Get all available boost packages"""
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        try:
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