from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User, Follow

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone', 'is_agent', 'is_verified', 'profile_image', 'created_at')
    list_filter = ('is_agent', 'is_verified', 'is_active')
    search_fields = ('username', 'email', 'phone')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('phone', 'is_agent', 'is_verified', 'verification_document', 
                      'profile_picture', 'bio', 'location', 'district', 'city', 
                      'followers_count', 'following_count')
        }),
    )
    
    def profile_image(self, obj):
        if obj.profile_picture:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', 
                             obj.profile_picture.url)
        return "No Image"
    profile_image.short_description = 'Profile Image'

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'following', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('follower__username', 'following__username')
    