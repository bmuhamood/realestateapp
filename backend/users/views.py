# users/views.py - COMPLETE FIXED VERSION WITH CLOUDINARY
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
import cloudinary.uploader
import cloudinary.api
from django.core.files.uploadedfile import UploadedFile

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
    
    def update(self, request, *args, **kwargs):
        """Handle profile updates with Cloudinary uploads"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle profile picture upload
        if 'profile_picture' in request.FILES:
            profile_file = request.FILES['profile_picture']
            upload_result = cloudinary.uploader.upload(
                profile_file,
                folder='profiles/',
                transformation={'width': 500, 'height': 500, 'crop': 'fill'},
                overwrite=True,
                invalidate=True
            )
            instance.profile_picture = upload_result['public_id']
        
        # Handle cover photo upload
        if 'cover_photo' in request.FILES:
            cover_file = request.FILES['cover_photo']
            upload_result = cloudinary.uploader.upload(
                cover_file,
                folder='covers/',
                transformation={'width': 1500, 'height': 500, 'crop': 'fill'},
                overwrite=True,
                invalidate=True
            )
            instance.cover_photo = upload_result['public_id']
        
        # Handle verification document upload
        if 'verification_document' in request.FILES:
            doc_file = request.FILES['verification_document']
            upload_result = cloudinary.uploader.upload(
                doc_file,
                folder='verifications/',
                resource_type='auto',
                overwrite=True,
                invalidate=True
            )
            instance.verification_document = upload_result['public_id']
        
        # Update other fields
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

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

# ========== PROFILE PICTURE UPLOAD VIEW ==========

class UploadProfilePictureView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        """Handle profile picture upload directly to Cloudinary"""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image_file = request.FILES['image']
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size should be less than 5MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder='profiles/',
                transformation={'width': 500, 'height': 500, 'crop': 'fill'},
                overwrite=True,
                invalidate=True
            )
            
            # Update user's profile picture
            user = request.user
            user.profile_picture = upload_result['public_id']
            user.save()
            
            return Response({
                'success': True,
                'url': upload_result['secure_url'],
                'public_id': upload_result['public_id'],
                'message': 'Profile picture updated successfully'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Delete profile picture"""
        user = request.user
        if user.profile_picture:
            # Delete from Cloudinary
            cloudinary.uploader.destroy(user.profile_picture)
            user.profile_picture = None
            user.save()
            return Response({'message': 'Profile picture deleted successfully'})
        return Response({'error': 'No profile picture to delete'}, status=status.HTTP_400_BAD_REQUEST)

class UploadCoverPhotoView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        """Handle cover photo upload"""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image_file = request.FILES['image']
            
            # Validate file size (max 10MB)
            if image_file.size > 10 * 1024 * 1024:
                return Response(
                    {'error': 'Image size should be less than 10MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder='covers/',
                transformation={'width': 1500, 'height': 500, 'crop': 'fill'},
                overwrite=True,
                invalidate=True
            )
            
            # Update user's cover photo
            user = request.user
            user.cover_photo = upload_result['public_id']
            user.save()
            
            return Response({
                'success': True,
                'url': upload_result['secure_url'],
                'public_id': upload_result['public_id'],
                'message': 'Cover photo updated successfully'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Delete cover photo"""
        user = request.user
        if user.cover_photo:
            cloudinary.uploader.destroy(user.cover_photo)
            user.cover_photo = None
            user.save()
            return Response({'message': 'Cover photo deleted successfully'})
        return Response({'error': 'No cover photo to delete'}, status=status.HTTP_400_BAD_REQUEST)

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
                # Note: For URL-based profile pictures from Google, store the URL
                # You may want to download and re-upload to Cloudinary here
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

# ========== STATUS VIEWS (with Cloudinary support) ==========

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
        """Create status with Cloudinary upload"""
        # Handle media upload to Cloudinary
        if 'media' in self.request.FILES:
            media_file = self.request.FILES['media']
            media_type = self.request.data.get('media_type', 'image')
            
            # Determine resource type
            resource_type = 'auto'
            if media_type == 'image':
                resource_type = 'image'
            elif media_type == 'video':
                resource_type = 'video'
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                media_file,
                folder=f'statuses/{timezone.now().strftime("%Y/%m/%d")}/',
                resource_type=resource_type,
                overwrite=True
            )
            
            # Save the public_id to the model
            serializer.save(
                user=self.request.user,
                media=upload_result['public_id']
            )
        else:
            # Text-only status
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
        
        # Handle file upload specially
        if 'media' in request.FILES:
            media_file = request.FILES['media']
            media_type = mutable_data.get('media_type', 'image')
            
            try:
                # Validate file size
                if media_type == 'image' and media_file.size > 10 * 1024 * 1024:
                    return Response(
                        {'error': 'Image size should be less than 10MB'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif media_type == 'video' and media_file.size > 50 * 1024 * 1024:
                    return Response(
                        {'error': 'Video size should be less than 50MB'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Determine resource type
                resource_type = 'image' if media_type == 'image' else 'video'
                
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    media_file,
                    folder=f'statuses/{timezone.now().strftime("%Y/%m/%d")}/',
                    resource_type=resource_type,
                    overwrite=True
                )
                
                # Create status with Cloudinary public_id
                status_obj = Status.objects.create(
                    user=request.user,
                    media=upload_result['public_id'],
                    media_type=media_type,
                    text_content=mutable_data.get('text_content', ''),
                    background_color=mutable_data.get('background_color', '#1DA1F2')
                )
                
                serializer = self.get_serializer(status_obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {'error': f'Upload failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Text-only status
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
                # Get profile picture URL
                profile_pic_url = None
                if status.user.profile_picture:
                    if hasattr(status.user.profile_picture, 'url'):
                        profile_pic_url = status.user.profile_picture.url
                    else:
                        profile_pic_url = status.user.profile_picture
                
                grouped[status.user.id] = {
                    'user': {
                        'id': status.user.id,
                        'username': status.user.username,
                        'first_name': status.user.first_name,
                        'last_name': status.user.last_name,
                        'profile_picture': profile_pic_url,
                        'is_agent': status.user.is_agent,
                        'is_service_provider': status.user.is_service_provider,
                    },
                    'statuses': []
                }
            
            # Get media URL for status
            status_data = StatusSerializer(status, context={'request': request}).data
            if status.media:
                if hasattr(status.media, 'url'):
                    status_data['media_url'] = status.media.url
                else:
                    # If media is a string (public_id), build URL
                    from cloudinary import CloudinaryImage
                    status_data['media_url'] = CloudinaryImage(status.media).build_url()
            
            grouped[status.user.id]['statuses'].append(status_data)
        
        return Response(list(grouped.values()))
    
    @action(detail=False, methods=['delete'])
    def delete_expired(self, request):
        """Delete expired statuses and remove from Cloudinary"""
        now = timezone.now()
        expired_statuses = Status.objects.filter(
            expires_at__lte=now,
            expires_at__isnull=False
        )
        
        # Delete from Cloudinary
        for status in expired_statuses:
            if status.media:
                try:
                    cloudinary.uploader.destroy(status.media, resource_type=status.media_type)
                except Exception as e:
                    print(f"Failed to delete {status.media} from Cloudinary: {e}")
        
        deleted_count = expired_statuses.count()
        expired_statuses.delete()
        
        return Response({'deleted': deleted_count})