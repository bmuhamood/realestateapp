# chatbot/admin.py - CORRECT VERSION (imports models, doesn't redefine them)
from django.contrib import admin
from django.db import models
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.contrib.admin import SimpleListFilter

# Import models from models.py - NOT redefining them!
from .models import (
    ChatSession, 
    ChatMessage, 
    UserChatPreference, 
    ConversationAnalytics,
    AgentUsage,
    UserFeedback
)

User = get_user_model()


# ─── Custom Filters ────────────────────────────────────────────────────────────
class DateRangeFilter(SimpleListFilter):
    title = 'date range'
    parameter_name = 'date_range'
    
    def lookups(self, request, model_admin):
        return (
            ('today', 'Today'),
            ('yesterday', 'Yesterday'),
            ('week', 'Last 7 days'),
            ('month', 'Last 30 days'),
            ('quarter', 'Last 90 days'),
        )
    
    def queryset(self, request, queryset):
        today = timezone.now().date()
        if self.value() == 'today':
            start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
            return queryset.filter(created_at__gte=start)
        if self.value() == 'yesterday':
            yesterday = today - timedelta(days=1)
            start = timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.min.time()))
            end = timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.max.time()))
            return queryset.filter(created_at__range=(start, end))
        if self.value() == 'week':
            week_ago = timezone.now() - timedelta(days=7)
            return queryset.filter(created_at__gte=week_ago)
        if self.value() == 'month':
            month_ago = timezone.now() - timedelta(days=30)
            return queryset.filter(created_at__gte=month_ago)
        if self.value() == 'quarter':
            quarter_ago = timezone.now() - timedelta(days=90)
            return queryset.filter(created_at__gte=quarter_ago)
        return queryset


class ConfidenceFilter(SimpleListFilter):
    title = 'confidence score'
    parameter_name = 'confidence'
    
    def lookups(self, request, model_admin):
        return (
            ('high', 'High (≥ 0.8)'),
            ('medium', 'Medium (0.5 - 0.8)'),
            ('low', 'Low (< 0.5)'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'high':
            return queryset.filter(confidence_score__gte=0.8)
        if self.value() == 'medium':
            return queryset.filter(confidence_score__gte=0.5, confidence_score__lt=0.8)
        if self.value() == 'low':
            return queryset.filter(confidence_score__lt=0.5)
        return queryset


# ─── Admin Classes ─────────────────────────────────────────────────────────────
@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_link', 'session_id_short', 'message_count', 'is_active', 'created_at_relative', 'updated_at_relative')
    list_filter = ('is_active', DateRangeFilter, 'created_at')
    search_fields = ('user__username', 'user__email', 'session_id')
    readonly_fields = ('created_at', 'updated_at', 'session_id')
    raw_id_fields = ('user',)
    list_select_related = ('user',)
    
    def user_link(self, obj):
        if obj.user:
            try:
                url = reverse('admin:users_user_change', args=[obj.user.id])
                return format_html('<a href="{}">{}</a>', url, obj.user.username)
            except:
                return obj.user.username
        return 'Anonymous'
    user_link.short_description = 'User'
    
    def session_id_short(self, obj):
        return str(obj.session_id)[:8] + '...'
    session_id_short.short_description = 'Session ID'
    
    def message_count(self, obj):
        count = obj.messages.count()
        return format_html('<span style="font-weight: bold;">{}</span>', count)
    message_count.short_description = 'Messages'
    
    def created_at_relative(self, obj):
        delta = timezone.now() - obj.created_at
        if delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600}h ago"
        elif delta.seconds > 60:
            return f"{delta.seconds // 60}m ago"
        return "just now"
    created_at_relative.short_description = 'Created'
    
    def updated_at_relative(self, obj):
        delta = timezone.now() - obj.updated_at
        if delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600}h ago"
        elif delta.seconds > 60:
            return f"{delta.seconds // 60}m ago"
        return "just now"
    updated_at_relative.short_description = 'Updated'
    
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
    
    actions = ['mark_active', 'mark_inactive', 'delete_old_sessions']
    
    def mark_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} sessions marked as active.')
    mark_active.short_description = 'Mark selected sessions as active'
    
    def mark_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} sessions marked as inactive.')
    mark_inactive.short_description = 'Mark selected sessions as inactive'
    
    def delete_old_sessions(self, request, queryset):
        old_sessions = queryset.filter(created_at__lt=timezone.now() - timedelta(days=30))
        count = old_sessions.count()
        old_sessions.delete()
        self.message_user(request, f'Deleted {count} old sessions.')
    delete_old_sessions.short_description = 'Delete selected sessions (30+ days old)'


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_short', 'message_type_badge', 'intent_badge', 'content_preview', 'confidence_badge', 'has_property', 'created_at_relative')
    list_filter = ('message_type', 'intent', ConfidenceFilter, DateRangeFilter, 'created_at')
    search_fields = ('content', 'session__user__username', 'session__session_id')
    readonly_fields = ('created_at',)
    raw_id_fields = ('session',)
    list_select_related = ('session',)
    
    def session_short(self, obj):
        return str(obj.session.session_id)[:8] + '...'
    session_short.short_description = 'Session'
    
    def message_type_badge(self, obj):
        colors = {'user': '#10b981', 'bot': '#3b82f6', 'system': '#f59e0b'}
        color = colors.get(obj.message_type, '#6b7280')
        text = obj.message_type.upper()
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}</span>', color, text)
    message_type_badge.short_description = 'Type'
    
    def intent_badge(self, obj):
        if not obj.intent:
            return '-'
        colors = {
            'property_search': '#10b981', 'booking': '#3b82f6', 'price_inquiry': '#f59e0b',
            'location_inquiry': '#8b5cf6', 'favorites': '#ec4899', 'greeting': '#6b7280',
            'help': '#14b8a6', 'general': '#94a3b8'
        }
        color = colors.get(obj.intent, '#6b7280')
        display = obj.intent.replace('_', ' ').title()
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}</span>', color, display)
    intent_badge.short_description = 'Intent'
    
    def confidence_badge(self, obj):
        if obj.confidence_score >= 0.8:
            color = '#10b981'
            label = 'High'
        elif obj.confidence_score >= 0.5:
            color = '#f59e0b'
            label = 'Medium'
        else:
            color = '#ef4444'
            label = 'Low'
        percent = int(obj.confidence_score * 100)
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{} ({}%)</span>', color, label, percent)
    confidence_badge.short_description = 'Confidence'
    
    def content_preview(self, obj):
        return obj.content[:60] + '...' if len(obj.content) > 60 else obj.content
    content_preview.short_description = 'Content'
    
    def has_property(self, obj):
        return '✓' if obj.property_data else '✗'
    has_property.short_description = 'Property'
    
    def created_at_relative(self, obj):
        delta = timezone.now() - obj.created_at
        if delta.seconds < 60:
            return f"{delta.seconds}s ago"
        elif delta.seconds < 3600:
            return f"{delta.seconds // 60}m ago"
        elif delta.days < 1:
            return f"{delta.seconds // 3600}h ago"
        return f"{delta.days}d ago"
    created_at_relative.short_description = 'When'
    
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
    list_display = ('user_link', 'preferred_locations_preview', 'budget_range', 'preferred_bedrooms', 'total_interactions', 'updated_at_relative')
    list_filter = ('updated_at',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('updated_at', 'total_interactions')
    raw_id_fields = ('user',)
    
    def user_link(self, obj):
        try:
            url = reverse('admin:users_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        except:
            return obj.user.username
    user_link.short_description = 'User'
    
    def preferred_locations_preview(self, obj):
        if obj.preferred_locations:
            return ', '.join(obj.preferred_locations[:3])
        return 'None'
    preferred_locations_preview.short_description = 'Locations'
    
    def budget_range(self, obj):
        if obj.budget_min and obj.budget_max:
            return f"UGX {obj.budget_min:,.0f} - {obj.budget_max:,.0f}"
        elif obj.budget_max:
            return f"Under UGX {obj.budget_max:,.0f}"
        elif obj.budget_min:
            return f"Above UGX {obj.budget_min:,.0f}"
        return 'Not set'
    budget_range.short_description = 'Budget'
    
    def updated_at_relative(self, obj):
        delta = timezone.now() - obj.updated_at
        if delta.days > 7:
            return f"{delta.days}d ago"
        elif delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600}h ago"
        return "recent"
    updated_at_relative.short_description = 'Updated'
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Property Preferences', {
            'fields': ('preferred_locations', 'preferred_property_types', 'preferred_bedrooms')
        }),
        ('Budget', {
            'fields': ('budget_min', 'budget_max')
        }),
        ('Behavior Analytics', {
            'fields': ('frequent_intents', 'average_message_length', 'total_interactions'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {'fields': ('updated_at',)})
    )


@admin.register(ConversationAnalytics)
class ConversationAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_short', 'intent_badge', 'response_time_badge', 'user_rating_stars', 'created_at_relative')
    list_filter = ('intent', 'user_rating', DateRangeFilter)
    search_fields = ('user_message', 'bot_response', 'session__user__username')
    readonly_fields = ('created_at',)
    raw_id_fields = ('session',)
    
    def session_short(self, obj):
        return str(obj.session.session_id)[:8] + '...'
    session_short.short_description = 'Session'
    
    def intent_badge(self, obj):
        return format_html('<span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}</span>', 
                          obj.intent.replace('_', ' ').title())
    intent_badge.short_description = 'Intent'
    
    def response_time_badge(self, obj):
        if obj.response_time_ms < 500:
            color = '#10b981'
            label = 'Fast'
        elif obj.response_time_ms < 1000:
            color = '#f59e0b'
            label = 'Normal'
        else:
            color = '#ef4444'
            label = 'Slow'
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{} ({}ms)</span>', color, label, obj.response_time_ms)
    response_time_badge.short_description = 'Response'
    
    def user_rating_stars(self, obj):
        if not obj.user_rating:
            return '-'
        stars = '★' * obj.user_rating + '☆' * (5 - obj.user_rating)
        colors = {1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#84cc16', 5: '#10b981'}
        color = colors.get(obj.user_rating, '#94a3b8')
        return format_html('<span style="color: {};">{}</span>', color, stars)
    user_rating_stars.short_description = 'Rating'
    
    def created_at_relative(self, obj):
        delta = timezone.now() - obj.created_at
        if delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600}h ago"
        return f"{delta.seconds // 60}m ago"
    created_at_relative.short_description = 'When'


@admin.register(AgentUsage)
class AgentUsageAdmin(admin.ModelAdmin):
    list_display = ('id', 'agent_name_badge', 'session_short', 'confidence_badge', 'response_time_badge', 'success_icon', 'user_rating_stars', 'created_at_relative')
    list_filter = ('agent_name', 'success', 'user_rating', DateRangeFilter, 'created_at')
    search_fields = ('session_id', 'user_message', 'agent_name')
    readonly_fields = ('created_at',)
    
    def agent_name_badge(self, obj):
        colors = {
            'Property Finder': '#10b981', 'Price Analyst': '#f59e0b',
            'Investment Advisor': '#8b5cf6', 'Location Expert': '#3b82f6',
            'Booking Specialist': '#ec4899', 'Mortgage Expert': '#14b8a6',
            'Legal Advisor': '#ef4444', 'Construction Expert': '#f97316',
            'Orchestrator': '#6b7280'
        }
        color = colors.get(obj.agent_name, '#6b7280')
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}</span>', color, obj.agent_name)
    agent_name_badge.short_description = 'Agent'
    
    def session_short(self, obj):
        return obj.session_id[:8] + '...' if obj.session_id else 'None'
    session_short.short_description = 'Session'
    
    def confidence_badge(self, obj):
        if obj.confidence_score >= 0.8:
            color = '#10b981'
        elif obj.confidence_score >= 0.5:
            color = '#f59e0b'
        else:
            color = '#ef4444'
        percent = int(obj.confidence_score * 100)
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}%</span>', color, percent)
    confidence_badge.short_description = 'Confidence'
    
    def response_time_badge(self, obj):
        if obj.response_time_ms < 500:
            color = '#10b981'
        elif obj.response_time_ms < 1000:
            color = '#f59e0b'
        else:
            color = '#ef4444'
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}ms</span>', color, obj.response_time_ms)
    response_time_badge.short_description = 'Response'
    
    def success_icon(self, obj):
        icon = '✓' if obj.success else '✗'
        color = '#10b981' if obj.success else '#ef4444'
        return format_html('<span style="color: {};">{}</span>', color, icon)
    success_icon.short_description = 'Success'
    
    def user_rating_stars(self, obj):
        if not obj.user_rating:
            return '-'
        stars = '★' * obj.user_rating + '☆' * (5 - obj.user_rating)
        colors = {1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#84cc16', 5: '#10b981'}
        color = colors.get(obj.user_rating, '#94a3b8')
        return format_html('<span style="color: {};">{}</span>', color, stars)
    user_rating_stars.short_description = 'Rating'
    
    def created_at_relative(self, obj):
        delta = timezone.now() - obj.created_at
        if delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600}h ago"
        return f"{delta.seconds // 60}m ago"
    created_at_relative.short_description = 'When'
    
    fieldsets = (
        ('Agent Info', {
            'fields': ('agent_name', 'session_id', 'confidence_score', 'success')
        }),
        ('User Message', {
            'fields': ('user_message',)
        }),
        ('Performance Metrics', {
            'fields': ('response_time_ms', 'user_rating')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        })
    )


@admin.register(UserFeedback)
class UserFeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'agent_name_badge', 'feedback_type_badge', 'session_short', 'message_preview', 'has_correction', 'created_at_relative')
    list_filter = ('agent_name', 'feedback_type', DateRangeFilter, 'created_at')
    search_fields = ('session_id', 'user_message', 'bot_response', 'correction')
    readonly_fields = ('created_at',)
    
    def agent_name_badge(self, obj):
        colors = {
            'Property Finder': '#10b981', 'Price Analyst': '#f59e0b',
            'Investment Advisor': '#8b5cf6', 'Location Expert': '#3b82f6',
            'Booking Specialist': '#ec4899', 'Mortgage Expert': '#14b8a6',
            'Legal Advisor': '#ef4444', 'Construction Expert': '#f97316',
        }
        color = colors.get(obj.agent_name, '#6b7280')
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}</span>', color, obj.agent_name)
    agent_name_badge.short_description = 'Agent'
    
    def feedback_type_badge(self, obj):
        colors = {
            'helpful': '#10b981', 'excellent': '#10b981',
            'not_helpful': '#ef4444', 'wrong_info': '#f59e0b',
            'confusing': '#f97316', 'training_data': '#8b5cf6'
        }
        color = colors.get(obj.feedback_type, '#6b7280')
        display = obj.feedback_type.replace('_', ' ').title()
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">{}</span>', color, display)
    feedback_type_badge.short_description = 'Feedback'
    
    def session_short(self, obj):
        return obj.session_id[:8] + '...' if obj.session_id else 'None'
    session_short.short_description = 'Session'
    
    def message_preview(self, obj):
        return obj.user_message[:50] + '...' if len(obj.user_message) > 50 else obj.user_message
    message_preview.short_description = 'Message'
    
    def has_correction(self, obj):
        return '✓' if obj.correction else '✗'
    has_correction.short_description = 'Correction'
    
    def created_at_relative(self, obj):
        delta = timezone.now() - obj.created_at
        if delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600}h ago"
        return f"{delta.seconds // 60}m ago"
    created_at_relative.short_description = 'When'
    
    actions = ['mark_as_helpful', 'mark_as_not_helpful', 'export_for_training']
    
    def mark_as_helpful(self, request, queryset):
        updated = queryset.update(feedback_type='helpful')
        self.message_user(request, f'{updated} feedback entries marked as helpful.')
    mark_as_helpful.short_description = 'Mark as helpful'
    
    def mark_as_not_helpful(self, request, queryset):
        updated = queryset.update(feedback_type='not_helpful')
        self.message_user(request, f'{updated} feedback entries marked as not helpful.')
    mark_as_not_helpful.short_description = 'Mark as not helpful'
    
    def export_for_training(self, request, queryset):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="chatbot_training_data.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['User Message', 'Bot Response', 'Feedback Type', 'Correction'])
        
        for item in queryset:
            writer.writerow([item.user_message, item.bot_response, item.feedback_type, item.correction])
        
        self.message_user(request, f'Exported {queryset.count()} entries for training.')
        return response
    export_for_training.short_description = 'Export for training'