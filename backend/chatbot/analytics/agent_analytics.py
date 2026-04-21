# chatbot/analytics/agent_analytics.py - COMPLETELY REWRITTEN (no circular imports)
import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.apps import apps

logger = logging.getLogger(__name__)


def get_agent_usage(days=30):
    """Get agent usage statistics"""
    try:
        AgentUsage = apps.get_model('chatbot', 'AgentUsage')
        since = timezone.now() - timedelta(days=days)
        
        return AgentUsage.objects.filter(
            created_at__gte=since
        ).values('agent_name').annotate(
            total=Count('id'),
            avg_confidence=Avg('confidence_score'),
            avg_response_time=Avg('response_time_ms'),
            success_rate=Avg('success') * 100
        ).order_by('-total')
    except Exception as e:
        logger.error(f"Error getting agent usage: {e}")
        return []


def get_feedback_summary(days=30):
    """Get feedback summary"""
    try:
        UserFeedback = apps.get_model('chatbot', 'UserFeedback')
        since = timezone.now() - timedelta(days=days)
        
        feedbacks = UserFeedback.objects.filter(created_at__gte=since)
        total = feedbacks.count()
        positive = feedbacks.filter(feedback_type__in=['helpful', 'excellent']).count()
        
        return {
            'total': total,
            'positive': positive,
            'negative': total - positive,
            'satisfaction_rate': (positive / total * 100) if total > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error getting feedback summary: {e}")
        return {'total': 0, 'positive': 0, 'negative': 0, 'satisfaction_rate': 0}


def get_conversation_stats(days=30):
    """Get conversation statistics"""
    try:
        ConversationAnalytics = apps.get_model('chatbot', 'ConversationAnalytics')
        since = timezone.now() - timedelta(days=days)
        
        return ConversationAnalytics.objects.filter(
            created_at__gte=since
        ).aggregate(
            total=Count('id'),
            avg_response_time=Avg('response_time_ms'),
            avg_rating=Avg('user_rating')
        )
    except Exception as e:
        logger.error(f"Error getting conversation stats: {e}")
        return {'total': 0, 'avg_response_time': 0, 'avg_rating': 0}


class AnalyticsService:
    """Analytics service for chatbot"""
    
    @staticmethod
    def get_agent_usage(days=30):
        return get_agent_usage(days)
    
    @staticmethod
    def get_feedback_summary(days=30):
        return get_feedback_summary(days)
    
    @staticmethod
    def get_conversation_stats(days=30):
        return get_conversation_stats(days)