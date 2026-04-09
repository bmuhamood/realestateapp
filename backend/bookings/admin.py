from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'visit_date', 'status', 'booking_fee', 'created_at')
    list_filter = ('status', 'visit_date', 'created_at')
    search_fields = ('user__username', 'property__title')
    readonly_fields = ('booking_fee', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Booking Info', {
            'fields': ('user', 'property', 'visit_date', 'message')
        }),
        ('Status & Payment', {
            'fields': ('status', 'booking_fee')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['confirm_bookings', 'cancel_bookings']
    
    def confirm_bookings(self, request, queryset):
        queryset.update(status='confirmed')
        self.message_user(request, f"{queryset.count()} bookings confirmed")
    confirm_bookings.short_description = "Confirm selected bookings"
    
    def cancel_bookings(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, f"{queryset.count()} bookings cancelled")
    cancel_bookings.short_description = "Cancel selected bookings"