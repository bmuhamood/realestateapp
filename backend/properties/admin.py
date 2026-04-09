from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from .models import Property, PropertyImage, PropertyLike, PropertyView
from django.db.models import Count, Q

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'price', 'property_type', 'transaction_type', 
                   'is_available', 'is_verified', 'is_boosted', 'views_count', 'likes_count', 'created_at')
    list_filter = ('property_type', 'transaction_type', 'is_available', 'is_verified', 'is_boosted', 'city')
    search_fields = ('title', 'address', 'owner__username', 'owner__email')
    readonly_fields = ('views_count', 'likes_count', 'shares_count', 'created_at')
    list_editable = ('is_available', 'is_verified')
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('owner', 'title', 'description', 'property_type', 'transaction_type')
        }),
        ('Pricing & Details', {
            'fields': ('price', 'bedrooms', 'bathrooms', 'square_meters')
        }),
        ('Location', {
            'fields': ('address', 'city', 'district', 'latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('is_available', 'is_verified')
        }),
        ('Boost/Featured', {
            'fields': ('is_boosted', 'boosted_until', 'boost_level', 'boost_price_paid'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('views_count', 'likes_count', 'shares_count'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_properties', 'mark_as_available', 'mark_as_featured']
    
    def verify_properties(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"{updated} properties verified.")
    verify_properties.short_description = "Verify selected properties"
    
    def mark_as_available(self, request, queryset):
        updated = queryset.update(is_available=True)
        self.message_user(request, f"{updated} properties marked as available.")
    mark_as_available.short_description = "Mark as available"
    
    def mark_as_featured(self, request, queryset):
        updated = queryset.update(is_boosted=True, boosted_until=timezone.now() + timedelta(days=7))
        self.message_user(request, f"{updated} properties boosted/featured.")
    mark_as_featured.short_description = "Boost/Feature selected properties"

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'image_preview', 'is_main', 'order', 'created_at')
    list_filter = ('is_main',)
    search_fields = ('property__title',)
    list_editable = ('is_main', 'order')
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 4px;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Preview'

@admin.register(PropertyLike)
class PropertyLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'property__title')

@admin.register(PropertyView)
class PropertyViewAdmin(admin.ModelAdmin):
    list_display = ('property', 'user', 'ip_address', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('property__title', 'user__username', 'ip_address')