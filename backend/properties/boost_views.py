from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from .models import Property
from payments.models import BoostPackage, Payment
from payments.serializers import BoostPackageSerializer
from properties.serializers import PropertySerializer
import uuid

class BoostPackageListView(generics.ListAPIView):
    """List available boost packages"""
    queryset = BoostPackage.objects.filter(is_active=True)
    serializer_class = BoostPackageSerializer
    permission_classes = (permissions.AllowAny,)

class InitiateBoostPaymentView(APIView):
    """Initiate payment for boosting a property"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, property_id):
        try:
            property_obj = Property.objects.get(id=property_id, owner=request.user)
            
            # Check if property already has active boost
            if property_obj.is_boosted and property_obj.boosted_until and property_obj.boosted_until > timezone.now():
                return Response({
                    'error': 'Property already has an active boost',
                    'days_left': (property_obj.boosted_until - timezone.now()).days
                }, status=status.HTTP_400_BAD_REQUEST)
            
            package_id = request.data.get('package_id')
            payment_method = request.data.get('payment_method', 'mtn')
            
            try:
                package = BoostPackage.objects.get(id=package_id, is_active=True)
            except BoostPackage.DoesNotExist:
                return Response({'error': 'Invalid package selected'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create payment record
            reference = f"BOOST-{uuid.uuid4().hex[:8].upper()}"
            
            payment = Payment.objects.create(
                user=request.user,
                property=property_obj,
                amount=package.price,
                payment_method=payment_method,
                reference=reference,
                status='pending',
                metadata={
                    'type': 'boost',
                    'package_id': package.id,
                    'package_name': package.name,
                    'duration_days': package.duration_days,
                    'property_id': property_obj.id,
                    'property_title': property_obj.title
                }
            )
            
            return Response({
                'success': True,
                'payment_id': payment.id,
                'reference': reference,
                'amount': float(package.price),
                'package': {
                    'id': package.id,
                    'name': package.name,
                    'duration_days': package.duration_days,
                    'price': float(package.price)
                },
                'payment_method': payment_method,
                'message': f'Payment initiated. Please complete payment of UGX {package.price:,.0f} to boost your property.'
            })
            
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

class VerifyBoostPaymentView(APIView):
    """Verify payment and activate boost"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        reference = request.data.get('reference')
        
        try:
            payment = Payment.objects.get(reference=reference, user=request.user)
            
            if payment.status == 'completed':
                # Payment already verified
                property_obj = payment.property
                
                # Get package details from metadata
                package_duration = payment.metadata.get('duration_days', 7)
                
                # Activate boost
                property_obj.is_boosted = True
                property_obj.boosted_until = timezone.now() + timedelta(days=package_duration)
                property_obj.boost_price_paid = payment.amount
                property_obj.boost_payment_ref = reference
                property_obj.save()
                
                return Response({
                    'success': True,
                    'message': f'Property boosted successfully for {package_duration} days!',
                    'property_id': property_obj.id,
                    'boosted_until': property_obj.boosted_until
                })
            
            elif payment.status == 'pending':
                # For demo, we'll mark as completed
                # In production, you would verify with payment gateway here
                payment.status = 'completed'
                payment.save()
                
                property_obj = payment.property
                package_duration = payment.metadata.get('duration_days', 7)
                
                property_obj.is_boosted = True
                property_obj.boosted_until = timezone.now() + timedelta(days=package_duration)
                property_obj.boost_price_paid = payment.amount
                property_obj.boost_payment_ref = reference
                property_obj.save()
                
                return Response({
                    'success': True,
                    'message': f'Payment verified! Property boosted for {package_duration} days.',
                    'property_id': property_obj.id,
                    'boosted_until': property_obj.boosted_until
                })
            else:
                return Response({
                    'error': f'Payment status is {payment.status}. Please try again.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

class BoostedPropertiesView(generics.ListAPIView):
    """Get all boosted properties (for homepage/featured section)"""
    serializer_class = PropertySerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        return Property.objects.filter(
            is_available=True,
            is_boosted=True,
            boosted_until__gt=timezone.now()
        ).order_by('-boost_level', '-created_at')[:10]

class MyBoostedPropertiesView(generics.ListAPIView):
    """Get agent's boosted properties"""
    serializer_class = PropertySerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Property.objects.filter(
            owner=self.request.user,
            is_boosted=True,
            boosted_until__gt=timezone.now()
        ).order_by('-boosted_until')