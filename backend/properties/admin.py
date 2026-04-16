# properties/admin.py
from django.contrib import admin
from .models import (
    Property, PropertyImage, PropertyVideo, PropertyDocument,
    PropertyLike, PropertyView, PropertyReview, PropertyInquiry
)

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ('image', 'is_main', 'order')

class PropertyVideoInline(admin.TabularInline):
    model = PropertyVideo
    extra = 1
    fields = ('video_file', 'video_url', 'thumbnail', 'title', 'is_main', 'order')

class PropertyDocumentInline(admin.TabularInline):
    model = PropertyDocument
    extra = 1
    fields = ('document_type', 'file', 'title', 'description')

class PropertyReviewInline(admin.TabularInline):
    model = PropertyReview
    extra = 0
    fields = ('user', 'rating', 'comment', 'created_at')
    readonly_fields = ('created_at',)

class PropertyInquiryInline(admin.TabularInline):
    model = PropertyInquiry
    extra = 0
    fields = ('name', 'email', 'inquiry_type', 'message', 'is_read', 'is_replied')
    readonly_fields = ('created_at',)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'property_type', 'transaction_type', 'price', 'city', 'is_available', 'is_verified', 'is_boosted', 'views_count')
    list_filter = ('property_type', 'transaction_type', 'city', 'is_available', 'is_verified', 'is_boosted')
    search_fields = ('title', 'description', 'address', 'city', 'district')
    readonly_fields = ('created_at', 'expires_at', 'views_count', 'likes_count', 'shares_count')
    inlines = [PropertyImageInline, PropertyVideoInline, PropertyDocumentInline, PropertyReviewInline, PropertyInquiryInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'title', 'description', 'property_type', 'transaction_type', 'price')
        }),
        ('Location', {
            'fields': ('address', 'city', 'district', 'latitude', 'longitude')
        }),
        ('Features', {
            'fields': ('bedrooms', 'bathrooms', 'square_meters', 'year_built', 'furnishing_status', 'parking_type', 'parking_spaces')
        }),
        ('Media', {
            'fields': ('video_url', 'video_file', 'video_thumbnail', 'virtual_tour_url'),
            'classes': ('collapse',)
        }),
        ('Neighborhood', {
            'fields': ('neighborhood_name', 'neighborhood_description', 'distance_to_city_center', 'distance_to_airport', 'distance_to_highway'),
            'classes': ('collapse',)
        }),
        ('Schools', {
            'fields': ('nearby_schools', 'distance_to_nearest_school', 'school_rating'),
            'classes': ('collapse',)
        }),
        ('Transportation', {
            'fields': ('nearby_roads', 'nearest_road', 'public_transport', 'nearest_bus_stop', 'nearest_taxi_stage'),
            'classes': ('collapse',)
        }),
        ('Amenities', {
            'fields': ('amenities', 'nearest_mall', 'distance_to_mall', 'nearest_supermarket', 'nearest_market', 'nearest_pharmacy', 'nearest_hospital', 'distance_to_hospital'),
            'classes': ('collapse',)
        }),
        ('Entertainment', {
            'fields': ('nearest_restaurant', 'nearest_cafe', 'nearest_gym', 'nearest_park'),
            'classes': ('collapse',)
        }),
        ('Security', {
            'fields': ('has_security', 'has_cctv', 'has_electric_fence', 'has_security_lights', 'has_security_guards', 'has_gated_community'),
            'classes': ('collapse',)
        }),
        ('Utilities', {
            'fields': ('has_solar', 'has_backup_generator', 'has_water_tank', 'has_borehole', 'has_internet', 'has_cable_tv'),
            'classes': ('collapse',)
        }),
        ('Outdoor', {
            'fields': ('has_garden', 'has_balcony', 'has_terrace', 'has_swimming_pool', 'has_playground', 'has_bbq_area'),
            'classes': ('collapse',)
        }),
        ('Interior', {
            'fields': ('has_air_conditioning', 'has_heating', 'has_fireplace', 'has_modern_kitchen', 'has_walk_in_closet', 'has_study_room'),
            'classes': ('collapse',)
        }),
        ('Restrictions', {
            'fields': ('pets_allowed', 'smoking_allowed'),
            'classes': ('collapse',)
        }),
        ('Legal', {
            'fields': ('has_title_deed', 'title_deed_number', 'land_registration_number'),
            'classes': ('collapse',)
        }),
        ('Contact', {
            'fields': ('agent_phone', 'agent_email', 'viewing_instructions'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_available', 'is_verified', 'is_boosted', 'boost_level', 'boosted_until', 'views_count', 'likes_count', 'shares_count', 'created_at', 'expires_at')
        }),
    )


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'image', 'is_main', 'order')
    list_filter = ('is_main',)
    search_fields = ('property__title',)


@admin.register(PropertyVideo)
class PropertyVideoAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'title', 'is_main', 'order', 'created_at')
    list_filter = ('is_main',)
    search_fields = ('property__title', 'title')


@admin.register(PropertyDocument)
class PropertyDocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'document_type', 'title', 'uploaded_at')
    list_filter = ('document_type',)
    search_fields = ('property__title', 'title')


@admin.register(PropertyLike)
class PropertyLikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'property', 'created_at')
    search_fields = ('user__username', 'property__title')


@admin.register(PropertyView)
class PropertyViewAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'user', 'ip_address', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('property__title', 'ip_address')


@admin.register(PropertyReview)
class PropertyReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'user', 'rating', 'comment_preview', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('property__title', 'user__username', 'comment')
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment'


@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'name', 'email', 'inquiry_type', 'is_read', 'is_replied', 'created_at')
    list_filter = ('inquiry_type', 'is_read', 'is_replied', 'created_at')
    search_fields = ('property__title', 'name', 'email', 'message')