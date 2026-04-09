from django.urls import path
from .views import PaymentListView, InitiatePaymentView, VerifyPaymentView, PaymentWebhookView

urlpatterns = [
    path('', PaymentListView.as_view(), name='payment-list'),
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
]