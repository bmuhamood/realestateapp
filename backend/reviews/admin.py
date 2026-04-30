# reviews/admin.py - WITH UUID SUPPORT

from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.urls import reverse
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'user_link', 'agent_link', 'property_link', 'rating_stars', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'user__email', 'agent__username', 'agent__email', 'comment')
    readonly_fields = ('id', 'created_at', 'updated_at')
    list_per_page = 20
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Review Information', {
            'fields': ('id', 'user', 'agent', 'property', 'rating', 'comment')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def id_short(self, obj):
        """Display shortened UUID"""
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    id_short.admin_order_field = 'id'
    
    def user_link(self, obj):
        """Display user as clickable link"""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}"><strong>{}</strong></a><br/><span style="color: #64748b; font-size: 11px;">{}</span>', 
                          url, obj.user.username, obj.user.email)
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'
    
    def agent_link(self, obj):
        """Display agent as clickable link"""
        url = reverse('admin:users_user_change', args=[obj.agent.id])
        return format_html('<a href="{}"><strong>{}</strong></a><br/><span style="color: #64748b; font-size: 11px;">{}</span>', 
                          url, obj.agent.username, obj.agent.email)
    agent_link.short_description = 'Agent'
    agent_link.admin_order_field = 'agent__username'
    
    def property_link(self, obj):
        """Display property as clickable link if exists"""
        if obj.property:
            url = reverse('admin:properties_property_change', args=[obj.property.id])
            return format_html('<a href="{}">{}</a>', url, obj.property.title)
        return '-'
    property_link.short_description = 'Property'
    property_link.admin_order_field = 'property__title'
    
    def rating_stars(self, obj):
        """Display rating as stars"""
        full_stars = int(obj.rating)
        stars = '★' * full_stars + '☆' * (5 - full_stars)
        colors = ['#ef4444', '#f97316', '#fbbf24', '#fbbf24', '#10b981']
        color = colors[obj.rating - 1] if 1 <= obj.rating <= 5 else '#6c757d'
        return mark_safe(f'<span style="color: {color}; font-size: 16px;">{stars}</span> <span style="color: #64748b;">({obj.rating})</span>')
    rating_stars.short_description = 'Rating'
    rating_stars.admin_order_field = 'rating'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('user', 'agent', 'property')
    
    actions = ['delete_selected_reviews']
    
    def delete_selected_reviews(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} reviews deleted successfully.")
    delete_selected_reviews.short_description = "Delete selected reviews"