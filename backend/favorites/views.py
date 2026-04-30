# favorites/views.py - WITH UUID SUPPORT

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Favorite
from .serializers import FavoriteSerializer
from properties.models import Property
import uuid


class FavoriteListView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to handle UUID validation"""
        property_id = request.data.get('property')
        
        if property_id:
            try:
                # Validate UUID format
                uuid.UUID(str(property_id))
            except ValueError:
                return Response(
                    {'error': 'Invalid property ID format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs)


class FavoriteDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def delete(self, request, property_id):
        try:
            # Validate UUID format
            uuid.UUID(str(property_id))
            
            favorite = Favorite.objects.get(user=request.user, property_id=property_id)
            favorite.delete()
            return Response({'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
        except (Favorite.DoesNotExist, ValueError):
            return Response({'error': 'Property not in favorites'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, property_id):
        try:
            # Validate UUID format
            uuid.UUID(str(property_id))
            
            property_obj = Property.objects.get(id=property_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                property=property_obj
            )
            if created:
                return Response({'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)
            return Response({'message': 'Already in favorites'}, status=status.HTTP_200_OK)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({'error': 'Invalid property ID format'}, status=status.HTTP_400_BAD_REQUEST)