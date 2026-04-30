# bookings/views.py - UPDATED WITH UUID SUPPORT

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Booking, BookingHistory
from .serializers import BookingSerializer, BookingHistorySerializer
import uuid


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        
        # Create history entry
        BookingHistory.objects.create(
            booking=booking,
            action='created',
            changed_by=self.request.user,
            notes=f"Booking created for property: {booking.property.title}"
        )
    
    def create(self, request, *args, **kwargs):
        """Override create to add custom validation"""
        # Check if user already has a pending booking for this property
        property_id = request.data.get('property')
        if property_id:
            try:
                # Convert string UUID to UUID object
                property_uuid = uuid.UUID(property_id)
                existing_booking = Booking.objects.filter(
                    user=request.user,
                    property_id=property_uuid,
                    status__in=['pending', 'confirmed']
                ).exists()
                
                if existing_booking:
                    return Response({
                        'error': 'You already have a pending or confirmed booking for this property'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                pass
        
        return super().create(request, *args, **kwargs)


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
            # Convert UUID to string for JSON
            data[i]['id'] = str(booking.id)
            
            # Add customer information
            data[i]['customer_phone'] = getattr(booking.user, 'phone', '')
            data[i]['customer_email'] = booking.user.email
            data[i]['customer_name'] = booking.user.get_full_name() or booking.user.username
            
            # Add property information
            data[i]['property_address'] = booking.property.address
            data[i]['property_location'] = f"{booking.property.district}, {booking.property.city}"
            data[i]['property_price'] = str(booking.property.price)
            data[i]['property_title'] = booking.property.title
            
            # Add property image
            main_image = booking.property.images.filter(is_main=True).first()
            if not main_image:
                main_image = booking.property.images.first()
            data[i]['property_image'] = main_image.image.url if main_image and main_image.image else None
            
            # Add booking status display
            data[i]['status_display'] = booking.get_status_display()
            data[i]['can_cancel'] = booking.can_cancel
            data[i]['days_until_visit'] = booking.days_until_visit
        
        return Response({
            'count': queryset.count(),
            'results': data
        })


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        # Allow access to bookings where user is the client OR owner of the property
        return Booking.objects.filter(
            Q(user=self.request.user) | Q(property__owner=self.request.user)
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to add additional data"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Add additional fields for agent view
        if instance.property.owner == request.user:
            data['customer_phone'] = getattr(instance.user, 'phone', '')
            data['customer_email'] = instance.user.email
            data['customer_name'] = instance.user.get_full_name() or instance.user.username
        
        # Add property images
        main_image = instance.property.images.filter(is_main=True).first()
        if not main_image:
            main_image = instance.property.images.first()
        data['property_image'] = main_image.image.url if main_image and main_image.image else None
        
        return Response(data)
    
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
                
                old_status = instance.status
                instance.status = new_status
                instance.save()
                
                # Create history entry
                BookingHistory.objects.create(
                    booking=instance,
                    action='updated',
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=request.user,
                    notes=f"Status changed from {old_status} to {new_status}"
                )
                
                serializer = self.get_serializer(instance)
                return Response({
                    'message': f'Booking {new_status} successfully',
                    'booking': serializer.data
                })
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
    
    def destroy(self, request, *args, **kwargs):
        """Override delete to prevent deletion of confirmed/completed bookings"""
        instance = self.get_object()
        
        if instance.status in ['confirmed', 'completed']:
            return Response({
                'error': f'Cannot delete a {instance.status} booking. Please cancel it first.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create history entry before deletion
        BookingHistory.objects.create(
            booking=instance,
            action='cancelled',
            changed_by=request.user,
            notes=f"Booking deleted by {request.user.username}"
        )
        
        return super().destroy(request, *args, **kwargs)


class ConfirmBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            # Handle UUID conversion
            if isinstance(pk, str):
                booking_uuid = uuid.UUID(pk)
            else:
                booking_uuid = pk
                
            booking = Booking.objects.get(pk=booking_uuid, property__owner=request.user)
            
            if booking.status == 'pending':
                old_status = booking.status
                booking.status = 'confirmed'
                booking.confirmed_at = timezone.now()
                booking.save()
                
                # Create history entry
                BookingHistory.objects.create(
                    booking=booking,
                    action='confirmed',
                    old_status=old_status,
                    new_status='confirmed',
                    changed_by=request.user,
                    notes="Booking confirmed by agent"
                )
                
                serializer = BookingSerializer(booking)
                return Response({
                    'message': 'Booking confirmed successfully',
                    'booking': serializer.data
                })
            return Response({
                'error': f'Booking cannot be confirmed. Current status: {booking.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


class CancelBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            # Handle UUID conversion
            if isinstance(pk, str):
                booking_uuid = uuid.UUID(pk)
            else:
                booking_uuid = pk
                
            booking = Booking.objects.get(pk=booking_uuid)
            is_agent = booking.property.owner == request.user
            is_client = booking.user == request.user
            
            if not (is_agent or is_client):
                return Response({'error': 'You don\'t have permission to cancel this booking'}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            if booking.status in ['pending', 'confirmed']:
                old_status = booking.status
                booking.status = 'cancelled'
                booking.cancelled_at = timezone.now()
                booking.cancellation_reason = request.data.get('reason', 'Cancelled by user')
                booking.save()
                
                # Create history entry
                BookingHistory.objects.create(
                    booking=booking,
                    action='cancelled',
                    old_status=old_status,
                    new_status='cancelled',
                    changed_by=request.user,
                    notes=f"Cancelled by {request.user.username}. Reason: {booking.cancellation_reason}"
                )
                
                serializer = BookingSerializer(booking)
                return Response({
                    'message': 'Booking cancelled successfully',
                    'booking': serializer.data
                })
            return Response({
                'error': f'Booking cannot be cancelled. Current status: {booking.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


class CompleteBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            # Handle UUID conversion
            if isinstance(pk, str):
                booking_uuid = uuid.UUID(pk)
            else:
                booking_uuid = pk
                
            booking = Booking.objects.get(pk=booking_uuid, property__owner=request.user)
            
            if booking.status == 'confirmed':
                old_status = booking.status
                booking.status = 'completed'
                booking.completed_at = timezone.now()
                booking.save()
                
                # Create history entry
                BookingHistory.objects.create(
                    booking=booking,
                    action='completed',
                    old_status=old_status,
                    new_status='completed',
                    changed_by=request.user,
                    notes="Booking marked as completed"
                )
                
                serializer = BookingSerializer(booking)
                return Response({
                    'message': 'Booking marked as completed',
                    'booking': serializer.data
                })
            return Response({
                'error': f'Booking cannot be marked as completed. Current status: {booking.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


class UpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def patch(self, request, pk):
        try:
            # Handle UUID conversion
            if isinstance(pk, str):
                booking_uuid = uuid.UUID(pk)
            else:
                booking_uuid = pk
                
            booking = Booking.objects.get(pk=booking_uuid, property__owner=request.user)
            new_status = request.data.get('status')
            reason = request.data.get('reason', '')
            
            valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
            if new_status not in valid_statuses:
                return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            old_status = booking.status
            booking.status = new_status
            
            # Update timestamps based on status
            if new_status == 'confirmed':
                booking.confirmed_at = timezone.now()
            elif new_status == 'cancelled':
                booking.cancelled_at = timezone.now()
                booking.cancellation_reason = reason
            elif new_status == 'completed':
                booking.completed_at = timezone.now()
            
            booking.save()
            
            # Create history entry
            BookingHistory.objects.create(
                booking=booking,
                action='updated',
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=f"Status updated to {new_status}. Reason: {reason}" if reason else f"Status updated to {new_status}"
            )
            
            serializer = BookingSerializer(booking)
            return Response({
                'message': f'Booking status updated to {new_status}',
                'booking': serializer.data
            })
            
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


class AgentUpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            # Handle UUID conversion
            if isinstance(pk, str):
                booking_uuid = uuid.UUID(pk)
            else:
                booking_uuid = pk
                
            booking = Booking.objects.get(pk=booking_uuid, property__owner=request.user)
            new_status = request.data.get('status')
            reason = request.data.get('reason', '')
            
            valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
            if new_status not in valid_statuses:
                return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            old_status = booking.status
            booking.status = new_status
            
            # Update timestamps
            if new_status == 'confirmed':
                booking.confirmed_at = timezone.now()
            elif new_status == 'cancelled':
                booking.cancelled_at = timezone.now()
                booking.cancellation_reason = reason
            elif new_status == 'completed':
                booking.completed_at = timezone.now()
            
            booking.save()
            
            # Create history entry
            BookingHistory.objects.create(
                booking=booking,
                action='updated',
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=f"Status updated by agent to {new_status}. Reason: {reason}" if reason else f"Status updated by agent to {new_status}"
            )
            
            serializer = BookingSerializer(booking)
            return Response({
                'success': True,
                'message': f'Booking {new_status} successfully',
                'booking': serializer.data
            })
            
        except (Booking.DoesNotExist, ValueError):
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
            # Convert UUID to string
            data[i]['id'] = str(booking.id)
            
            # Add property information
            data[i]['property_title'] = booking.property.title
            data[i]['property_address'] = booking.property.address
            data[i]['property_price'] = str(booking.property.price)
            
            # Add property image
            main_image = booking.property.images.filter(is_main=True).first()
            if not main_image:
                main_image = booking.property.images.first()
            data[i]['property_image'] = main_image.image.url if main_image and main_image.image else None
            
            # Add agent information
            data[i]['agent_name'] = booking.property.owner.get_full_name() or booking.property.owner.username
            data[i]['agent_phone'] = getattr(booking.property.owner, 'phone', '')
            data[i]['agent_email'] = booking.property.owner.email
            
            # Add booking details
            data[i]['status_display'] = booking.get_status_display()
            data[i]['can_cancel'] = booking.can_cancel
            data[i]['days_until_visit'] = booking.days_until_visit
            data[i]['visit_date_formatted'] = booking.visit_date.strftime('%B %d, %Y at %I:%M %p')
            
            # Add property location
            data[i]['property_location'] = f"{booking.property.district}, {booking.property.city}"
        
        return Response({
            'count': queryset.count(),
            'results': data
        })


class BookingHistoryView(generics.ListAPIView):
    """Get history of a specific booking"""
    serializer_class = BookingHistorySerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        booking_id = self.kwargs.get('booking_id')
        
        try:
            if isinstance(booking_id, str):
                booking_uuid = uuid.UUID(booking_id)
            else:
                booking_uuid = booking_id
                
            booking = get_object_or_404(Booking, pk=booking_uuid)
            
            # Check permission
            if self.request.user != booking.user and self.request.user != booking.property.owner and not self.request.user.is_staff:
                return BookingHistory.objects.none()
            
            return BookingHistory.objects.filter(booking=booking)
        except (ValueError, TypeError):
            return BookingHistory.objects.none()