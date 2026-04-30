# users/admin.py - SIMPLE WORKING VERSION

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from .models import User, Follow, Status, StatusView


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone', 'is_agent', 'is_service_provider', 
                   'is_verified', 'created_at')
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