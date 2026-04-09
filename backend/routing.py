# backend/routing.py
from django.urls import re_path
from .chatbot import consumers

websocket_urlpatterns = [
    # This should match your frontend URL exactly
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]