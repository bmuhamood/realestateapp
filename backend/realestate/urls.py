# realestate/urls.py - CORRECTED FINAL VERSION WITH KYC

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import StatusViewSet, KYCSubmitView, KYCStatusView  # ✅ ADD KYC VIEWS

def api_root(request):
    return JsonResponse({
        'name': 'Metro Care Properties API',
        'version': '1.0.0',
        'status': 'operational',
        'endpoints': {
            'auth': {
                'login': '/api/auth/login/',
                'refresh': '/api/auth/refresh/',
            },
            'users': '/api/users/',
            'properties': '/api/properties/',
            'bookings': '/api/bookings/',
            'payments': '/api/payments/',
            'favorites': '/api/favorites/',
            'reviews': '/api/reviews/',
            'services': '/api/services/',
            # 'chatbot': '/api/chat/',
            'statuses': '/api/users/statuses/',
            'kyc': '/api/kyc/',  # ✅ ADD KYC TO ROOT ENDPOINTS
            'admin': '/admin/',
        },
        'documentation': 'Contact support@metrocareproperties.ug for API docs'
    })

urlpatterns = [
    # Root route - returns API info
    path('', api_root, name='api_root'),
    
    path('admin/', admin.site.urls),

    # Auth endpoints
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App endpoints
    path('api/users/', include('users.urls')),
    path('api/properties/', include('properties.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/favorites/', include('favorites.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/services/', include('services.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/dealroom/', include('dealroom.urls')),
    
    # ✅ ADD KYC ENDPOINTS - Direct endpoints for frontend
    path('api/kyc/', KYCSubmitView.as_view(), name='kyc'),
    path('api/kyc/status/', KYCStatusView.as_view(), name='kyc-status'),

    # Legal Pages
    path('terms/', TemplateView.as_view(template_name='legal/terms_of_service.html'), name='terms'),
    path('privacy/', TemplateView.as_view(template_name='legal/privacy_policy.html'), name='privacy'),
    path('cookies/', TemplateView.as_view(template_name='legal/cookie_policy.html'), name='cookies'),
    path('disclaimer/', TemplateView.as_view(template_name='legal/disclaimer.html'), name='disclaimer'),
    path('user-agreement/', TemplateView.as_view(template_name='legal/user_agreement.html'), name='user-agreement'),
    path('data-protection/', TemplateView.as_view(template_name='legal/data_protection.html'), name='data-protection'),
    path('safety/', TemplateView.as_view(template_name='legal/safety_center.html'), name='safety'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)