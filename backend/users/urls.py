from django.urls import path
from .views import (
    RegisterView, UserProfileView, UserDetailView, FollowUserView,
    GoogleLoginView, FacebookLoginView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserProfileView.as_view(), name='profile'),
    path('<str:username>/', UserDetailView.as_view(), name='user-detail'),
    path('<str:username>/follow/', FollowUserView.as_view(), name='follow'),
    # path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    # path('auth/facebook/', FacebookLoginView.as_view(), name='facebook_login'),
]