from django.contrib import admin
from django.utils.html import format_html
from .models import DealRoom, DealMessage, DealDocument, DealMilestone, DealOffer, DealActivityLog


@admin.register(DealRoom)
class DealRoomAdmin(admin.ModelAdmin):
    list_display = ['deal_number', 'property_link', 'buyer', 'seller', 'status_badge', 
                    'agreed_price_display', 'progress_badge', 'created_at']
    list_filter = ['status', 'created_at', 'deposit_paid', 'commission_paid']
    search_fields = ['deal_number', 'property__title', 'buyer__username', 'seller__username']
    readonly_fields = ['deal_number', 'offer_date', 'created_at', 'updated_at', 'activity_link']
    
    fieldsets = (
        ('Deal Information', {
            'fields': ('deal_number', 'property', 'booking', 'status')
        }),
        ('Parties', {
            'fields': ('buyer', 'seller', 'agent')
        }),
        ('Financial', {
            'fields': ('agreed_price', 'original_listing_price', 'price_reduction', 
                      'deposit_amount', 'deposit_percentage', 'deposit_paid', 'deposit_reference',
                      'agent_commission', 'commission_percentage', 'commission_paid')
        }),
        ('Dates', {
            'fields': ('offer_date', 'acceptance_date', 'closing_date', 'possession_date', 'completed_at')
        }),
        ('Terms', {
            'fields': ('special_conditions', 'contingencies')
        }),
        ('Activity', {
            'fields': ('activity_link',)
        }),
    )
    
    def property_link(self, obj):
        return format_html('<a href="/admin/properties/property/{}/change/">{}</a>', 
                          obj.property.id, obj.property.title[:50])
    property_link.short_description = 'Property'
    
    def status_badge(self, obj):
        colors = {
            'negotiation': '#f59e0b',
            'deposit': '#8b5cf6',
            'contract': '#3b82f6',
            'inspection': '#10b981',
            'closing': '#6366f1',
            'completed': '#22c55e',
            'cancelled': '#ef4444',
            'disputed': '#dc2626',
        }
        color = colors.get(obj.status, '#64748b')
        return format_html('<span style="background: {}; color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px;">{}</span>',
                          color, obj.get_status_display())
    status_badge.short_description = 'Status'
    
    def agreed_price_display(self, obj):
        if obj.agreed_price:
            return format_html('<strong>UGX {:,.0f}</strong>', obj.agreed_price)
        return '-'
    agreed_price_display.short_description = 'Agreed Price'
    
    def progress_badge(self, obj):
        progress = obj.progress_percentage
        return format_html('''
        <div style="width: 80px; background: #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="width: {}%; background: #22c55e; color: white; font-size: 9px; padding: 2px 0; text-align: center;">{}%</div>
        </div>
        ''', progress, progress)
    progress_badge.short_description = 'Progress'
    
    def activity_link(self, obj):
        return format_html('<a href="/admin/dealroom/dealactivitylog/?deal_room__id__exact={}">View Activity Log</a>', obj.id)
    activity_link.short_description = 'Activity Log'


@admin.register(DealMessage)
class DealMessageAdmin(admin.ModelAdmin):
    list_display = ['deal_room', 'sender', 'message_type', 'content_preview', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'created_at']
    search_fields = ['content', 'sender__username', 'deal_room__deal_number']
    
    def content_preview(self, obj):
        return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
    content_preview.short_description = 'Message'


@admin.register(DealDocument)
class DealDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'deal_room', 'document_type', 'uploaded_by', 'all_signed', 'uploaded_at']
    list_filter = ['document_type', 'requires_signature', 'uploaded_at']
    search_fields = ['title', 'deal_room__deal_number']
    
    def all_signed(self, obj):
        return '✓' if obj.all_signatures_complete else 'Pending'
    all_signed.boolean = True


@admin.register(DealMilestone)
class DealMilestoneAdmin(admin.ModelAdmin):
    list_display = ['title', 'deal_room', 'is_completed', 'due_date', 'completed_date']
    list_filter = ['is_completed', 'due_date']


@admin.register(DealOffer)
class DealOfferAdmin(admin.ModelAdmin):
    list_display = ['deal_room', 'made_by', 'amount_display', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    
    def amount_display(self, obj):
        return f"UGX {obj.amount:,.0f}"
    amount_display.short_description = 'Amount'


@admin.register(DealActivityLog)
class DealActivityLogAdmin(admin.ModelAdmin):
    list_display = ['deal_room', 'user', 'activity_type', 'description', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['description', 'deal_room__deal_number', 'user__username']
    readonly_fields = ['deal_room', 'user', 'activity_type', 'description', 
                       'old_value', 'new_value', 'ip_address', 'user_agent', 'created_at']