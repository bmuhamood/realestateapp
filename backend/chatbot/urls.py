# chatbot/urls.py - UPDATED WITH CORRECT IMPORTS

from django.urls import path
# Change this import - use 'views' instead of 'views_dynamic'
from .views import ChatbotMessageView  # Import your actual view class

# Try to import voice views
try:
    from .views_voice import VoiceChatbotView, TextToSpeechView
    VOICE_AVAILABLE = True
except ImportError as e:
    print(f"Voice modules not available: {e}")
    VOICE_AVAILABLE = False
    VoiceChatbotView = None
    TextToSpeechView = None

# Try to import analytics views
try:
    from .analytics.analytics_views import (
        AgentAnalyticsView, 
        FeedbackView, 
        TrainingDataView,
        DashboardStatsView
    )
    ANALYTICS_AVAILABLE = True
except ImportError as e:
    print(f"Analytics modules not available: {e}")
    ANALYTICS_AVAILABLE = False
    AgentAnalyticsView = None
    FeedbackView = None
    TrainingDataView = None
    DashboardStatsView = None

# Base URL patterns
urlpatterns = [
    # Use the correct view class name
    path('message/', ChatbotMessageView.as_view(), name='chatbot-message'),
]

# Add voice endpoints if available
if VOICE_AVAILABLE and VoiceChatbotView:
    urlpatterns += [
        path('voice/', VoiceChatbotView.as_view(), name='chatbot-voice'),
        path('tts/', TextToSpeechView.as_view(), name='text-to-speech'),
    ]

# Add analytics endpoints if available
if ANALYTICS_AVAILABLE:
    urlpatterns += [
        path('analytics/agents/', AgentAnalyticsView.as_view(), name='agent-analytics'),
        path('analytics/feedback/', FeedbackView.as_view(), name='user-feedback'),
        path('analytics/training/', TrainingDataView.as_view(), name='training-data'),
        path('analytics/dashboard/', DashboardStatsView.as_view(), name='analytics-dashboard'),
    ]