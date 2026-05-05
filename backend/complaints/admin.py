from django.contrib import admin
from django.utils.html import format_html
from .models import Complaint, ComplaintMessage, ComplaintDocument, ComplaintResolution


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['complaint_number', 'title', 'category', 'status', 'priority', 
                    'complainant', 'defendant', 'created_at']
    list_filter = ['status', 'category', 'priority', 'created_at']
    search_fields = ['title', 'description', 'complainant__username', 'defendant__username',
                     'complaint_number']
    readonly_fields = ['id', 'complaint_number', 'created_at', 'updated_at', 'resolved_at']
    
    fieldsets = (
        ('Complaint Information', {
            'fields': ('complaint_number', 'title', 'description', 'category', 'priority')
        }),
        ('Parties Involved', {
            'fields': ('complainant', 'defendant', 'property', 'service')
        }),
        ('Evidence', {
            'fields': ('evidence',)
        }),
        ('Status & Resolution', {
            'fields': ('status', 'admin_notes', 'admin_response', 'resolution_details', 
                      'resolved_in_favor', 'compensation_amount', 'resolved_at')
        }),
        ('Assignment', {
            'fields': ('assigned_to',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def complaint_number(self, obj):
        return obj.complaint_number
    complaint_number.short_description = 'Complaint #'


@admin.register(ComplaintMessage)
class ComplaintMessageAdmin(admin.ModelAdmin):
    list_display = ['complaint', 'sender', 'is_admin_response', 'is_read', 'created_at']
    list_filter = ['is_admin_response', 'is_read', 'created_at']
    search_fields = ['content', 'sender__username', 'complaint__title']


@admin.register(ComplaintDocument)
class ComplaintDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'complaint', 'uploaded_by', 'file_size', 'uploaded_at']
    search_fields = ['title', 'uploaded_by__username', 'complaint__title']


@admin.register(ComplaintResolution)
class ComplaintResolutionAdmin(admin.ModelAdmin):
    list_display = ['complaint', 'action_type', 'action_by', 'created_at']
    list_filter = ['action_type', 'created_at']
    search_fields = ['action_taken', 'complaint__title']