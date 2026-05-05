from django.db import models
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import (
    DealRoom, DealMessage, DealDocument, DealMilestone, 
    DealOffer, DealActivityLog
)
from .serializers import (
    DealRoomSerializer, DealRoomCreateSerializer, DealUpdateSerializer,
    DealMessageSerializer, DealMessageCreateSerializer,
    DealDocumentSerializer, DealDocumentCreateSerializer,
    DealMilestoneSerializer, DealOfferSerializer, DealOfferCreateSerializer,
    DealOfferResponseSerializer, DealSignatureSerializer, DealActivityLogSerializer
)
from properties.models import Property


class DealRoomListView(generics.ListCreateAPIView):
    """List all deal rooms for the authenticated user"""
    serializer_class = DealRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    # ✅ FIXED: Use property_obj__title
    search_fields = ['deal_number', 'property_obj__title', 'buyer__username', 'seller__username']
    ordering_fields = ['created_at', 'updated_at', 'closing_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DealRoomCreateSerializer
        return DealRoomSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return DealRoom.objects.all()
        return DealRoom.objects.filter(
            Q(buyer=user) | Q(seller=user) | Q(agent=user)
        ).distinct()
    
    def perform_create(self, serializer):
        deal = serializer.save()
        self._log_activity(deal, self.request.user, 'deal_created', 'Deal room created')
    
    def _log_activity(self, deal, user, activity_type, description):
        DealActivityLog.objects.create(
            deal_room=deal,
            user=user,
            activity_type=activity_type,
            description=description,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )


class DealRoomDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve, update or delete a deal room"""
    queryset = DealRoom.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DealUpdateSerializer
        return DealRoomSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return DealRoom.objects.all()
        return DealRoom.objects.filter(
            Q(buyer=user) | Q(seller=user) | Q(agent=user)
        ).distinct()
    
    def update(self, request, *args, **kwargs):
        deal = self.get_object()
        old_status = deal.status
        
        response = super().update(request, *args, **kwargs)
        
        if old_status != deal.status:
            self._log_activity(deal, request.user, 'status_change', 
                               f"Status changed from {old_status} to {deal.status}")
        
        if 'agreed_price' in request.data and request.data['agreed_price'] != str(deal.agreed_price):
            self._log_activity(deal, request.user, 'price_updated',
                               f"Price updated to UGX {deal.agreed_price:,.0f}")
        
        return response
    
    def _log_activity(self, deal, user, activity_type, description):
        DealActivityLog.objects.create(
            deal_room=deal,
            user=user,
            activity_type=activity_type,
            description=description,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )


class DealRoomMessagesView(generics.ListCreateAPIView):
    """Get messages for a deal room or send new message"""
    serializer_class = DealMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DealMessageCreateSerializer
        return DealMessageSerializer
    
    def get_queryset(self):
        deal_id = self.kwargs.get('deal_id')
        return DealMessage.objects.filter(deal_room_id=deal_id).order_by('created_at')
    
    def perform_create(self, serializer):
        deal_id = self.kwargs.get('deal_id')
        deal = get_object_or_404(DealRoom, id=deal_id)
        
        if not self._can_access_deal(deal, self.request.user):
            raise PermissionError("You don't have access to this deal room")
        
        message = serializer.save(
            deal_room=deal,
            sender=self.request.user
        )
        
        DealActivityLog.objects.create(
            deal_room=deal,
            user=self.request.user,
            activity_type='message_sent',
            description=f"Message sent: {message.content[:100]}",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def _can_access_deal(self, deal, user):
        return user.is_staff or user in [deal.buyer, deal.seller, deal.agent]


class DealRoomDocumentsView(generics.ListCreateAPIView):
    """List and upload documents for a deal room"""
    serializer_class = DealDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        deal_id = self.kwargs.get('deal_id')
        user = self.request.user
        queryset = DealDocument.objects.filter(deal_room_id=deal_id)
        
        if not user.is_staff:
            queryset = queryset.filter(
                Q(is_confidential=False) | 
                Q(uploaded_by=user) |
                Q(deal_room__buyer=user) |
                Q(deal_room__seller=user)
            )
        
        return queryset.order_by('-uploaded_at')
    
    def perform_create(self, serializer):
        deal_id = self.kwargs.get('deal_id')
        deal = get_object_or_404(DealRoom, id=deal_id)
        
        if not self._can_access_deal(deal, self.request.user):
            raise PermissionError("You don't have access to this deal room")
        
        file = self.request.FILES.get('file')
        document = serializer.save(
            deal_room=deal,
            uploaded_by=self.request.user,
            file_name=file.name if file else '',
            file_size=file.size if file else 0
        )
        
        DealActivityLog.objects.create(
            deal_room=deal,
            user=self.request.user,
            activity_type='document_upload',
            description=f"Document uploaded: {document.title}",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def _can_access_deal(self, deal, user):
        return user.is_staff or user in [deal.buyer, deal.seller, deal.agent]


class SignDocumentView(APIView):
    """Sign a document in the deal room"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, deal_id, document_id):
        deal = get_object_or_404(DealRoom, id=deal_id)
        document = get_object_or_404(DealDocument, id=document_id, deal_room=deal)
        
        if not self._can_access_deal(deal, request.user):
            return Response({'error': 'You do not have access to this deal'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        if request.user == deal.buyer:
            document.signed_by_buyer = True
        elif request.user == deal.seller:
            document.signed_by_seller = True
        elif request.user == deal.agent:
            document.signed_by_agent = True
        else:
            return Response({'error': 'You are not authorized to sign this document'},
                           status=status.HTTP_403_FORBIDDEN)
        
        document.save()
        
        if document.all_signatures_complete:
            document.signed_at = timezone.now()
            document.save()
            
            DealActivityLog.objects.create(
                deal_room=deal,
                user=request.user,
                activity_type='document_signed',
                description=f"Document fully signed: {document.title}",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        else:
            DealActivityLog.objects.create(
                deal_room=deal,
                user=request.user,
                activity_type='document_signed',
                description=f"Document signed by {request.user.username}: {document.title}",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        
        return Response(DealDocumentSerializer(document, context={'request': request}).data)
    
    def _can_access_deal(self, deal, user):
        return user.is_staff or user in [deal.buyer, deal.seller, deal.agent]


class DealRoomOffersView(generics.ListCreateAPIView):
    """List and create offers for a deal room"""
    serializer_class = DealOfferSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        deal_id = self.kwargs.get('deal_id')
        return DealOffer.objects.filter(deal_room_id=deal_id).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DealOfferCreateSerializer
        return DealOfferSerializer
    
    def perform_create(self, serializer):
        deal_id = self.kwargs.get('deal_id')
        deal = get_object_or_404(DealRoom, id=deal_id)
        
        offer = serializer.save(
            deal_room=deal,
            made_by=self.request.user
        )
        
        DealActivityLog.objects.create(
            deal_room=deal,
            user=self.request.user,
            activity_type='offer_made',
            description=f"Offer of UGX {offer.amount:,.0f} made",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )

class RespondToOfferView(APIView):
    """Accept, reject, or counter an offer"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, deal_id):
        serializer = DealOfferResponseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        offer_id = serializer.validated_data['offer_id']
        action = serializer.validated_data['action']
        
        offer = get_object_or_404(DealOffer, id=offer_id, deal_room_id=deal_id)
        deal = offer.deal_room
        
        recipient = deal.seller if offer.made_by == deal.buyer else deal.buyer
        if request.user != recipient and not request.user.is_staff:
            return Response({'error': 'You are not authorized to respond to this offer'},
                           status=status.HTTP_403_FORBIDDEN)
        
        if action == 'accept':
            offer.status = 'accepted'
            offer.responded_at = timezone.now()
            offer.save()
            
            # ✅ Update deal with accepted offer amount
            deal.agreed_price = offer.amount
            deal.save()
            
            DealActivityLog.objects.create(
                deal_room=deal,
                user=request.user,
                activity_type='offer_accepted',
                description=f"Offer of UGX {offer.amount:,.0f} accepted",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
        elif action == 'reject':
            offer.status = 'rejected'
            offer.responded_at = timezone.now()
            offer.save()
            
            DealActivityLog.objects.create(
                deal_room=deal,
                user=request.user,
                activity_type='offer_rejected',
                description=f"Offer of UGX {offer.amount:,.0f} rejected",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
        elif action == 'counter':
            counter_amount = serializer.validated_data.get('counter_amount')
            counter_terms = serializer.validated_data.get('counter_terms', '')
            
            offer.status = 'countered'
            offer.save()
            
            # Create counter offer
            DealOffer.objects.create(
                deal_room=deal,
                made_by=request.user,
                amount=counter_amount or offer.amount,
                terms=counter_terms,
                status='pending'
            )
            
            DealActivityLog.objects.create(
                deal_room=deal,
                user=request.user,
                activity_type='offer_countered',
                description=f"Counter offer of UGX {counter_amount:,.0f} made",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        
        return Response({'message': f'Offer {action}ed successfully'})


class DealRoomMilestonesView(generics.ListCreateAPIView):
    """List and manage milestones for a deal room"""
    serializer_class = DealMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        deal_id = self.kwargs.get('deal_id')
        return DealMilestone.objects.filter(deal_room_id=deal_id).order_by('order')
    
    def perform_create(self, serializer):
        deal_id = self.kwargs.get('deal_id')
        deal = get_object_or_404(DealRoom, id=deal_id)
        serializer.save(deal_room=deal)


class CompleteMilestoneView(APIView):
    """Mark a milestone as completed"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, deal_id, milestone_id):
        milestone = get_object_or_404(DealMilestone, id=milestone_id, deal_room_id=deal_id)
        
        if not milestone.is_completed:
            milestone.is_completed = True
            milestone.completed_date = timezone.now()
            milestone.completed_by = request.user
            milestone.save()
            
            DealActivityLog.objects.create(
                deal_room=milestone.deal_room,
                user=request.user,
                activity_type='milestone_completed',
                description=f"Milestone completed: {milestone.title}",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        
        return Response(DealMilestoneSerializer(milestone).data)


class DealRoomActivityLogView(generics.ListAPIView):
    """Get activity log for a deal room"""
    serializer_class = DealActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        deal_id = self.kwargs.get('deal_id')
        return DealActivityLog.objects.filter(deal_room_id=deal_id).order_by('-created_at')


class MarkMessagesReadView(APIView):
    """Mark all messages in deal room as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, deal_id):
        deal = get_object_or_404(DealRoom, id=deal_id)
        
        if not (request.user.is_staff or request.user in [deal.buyer, deal.seller, deal.agent]):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        DealMessage.objects.filter(
            deal_room=deal
        ).exclude(
            sender=request.user
        ).update(is_read=True)
        
        return Response({'message': 'Messages marked as read'})


class DealRoomStatsView(APIView):
    """Get statistics for deal rooms (admin only)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncMonth
        
        total = DealRoom.objects.count()
        active = DealRoom.objects.exclude(status__in=['completed', 'cancelled']).count()
        completed = DealRoom.objects.filter(status='completed').count()
        cancelled = DealRoom.objects.filter(status='cancelled').count()
        disputed = DealRoom.objects.filter(status='disputed').count()
        
        total_value = DealRoom.objects.filter(
            agreed_price__isnull=False, 
            status='completed'
        ).aggregate(total=Sum('agreed_price'))['total'] or 0
        
        monthly = DealRoom.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=365)
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id'),
            value=Sum('agreed_price')
        ).order_by('-month')
        
        return Response({
            'total': total,
            'active': active,
            'completed': completed,
            'cancelled': cancelled,
            'disputed': disputed,
            'total_value': float(total_value),
            'monthly_breakdown': list(monthly)
        })