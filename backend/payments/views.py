from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Payment
from .serializers import PaymentSerializer, InitiatePaymentSerializer, VerifyPaymentSerializer
from properties.models import Property
from bookings.models import Booking
import requests
import uuid

class PaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

class InitiatePaymentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Get property
            property_obj = get_object_or_404(Property, id=data['property_id'])
            
            # Create payment record
            payment = Payment.objects.create(
                user=request.user,
                property=property_obj,
                amount=data['amount'],
                payment_method=data['payment_method'],
                phone_number=data.get('phone_number', ''),
                reference=str(uuid.uuid4())[:8].upper()
            )
            
            # Here you would integrate with Flutterwave or other payment gateway
            # For now, we'll return a mock response
            return Response({
                'payment_id': payment.id,
                'reference': payment.reference,
                'amount': payment.amount,
                'payment_method': payment.payment_method,
                'status': payment.status,
                'message': 'Payment initiated. Please complete payment on your phone.'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyPaymentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        if serializer.is_valid():
            reference = serializer.validated_data['reference']
            
            try:
                payment = Payment.objects.get(reference=reference, user=request.user)
                
                # Here you would verify with the payment gateway
                # For demo, we'll mark as completed
                payment.status = 'completed'
                payment.save()
                
                # Create booking if payment is for booking fee
                if payment.booking:
                    payment.booking.status = 'confirmed'
                    payment.booking.save()
                
                return Response({
                    'status': 'completed',
                    'message': 'Payment verified successfully'
                })
                
            except Payment.DoesNotExist:
                return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PaymentWebhookView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        # Handle webhook from payment gateway
        data = request.data
        reference = data.get('reference')
        status = data.get('status')
        
        try:
            payment = Payment.objects.get(reference=reference)
            if status == 'successful':
                payment.status = 'completed'
                if payment.booking:
                    payment.booking.status = 'confirmed'
                    payment.booking.save()
            elif status == 'failed':
                payment.status = 'failed'
            
            payment.save()
            
            return Response({'status': 'ok'})
            
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)