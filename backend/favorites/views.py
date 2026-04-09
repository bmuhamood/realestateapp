from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Favorite
from .serializers import FavoriteSerializer
from properties.models import Property

class FavoriteListView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FavoriteDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def delete(self, request, property_id):
        try:
            favorite = Favorite.objects.get(user=request.user, property_id=property_id)
            favorite.delete()
            return Response({'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
        except Favorite.DoesNotExist:
            return Response({'error': 'Property not in favorites'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, property_id):
        try:
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