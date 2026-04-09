from django.urls import path
from .views import (
    BookingListCreateView, AgentBookingsView, BookingDetailView, 
    ConfirmBookingView, CancelBookingView, UpdateBookingStatusView, 
    MyBookingsView, CompleteBookingView, AgentUpdateBookingStatusView
)

urlpatterns = [
    path('', BookingListCreateView.as_view(), name='booking-list'),
    path('agent/', AgentBookingsView.as_view(), name='agent-bookings'),
    path('my/', MyBookingsView.as_view(), name='my-bookings'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<int:pk>/confirm/', ConfirmBookingView.as_view(), name='booking-confirm'),
    path('<int:pk>/cancel/', CancelBookingView.as_view(), name='booking-cancel'),
    path('<int:pk>/complete/', CompleteBookingView.as_view(), name='booking-complete'),
    path('<int:pk>/status/', UpdateBookingStatusView.as_view(), name='booking-status'),
    path('<int:pk>/agent-status/', AgentUpdateBookingStatusView.as_view(), name='agent-booking-status'),
]