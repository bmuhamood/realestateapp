# properties/urls.py - CORRECTED FOR UUID SUPPORT
from django.urls import path
from .views import (
    PropertyImageView, PropertyListView, PropertyDetailView, PropertyLikeView, 
    MyPropertiesView, BoostPropertyView, PropertyRecommendationsView, UserFavoritesView,
    # New imports for upgraded features
    PropertyVideoView, PropertyDocumentView, PropertyReviewView, PropertyInquiryView,
    BulkPropertyImageUploadView  # Add this import
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
    
    # ========== SINGLE PROPERTY ENDPOINTS (Using UUID) ==========
    path('<uuid:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('<uuid:pk>/recommendations/', PropertyRecommendationsView.as_view(), name='property-recommendations-detail'),
    path('<uuid:pk>/like/', PropertyLikeView.as_view(), name='property-like'),
    path('<uuid:pk>/boost/', BoostPropertyView.as_view(), name='property-boost'),
    
    # ========== BOOST/FEATURED ENDPOINTS ==========
    path('boost-packages/', BoostPackageListView.as_view(), name='boost-packages'),
    path('<uuid:property_id>/initiate-boost/', InitiateBoostPaymentView.as_view(), name='initiate-boost'),
    path('verify-boost/', VerifyBoostPaymentView.as_view(), name='verify-boost'),
    path('boosted/', BoostedPropertiesView.as_view(), name='boosted-properties'),
    path('my/boosted/', MyBoostedPropertiesView.as_view(), name='my-boosted-properties'),
    
    # ========== IMAGE ENDPOINTS (Using UUID) ==========
    path('<uuid:property_id>/images/', PropertyImageView.as_view(), name='property-images'),
    path('<uuid:property_id>/upload/bulk-images/', BulkPropertyImageUploadView.as_view(), name='bulk-upload-images'),
    path('images/<uuid:image_id>/', PropertyImageView.as_view(), name='property-image-delete'),
    
    # ========== VIDEO ENDPOINTS (Using UUID) ==========
    path('<uuid:property_id>/videos/', PropertyVideoView.as_view(), name='property-videos'),
    path('<uuid:property_id>/videos/<uuid:video_id>/', PropertyVideoView.as_view(), name='property-video-detail'),
    
    # ========== DOCUMENT ENDPOINTS (Using UUID) ==========
    path('<uuid:property_id>/documents/', PropertyDocumentView.as_view(), name='property-documents'),
    path('<uuid:property_id>/documents/<uuid:document_id>/', PropertyDocumentView.as_view(), name='property-document-detail'),
    
    # ========== REVIEW ENDPOINTS (Using UUID) ==========
    path('<uuid:property_id>/reviews/', PropertyReviewView.as_view(), name='property-reviews'),
    path('<uuid:property_id>/reviews/<uuid:review_id>/', PropertyReviewView.as_view(), name='property-review-detail'),
    
    # ========== INQUIRY ENDPOINTS (Using UUID) ==========
    path('<uuid:property_id>/inquiries/', PropertyInquiryView.as_view(), name='property-inquiries'),
    path('<uuid:property_id>/inquiries/<uuid:inquiry_id>/', PropertyInquiryView.as_view(), name='property-inquiry-detail'),
]