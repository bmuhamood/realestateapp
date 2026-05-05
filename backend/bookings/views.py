# bookings/views.py - FIXED VERSION

from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Booking, BookingHistory
from .serializers import BookingSerializer, BookingHistorySerializer, BookingStatusSerializer
import uuid
from properties.models import Property


# ─── helpers ──────────────────────────────────────────────────────────────────

def _parse_uuid(pk):
    """Return a UUID object from a string or UUID; raise ValueError if invalid."""
    return uuid.UUID(str(pk)) if not isinstance(pk, uuid.UUID) else pk


# ─── Create ───────────────────────────────────────────────────────────────────

class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        property_id = self.request.data.get('property')
        try:
            property_uuid = uuid.UUID(property_id)
            property_obj = Property.objects.get(id=property_uuid)
        except (ValueError, TypeError, Property.DoesNotExist):
            raise serializers.ValidationError({"property": "Invalid property ID"})

        serializer.save(
            user=self.request.user,
            property_obj=property_obj,
            booking_fee=10000,
            status='pending',
        )


# ─── List / Create (user's own bookings) ──────────────────────────────────────

class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return (
            Booking.objects
            .filter(user=self.request.user)
            .select_related('user', 'property_obj', 'property_obj__owner')
            .prefetch_related('property_obj__images')
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        BookingHistory.objects.create(
            booking=booking,
            action='created',
            changed_by=self.request.user,
            notes=f"Booking created for property: {booking.property_obj.title}",
        )

    def create(self, request, *args, **kwargs):
        property_id = request.data.get('property')
        if property_id:
            try:
                property_uuid = uuid.UUID(property_id)
                if Booking.objects.filter(
                    user=request.user,
                    property_obj_id=property_uuid,
                    status__in=['pending', 'confirmed'],
                ).exists():
                    return Response(
                        {'error': 'You already have a pending or confirmed booking for this property'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except (ValueError, TypeError):
                pass

        return super().create(request, *args, **kwargs)


# ─── Agent: list all bookings for their properties ────────────────────────────

class AgentBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return (
            Booking.objects
            .filter(property_obj__owner=self.request.user)
            .select_related('user', 'property_obj', 'property_obj__owner')
            .prefetch_related('property_obj__images')
            .order_by('-created_at')
        )

    # FIX 4: Pass request context to the serializer so nested serializers
    # (PropertySerializer, UserSerializer) can build Cloudinary URLs correctly.
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data,
        })


# ─── User: my bookings ────────────────────────────────────────────────────────

class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return (
            Booking.objects
            .filter(user=self.request.user)
            .select_related('user', 'property_obj', 'property_obj__owner')
            .prefetch_related('property_obj__images')
            .order_by('-created_at')
        )

    # FIX 4 (same): get_serializer automatically passes the request context
    # when called from a ListAPIView — no need to override list() at all.
    # But we keep it explicit so the response shape is guaranteed.
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data,
        })


# ─── Detail (retrieve / update / destroy) ────────────────────────────────────

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Booking.objects.filter(
            Q(user=self.request.user) | Q(property_obj__owner=self.request.user)
        ).select_related('user', 'property_obj', 'property_obj__owner').prefetch_related('property_obj__images')

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        is_agent = instance.property_obj.owner == request.user
        new_status = request.data.get('status')

        if new_status:
            if not is_agent:
                return Response(
                    {'error': 'Only the property owner can update booking status'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Invalid status. Must be one of: {valid_statuses}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            old_status = instance.status
            instance.status = new_status
            instance.save()

            BookingHistory.objects.create(
                booking=instance,
                action='updated',
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=f"Status changed from {old_status} to {new_status}",
            )

            serializer = self.get_serializer(instance)
            return Response({
                'message': f'Booking {new_status} successfully',
                'booking': serializer.data,
            })

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.status in ['confirmed', 'completed']:
            return Response(
                {'error': f'Cannot delete a {instance.status} booking. Please cancel it first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        BookingHistory.objects.create(
            booking=instance,
            action='cancelled',
            changed_by=request.user,
            notes=f"Booking deleted by {request.user.username}",
        )
        return super().destroy(request, *args, **kwargs)


# ─── Confirm ──────────────────────────────────────────────────────────────────

class ConfirmBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(
                pk=_parse_uuid(pk),
                property_obj__owner=request.user,
            )
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status != 'pending':
            return Response(
                {'error': f'Booking cannot be confirmed. Current status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = booking.status
        booking.status = 'confirmed'
        booking.confirmed_at = timezone.now()
        booking.save()

        BookingHistory.objects.create(
            booking=booking,
            action='confirmed',
            old_status=old_status,
            new_status='confirmed',
            changed_by=request.user,
            notes="Booking confirmed by agent",
        )

        return Response({
            'message': 'Booking confirmed successfully',
            'booking': BookingSerializer(booking, context={'request': request}).data,
        })


# ─── Cancel ───────────────────────────────────────────────────────────────────

class CancelBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=_parse_uuid(pk))
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        # FIX 5: Compare PKs (integers) not model instances to avoid type mismatch
        is_agent = booking.property_obj.owner_id == request.user.pk
        is_client = booking.user_id == request.user.pk

        if not (is_agent or is_client):
            return Response(
                {'error': "You don't have permission to cancel this booking"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status not in ['pending', 'confirmed']:
            return Response(
                {'error': f'Booking cannot be cancelled. Current status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = booking.status
        booking.status = 'cancelled'
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = request.data.get('reason', 'Cancelled by user')
        booking.save()

        BookingHistory.objects.create(
            booking=booking,
            action='cancelled',
            old_status=old_status,
            new_status='cancelled',
            changed_by=request.user,
            notes=f"Cancelled by {request.user.username}. Reason: {booking.cancellation_reason}",
        )

        return Response({
            'message': 'Booking cancelled successfully',
            'booking': BookingSerializer(booking, context={'request': request}).data,
        })


# ─── Complete ─────────────────────────────────────────────────────────────────

class CompleteBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(
                pk=_parse_uuid(pk),
                property_obj__owner=request.user,
            )
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status != 'confirmed':
            return Response(
                {'error': f'Booking cannot be completed. Current status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = booking.status
        booking.status = 'completed'
        booking.completed_at = timezone.now()
        booking.save()

        BookingHistory.objects.create(
            booking=booking,
            action='completed',
            old_status=old_status,
            new_status='completed',
            changed_by=request.user,
            notes="Booking marked as completed",
        )

        return Response({
            'message': 'Booking marked as completed',
            'booking': BookingSerializer(booking, context={'request': request}).data,
        })


# ─── Update status (PATCH) ────────────────────────────────────────────────────

class UpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(
                pk=_parse_uuid(pk),
                property_obj__owner=request.user,
            )
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        return _apply_status_change(booking, request)


# ─── Agent status update (POST) ───────────────────────────────────────────────

class AgentUpdateBookingStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(
                pk=_parse_uuid(pk),
                property_obj__owner=request.user,
            )
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        result = _apply_status_change(booking, request)
        if result.status_code == 200:
            return Response({
                'success': True,
                'message': result.data.get('message', 'Status updated'),
                'booking': result.data.get('booking'),
            })
        return result


# ─── Shared status-change helper ──────────────────────────────────────────────

def _apply_status_change(booking, request):
    new_status = request.data.get('status')
    reason = request.data.get('reason', '')

    valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if new_status not in valid_statuses:
        return Response(
            {'error': f'Invalid status. Must be one of: {valid_statuses}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    old_status = booking.status
    booking.status = new_status

    if new_status == 'confirmed':
        booking.confirmed_at = timezone.now()
    elif new_status == 'cancelled':
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = reason
    elif new_status == 'completed':
        booking.completed_at = timezone.now()

    booking.save()

    BookingHistory.objects.create(
        booking=booking,
        action='updated',
        old_status=old_status,
        new_status=new_status,
        changed_by=request.user,
        notes=(
            f"Status updated to {new_status}. Reason: {reason}"
            if reason else f"Status updated to {new_status}"
        ),
    )

    return Response({
        'message': f'Booking status updated to {new_status}',
        'booking': BookingSerializer(booking, context={'request': request}).data,
    })


# ─── Booking History ──────────────────────────────────────────────────────────

class BookingHistoryView(generics.ListAPIView):
    serializer_class = BookingHistorySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        booking_id = self.kwargs.get('booking_id')
        try:
            booking_uuid = _parse_uuid(booking_id)
        except (ValueError, TypeError, AttributeError):
            return BookingHistory.objects.none()

        # FIX 6: Use _id suffix (PK comparison) to avoid model-instance
        # type mismatch. Also handle staff users.
        try:
            booking = Booking.objects.select_related(
                'user', 'property_obj', 'property_obj__owner'
            ).get(pk=booking_uuid)
        except Booking.DoesNotExist:
            return BookingHistory.objects.none()

        user = self.request.user
        is_owner = booking.user_id == user.pk
        is_agent = booking.property_obj.owner_id == user.pk
        is_staff = user.is_staff

        if not (is_owner or is_agent or is_staff):
            return BookingHistory.objects.none()

        return (
            BookingHistory.objects
            .filter(booking=booking)
            .select_related('changed_by')
            .order_by('created_at')
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data,
        })