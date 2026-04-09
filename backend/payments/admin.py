from django.contrib import admin
from .models import Payment, BoostPackage

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'reference', 'amount', 'payment_method', 'status', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('user__username', 'reference', 'phone_number')
    readonly_fields = ('reference', 'created_at', 'updated_at')
    
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'phone_number')
        }),
        ('Payment Details', {
            'fields': ('property', 'booking', 'amount', 'payment_method', 'reference')
        }),
        ('Status', {
            'fields': ('status', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_completed', 'mark_as_failed']
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status='completed')
        self.message_user(request, f"{updated} payments marked as completed.")
    mark_as_completed.short_description = "Mark selected payments as completed"
    
    def mark_as_failed(self, request, queryset):
        updated = queryset.update(status='failed')
        self.message_user(request, f"{updated} payments marked as failed.")
    mark_as_failed.short_description = "Mark selected payments as failed"

@admin.register(BoostPackage)
class BoostPackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_days', 'price_formatted', 'priority', 'is_active')
    list_filter = ('is_active', 'priority')
    search_fields = ('name',)
    list_editable = ('is_active', 'priority')
    
    def price_formatted(self, obj):
        return f"UGX {obj.price:,.0f}"
    price_formatted.short_description = 'Price'