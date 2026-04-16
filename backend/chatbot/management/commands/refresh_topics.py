# chatbot/management/commands/refresh_topics.py
from django.core.management.base import BaseCommand
from chatbot.dynamic_topics import DynamicTopicExtractor
from django.core.cache import cache

class Command(BaseCommand):
    help = 'Refresh dynamic topics from database'
    
    def handle(self, *args, **options):
        self.stdout.write("Refreshing dynamic topics...")
        
        extractor = DynamicTopicExtractor()
        topics = extractor.get_all_dynamic_topics(force_refresh=True)
        
        self.stdout.write(self.style.SUCCESS(f"""
        ✅ Topics refreshed successfully!
        
        Locations found: {len(topics.get('location', []))}
        Property types: {len(topics.get('property_type', []))}
        Service types: {len(topics.get('service', []))}
        Amenities found: {len(topics.get('amenities', []))}
        Features found: {len(topics.get('features', []))}
        """))
        
        # Store in cache for quick access
        cache.set('dynamic_topics', topics, timeout=3600)