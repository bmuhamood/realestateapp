from django.urls import path
from . import views

urlpatterns = [
    # Main deal endpoints
    path('', views.DealRoomListView.as_view(), name='deal-list'),
    path('stats/', views.DealRoomStatsView.as_view(), name='deal-stats'),
    path('<uuid:id>/', views.DealRoomDetailView.as_view(), name='deal-detail'),
    
    # Messages
    path('<uuid:deal_id>/messages/', views.DealRoomMessagesView.as_view(), name='deal-messages'),
    path('<uuid:deal_id>/messages/read/', views.MarkMessagesReadView.as_view(), name='deal-messages-read'),
    
    # Documents
    path('<uuid:deal_id>/documents/', views.DealRoomDocumentsView.as_view(), name='deal-documents'),
    path('<uuid:deal_id>/documents/<uuid:document_id>/sign/', 
         views.SignDocumentView.as_view(), name='deal-sign-document'),
    
    # Offers
    path('<uuid:deal_id>/offers/', views.DealRoomOffersView.as_view(), name='deal-offers'),
    path('<uuid:deal_id>/offers/respond/', views.RespondToOfferView.as_view(), name='deal-respond-offer'),
    
    # Milestones
    path('<uuid:deal_id>/milestones/', views.DealRoomMilestonesView.as_view(), name='deal-milestones'),
    path('<uuid:deal_id>/milestones/<uuid:milestone_id>/complete/', 
         views.CompleteMilestoneView.as_view(), name='deal-milestone-complete'),
    
    # Activity log
    path('<uuid:deal_id>/activity/', views.DealRoomActivityLogView.as_view(), name='deal-activity'),
]