# users/urls.py
from django.urls import path
from .views import (
    RegisterView, UserFollowersView, UserFollowingView, UserListView, UserProfileView, UserDetailView, FollowUserView,
    FollowStatusView, ChangePasswordView,  # Make sure this is imported
    GoogleLoginView, FacebookLoginView
)

urlpatterns = [
    path('', UserListView.as_view(), name='user-list'),  # Add this
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserProfileView.as_view(), name='profile'),
    path('<str:username>/', UserDetailView.as_view(), name='user-detail'),
    path('<str:username>/follow/', FollowUserView.as_view(), name='follow'),
    path('<str:username>/follow/status/', FollowStatusView.as_view(), name='follow-status'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('<str:username>/followers/', UserFollowersView.as_view(), name='user-followers'),
    path('<str:username>/following/', UserFollowingView.as_view(), name='user-following'),
]