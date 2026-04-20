# users/views.py - COMPLETE FIXED VERSION
from rest_framework import generics, permissions, status, filters, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
import os
import requests as http_requests

from .serializers import (
    UserSerializer, RegisterSerializer, FollowSerializer,
    StatusSerializer, StatusViewSerializer
)
from .models import Follow, Status, StatusView

User = get_user_model()

# ========== USER MANAGEMENT VIEWS ==========

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response(
                {'error': 'Both old_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_agent', 'is_service_provider', 'is_verified']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'city', 'district']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'username'

# ========== FOLLOW VIEWS ==========

class FollowUserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, username):
        try:
            user_to_follow = User.objects.get(username=username)
            if user_to_follow == request.user:
                return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
            follow, created = Follow.objects.get_or_create(
                follower=request.user,
                following=user_to_follow
            )
            
            if created:
                user_to_follow.followers_count += 1
                request.user.following_count += 1
                user_to_follow.save()
                request.user.save()
                return Response({'message': f'Now following {username}'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Already following'}, status=status.HTTP_200_OK)
                
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, username):
        try:
            user_to_unfollow = User.objects.get(username=username)
            follow = Follow.objects.filter(follower=request.user, following=user_to_unfollow)
            
            if follow.exists():
                follow.delete()
                user_to_unfollow.followers_count -= 1
                request.user.following_count -= 1
                user_to_unfollow.save()
                request.user.save()
                return Response({'message': f'Unfollowed {username}'}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'Not following'}, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class FollowStatusView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request, username):
        try:
            user_to_check = User.objects.get(username=username)
            is_following = Follow.objects.filter(
                follower=request.user, 
                following=user_to_check
            ).exists()
            return Response({'is_following': is_following})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserFollowersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        follower_ids = Follow.objects.filter(following=user).values_list('follower_id', flat=True)
        return User.objects.filter(id__in=follower_ids)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class UserFollowingView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        return User.objects.filter(id__in=following_ids)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# ========== SOCIAL LOGIN VIEWS ==========

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'No token provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com')
            
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return Response(
                    {'error': 'Invalid token issuer'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            profile_picture = idinfo.get('picture', '')
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Google'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'profile_picture': profile_picture,
                    'is_verified': True,
                }
            )
            
            if not created and not user.profile_picture and profile_picture:
                user.profile_picture = profile_picture
                user.save()
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid Google token: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Google login failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class FacebookLoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'No token provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            response = http_requests.get(
                f'https://graph.facebook.com/me',
                params={
                    'access_token': token,
                    'fields': 'id,name,email,first_name,last_name,picture'
                }
            )
            
            if response.status_code != 200:
                return Response(
                    {'error': 'Invalid Facebook token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = response.json()
            email = data.get('email')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            profile_picture = data.get('picture', {}).get('data', {}).get('url', '')
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Facebook'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'profile_picture': profile_picture,
                    'is_verified': True,
                }
            )
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Facebook login failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# ========== STATUS VIEWS ==========

class StatusViewSet(viewsets.ModelViewSet):
    serializer_class = StatusSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get active statuses from followed users"""
        following_user_ids = self.request.user.following.values_list('following', flat=True)
        now = timezone.now()
        
        return Status.objects.filter(
            user__in=following_user_ids,
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        ).select_related('user').order_by('-created_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        # Create mutable copy of data
        mutable_data = request.data.copy()
        
        # Remove user if present
        if 'user' in mutable_data:
            del mutable_data['user']
        
        # Remove expires_at if present (let model handle it)
        if 'expires_at' in mutable_data:
            del mutable_data['expires_at']
        
        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def mark_viewed(self, request, pk=None):
        status_obj = self.get_object()
        view, created = StatusView.objects.get_or_create(
            status=status_obj,
            viewer=request.user
        )
        if created:
            status_obj.views_count += 1
            status_obj.save(update_fields=['views_count'])
        return Response({'status': 'viewed'})
    
    @action(detail=False, methods=['get'])
    def my_statuses(self, request):
        """Get current user's active statuses"""
        now = timezone.now()
        statuses = Status.objects.filter(
            user=request.user,
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        ).order_by('-created_at')
        serializer = self.get_serializer(statuses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def following_statuses(self, request):
        """Get statuses grouped by user (like WhatsApp)"""
        following_user_ids = request.user.following.values_list('following', flat=True)
        now = timezone.now()
        
        statuses = Status.objects.filter(
            user__in=following_user_ids,
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        ).select_related('user').order_by('-created_at')
        
        # Group by user
        grouped = {}
        for status in statuses:
            if status.user.id not in grouped:
                grouped[status.user.id] = {
                    'user': {
                        'id': status.user.id,
                        'username': status.user.username,
                        'first_name': status.user.first_name,
                        'last_name': status.user.last_name,
                        'profile_picture': status.user.profile_picture.url if status.user.profile_picture else None,
                        'is_agent': status.user.is_agent,
                        'is_service_provider': status.user.is_service_provider,
                    },
                    'statuses': []
                }
            grouped[status.user.id]['statuses'].append(
                StatusSerializer(status, context={'request': request}).data
            )
        
        return Response(list(grouped.values()))
    
    @action(detail=False, methods=['delete'])
    def delete_expired(self, request):
        """Delete expired statuses"""
        now = timezone.now()
        deleted = Status.objects.filter(
            expires_at__lte=now,
            expires_at__isnull=False
        ).delete()
        return Response({'deleted': deleted[0]})