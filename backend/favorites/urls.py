from django.urls import path
from .views import FavoriteListView, FavoriteDetailView

urlpatterns = [
    path('', FavoriteListView.as_view(), name='favorite-list'),
    path('<int:property_id>/', FavoriteDetailView.as_view(), name='favorite-detail'),
]