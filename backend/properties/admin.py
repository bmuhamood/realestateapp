# properties/admin.py - COMPLETELY FIXED VERSION

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Avg
from .models import (
    Property, PropertyImage, PropertyVideo, PropertyDocument,
    PropertyLike, PropertyView, PropertyReview, PropertyInquiry
)


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ('image_preview', 'image', 'is_main', 'order')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            try:
                if hasattr(obj.image, 'url'):
                    return format_html('<img src="{}" style="width: 80px; height: 80px; object-fit: cover;" />', obj.image.url)
            except:
                pass
        return "-"
    image_preview.short_description = 'Preview'


class PropertyVideoInline(admin.TabularInline):
    model = PropertyVideo
    extra = 1
    fields = ('video_preview', 'video_file', 'video_url', 'title', 'is_main', 'order')
    readonly_fields = ('video_preview',)
    
    def video_preview(self, obj):
        if obj.video_file and hasattr(obj.video_file, 'url'):
            return format_html('<video width="100" controls><source src="{}" type="video/mp4"></video>', obj.video_file.url)
        if obj.video_url:
            return format_html('<a href="{}" target="_blank">Watch Video</a>', obj.video_url)
        return "-"
    video_preview.short_description = 'Preview'


class PropertyDocumentInline(admin.TabularInline):
    model = PropertyDocument
    extra = 1
    fields = ('document_type', 'title', 'description')
    
    def file_link(self, obj):
        if obj.file and hasattr(obj.file, 'url'):
            return format_html('<a href="{}" target="_blank">Download</a>', obj.file.url)
        return "-"


class PropertyReviewInline(admin.TabularInline):
    model = PropertyReview
    extra = 0
    fields = ('user', 'rating', 'comment', 'created_at')
    readonly_fields = ('created_at',)
    can_delete = True


class PropertyInquiryInline(admin.TabularInline):
    model = PropertyInquiry
    extra = 0
    fields = ('name', 'email', 'inquiry_type', 'message', 'is_read', 'created_at')
    readonly_fields = ('created_at',)
    can_delete = True


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'title', 'property_type', 'transaction_type', 
                   'price', 'city', 'is_available', 'is_verified', 'is_boosted', 
                   'views_count', 'created_at')
    list_display_links = ('id_short', 'title')
    list_filter = ('property_type', 'transaction_type', 'city', 'district', 
                  'is_available', 'is_verified', 'is_boosted', 'furnishing_status')
    search_fields = ('title', 'description', 'address', 'city', 'district', 
                    'owner__username', 'owner__email')
    readonly_fields = ('id', 'created_at', 'expires_at', 'views_count', 'likes_count', 'shares_count')
    inlines = [PropertyImageInline, PropertyVideoInline, PropertyDocumentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'title', 'description', 'property_type', 'transaction_type', 'price')
        }),
        ('Location', {
            'fields': ('address', 'city', 'district', 'latitude', 'longitude')
        }),
        ('Features', {
            'fields': ('bedrooms', 'bathrooms', 'square_meters', 'year_built', 
                      'furnishing_status', 'parking_type', 'parking_spaces')
        }),
        ('Media', {
            'fields': ('video_url', 'video_file', 'virtual_tour_url'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_available', 'is_verified', 'is_boosted', 'boost_level', 
                      'boosted_until', 'views_count', 'likes_count', 'shares_count', 
                      'created_at', 'expires_at')
        }),
    )
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    
    def get_queryset(self, request):
        return super().get_queryset(request)


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'property', 'is_main', 'order', 'created_at')
    list_filter = ('is_main', 'created_at')
    search_fields = ('property__title',)
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'


@admin.register(PropertyVideo)
class PropertyVideoAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'property', 'title', 'is_main', 'order', 'created_at')
    list_filter = ('is_main', 'created_at')
    search_fields = ('property__title', 'title')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'


@admin.register(PropertyDocument)
class PropertyDocumentAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'property', 'document_type', 'title', 'uploaded_at')
    list_filter = ('document_type', 'uploaded_at')
    search_fields = ('property__title', 'title')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'


@admin.register(PropertyLike)
class PropertyLikeAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'user', 'property', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'property__title')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'


@admin.register(PropertyView)
class PropertyViewAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'property', 'user', 'ip_address', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('property__title', 'ip_address')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'


@admin.register(PropertyReview)
class PropertyReviewAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'property', 'user', 'rating', 'comment_preview', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('property__title', 'user__username', 'comment')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment'


@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'property', 'name', 'email', 'inquiry_type', 'is_read', 'created_at')
    list_filter = ('inquiry_type', 'is_read', 'is_replied', 'created_at')
    search_fields = ('property__title', 'name', 'email', 'message')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'