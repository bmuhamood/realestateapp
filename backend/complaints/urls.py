from django.urls import path
from . import views

urlpatterns = [
    # Main complaint endpoints
    path('', views.ComplaintListView.as_view(), name='complaint-list'),
    path('<uuid:id>/', views.ComplaintDetailView.as_view(), name='complaint-detail'),
    
    # User-specific complaint lists
    path('my-complaints/', views.MyComplaintsView.as_view(), name='my-complaints'),
    path('against-me/', views.ComplaintsAgainstMeView.as_view(), name='complaints-against-me'),
    
    # Complaint messages
    path('<uuid:complaint_id>/messages/', views.ComplaintMessageView.as_view(), name='complaint-messages'),
    path('<uuid:complaint_id>/messages/<uuid:message_id>/read/', 
         views.ComplaintMessageMarkReadView.as_view(), name='complaint-message-read'),
    
    # Documents
    path('<uuid:complaint_id>/documents/', views.ComplaintDocumentUploadView.as_view(), name='complaint-documents'),
    
    # 👇 ADD THIS LINE - Evidence upload endpoint
    path('upload/evidence/', views.EvidenceUploadView.as_view(), name='evidence-upload'),
    
    # Resolution
    path('<uuid:complaint_id>/resolutions/', views.AddResolutionView.as_view(), name='complaint-resolutions'),
    
    # Statistics (admin only)
    path('stats/', views.ComplaintStatsView.as_view(), name='complaint-stats'),
]