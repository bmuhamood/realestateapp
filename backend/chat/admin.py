from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Q
from django.utils import timezone
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    """Inline messages within conversation"""
    model = Message
    fields = ['sender', 'content_preview', 'attachment_link', 'is_read', 'created_at']
    readonly_fields = ['sender', 'content_preview', 'attachment_link', 'is_read', 'created_at']
    can_delete = True
    extra = 0
    classes = ['collapse']
    
    def content_preview(self, obj):
        if obj.content:
            return format_html(
                '<div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{}</div>',
                obj.content[:100] + ('...' if len(obj.content) > 100 else '')
            )
        return '-'
    content_preview.short_description = 'Message'
    
    def attachment_link(self, obj):
        if obj.attachment:
            return format_html(
                '<a href="{}" target="_blank" style="color: #e63946;">📎 View</a>',
                obj.attachment.url
            )
        return '-'
    attachment_link.short_description = 'Attachment'


class ParticipantFilter(admin.SimpleListFilter):
    """Filter conversations by participant username"""
    title = 'Participant'
    parameter_name = 'participant'
    
    def lookups(self, request, model_admin):
        # Get unique participants across all conversations
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(
            Q(conversations_as_participant__isnull=False)
        ).distinct()[:20]
        return [(user.id, user.username) for user in users]
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(participants__id=self.value())
        return queryset


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = [
        'id_short', 'participants_list', 'property_link', 'last_message_preview',
        'message_count', 'unread_count', 'last_message_time', 'is_active_badge'
    ]
    list_filter = [
        'is_active',
        ParticipantFilter,
        ('last_message_time', admin.DateFieldListFilter),
        ('created_at', admin.DateFieldListFilter),
    ]
    search_fields = [
        'id', 
        'participants__username', 
        'participants__email',
        'participants__first_name',
        'participants__last_name',
        'property__title',
        'last_message'
    ]
    readonly_fields = [
        'id', 'full_id', 'participants_display', 'property_display',
        'message_count_display', 'unread_count_display', 'created_at', 
        'last_message_time', 'message_history'
    ]
    inlines = [MessageInline]
    actions = ['mark_all_messages_read', 'deactivate_conversations', 'export_conversation_data']
    
    fieldsets = (
        ('Conversation Information', {
            'fields': ('full_id', 'participants_display', 'property_display', 'is_active')
        }),
        ('Statistics', {
            'fields': ('message_count_display', 'unread_count_display', 'last_message_time'),
            'classes': ('wide',)
        }),
        ('Message History', {
            'fields': ('message_history',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        # Annotate with message counts for efficiency
        queryset = queryset.annotate(
            total_messages=Count('messages'),
            unread_msgs=Count('messages', filter=Q(messages__is_read=False))
        )
        return queryset
    
    def id_short(self, obj):
        """Display shortened ID"""
        return format_html(
            '<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</code>',
            str(obj.id)[:8]
        )
    id_short.short_description = 'ID'
    
    def full_id(self, obj):
        """Display full UUID"""
        return format_html(
            '<code style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 12px;">{}</code>',
            obj.id
        )
    full_id.short_description = 'Conversation ID'
    
    def participants_list(self, obj):
        """Display all participants with avatars and links"""
        participants = obj.participants.all()
        html = '<div style="display: flex; flex-direction: column; gap: 4px;">'
        for participant in participants:
            # Get participant role badge
            role_badge = ''
            if participant.is_agent:
                role_badge = '<span style="background: #e63946; color: white; font-size: 9px; padding: 1px 6px; border-radius: 10px; margin-left: 6px;">Agent</span>'
            elif participant.is_service_provider:
                role_badge = '<span style="background: #f59e0b; color: white; font-size: 9px; padding: 1px 6px; border-radius: 10px; margin-left: 6px;">Provider</span>'
            
            # Get verification badge
            verified_badge = ' ✓' if participant.is_verified else ''
            
            html += f'''
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #e63946, #c1121f); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                    {participant.username[0].upper()}
                </div>
                <div>
                    <a href="{reverse('admin:users_user_change', args=[participant.id])}" style="font-weight: 600; text-decoration: none; color: #0d1b2e;">
                        {participant.get_full_name() or participant.username}
                    </a>
                    {role_badge}
                    <div style="font-size: 10px; color: #64748b;">@{participant.username}{verified_badge}</div>
                </div>
            </div>
            '''
        html += '</div>'
        return format_html(html)
    participants_list.short_description = 'Participants'
    
    def participants_display(self, obj):
        """Detailed participants view for readonly field"""
        participants = obj.participants.all()
        html = '<div style="display: flex; flex-direction: column; gap: 12px;">'
        for participant in participants:
            # Get profile picture if exists
            profile_pic = ''
            if participant.profile_picture:
                profile_pic = f'<img src="{participant.profile_picture.url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">'
            else:
                profile_pic = f'<div style="width: 40px; height: 40px; border-radius: 50%; background: #e63946; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">{participant.username[0].upper()}</div>'
            
            html += f'''
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: #f8fafc; border-radius: 8px;">
                {profile_pic}
                <div>
                    <div style="font-weight: 700; color: #0d1b2e;">{participant.get_full_name() or participant.username}</div>
                    <div style="font-size: 11px; color: #64748b;">@{participant.username} • {participant.email}</div>
                    <div style="font-size: 10px; margin-top: 4px;">
                        <span style="background: #eef2f7; padding: 2px 8px; border-radius: 10px;">ID: {participant.id}</span>
                        {"<span style='background: #dcfce7; padding: 2px 8px; border-radius: 10px; margin-left: 4px;'>✓ Verified</span>" if participant.is_verified else ""}
                        {"<span style='background: #fee2e2; padding: 2px 8px; border-radius: 10px; margin-left: 4px;'>🏠 Agent</span>" if participant.is_agent else ""}
                    </div>
                </div>
            </div>
            '''
        html += '</div>'
        return format_html(html)
    participants_display.short_description = 'Participants Details'
    
    def property_link(self, obj):
        """Link to property if exists"""
        if obj.property:
            return format_html(
                '<a href="{}" style="display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; text-decoration: none; color: #0d1b2e; font-size: 12px;">🏠 {}</a>',
                reverse('admin:properties_property_change', args=[obj.property.id]),
                obj.property.title[:40] + ('...' if len(obj.property.title) > 40 else '')
            )
        return '-'
    property_link.short_description = 'Property'
    
    def property_display(self, obj):
        """Detailed property view"""
        if obj.property:
            return format_html('''
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                <div><strong>Title:</strong> {}</div>
                <div><strong>Location:</strong> {}, {}</div>
                <div><strong>Price:</strong> UGX {:,.0f}</div>
                <div><a href="{}" target="_blank" style="color: #e63946;">View Property →</a></div>
            </div>
            ''', obj.property.title, obj.property.district, obj.property.city, 
                obj.property.price, f'/property/{obj.property.id}')
        return '-'
    property_display.short_description = 'Property Details'
    
    def last_message_preview(self, obj):
        """Preview of last message"""
        if obj.last_message:
            return format_html(
                '<div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #475569;">{}</div>',
                obj.last_message
            )
        return '-'
    last_message_preview.short_description = 'Last Message'
    
    def message_count(self, obj):
        """Total messages count"""
        count = getattr(obj, 'total_messages', obj.messages.count())
        return format_html(
            '<span style="font-weight: 700; font-size: 14px; color: #0d1b2e;">{}</span>',
            count
        )
    message_count.short_description = 'Messages'
    
    def message_count_display(self, obj):
        """Detailed message count with breakdown"""
        total = obj.messages.count()
        last_24h = obj.messages.filter(created_at__gte=timezone.now() - timezone.timedelta(days=1)).count()
        last_7d = obj.messages.filter(created_at__gte=timezone.now() - timezone.timedelta(days=7)).count()
        
        return format_html('''
        <div>
            <div><strong>Total:</strong> {}</div>
            <div><strong>Last 24h:</strong> {}</div>
            <div><strong>Last 7 days:</strong> {}</div>
        </div>
        ''', total, last_24h, last_7d)
    message_count_display.short_description = 'Message Statistics'
    
    def unread_count(self, obj):
        """Unread messages count"""
        unread = getattr(obj, 'unread_msgs', obj.messages.filter(is_read=False).count())
        if unread > 0:
            return format_html(
                '<span style="background: #e63946; color: white; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;">{} unread</span>',
                unread
            )
        return format_html('<span style="color: #22c55e;">✓ All read</span>')
    unread_count.short_description = 'Read Status'
    
    def unread_count_display(self, obj):
        """Detailed unread breakdown by participant"""
        html = '<div style="display: flex; flex-direction: column; gap: 6px;">'
        for participant in obj.participants.all():
            unread = obj.messages.filter(is_read=False).exclude(sender=participant).count()
            status = '🔴 Unread' if unread > 0 else '🟢 All read'
            html += f'<div><strong>{participant.username}:</strong> {unread} messages - {status}</div>'
        html += '</div>'
        return format_html(html)
    unread_count_display.short_description = 'Unread Breakdown'
    
    def is_active_badge(self, obj):
        """Active status badge"""
        if obj.is_active:
            return format_html('<span style="background: #22c55e; color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px;">✓ Active</span>')
        return format_html('<span style="background: #ef4444; color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px;">✗ Archived</span>')
    is_active_badge.short_description = 'Status'
    
    def message_history(self, obj):
        """Full message history view"""
        messages = obj.messages.all().order_by('created_at')[:50]
        if not messages:
            return format_html('<div style="text-align: center; padding: 40px; color: #94a3b8;">No messages yet</div>')
        
        html = '<div style="max-height: 500px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">'
        for msg in messages:
            # Determine alignment based on sender
            is_admin = msg.sender.is_staff
            bg_color = '#e63946' if is_admin else '#f1f5f9'
            text_color = 'white' if is_admin else '#0d1b2e'
            alignment = 'flex-end' if is_admin else 'flex-start'
            
            # Format time
            time_str = msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
            
            # Get sender name
            sender_name = msg.sender.get_full_name() or msg.sender.username
            if is_admin:
                sender_name = f'👑 {sender_name} (Admin)'
            
            html += f'''
            <div style="display: flex; justify-content: {alignment}; margin-bottom: 12px;">
                <div style="max-width: 70%; background: {bg_color}; color: {text_color}; padding: 10px 14px; border-radius: 12px;">
                    <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">
                        {sender_name} • {time_str}
                        {' ✓ Read' if msg.is_read else ' 📨 Unread'}
                    </div>
                    <div style="font-size: 13px; word-wrap: break-word;">{msg.content}</div>
                    {f'<div style="margin-top: 6px;"><a href="{msg.attachment.url}" target="_blank" style="color: {"white" if is_admin else "#e63946"}; font-size: 11px;">📎 Attachment</a></div>' if msg.attachment else ''}
                </div>
            </div>
            '''
        html += '</div>'
        return format_html(html)
    message_history.short_description = 'Message History'
    
    def mark_all_messages_read(self, request, queryset):
        """Admin action to mark all messages as read in selected conversations"""
        updated = 0
        for conversation in queryset:
            count = conversation.messages.filter(is_read=False).update(is_read=True)
            updated += count
        self.message_user(request, f'Marked {updated} messages as read in {queryset.count()} conversations.')
    mark_all_messages_read.short_description = 'Mark all messages as read in selected conversations'
    
    def deactivate_conversations(self, request, queryset):
        """Archive/deactivate selected conversations"""
        count = queryset.update(is_active=False)
        self.message_user(request, f'Archived {count} conversations.')
    deactivate_conversations.short_description = 'Archive selected conversations'
    
    def export_conversation_data(self, request, queryset):
        """Export conversation data as JSON"""
        import json
        from django.http import HttpResponse
        
        export_data = []
        for conv in queryset:
            messages = list(conv.messages.values('sender__username', 'content', 'created_at', 'is_read'))
            export_data.append({
                'id': str(conv.id),
                'participants': list(conv.participants.values('id', 'username', 'email')),
                'property': str(conv.property.id) if conv.property else None,
                'messages': messages,
                'created_at': str(conv.created_at),
                'last_message_time': str(conv.last_message_time),
            })
        
        response = HttpResponse(
            json.dumps(export_data, indent=2, default=str),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename="conversations_export.json"'
        return response
    export_conversation_data.short_description = 'Export selected conversations (JSON)'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'id_short', 'conversation_link', 'sender_info', 'content_preview', 
        'attachment_icon', 'read_status', 'created_at_relative'
    ]
    list_filter = [
        'is_read', 
        'created_at',
        ('sender', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['content', 'sender__username', 'sender__email', 'conversation__id']
    readonly_fields = ['id', 'conversation', 'sender', 'created_at', 'read_at']
    list_select_related = ['conversation', 'sender']
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected']
    
    fieldsets = (
        ('Message Details', {
            'fields': ('conversation', 'sender', 'content', 'attachment')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'created_at'),
            'classes': ('wide',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('conversation', 'sender')
    
    def id_short(self, obj):
        return format_html(
            '<code style="font-size: 10px;">{}</code>',
            str(obj.id)[:8]
        )
    id_short.short_description = 'ID'
    
    def conversation_link(self, obj):
        return format_html(
            '<a href="{}" style="font-family: monospace; font-size: 11px;">Conv: {}</a>',
            reverse('admin:chat_conversation_change', args=[obj.conversation.id]),
            str(obj.conversation.id)[:8]
        )
    conversation_link.short_description = 'Conversation'
    
    def sender_info(self, obj):
        role = ''
        if obj.sender.is_agent:
            role = '🏠 Agent'
        elif obj.sender.is_service_provider:
            role = '🔧 Provider'
        elif obj.sender.is_staff:
            role = '👑 Admin'
        
        return format_html('''
        <div>
            <strong>{}</strong>
            <div style="font-size: 10px; color: #64748b;">{}</div>
            <div style="font-size: 9px;">{}</div>
        </div>
        ''', obj.sender.username, obj.sender.email, role)
    sender_info.short_description = 'Sender'
    
    def content_preview(self, obj):
        if obj.content:
            preview = obj.content[:80] + ('...' if len(obj.content) > 80 else '')
            return format_html(
                '<div style="max-width: 300px; white-space: normal; word-wrap: break-word; font-size: 12px;">{}</div>',
                preview
            )
        return '-'
    content_preview.short_description = 'Message'
    
    def attachment_icon(self, obj):
        if obj.attachment:
            return format_html('<span style="font-size: 16px;">📎</span>')
        return '-'
    attachment_icon.short_description = 'Attachment'
    
    def read_status(self, obj):
        if obj.is_read:
            return format_html(
                '<span style="color: #22c55e;">✓ Read</span><div style="font-size: 9px;">{}</div>',
                obj.read_at.strftime('%Y-%m-%d %H:%M') if obj.read_at else ''
            )
        return format_html('<span style="color: #e63946; font-weight: 700;">● Unread</span>')
    read_status.short_description = 'Status'
    
    def created_at_relative(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)
    created_at_relative.short_description = 'Time ago'
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'Marked {updated} messages as read.')
    mark_as_read.short_description = 'Mark selected messages as read'
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'Marked {updated} messages as unread.')
    mark_as_unread.short_description = 'Mark selected messages as unread'


# Custom Admin Dashboard Widget
class ChatDashboardWidget:
    """Widget for admin dashboard showing chat statistics"""
    
    @staticmethod
    def get_stats():
        from django.db.models import Count, Q
        from datetime import timedelta
        from django.utils import timezone
        
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        
        total_conversations = Conversation.objects.count()
        active_conversations = Conversation.objects.filter(is_active=True).count()
        total_messages = Message.objects.count()
        
        # Messages today
        messages_today = Message.objects.filter(created_at__date=today).count()
        
        # Messages last 7 days
        messages_week = Message.objects.filter(created_at__gte=week_ago).count()
        
        # Unread messages
        unread_messages = Message.objects.filter(is_read=False).count()
        
        # Top conversations by message count
        top_conversations = Conversation.objects.annotate(
            msg_count=Count('messages')
        ).order_by('-msg_count')[:5]
        
        return {
            'total_conversations': total_conversations,
            'active_conversations': active_conversations,
            'total_messages': total_messages,
            'messages_today': messages_today,
            'messages_week': messages_week,
            'unread_messages': unread_messages,
            'top_conversations': top_conversations,
        }
    
    @staticmethod
    def render():
        stats = ChatDashboardWidget.get_stats()
        
        return format_html('''
        <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 16px 0; color: #0d1b2e; font-size: 16px;">💬 Chat System Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: 800; color: #e63946;">{}</div>
                    <div style="font-size: 11px; color: #64748b;">Total Conversations</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: 800; color: #22c55e;">{}</div>
                    <div style="font-size: 11px; color: #64748b;">Active Chats</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: 800; color: #f59e0b;">{}</div>
                    <div style="font-size: 11px; color: #64748b;">Total Messages</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: 800; color: #6366f1;">{}</div>
                    <div style="font-size: 11px; color: #64748b;">Unread Messages</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                <div>
                    <div style="font-weight: 700; margin-bottom: 8px;">📊 Recent Activity</div>
                    <div style="font-size: 13px;">Today: <strong>{}</strong> messages</div>
                    <div style="font-size: 13px;">Last 7 days: <strong>{}</strong> messages</div>
                </div>
                <div>
                    <div style="font-weight: 700; margin-bottom: 8px;">🔥 Most Active Conversations</div>
                    <div style="font-size: 12px;">
                        {}
                    </div>
                </div>
            </div>
        </div>
        ''',
            stats['total_conversations'],
            stats['active_conversations'],
            stats['total_messages'],
            stats['unread_messages'],
            stats['messages_today'],
            stats['messages_week'],
            ''.join([f'<div>• {conv.title[:30]}... ({conv.total_messages} msgs)</div>' for conv in stats['top_conversations']])
        )


# Register the dashboard widget (optional - add to your admin dashboard)
# You can include this in your main admin.py or a custom admin site