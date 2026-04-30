# payments/views.py - WITH UUID SUPPORT

from datetime import timedelta, timezone

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Payment, BoostPackage
from .serializers import PaymentSerializer, InitiatePaymentSerializer, VerifyPaymentSerializer, BoostPackageSerializer
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
            
            # Convert property_id string to UUID
            try:
                property_uuid = uuid.UUID(data['property_id'])
            except ValueError:
                return Response({'error': 'Invalid property ID format'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get property
            property_obj = get_object_or_404(Property, id=property_uuid)
            
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
                'payment_id': str(payment.id),  # Convert UUID to string
                'reference': payment.reference,
                'amount': str(payment.amount),  # Convert Decimal to string
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
                    'payment_id': str(payment.id),  # Convert UUID to string
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
        status_val = data.get('status')
        
        try:
            payment = Payment.objects.get(reference=reference)
            if status_val == 'successful':
                payment.status = 'completed'
                if payment.booking:
                    payment.booking.status = 'confirmed'
                    payment.booking.save()
            elif status_val == 'failed':
                payment.status = 'failed'
            elif status_val == 'refunded':
                payment.status = 'refunded'
            
            payment.save()
            
            return Response({'status': 'ok'})
            
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


class BoostPackageListView(generics.ListAPIView):
    """List all available boost packages"""
    queryset = BoostPackage.objects.filter(is_active=True)
    serializer_class = BoostPackageSerializer
    permission_classes = (permissions.AllowAny,)


class InitiateBoostPaymentView(APIView):
    """Initiate payment for property boost"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, property_id):
        try:
            # Validate property_id UUID
            property_uuid = uuid.UUID(property_id)
            
            # Get property
            property_obj = get_object_or_404(Property, id=property_uuid, owner=request.user)
            
            # Get package
            package_id = request.data.get('package_id')
            package = get_object_or_404(BoostPackage, id=package_id, is_active=True)
            
            # Create payment record for boost
            payment = Payment.objects.create(
                user=request.user,
                property=property_obj,
                amount=package.price,
                payment_method=request.data.get('payment_method', 'card'),
                reference=str(uuid.uuid4())[:8].upper(),
                metadata={
                    'type': 'boost',
                    'package_id': package.id,
                    'package_name': package.name,
                    'duration_days': package.duration_days
                }
            )
            
            return Response({
                'payment_id': str(payment.id),
                'reference': payment.reference,
                'amount': float(payment.amount),
                'message': 'Boost payment initiated',
                'package': BoostPackageSerializer(package).data
            }, status=status.HTTP_201_CREATED)
            
        except ValueError:
            return Response({'error': 'Invalid property ID format'}, status=status.HTTP_400_BAD_REQUEST)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
        except BoostPackage.DoesNotExist:
            return Response({'error': 'Boost package not found'}, status=status.HTTP_404_NOT_FOUND)


class VerifyBoostPaymentView(APIView):
    """Verify boost payment and activate boost"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        reference = request.data.get('reference')
        
        try:
            payment = Payment.objects.get(reference=reference, user=request.user)
            
            if payment.metadata.get('type') == 'boost' and payment.status == 'pending':
                # Verify with payment gateway here (mock for demo)
                payment.status = 'completed'
                payment.save()
                
                # Activate boost on property
                property_obj = payment.property
                property_obj.is_boosted = True
                property_obj.boosted_until = timezone.now() + timedelta(days=payment.metadata.get('duration_days', 7))
                property_obj.save()
                
                return Response({
                    'success': True,
                    'message': 'Property boosted successfully',
                    'boosted_until': property_obj.boosted_until
                })
            
            return Response({
                'success': False,
                'message': f'Payment cannot be verified. Status: {payment.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


class PaymentHistoryView(generics.ListAPIView):
    """Get user's payment history"""
    serializer_class = PaymentSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')