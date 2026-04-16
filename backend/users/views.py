from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, RegisterSerializer, FollowSerializer
from .models import Follow
import os
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend

User = get_user_model()

class ChangePasswordView(APIView):
    """
    API endpoint for changing user password
    """
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        # Validate required fields
        if not old_password or not new_password:
            return Response(
                {'error': 'Both old_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if old password is correct
        if not user.check_password(old_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password strength
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
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
            # Get Google Client ID from environment or settings
            GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com')
            
            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # Check if token is valid
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return Response(
                    {'error': 'Invalid token issuer'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user info from token
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            profile_picture = idinfo.get('picture', '')
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Google'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate username from email
            username = email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Get or create user
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
            
            # If user already exists but no profile picture, update it
            if not created and not user.profile_picture and profile_picture:
                user.profile_picture = profile_picture
                user.save()
            
            # Generate JWT tokens
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
        # Implement Facebook login using facebook-sdk or requests
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'No token provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use requests to verify Facebook token
            import requests as http_requests
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
            
            # Generate username
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Get or create user
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
    """Get list of users following a specific user"""
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        # Get the User objects of people who follow this user
        follower_ids = Follow.objects.filter(following=user).values_list('follower_id', flat=True)
        return User.objects.filter(id__in=follower_ids)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class UserFollowingView(generics.ListAPIView):
    """Get list of users a specific user is following"""
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        # Get the User objects that this user follows
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        return User.objects.filter(id__in=following_ids)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context