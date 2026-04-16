# chatbot/analytics/analytics_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
import json

# Import your analytics models
from chatbot.analytics.agent_analytics import (
    AgentUsage, 
    UserFeedback, 
    ConversationAnalytics,
    AnalyticsService
)

class AgentAnalyticsView(APIView):
    """View for agent usage analytics"""
    
    permission_classes = []  # Add permission classes as needed
    
    def get(self, request):
        """Get agent analytics data"""
        days = request.query_params.get('days', 7)
        
        try:
            days = int(days)
        except ValueError:
            days = 7
        
        since = timezone.now() - timedelta(days=days)
        
        # Get agent usage stats
        agent_stats = AgentUsage.objects.filter(
            created_at__gte=since
        ).values('agent_name').annotate(
            total_queries=Count('id'),
            avg_confidence=Avg('confidence_score'),
            avg_response_time=Avg('response_time_ms'),
            success_count=Count('id', filter=Q(success=True))
        ).order_by('-total_queries')
        
        # Format response
        data = []
        for stat in agent_stats:
            data.append({
                'agent_name': stat['agent_name'],
                'total_queries': stat['total_queries'],
                'avg_confidence': round(stat['avg_confidence'], 2) if stat['avg_confidence'] else 0,
                'avg_response_time_ms': int(stat['avg_response_time']) if stat['avg_response_time'] else 0,
                'success_rate': round((stat['success_count'] / stat['total_queries']) * 100, 1) if stat['total_queries'] > 0 else 0
            })
        
        return Response({
            'period_days': days,
            'agents': data,
            'total_queries': sum(stat['total_queries'] for stat in agent_stats)
        })


class FeedbackView(APIView):
    """View for user feedback"""
    
    permission_classes = []  # Add permission classes as needed
    
    def get(self, request):
        """Get feedback data"""
        days = request.query_params.get('days', 30)
        
        try:
            days = int(days)
        except ValueError:
            days = 30
        
        since = timezone.now() - timedelta(days=days)
        
        feedbacks = UserFeedback.objects.filter(
            created_at__gte=since
        )
        
        # Calculate stats
        total = feedbacks.count()
        helpful = feedbacks.filter(feedback_type__in=['helpful', 'excellent']).count()
        not_helpful = feedbacks.filter(feedback_type__in=['not_helpful', 'wrong_info', 'confusing']).count()
        
        # Group by agent
        by_agent = feedbacks.values('agent_name').annotate(
            total=Count('id'),
            helpful=Count('id', filter=Q(feedback_type__in=['helpful', 'excellent'])),
            needs_improvement=Count('id', filter=Q(feedback_type__in=['not_helpful', 'wrong_info']))
        )
        
        # Get recent feedback
        recent = feedbacks.order_by('-created_at')[:20].values(
            'id', 'agent_name', 'feedback_type', 'user_message', 'created_at'
        )
        
        return Response({
            'period_days': days,
            'summary': {
                'total_feedback': total,
                'helpful_count': helpful,
                'not_helpful_count': not_helpful,
                'satisfaction_rate': round((helpful / total * 100), 1) if total > 0 else 0
            },
            'by_agent': list(by_agent),
            'recent_feedback': list(recent)
        })
    
    def post(self, request):
        """Submit new feedback"""
        try:
            session_id = request.data.get('session_id')
            agent_name = request.data.get('agent_name')
            user_message = request.data.get('user_message')
            bot_response = request.data.get('bot_response')
            feedback_type = request.data.get('feedback_type')
            correction = request.data.get('correction', '')
            
            if not all([session_id, agent_name, user_message, bot_response, feedback_type]):
                return Response({
                    'error': 'Missing required fields'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate feedback type
            valid_types = ['helpful', 'not_helpful', 'wrong_info', 'confusing', 'excellent']
            if feedback_type not in valid_types:
                return Response({
                    'error': f'Invalid feedback_type. Must be one of: {valid_types}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create feedback
            feedback = UserFeedback.objects.create(
                session_id=session_id,
                agent_name=agent_name,
                user_message=user_message[:500],
                bot_response=bot_response[:500],
                feedback_type=feedback_type,
                correction=correction[:500] if correction else ''
            )
            
            return Response({
                'success': True,
                'feedback_id': feedback.id,
                'message': 'Feedback submitted successfully'
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrainingDataView(APIView):
    """View for training data export"""
    
    permission_classes = []  # Add permission classes as needed
    
    def get(self, request):
        """Export training data"""
        limit = request.query_params.get('limit', 100)
        
        try:
            limit = int(limit)
            limit = min(limit, 1000)  # Max 1000 records
        except ValueError:
            limit = 100
        
        # Get feedback that needs training
        feedbacks = UserFeedback.objects.filter(
            feedback_type__in=['not_helpful', 'wrong_info']
        ).order_by('-created_at')[:limit]
        
        # Get conversation analytics for context
        training_data = []
        
        for fb in feedbacks:
            # Get conversation context if available
            conversation = ConversationAnalytics.objects.filter(
                session_id=fb.session_id
            ).order_by('-created_at').first()
            
            training_data.append({
                'user_message': fb.user_message,
                'bot_response': fb.bot_response,
                'agent_name': fb.agent_name,
                'issue_type': fb.feedback_type,
                'user_correction': fb.correction,
                'intent': conversation.intent if conversation else None,
                'timestamp': fb.created_at.isoformat()
            })
        
        return Response({
            'total_records': len(training_data),
            'training_data': training_data,
            'export_format': 'json',
            'note': 'Use this data to fine-tune your models'
        })
    
    def post(self, request):
        """Submit training data manually"""
        try:
            data = request.data
            session_id = data.get('session_id', 'manual_training')
            agent_name = data.get('agent_name', 'unknown')
            user_message = data.get('user_message')
            bot_response = data.get('bot_response')
            expected_response = data.get('expected_response')
            
            if not all([user_message, expected_response]):
                return Response({
                    'error': 'user_message and expected_response are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Store as feedback with correction
            feedback = UserFeedback.objects.create(
                session_id=session_id,
                agent_name=agent_name,
                user_message=user_message[:500],
                bot_response=bot_response[:500] if bot_response else '',
                feedback_type='training_data',
                correction=expected_response[:500]
            )
            
            return Response({
                'success': True,
                'feedback_id': feedback.id,
                'message': 'Training data submitted successfully'
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardStatsView(APIView):
    """View for dashboard statistics"""
    
    permission_classes = []  # Add permission classes as needed
    
    def get(self, request):
        """Get dashboard statistics"""
        # Last 7 days by default
        days = request.query_params.get('days', 7)
        
        try:
            days = int(days)
        except ValueError:
            days = 7
        
        since = timezone.now() - timedelta(days=days)
        
        # Agent usage stats
        agent_stats = AgentUsage.objects.filter(
            created_at__gte=since
        ).values('agent_name').annotate(
            count=Count('id'),
            avg_confidence=Avg('confidence_score')
        ).order_by('-count')
        
        # Feedback stats
        feedback_stats = UserFeedback.objects.filter(
            created_at__gte=since
        ).aggregate(
            total=Count('id'),
            positive=Count('id', filter=Q(feedback_type__in=['helpful', 'excellent'])),
            negative=Count('id', filter=Q(feedback_type__in=['not_helpful', 'wrong_info', 'confusing']))
        )
        
        # Response time trends
        response_times = ConversationAnalytics.objects.filter(
            created_at__gte=since
        ).values('intent').annotate(
            avg_response_time=Avg('response_time_ms'),
            total_queries=Count('id')
        ).order_by('-total_queries')[:5]
        
        # Daily activity
        daily_activity = []
        for i in range(days):
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            queries = AgentUsage.objects.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).count()
            
            daily_activity.append({
                'date': day.date().isoformat(),
                'queries': queries
            })
        
        satisfaction_rate = 0
        if feedback_stats['total'] > 0:
            satisfaction_rate = (feedback_stats['positive'] / feedback_stats['total']) * 100
        
        return Response({
            'period_days': days,
            'summary': {
                'total_queries': AgentUsage.objects.filter(created_at__gte=since).count(),
                'total_sessions': AgentUsage.objects.filter(created_at__gte=since).values('session_id').distinct().count(),
                'avg_response_time': ConversationAnalytics.objects.filter(created_at__gte=since).aggregate(Avg('response_time_ms'))['response_time_ms__avg'] or 0,
                'satisfaction_rate': round(satisfaction_rate, 1),
                'total_feedback': feedback_stats['total']
            },
            'agent_performance': list(agent_stats),
            'response_time_by_intent': list(response_times),
            'daily_activity': daily_activity
        })


class ConversationAnalyticsView(APIView):
    """View for conversation analytics"""
    
    permission_classes = []  # Add permission classes as needed
    
    def get(self, request):
        """Get conversation analytics"""
        days = request.query_params.get('days', 30)
        
        try:
            days = int(days)
        except ValueError:
            days = 30
        
        since = timezone.now() - timedelta(days=days)
        
        # Intent distribution
        intent_stats = ConversationAnalytics.objects.filter(
            created_at__gte=since
        ).values('intent').annotate(
            count=Count('id'),
            avg_rating=Avg('user_rating')
        ).order_by('-count')
        
        # User satisfaction trends
        satisfaction_trends = []
        for i in range(min(days, 30)):  # Last 30 days max
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            feedbacks = UserFeedback.objects.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            )
            
            total = feedbacks.count()
            positive = feedbacks.filter(feedback_type__in=['helpful', 'excellent']).count()
            
            satisfaction_trends.append({
                'date': day.date().isoformat(),
                'satisfaction': round((positive / total * 100), 1) if total > 0 else None,
                'total_feedback': total
            })
        
        return Response({
            'period_days': days,
            'intent_distribution': list(intent_stats),
            'satisfaction_trends': satisfaction_trends,
            'total_conversations': ConversationAnalytics.objects.filter(created_at__gte=since).count()
        })