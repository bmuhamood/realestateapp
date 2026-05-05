from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Complaint, ComplaintMessage, ComplaintDocument, ComplaintResolution
from .serializers import (
    ComplaintSerializer, ComplaintCreateSerializer, ComplaintUpdateSerializer,
    ComplaintMessageSerializer, ComplaintDocumentSerializer, ComplaintResolutionSerializer
)
from django.contrib.auth import get_user_model
import cloudinary.uploader

User = get_user_model()


class EvidenceUploadView(APIView):
    """Upload evidence files for complaints"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  # Use tuple, not list
    
    def post(self, request, *args, **kwargs):
        # Get file from request
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 10MB)
        if file_obj.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File size exceeds 10MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
        if file_obj.content_type not in allowed_types:
            return Response(
                {'error': f'Invalid file type. Allowed: {", ".join(allowed_types)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file_obj,
                folder='complaints/evidence/',
                resource_type='auto',
                overwrite=True
            )
            
            return Response({
                'success': True,
                'url': upload_result['secure_url'],
                'public_id': upload_result['public_id']
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== COMPLAINT LIST VIEW ==========
class ComplaintListView(generics.ListCreateAPIView):
    """List all complaints (filtered by user role)"""
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'priority']
    search_fields = ['title', 'description', 'complaint_number', 'complainant__username', 'defendant__username']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ComplaintCreateSerializer
        return ComplaintSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin/staff can see all complaints
        if user.is_staff:
            return Complaint.objects.all()
        
        # Regular users see their own complaints and complaints against them
        return Complaint.objects.filter(
            Q(complainant=user) | Q(defendant=user)
        )
    
    def perform_create(self, serializer):
        serializer.save()


# ========== COMPLAINT DETAIL VIEW ==========
class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve, update or delete a complaint"""
    queryset = Complaint.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            # Only admins can update complaint status/details
            if self.request.user.is_staff:
                return ComplaintUpdateSerializer
            return None
        return ComplaintSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Complaint.objects.all()
        return Complaint.objects.filter(Q(complainant=user) | Q(defendant=user))
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can update complaint status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        complaint = self.get_object()
        old_status = complaint.status
        
        serializer = self.get_serializer(complaint, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # If status changed to resolved, set resolved_at
        new_status = serializer.validated_data.get('status', old_status)
        if new_status == 'resolved' and old_status != 'resolved':
            serializer.validated_data['resolved_at'] = timezone.now()
        
        self.perform_update(serializer)
        
        # TODO: Add notification later (Firebase)
        # self._create_notification(complaint, old_status, new_status)
        
        return Response(serializer.data)
    
    def delete(self, request, *args, **kwargs):
        complaint = self.get_object()
        
        # Only complainant or admin can delete
        if not (request.user.is_staff or request.user == complaint.complainant):
            return Response(
                {'error': 'You do not have permission to delete this complaint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only pending complaints can be deleted
        if complaint.status != 'pending' and not request.user.is_staff:
            return Response(
                {'error': 'Only pending complaints can be deleted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        complaint.delete()
        return Response({'message': 'Complaint deleted successfully'}, status=status.HTTP_200_OK)


# ========== USER COMPLAINTS VIEWS ==========
class MyComplaintsView(generics.ListAPIView):
    """Get complaints filed by the authenticated user"""
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Complaint.objects.filter(complainant=self.request.user).order_by('-created_at')


class ComplaintsAgainstMeView(generics.ListAPIView):
    """Get complaints filed against the authenticated user"""
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Complaint.objects.filter(defendant=self.request.user).order_by('-created_at')


# ========== COMPLAINT MESSAGES ==========
class ComplaintMessageView(generics.ListCreateAPIView):
    """Add messages to a complaint thread"""
    serializer_class = ComplaintMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        complaint_id = self.kwargs.get('complaint_id')
        complaint = get_object_or_404(Complaint, id=complaint_id)
        
        # Verify user is part of this complaint
        if not (self.request.user.is_staff or 
                self.request.user == complaint.complainant or 
                self.request.user == complaint.defendant):
            return ComplaintMessage.objects.none()
        
        return ComplaintMessage.objects.filter(complaint=complaint).order_by('created_at')
    
    def perform_create(self, serializer):
        complaint_id = self.kwargs.get('complaint_id')
        complaint = get_object_or_404(Complaint, id=complaint_id)
        
        is_admin = self.request.user.is_staff
        
        serializer.save(
            complaint=complaint,
            sender=self.request.user,
            is_admin_response=is_admin
        )


class ComplaintMessageMarkReadView(APIView):
    """Mark messages as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, complaint_id, message_id):
        message = get_object_or_404(ComplaintMessage, id=message_id, complaint_id=complaint_id)
        
        if not message.is_read and request.user != message.sender:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()
        
        return Response({'status': 'marked as read'})


# ========== COMPLAINT DOCUMENTS ==========
class ComplaintDocumentUploadView(APIView):
    """Upload documents as evidence for a complaint"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        
        # Only complainant and admin can upload documents
        if not (request.user.is_staff or request.user == complaint.complainant):
            return Response(
                {'error': 'You do not have permission to upload documents for this complaint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file = request.FILES.get('file')
        title = request.data.get('title', 'Untitled')
        
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        document = ComplaintDocument.objects.create(
            complaint=complaint,
            uploaded_by=request.user,
            title=title,
            file=file,
            file_name=file.name,
            file_size=file.size
        )
        
        # Also add to evidence JSON field in Complaint
        if not complaint.evidence:
            complaint.evidence = []
        complaint.evidence.append({
            'document_id': str(document.id),
            'title': title,
            'url': document.file.url if document.file else None,
            'uploaded_at': str(timezone.now())
        })
        complaint.save()
        
        serializer = ComplaintDocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ========== COMPLAINT RESOLUTION ==========
class AddResolutionView(APIView):
    """Add resolution action to a complaint (admin only)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, complaint_id):
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can add resolutions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        complaint = get_object_or_404(Complaint, id=complaint_id)
        
        serializer = ComplaintResolutionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        resolution = serializer.save(
            complaint=complaint,
            action_by=request.user
        )
        
        return Response(
            ComplaintResolutionSerializer(resolution).data,
            status=status.HTTP_201_CREATED
        )


# ========== COMPLAINT STATISTICS ==========
class ComplaintStatsView(APIView):
    """Get statistics about complaints (admin dashboard)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can view stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total = Complaint.objects.count()
        pending = Complaint.objects.filter(status='pending').count()
        investigating = Complaint.objects.filter(status='investigating').count()
        resolved = Complaint.objects.filter(status='resolved').count()
        dismissed = Complaint.objects.filter(status='dismissed').count()
        
        # By category
        categories = {}
        for cat, label in Complaint.CATEGORY_CHOICES:
            categories[label] = Complaint.objects.filter(category=cat).count()
        
        # By priority
        priorities = {}
        for prio, label in Complaint.PRIORITY_CHOICES:
            priorities[label] = Complaint.objects.filter(priority=prio).count()
        
        # Recent complaints (last 30 days)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        recent = Complaint.objects.filter(created_at__gte=thirty_days_ago).count()
        
        return Response({
            'total': total,
            'pending': pending,
            'investigating': investigating,
            'resolved': resolved,
            'dismissed': dismissed,
            'by_category': categories,
            'by_priority': priorities,
            'recent_30_days': recent,
        })