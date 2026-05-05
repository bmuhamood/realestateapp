# bookings/admin.py - UPDATED VERSION

from django.contrib import admin
from .models import Booking, BookingHistory


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    # ✅ Changed 'property' to 'property_obj'
    list_display = ('id', 'user', 'property_obj', 'visit_date', 'status', 'booking_fee', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'property_obj__title')  # ✅ Changed 'property__title' to 'property_obj__title'
    readonly_fields = ('id', 'booking_fee', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Booking Info', {
            'fields': ('id', 'user', 'property_obj', 'visit_date', 'message')  # ✅ Changed 'property' to 'property_obj'
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
        updated = queryset.update(status='confirmed')
        self.message_user(request, f"{updated} bookings confirmed")
    confirm_bookings.short_description = "Confirm selected bookings"
    
    def cancel_bookings(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f"{updated} bookings cancelled")
    cancel_bookings.short_description = "Cancel selected bookings"


@admin.register(BookingHistory)
class BookingHistoryAdmin(admin.ModelAdmin):
    list_display = ('booking', 'action', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('booking__user__username', 'notes')
    readonly_fields = ('id', 'created_at')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False