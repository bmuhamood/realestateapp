# chatbot/middleware.py
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from .dynamic_topics import DynamicTopicExtractor
import threading
import time

class DynamicTopicsMiddleware(MiddlewareMixin):
    """Automatically refresh topics periodically"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.last_refresh = 0
        self.refresh_interval = 300  # 5 minutes
        self.start_background_refresh()
    
    def start_background_refresh(self):
        """Start background thread to refresh topics"""
        def refresh_worker():
            while True:
                time.sleep(self.refresh_interval)
                try:
                    extractor = DynamicTopicExtractor()
                    topics = extractor.get_all_dynamic_topics(force_refresh=True)
                    cache.set('dynamic_topics', topics, timeout=3600)
                    print(f"🔄 Dynamic topics refreshed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
                except Exception as e:
                    print(f"❌ Failed to refresh topics: {e}")
        
        thread = threading.Thread(target=refresh_worker, daemon=True)
        thread.start()
    
    def process_request(self, request):
        # Ensure topics are fresh on each request if needed
        if time.time() - self.last_refresh > self.refresh_interval:
            self.last_refresh = time.time()
            # Trigger refresh in background (non-blocking)
            threading.Thread(
                target=lambda: DynamicTopicExtractor().get_all_dynamic_topics(force_refresh=True),
                daemon=True
            ).start()
        
        return None