# users/admin.py - FIXED VERSION

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import User, Follow, Status, StatusView, KYCSubmission
from django.utils.safestring import mark_safe


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone', 'is_agent', 'is_service_provider', 
                   'is_verified', 'kyc_status_display', 'created_at')
    list_filter = ('is_agent', 'is_service_provider', 'is_verified', 'is_active', 'is_staff')
    search_fields = ('username', 'email', 'phone', 'first_name', 'last_name')
    readonly_fields = ('followers_count', 'following_count', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone', 'bio', 'location', 'district', 'city')}),
        ('Profile', {'fields': ('profile_picture', 'cover_photo')}),
        ('Verification', {'fields': ('is_agent', 'is_service_provider', 'is_verified', 'verification_document')}),
        ('Stats', {'fields': ('followers_count', 'following_count')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'phone', 'password1', 'password2', 'first_name', 'last_name', 'is_agent', 'is_service_provider'),
        }),
    )
    
    def kyc_status_display(self, obj):
        """Display KYC status for user"""
        try:
            latest_kyc = obj.kyc_submissions.order_by('-submitted_at').first()
            if latest_kyc:
                status_colors = {
                    'pending': 'orange',
                    'approved': 'green',
                    'rejected': 'red',
                    'requires_update': 'purple'
                }
                color = status_colors.get(latest_kyc.status, 'gray')
                return format_html(
                    '<span style="color: {}; font-weight: bold;">{}</span>',
                    color,
                    latest_kyc.get_status_display()
                )
            return format_html('<span style="color: gray;">Not Submitted</span>')
        except:
            return format_html('<span style="color: gray;">Not Submitted</span>')
    
    kyc_status_display.short_description = 'KYC Status'


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'following', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('follower__username', 'following__username')


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('user', 'media_type', 'views_count', 'is_active', 'expires_at', 'created_at')
    list_filter = ('media_type', 'is_active', 'created_at')
    search_fields = ('user__username', 'text_content')


@admin.register(StatusView)
class StatusViewAdmin(admin.ModelAdmin):
    list_display = ('status', 'viewer', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('status__user__username', 'viewer__username')


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type_display', 'status_colored', 'submitted_at', 'reviewed_at', 'action_buttons')
    list_filter = ('status', 'document_type', 'submitted_at')
    search_fields = ('user__username', 'user__email', 'document_number')
    readonly_fields = ('submitted_at', 'preview_images')
    list_per_page = 25
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'document_type', 'document_number')
        }),
        ('Document Images', {
            'fields': ('front_image_preview', 'back_image_preview', 'selfie_preview'),
            'classes': ('wide',)
        }),
        ('Review Information', {
            'fields': ('status', 'admin_notes', 'rejection_reason'),
            'classes': ('wide',)
        }),
        ('Timestamps', {
            'fields': ('submitted_at', 'reviewed_at', 'reviewed_by'),
            'classes': ('collapse',)
        })
    )
    
    def document_type_display(self, obj):
        return obj.get_document_type_display()
    document_type_display.short_description = 'Document Type'
    
    def status_colored(self, obj):
        colors = {
            'pending': '#ff9800',
            'approved': '#4caf50',
            'rejected': '#f44336',
            'requires_update': '#9c27b0'
        }
        color = colors.get(obj.status, '#757575')
        return format_html(
            '<span style="color: {}; font-weight: bold; padding: 3px 8px; border-radius: 4px; background: {}20;">{}</span>',
            color,
            color,
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    
    def front_image_preview(self, obj):
        if obj.front_image:
            return format_html(
                '<img src="{}" style="max-height: 150px; max-width: 200px; border-radius: 8px; margin: 5px;" />',
                obj.front_image.url
            )
        return format_html('<span>-</span>')
    front_image_preview.short_description = 'Front Image'
    
    def back_image_preview(self, obj):
        if obj.back_image:
            return format_html(
                '<img src="{}" style="max-height: 150px; max-width: 200px; border-radius: 8px; margin: 5px;" />',
                obj.back_image.url
            )
        return format_html('<span>-</span>')
    back_image_preview.short_description = 'Back Image'
    
    def selfie_preview(self, obj):
        if obj.selfie:
            return format_html(
                '<img src="{}" style="max-height: 150px; max-width: 200px; border-radius: 8px; margin: 5px;" />',
                obj.selfie.url
            )
        return format_html('<span>-</span>')
    selfie_preview.short_description = 'Selfie'
    
    def action_buttons(self, obj):
        buttons = []
        
        if obj.status == 'pending':
            approve_url = reverse('admin:kyc_approve', args=[str(obj.id)])
            reject_url = reverse('admin:kyc_reject', args=[str(obj.id)])
            change_url = reverse('admin:users_kycsubmission_change', args=[str(obj.id)])
            buttons.append(f'<a href="{approve_url}" style="background: #4caf50; color: white; padding: 4px 8px; text-decoration: none; border-radius: 4px; margin: 2px;">✓ Approve</a>')
            buttons.append(f'<a href="{reject_url}" style="background: #f44336; color: white; padding: 4px 8px; text-decoration: none; border-radius: 4px; margin: 2px;">✗ Reject</a>')
            buttons.append(f'<a href="{change_url}" style="background: #2196f3; color: white; padding: 4px 8px; text-decoration: none; border-radius: 4px; margin: 2px;">📝 Review</a>')
        elif obj.status == 'requires_update':
            approve_url = reverse('admin:kyc_approve', args=[str(obj.id)])
            reject_url = reverse('admin:kyc_reject', args=[str(obj.id)])
            buttons.append(f'<a href="{approve_url}" style="background: #4caf50; color: white; padding: 4px 8px; text-decoration: none; border-radius: 4px; margin: 2px;">✓ Approve</a>')
            buttons.append(f'<a href="{reject_url}" style="background: #f44336; color: white; padding: 4px 8px; text-decoration: none; border-radius: 4px; margin: 2px;">✗ Reject</a>')
        
        if buttons:
            return mark_safe(''.join(buttons))  # ← changed from format_html
        return mark_safe('<span>-</span>')
    action_buttons.short_description = 'Quick Actions'

    def save_model(self, request, obj, form, change):
        """Handle status changes and update user verification status"""
        if change:
            old_obj = self.model.objects.get(pk=obj.pk)
            
            # If status changed to approved, verify the user
            if old_obj.status != 'approved' and obj.status == 'approved':
                obj.reviewed_at = timezone.now()
                obj.reviewed_by = request.user
                obj.user.is_verified = True
                obj.user.save()
            
            # If status changed from approved to something else, unverify if no other approved
            elif old_obj.status == 'approved' and obj.status != 'approved':
                has_other_approved = KYCSubmission.objects.filter(
                    user=obj.user,
                    status='approved'
                ).exclude(pk=obj.pk).exists()
                
                if not has_other_approved:
                    obj.user.is_verified = False
                    obj.user.save()
            
            # If status changed to requires_update, ensure admin_notes are set
            elif obj.status == 'requires_update' and not obj.admin_notes:
                if not obj.admin_notes:
                    obj.admin_notes = "Additional information required. Please check the rejection reason."
        
        super().save_model(request, obj, form, change)
    
    actions = ['approve_selected', 'reject_selected']
    
    def approve_selected(self, request, queryset):
        """Bulk approve KYC submissions"""
        count = 0
        for submission in queryset:
            if submission.status in ['pending', 'requires_update']:
                submission.status = 'approved'
                submission.reviewed_at = timezone.now()
                submission.reviewed_by = request.user
                submission.save()
                submission.user.is_verified = True
                submission.user.save()
                count += 1
        self.message_user(request, f'Approved {count} KYC submission(s).')
    approve_selected.short_description = 'Approve selected submissions'
    
    def reject_selected(self, request, queryset):
        """Bulk reject KYC submissions"""
        count = 0
        for submission in queryset:
            if submission.status in ['pending', 'requires_update']:
                submission.status = 'rejected'
                submission.reviewed_at = timezone.now()
                submission.reviewed_by = request.user
                submission.save()
                submission.user.is_verified = False
                submission.user.save()
                count += 1
        self.message_user(request, f'Rejected {count} KYC submission(s).')
    reject_selected.short_description = 'Reject selected submissions'


# Register custom admin URLs for quick actions
from django.urls import path
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages

class KYCSubmissionAdminWithActions(KYCSubmissionAdmin):
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<uuid:pk>/approve/', self.admin_site.admin_view(self.approve_submission), name='kyc_approve'),
            path('<uuid:pk>/reject/', self.admin_site.admin_view(self.reject_submission), name='kyc_reject'),
        ]
        return custom_urls + urls
    
    def approve_submission(self, request, pk):
        submission = get_object_or_404(KYCSubmission, pk=pk)
        if submission.status in ['pending', 'requires_update']:
            submission.status = 'approved'
            submission.reviewed_at = timezone.now()
            submission.reviewed_by = request.user
            submission.save()
            submission.user.is_verified = True
            submission.user.save()
            messages.success(request, f'KYC submission for {submission.user.username} has been approved!')
        else:
            messages.warning(request, f'Cannot approve submission with status: {submission.get_status_display()}')
        return redirect('admin:users_kycsubmission_changelist')
    
    def reject_submission(self, request, pk):
        submission = get_object_or_404(KYCSubmission, pk=pk)
        if submission.status in ['pending', 'requires_update']:
            submission.status = 'rejected'
            submission.reviewed_at = timezone.now()
            submission.reviewed_by = request.user
            submission.save()
            submission.user.is_verified = False
            submission.user.save()
            messages.success(request, f'KYC submission for {submission.user.username} has been rejected.')
        else:
            messages.warning(request, f'Cannot reject submission with status: {submission.get_status_display()}')
        return redirect('admin:users_kycsubmission_changelist')
    
    # Override the preview_images method if needed
    def preview_images(self, obj):
        """Combined preview of all images"""
        html_parts = []
        
        if obj.front_image:
            html_parts.append(f'''
                <div style="display: inline-block; margin: 10px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Front Side</div>
                    <img src="{obj.front_image.url}" style="max-height: 200px; max-width: 250px; border-radius: 8px; border: 1px solid #ddd;" />
                </div>
            ''')
        
        if obj.back_image:
            html_parts.append(f'''
                <div style="display: inline-block; margin: 10px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Back Side</div>
                    <img src="{obj.back_image.url}" style="max-height: 200px; max-width: 250px; border-radius: 8px; border: 1px solid #ddd;" />
                </div>
            ''')
        
        if obj.selfie:
            html_parts.append(f'''
                <div style="display: inline-block; margin: 10px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Selfie</div>
                    <img src="{obj.selfie.url}" style="max-height: 200px; max-width: 250px; border-radius: 8px; border: 1px solid #ddd;" />
                </div>
            ''')
        
        if html_parts:
            return format_html(''.join(html_parts))
        return format_html('<p>No images uploaded</p>')
    preview_images.short_description = 'Document Preview'

# Re-register with custom actions
admin.site.unregister(KYCSubmission)
admin.site.register(KYCSubmission, KYCSubmissionAdminWithActions)