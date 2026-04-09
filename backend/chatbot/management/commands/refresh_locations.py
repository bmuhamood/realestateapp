# chatbot/management/commands/refresh_locations.py
from django.core.management.base import BaseCommand
from chatbot.location_intelligence import DynamicLocationIntelligence

class Command(BaseCommand):
    help = 'Refresh location cache from database'
    
    def handle(self, *args, **options):
        self.stdout.write('Refreshing location cache from database...')
        
        location_intel = DynamicLocationIntelligence()
        locations = location_intel.get_all_locations(force_refresh=True)
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully cached {len(locations)} locations from database'
        ))
        
        # Show sample locations
        if locations:
            self.stdout.write('\nSample locations found:')
            for loc in sorted(locations)[:20]:
                self.stdout.write(f"  • {loc}")
        
        # Show popular locations
        popular = location_intel.get_popular_locations(10)
        if popular:
            self.stdout.write('\nMost active locations:')
            for loc in popular:
                self.stdout.write(f"  • {loc['name']}: {loc['property_count']} properties")