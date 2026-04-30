# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, UserFollowersView, UserFollowingView, UserListView, 
    UserProfileView, UserDetailView, FollowUserView, FollowStatusView, 
    ChangePasswordView, GoogleLoginView, FacebookLoginView,
    UploadProfilePictureView, UploadCoverPhotoView, StatusViewSet
)

# Create router for StatusViewSet
router = DefaultRouter()
router.register('statuses', StatusViewSet, basename='status')

urlpatterns = [
    # User URLs
    path('', UserListView.as_view(), name='user-list'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserProfileView.as_view(), name='profile'),
    path('<str:username>/', UserDetailView.as_view(), name='user-detail'),
    path('<str:username>/follow/', FollowUserView.as_view(), name='follow'),
    path('<str:username>/follow/status/', FollowStatusView.as_view(), name='follow-status'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('<str:username>/followers/', UserFollowersView.as_view(), name='user-followers'),
    path('<str:username>/following/', UserFollowingView.as_view(), name='user-following'),
    
    # Cloudinary Upload URLs
    path('upload/profile-picture/', UploadProfilePictureView.as_view(), name='upload-profile-picture'),
    path('upload/cover-photo/', UploadCoverPhotoView.as_view(), name='upload-cover-photo'),
    
    # Status URLs (via router)
    path('', include(router.urls)),
    
    # Social Login URLs
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    path('auth/facebook/', FacebookLoginView.as_view(), name='facebook-login'),
]
