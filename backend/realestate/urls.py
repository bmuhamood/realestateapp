from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import StatusViewSet

def api_root(request):
    return JsonResponse({
        'name': 'Metro Properties API',
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
            'chatbot': '/api/chatbot/',
            'statuses': '/api/statuses/',
            'admin': '/admin/',
        },
        'documentation': 'Contact support@metroproperties.ug for API docs'
    })

urlpatterns = [
    # Root route - returns API info
    path('', api_root, name='api_root'),
    
    path('admin/', admin.site.urls),

    path('api/statuses/', StatusViewSet.as_view({'get': 'list', 'post': 'create'}), name='status-list'),
    path('api/statuses/my_statuses/', StatusViewSet.as_view({'get': 'my_statuses'}), name='my-statuses'),
    path('api/statuses/following_statuses/', StatusViewSet.as_view({'get': 'following_statuses'}), name='following-statuses'),
    path('api/statuses/<int:pk>/mark_viewed/', StatusViewSet.as_view({'post': 'mark_viewed'}), name='mark-viewed'),
    path('api/statuses/<int:pk>/', StatusViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='status-detail'),
    
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/properties/', include('properties.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/favorites/', include('favorites.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/services/', include('services.urls')),
    path('api/chatbot/', include('chatbot.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)