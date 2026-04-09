from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from .models import Booking
from .serializers import BookingSerializer

class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AgentBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Booking.objects.filter(
            property__owner=self.request.user
        ).select_related('user', 'property', 'property__owner').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        data = serializer.data
        for i, booking in enumerate(queryset):
            data[i]['customer_phone'] = booking.user.phone
            data[i]['customer_email'] = booking.user.email
            data[i]['customer_name'] = f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username
            data[i]['property_address'] = booking.property.address
            data[i]['property_location'] = f"{booking.property.district}, {booking.property.city}"
            data[i]['property_price'] = str(booking.property.price)
        
        return Response(data)

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        # Allow access to bookings where user is the client OR owner of the property
        return Booking.objects.filter(
            Q(user=self.request.user) | Q(property__owner=self.request.user)
        )
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if user is the property owner (agent) or the client
        is_agent = instance.property.owner == request.user
        is_client = instance.user == request.user
        
        # Get the status from request
        new_status = request.data.get('status')
        
        if new_status:
            # Only allow status changes if user is the agent
            if is_agent:
                # Validate status
                valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
                if new_status not in valid_statuses:
                    return Response(
                        {'error': f'Invalid status. Must be one of: {valid_statuses}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update status
                instance.status = new_status
                instance.save()
                
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Only the property owner can update booking status'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # If no status change, allow updates to other fields
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class ConfirmBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, property__owner=request.user)
            if booking.status == 'pending':
                booking.status = 'confirmed'
                booking.save()
                serializer = BookingSerializer(booking)
                return Response({
                    'message': 'Booking confirmed successfully',
                    'booking': serializer.data
                })
            return Response({
                'error': f'Booking cannot be confirmed. Current status: {booking.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

class CancelBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            is_agent = booking.property.owner == request.user
            is_client = booking.user == request.user
            
            if not (is_agent or is_client):
                return Response({'error': 'You don\'t have permission to cancel this booking'}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            if booking.status in ['pending', 'confirmed']:
                booking.status = 'cancelled'
                booking.save()
                serializer = BookingSerializer(booking)
                return Response({
                    'message': 'Booking cancelled successfully',
                    'booking': serializer.data
                })
            return Response({
                'error': f'Booking cannot be cancelled. Current status: {booking.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

class CompleteBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, property__owner=request.user)
            if booking.status == 'confirmed':
                booking.status = 'completed'
                booking.save()
                serializer = BookingSerializer(booking)
                return Response({
                    'message': 'Booking marked as completed',
                    'booking': serializer.data
                })
            return Response({
                'error': f'Booking cannot be marked as completed. Current status: {booking.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

class UpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, property__owner=request.user)
            new_status = request.data.get('status')
            
            valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
            if new_status not in valid_statuses:
                return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            booking.status = new_status
            booking.save()
            
            serializer = BookingSerializer(booking)
            return Response({
                'message': f'Booking status updated to {new_status}',
                'booking': serializer.data
            })
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

class AgentUpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, property__owner=request.user)
            new_status = request.data.get('status')
            
            valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
            if new_status not in valid_statuses:
                return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            booking.status = new_status
            booking.save()
            
            serializer = BookingSerializer(booking)
            return Response({
                'success': True,
                'message': f'Booking {new_status} successfully',
                'booking': serializer.data
            })
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        for i, booking in enumerate(queryset):
            data[i]['property_title'] = booking.property.title
            data[i]['property_address'] = booking.property.address
            data[i]['property_price'] = str(booking.property.price)
            data[i]['property_image'] = booking.property.images.first().image.url if booking.property.images.exists() else None
            data[i]['agent_name'] = f"{booking.property.owner.first_name} {booking.property.owner.last_name}".strip() or booking.property.owner.username
            data[i]['agent_phone'] = booking.property.owner.phone
        
        return Response(data)