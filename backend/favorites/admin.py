# favorites/admin.py - SIMPLE VERSION WITH UUID

from django.contrib import admin
from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'property', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'property__title')
    readonly_fields = ('id', 'created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'property')