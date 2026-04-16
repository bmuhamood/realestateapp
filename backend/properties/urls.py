# properties/urls.py - COMPLETE UPGRADED VERSION
from django.urls import path
from .views import (
    PropertyListView, PropertyDetailView, PropertyLikeView, 
    MyPropertiesView, BoostPropertyView, PropertyRecommendationsView, UserFavoritesView,
    # New imports for upgraded features
    PropertyVideoView, PropertyDocumentView, PropertyReviewView, PropertyInquiryView
)
from .boost_views import (
    BoostPackageListView, InitiateBoostPaymentView, 
    VerifyBoostPaymentView, BoostedPropertiesView, MyBoostedPropertiesView
)

urlpatterns = [
    # ========== MAIN PROPERTY ENDPOINTS ==========
    path('', PropertyListView.as_view(), name='property-list'),
    path('my/', MyPropertiesView.as_view(), name='my-properties'),
    path('recommendations/', PropertyRecommendationsView.as_view(), name='property-recommendations'),
    path('favorites/', UserFavoritesView.as_view(), name='user-favorites'),
    
    # ========== SINGLE PROPERTY ENDPOINTS ==========
    path('<int:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('<int:pk>/recommendations/', PropertyRecommendationsView.as_view(), name='property-recommendations-detail'),
    path('<int:pk>/like/', PropertyLikeView.as_view(), name='property-like'),
    path('<int:pk>/boost/', BoostPropertyView.as_view(), name='property-boost'),
    
    # ========== BOOST/FEATURED ENDPOINTS ==========
    path('boost-packages/', BoostPackageListView.as_view(), name='boost-packages'),
    path('<int:property_id>/initiate-boost/', InitiateBoostPaymentView.as_view(), name='initiate-boost'),
    path('verify-boost/', VerifyBoostPaymentView.as_view(), name='verify-boost'),
    path('boosted/', BoostedPropertiesView.as_view(), name='boosted-properties'),
    path('my/boosted/', MyBoostedPropertiesView.as_view(), name='my-boosted-properties'),
    
    # ========== NEW: VIDEO ENDPOINTS ==========
    path('<int:property_id>/videos/', PropertyVideoView.as_view(), name='property-videos'),
    path('<int:property_id>/videos/<int:video_id>/', PropertyVideoView.as_view(), name='property-video-detail'),
    
    # ========== NEW: DOCUMENT ENDPOINTS ==========
    path('<int:property_id>/documents/', PropertyDocumentView.as_view(), name='property-documents'),
    path('<int:property_id>/documents/<int:document_id>/', PropertyDocumentView.as_view(), name='property-document-detail'),
    
    # ========== NEW: REVIEW ENDPOINTS ==========
    path('<int:property_id>/reviews/', PropertyReviewView.as_view(), name='property-reviews'),
    
    # ========== NEW: INQUIRY ENDPOINTS ==========
    path('<int:property_id>/inquiries/', PropertyInquiryView.as_view(), name='property-inquiries'),
]