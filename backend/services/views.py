from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import ServiceCategory, Service, ServiceBooking, ServiceReview
from .serializers import (
    ServiceCategorySerializer, ServiceSerializer, 
    ServiceBookingSerializer, ServiceReviewSerializer
)

class ServiceCategoryListView(generics.ListAPIView):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = (permissions.AllowAny,)

class ServiceListView(generics.ListCreateAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'service_type']
    search_fields = ['name', 'description', 'provider']
    ordering_fields = ['price', 'rating', 'created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
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
        serializer.save()

class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

class ServiceBookingView(generics.ListCreateAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return ServiceBooking.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        service = serializer.validated_data.get('service')
        total_price = service.price if service.price else 0
        serializer.save(user=self.request.user, total_price=total_price)

class ServiceBookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return ServiceBooking.objects.filter(user=self.request.user)

class ServiceReviewView(generics.ListCreateAPIView):
    serializer_class = ServiceReviewSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    
    def get_queryset(self):
        service_id = self.request.query_params.get('service')
        if service_id:
            return ServiceReview.objects.filter(service_id=service_id)
        return ServiceReview.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
        # Update service rating
        service = serializer.validated_data.get('service')
        reviews = service.reviews.all()
        avg_rating = sum(r.rating for r in reviews) / reviews.count()
        service.rating = avg_rating
        service.reviews_count = reviews.count()
        service.save()

class AgentServiceBookingsView(generics.ListAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        # For demo, show all bookings (in production, filter by agent)
        return ServiceBooking.objects.all().order_by('-created_at')

class AgentServiceBookingsView(generics.ListAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        # Get all bookings for services owned by the current user as provider
        return ServiceBooking.objects.filter(
            service__provider_email=self.request.user.email
        ).order_by('-created_at')
    
class UpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def patch(self, request, pk):
        try:
            booking = ServiceBooking.objects.get(pk=pk)
            new_status = request.data.get('status')
            
            valid_statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
            if new_status not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
            booking.status = new_status
            booking.save()
            
            serializer = ServiceBookingSerializer(booking)
            return Response(serializer.data)
        except ServiceBooking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)