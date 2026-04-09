# chatbot/apps.py
from django.apps import AppConfig
from django.core.cache import cache
import threading
import time

class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'
    
    def ready(self):
        # Start background thread to refresh location cache periodically
        if not self._is_refresh_scheduled():
            self._schedule_location_refresh()
    
    def _is_refresh_scheduled(self):
        """Check if refresh is already scheduled"""
        return hasattr(self, '_refresh_thread')
    
    def _schedule_location_refresh(self):
        """Schedule periodic location cache refresh"""
        def refresh_loop():
            while True:
                time.sleep(300)  # Refresh every 5 minutes
                try:
                    from .location_intelligence import DynamicLocationIntelligence
                    location_intel = DynamicLocationIntelligence()
                    location_intel.get_all_locations(force_refresh=True)
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Location cache refreshed")
                except Exception as e:
                    print(f"Location refresh error: {e}")
        
        self._refresh_thread = threading.Thread(target=refresh_loop, daemon=True)
        self._refresh_thread.start()