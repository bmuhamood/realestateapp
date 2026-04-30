# services/urls.py - WITH UUID SUPPORT

from django.urls import path
from .views import (
    ServiceCategoryListView, ServiceListView, ServiceDetailView,
    ServiceBookingView, ServiceBookingDetailView, ServiceReviewView,
    AgentServiceBookingsView, UpdateBookingStatusView
)

urlpatterns = [
    path('categories/', ServiceCategoryListView.as_view(), name='service-categories'),
    path('', ServiceListView.as_view(), name='service-list'),
    path('<uuid:pk>/', ServiceDetailView.as_view(), name='service-detail'),
    path('bookings/', ServiceBookingView.as_view(), name='service-bookings'),
    path('bookings/<uuid:pk>/', ServiceBookingDetailView.as_view(), name='service-booking-detail'),
    path('bookings/<uuid:pk>/status/', UpdateBookingStatusView.as_view(), name='update-booking-status'),
    path('reviews/', ServiceReviewView.as_view(), name='service-reviews'),
    path('agent/bookings/', AgentServiceBookingsView.as_view(), name='agent-service-bookings'),
]