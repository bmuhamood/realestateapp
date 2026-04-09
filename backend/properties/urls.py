# properties/urls.py
from django.urls import path
from .views import (
    PropertyListView, PropertyDetailView, PropertyLikeView, 
    MyPropertiesView, BoostPropertyView, PropertyRecommendationsView
)
from .boost_views import (
    BoostPackageListView, InitiateBoostPaymentView, 
    VerifyBoostPaymentView, BoostedPropertiesView, MyBoostedPropertiesView
)

urlpatterns = [
    path('', PropertyListView.as_view(), name='property-list'),
    path('my/', MyPropertiesView.as_view(), name='my-properties'),
    path('recommendations/', PropertyRecommendationsView.as_view(), name='property-recommendations'),  # Add this line - no pk
    path('<int:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('<int:pk>/recommendations/', PropertyRecommendationsView.as_view(), name='property-recommendations-detail'),  # For property-specific recommendations
    path('<int:pk>/like/', PropertyLikeView.as_view(), name='property-like'),
    path('<int:pk>/boost/', BoostPropertyView.as_view(), name='property-boost'),
    
    # Boost/Featured endpoints
    path('boost-packages/', BoostPackageListView.as_view(), name='boost-packages'),
    path('<int:property_id>/initiate-boost/', InitiateBoostPaymentView.as_view(), name='initiate-boost'),
    path('verify-boost/', VerifyBoostPaymentView.as_view(), name='verify-boost'),
    path('boosted/', BoostedPropertiesView.as_view(), name='boosted-properties'),
    path('my/boosted/', MyBoostedPropertiesView.as_view(), name='my-boosted-properties'),
]