# payments/urls.py - WITH UUID SUPPORT

from django.urls import path
from .views import (
    PaymentListView, InitiatePaymentView, VerifyPaymentView, 
    PaymentWebhookView, BoostPackageListView, InitiateBoostPaymentView,
    VerifyBoostPaymentView, PaymentHistoryView
)

urlpatterns = [
    # Payment endpoints
    path('', PaymentListView.as_view(), name='payment-list'),
    path('history/', PaymentHistoryView.as_view(), name='payment-history'),
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    
    # Boost package endpoints
    path('boost-packages/', BoostPackageListView.as_view(), name='boost-packages'),
    path('property/<uuid:property_id>/initiate-boost/', InitiateBoostPaymentView.as_view(), name='initiate-boost'),
    path('verify-boost/', VerifyBoostPaymentView.as_view(), name='verify-boost'),
]