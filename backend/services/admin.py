# services/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db.models import Count, Avg, Q
from .models import ServiceCategory, Service, ServiceGalleryImage, ServiceBooking, ServiceReview

# Inline for Gallery Images
class ServiceGalleryImageInline(admin.TabularInline):
    model = ServiceGalleryImage
    extra = 1
    fields = ('image', 'order', 'is_main')
    readonly_fields = ('preview',)
    
    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.image.url)
        return "-"
    preview.short_description = 'Preview'


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'service_count', 'order', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('order', 'is_active')
    list_per_page = 20
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'icon', 'description', 'image')
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active')
        }),
    )
    
    def service_count(self, obj):
        count = obj.services.filter(is_active=True).count()
        return format_html(
            '<span style="background-color: #4caf50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">{}</span>',
            count
        )
    service_count.short_description = 'Active Services'
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            service_count=Count('services', filter=Q(services__is_active=True))
        )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'service_type_display', 'price_display', 'provider', 
                   'rating_display', 'is_featured', 'is_active', 'bookings_count')
    list_filter = ('category', 'service_type', 'is_featured', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'provider', 'provider_phone', 'provider_email')
    list_editable = ('is_featured', 'is_active')
    list_per_page = 20
    readonly_fields = ('rating', 'reviews_count', 'created_at', 'updated_at', 'preview_image')
    
    # Add the inline for gallery images
    inlines = [ServiceGalleryImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'service_type', 'name', 'description', 'image', 'preview_image')
        }),
        ('Pricing & Duration', {
            'fields': ('price', 'price_unit', 'duration'),
            'classes': ('wide',)
        }),
        ('Provider Information', {
            'fields': ('provider', 'provider_phone', 'provider_email'),
            'classes': ('collapse',)
        }),
        ('Display Settings', {
            'fields': ('is_featured', 'is_active'),
        }),
        ('Statistics', {
            'fields': ('rating', 'reviews_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def service_type_display(self, obj):
        type_labels = {
            'decoration': '🎨 Decoration',
            'cleaning': '🧹 Cleaning',
            'moving': '🚚 Moving',
            'renovation': '🔨 Renovation',
            'furniture': '🛋️ Furniture',
            'security': '🔒 Security',
            'landscaping': '🌿 Landscaping',
            'maintenance': '🔧 Maintenance',
            'interior_design': '🎨 Interior Design',
            'electrical': '⚡ Electrical',
            'plumbing': '💧 Plumbing',
            'painting': '🖌️ Painting',
            'other': '📦 Other',
        }
        label = type_labels.get(obj.service_type, obj.service_type)
        return mark_safe(f'<span style="background-color: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 11px;">{label}</span>')
    service_type_display.short_description = 'Service Type'
    
    def price_display(self, obj):
        if obj.price:
            price_value = float(obj.price)
            html = f'<span style="color: #F97316; font-weight: bold;">UGX {price_value:,.0f}</span>'
            if obj.price_unit:
                html += f' /{obj.price_unit}'
            return mark_safe(html)
        return '-'
    price_display.short_description = 'Price'
    
    def rating_display(self, obj):
        if obj.rating:
            rating_value = float(obj.rating) if not isinstance(obj.rating, (int, float)) else obj.rating
            full_stars = int(rating_value)
            stars = '★' * full_stars + '☆' * (5 - full_stars)
            return mark_safe(f'<span style="color: #fbbf24;">{stars}</span> <span style="color: #64748b;">({rating_value:.1f})</span>')
        return 'No ratings'
    rating_display.short_description = 'Rating'
    
    def preview_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 80px; max-width: 80px; border-radius: 8px;" />',
                obj.image.url
            )
        return "No Image"
    preview_image.short_description = 'Preview'
    
    def bookings_count(self, obj):
        count = obj.bookings.count()
        return mark_safe(f'<span style="background-color: #2196f3; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">{count}</span>')
    bookings_count.short_description = 'Bookings'
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            bookings_count=Count('bookings')
        )
    
    actions = ['mark_as_featured', 'mark_as_active', 'mark_as_inactive']
    
    def mark_as_featured(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} services marked as featured.")
    mark_as_featured.short_description = "Mark selected services as featured"
    
    def mark_as_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} services activated.")
    mark_as_active.short_description = "Activate selected services"
    
    def mark_as_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} services deactivated.")
    mark_as_inactive.short_description = "Deactivate selected services"


@admin.register(ServiceBooking)
class ServiceBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_display', 'service_display', 'booking_date_display', 
                   'status_display', 'total_price_display', 'created_at')
    list_filter = ('status', 'created_at', 'booking_date')
    search_fields = ('user__username', 'user__email', 'service__name', 'address')
    readonly_fields = ('created_at', 'updated_at', 'total_price')
    list_per_page = 20
    date_hierarchy = 'booking_date'
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('user', 'service', 'booking_date', 'address', 'special_instructions')
        }),
        ('Payment & Status', {
            'fields': ('status', 'total_price')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_display(self, obj):
        return mark_safe(f'<strong>{obj.user.username}</strong><br/><span style="color: #64748b; font-size: 11px;">{obj.user.email}</span>')
    user_display.short_description = 'User'
    
    def service_display(self, obj):
        category_name = obj.service.category.name if obj.service.category else '-'
        return mark_safe(f'<strong>{obj.service.name}</strong><br/><span style="color: #F97316;">{category_name}</span>')
    service_display.short_description = 'Service'
    
    def booking_date_display(self, obj):
        return mark_safe(f'<strong>{obj.booking_date.strftime("%b %d, %Y")}</strong><br/><span style="color: #64748b;">{obj.booking_date.strftime("%I:%M %p")}</span>')
    booking_date_display.short_description = 'Booking Date'
    
    def status_display(self, obj):
        colors = {
            'pending': '#ff9800',
            'confirmed': '#4caf50',
            'in_progress': '#2196f3',
            'completed': '#9c27b0',
            'cancelled': '#f44336',
        }
        color = colors.get(obj.status, '#757575')
        status_text = obj.status.replace('_', ' ').title()
        return mark_safe(f'<span style="background-color: {color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">{status_text}</span>')
    status_display.short_description = 'Status'
    
    def total_price_display(self, obj):
        price_value = float(obj.total_price) if obj.total_price else 0
        return mark_safe(f'<span style="color: #F97316; font-weight: bold;">UGX {price_value:,.0f}</span>')
    total_price_display.short_description = 'Total Price'
    
    actions = ['confirm_bookings', 'start_service', 'complete_service', 'cancel_bookings']
    
    def confirm_bookings(self, request, queryset):
        updated = queryset.update(status='confirmed')
        self.message_user(request, f"{updated} bookings confirmed.")
    confirm_bookings.short_description = "Confirm selected bookings"
    
    def start_service(self, request, queryset):
        updated = queryset.update(status='in_progress')
        self.message_user(request, f"{updated} bookings marked as in progress.")
    start_service.short_description = "Mark as in progress"
    
    def complete_service(self, request, queryset):
        updated = queryset.update(status='completed')
        self.message_user(request, f"{updated} bookings marked as completed.")
    complete_service.short_description = "Mark as completed"
    
    def cancel_bookings(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f"{updated} bookings cancelled.")
    cancel_bookings.short_description = "Cancel selected bookings"


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_display', 'service_display', 'rating_stars', 
                   'comment_preview', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'service__name', 'comment')
    readonly_fields = ('created_at',)
    list_per_page = 20
    
    fieldsets = (
        ('Review Information', {
            'fields': ('user', 'service', 'rating', 'comment')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def user_display(self, obj):
        return mark_safe(f'<strong>{obj.user.username}</strong><br/><span style="color: #64748b;">{obj.user.email}</span>')
    user_display.short_description = 'User'
    
    def service_display(self, obj):
        category_name = obj.service.category.name if obj.service.category else '-'
        return mark_safe(f'<strong>{obj.service.name}</strong><br/><span style="color: #F97316;">{category_name}</span>')
    service_display.short_description = 'Service'
    
    def rating_stars(self, obj):
        rating_value = float(obj.rating) if not isinstance(obj.rating, (int, float)) else obj.rating
        stars = '★' * rating_value + '☆' * (5 - rating_value)
        return mark_safe(f'<span style="color: #fbbf24; font-size: 14px;">{stars}</span> <span style="color: #64748b;">({rating_value})</span>')
    rating_stars.short_description = 'Rating'
    
    def comment_preview(self, obj):
        return obj.comment[:100] + ('...' if len(obj.comment) > 100 else '')
    comment_preview.short_description = 'Comment'
    
    actions = ['delete_selected_reviews']
    
    def delete_selected_reviews(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} reviews deleted.")
    delete_selected_reviews.short_description = "Delete selected reviews"