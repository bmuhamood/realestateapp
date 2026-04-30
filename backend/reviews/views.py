# reviews/views.py - WITH UUID SUPPORT

from rest_framework import generics, permissions
from .models import Review
from .serializers import ReviewSerializer
import uuid


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    
    def get_queryset(self):
        queryset = Review.objects.all()
        agent_id = self.request.query_params.get('agent')
        
        if agent_id:
            try:
                # Validate UUID format
                uuid.UUID(str(agent_id))
                queryset = queryset.filter(agent_id=agent_id)
            except ValueError:
                # Return empty queryset if invalid UUID
                return Review.objects.none()
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    lookup_field = 'pk'  # This automatically handles UUID
    
    def perform_update(self, serializer):
        if self.request.user == serializer.instance.user:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own reviews")
    
    def perform_destroy(self, instance):
        if self.request.user == instance.user:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own reviews")