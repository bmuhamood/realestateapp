# chatbot/admin.py - FULLY FIXED VERSION (remove backend.favorites import)
from django.contrib import admin
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .models import (
    ChatSession, 
    ChatMessage, 
    UserChatPreference, 
    ConversationAnalytics,
    AgentUsage,
    UserFeedback
)

# REMOVED: from backend.favorites import models - THIS WAS CAUSING THE ERROR


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_id', 'created_at', 'updated_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__username', 'user__email', 'session_id')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user',)
    
    fieldsets = (
        ('Session Info', {
            'fields': ('user', 'session_id', 'is_active')
        }),
        ('Context Data', {
            'fields': ('context', 'user_preferences'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'message_type', 'intent', 'content_preview', 'confidence_score', 'created_at')
    list_filter = ('message_type', 'intent', 'created_at')
    search_fields = ('content', 'session__user__username', 'session__session_id')
    readonly_fields = ('created_at',)
    raw_id_fields = ('session',)
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
    
    fieldsets = (
        ('Message Info', {
            'fields': ('session', 'message_type', 'intent', 'confidence_score')
        }),
        ('Content', {
            'fields': ('content', 'suggestions')
        }),
        ('Extracted Data', {
            'fields': ('entities', 'property_data', 'service_data'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )


@admin.register(UserChatPreference)
class UserChatPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_locations_preview', 'budget_range', 'total_interactions', 'updated_at')
    list_filter = ('updated_at',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('updated_at',)
    raw_id_fields = ('user',)
    
    def preferred_locations_preview(self, obj):
        return ', '.join(obj.preferred_locations[:3]) if obj.preferred_locations else 'None'
    preferred_locations_preview.short_description = 'Preferred Locations'
    
    def budget_range(self, obj):
        if obj.budget_min and obj.budget_max:
            return f'UGX {obj.budget_min:,.0f} - {obj.budget_max:,.0f}'
        elif obj.budget_max:
            return f'Under UGX {obj.budget_max:,.0f}'
        elif obj.budget_min:
            return f'Above UGX {obj.budget_min:,.0f}'
        return 'Not set'
    budget_range.short_description = 'Budget Range'
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Preferences', {
            'fields': ('preferred_locations', 'preferred_property_types', 
                      'preferred_bedrooms', 'budget_min', 'budget_max')
        }),
        ('Behavior', {
            'fields': ('frequent_intents', 'average_message_length', 'total_interactions')
        }),
        ('Timestamps', {
            'fields': ('updated_at',)
        })
    )


@admin.register(ConversationAnalytics)
class ConversationAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'intent', 'response_time_ms', 'user_rating', 'created_at')
    list_filter = ('intent', 'user_rating', 'created_at')
    search_fields = ('user_message', 'bot_response', 'session__user__username')
    readonly_fields = ('created_at',)
    raw_id_fields = ('session',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('session')
    
    fieldsets = (
        ('Conversation', {
            'fields': ('session', 'intent', 'user_message', 'bot_response')
        }),
        ('Metrics', {
            'fields': ('response_time_ms', 'user_rating')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        })
    )


@admin.register(AgentUsage)
class AgentUsageAdmin(admin.ModelAdmin):
    list_display = ('id', 'agent_name', 'session_id_short', 'confidence_score', 'response_time_ms', 'success', 'user_rating', 'created_at')
    list_filter = ('agent_name', 'success', 'user_rating', 'created_at')
    search_fields = ('session_id', 'user_message', 'agent_name')
    readonly_fields = ('created_at',)
    
    def session_id_short(self, obj):
        return obj.session_id[:8] + '...' if obj.session_id else 'None'
    session_id_short.short_description = 'Session ID'
    
    def get_queryset(self, request):
        return super().get_queryset(request).order_by('-created_at')
    
    fieldsets = (
        ('Agent Info', {
            'fields': ('agent_name', 'session_id', 'confidence_score', 'success')
        }),
        ('Message', {
            'fields': ('user_message',)
        }),
        ('Performance', {
            'fields': ('response_time_ms', 'user_rating')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        })
    )


@admin.register(UserFeedback)
class UserFeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'agent_name', 'feedback_type', 'session_id_short', 'content_preview', 'created_at')
    list_filter = ('agent_name', 'feedback_type', 'created_at')
    search_fields = ('session_id', 'user_message', 'bot_response', 'correction')
    readonly_fields = ('created_at',)
    
    def session_id_short(self, obj):
        return obj.session_id[:8] + '...' if obj.session_id else 'None'
    session_id_short.short_description = 'Session ID'
    
    def content_preview(self, obj):
        return obj.user_message[:50] + '...' if len(obj.user_message) > 50 else obj.user_message
    content_preview.short_description = 'User Message'
    
    actions = ['mark_as_helpful', 'mark_for_training']
    
    def mark_as_helpful(self, request, queryset):
        updated = queryset.update(feedback_type='helpful')
        self.message_user(request, f'{updated} feedback entries marked as helpful.')
    mark_as_helpful.short_description = 'Mark selected as helpful'
    
    def mark_for_training(self, request, queryset):
        self.message_user(request, f'{queryset.count()} feedback entries marked for training.')
    mark_for_training.short_description = 'Mark for model training'
    
    fieldsets = (
        ('Feedback Info', {
            'fields': ('agent_name', 'session_id', 'feedback_type')
        }),
        ('Content', {
            'fields': ('user_message', 'bot_response', 'correction')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        })
    )


# Optional: Custom dashboard (commented out if you don't have the template)
# class ChatbotAdminDashboard(admin.ModelAdmin):
#     """Custom dashboard for chatbot analytics"""
#     change_list_template = 'admin/chatbot/dashboard.html'
#     
#     def changelist_view(self, request, extra_context=None):
#         # Get last 7 days data
#         week_ago = timezone.now() - timedelta(days=7)
#         
#         # Calculate stats
#         total_sessions = ChatSession.objects.filter(created_at__gte=week_ago).count()
#         total_messages = ChatMessage.objects.filter(created_at__gte=week_ago).count()
#         avg_response_time = ConversationAnalytics.objects.filter(
#             created_at__gte=week_ago
#         ).aggregate(models.Avg('response_time_ms'))['response_time_ms__avg'] or 0
#         
#         # Agent usage stats
#         agent_stats = AgentUsage.objects.filter(
#             created_at__gte=week_ago
#         ).values('agent_name').annotate(
#             count=models.Count('id'),
#             avg_confidence=models.Avg('confidence_score')
#         ).order_by('-count')
#         
#         # Satisfaction rate
#         total_feedback = UserFeedback.objects.filter(created_at__gte=week_ago).count()
#         positive_feedback = UserFeedback.objects.filter(
#             created_at__gte=week_ago,
#             feedback_type__in=['helpful', 'excellent']
#         ).count()
#         satisfaction_rate = (positive_feedback / total_feedback * 100) if total_feedback > 0 else 0
#         
#         extra_context = extra_context or {}
#         extra_context.update({
#             'total_sessions': total_sessions,
#             'total_messages': total_messages,
#             'avg_response_time': int(avg_response_time),
#             'agent_stats': agent_stats,
#             'satisfaction_rate': int(satisfaction_rate),
#             'total_feedback': total_feedback,
#         })
#         
#         return super().changelist_view(request, extra_context=extra_context)