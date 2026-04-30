# bookings/urls.py - UPDATED FOR UUID SUPPORT

from django.urls import path
from .views import (
    BookingListCreateView, AgentBookingsView, BookingDetailView, 
    ConfirmBookingView, CancelBookingView, UpdateBookingStatusView, 
    MyBookingsView, CompleteBookingView, AgentUpdateBookingStatusView,
    BookingHistoryView  # Add this if you have it
)

urlpatterns = [
    # Main booking endpoints
    path('', BookingListCreateView.as_view(), name='booking-list'),
    path('my/', MyBookingsView.as_view(), name='my-bookings'),
    path('agent/', AgentBookingsView.as_view(), name='agent-bookings'),
    
    # Booking detail and actions with UUID
    path('<uuid:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<uuid:pk>/confirm/', ConfirmBookingView.as_view(), name='booking-confirm'),
    path('<uuid:pk>/cancel/', CancelBookingView.as_view(), name='booking-cancel'),
    path('<uuid:pk>/complete/', CompleteBookingView.as_view(), name='booking-complete'),
    path('<uuid:pk>/status/', UpdateBookingStatusView.as_view(), name='booking-status'),
    path('<uuid:pk>/agent-status/', AgentUpdateBookingStatusView.as_view(), name='agent-booking-status'),
    
    # Booking history (optional)
    path('<uuid:booking_id>/history/', BookingHistoryView.as_view(), name='booking-history'),
]