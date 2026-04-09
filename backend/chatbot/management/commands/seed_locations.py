# chatbot/management/commands/seed_locations.py
from django.core.management.base import BaseCommand
from django.utils import timezone  # Add this import
from properties.models import Property
from services.models import Service, ServiceBooking
from django.contrib.auth import get_user_model
import re
import os
import json
from collections import Counter

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial location data from existing database records'
    
    def handle(self, *args, **options):
        self.stdout.write('🔍 Extracting locations from existing data...')
        
        locations = set()
        
        # 1. Extract from Properties
        self.stdout.write('  📍 Checking properties...')
        properties = Property.objects.filter(is_available=True)
        prop_count = 0
        
        for prop in properties:
            if prop.city and prop.city.strip():
                locations.add(prop.city.strip())
                prop_count += 1
            if prop.district and prop.district.strip():
                locations.add(prop.district.strip())
                prop_count += 1
        
        self.stdout.write(f"     Found {prop_count} location entries from properties")
        
        # 2. Extract from Services (provider field)
        self.stdout.write('  🔧 Checking services...')
        services = Service.objects.filter(is_active=True)
        service_count = 0
        
        # Common Ugandan locations to help with extraction
        common_locations = [
            'kampala', 'wakiso', 'entebbe', 'jinja', 'mukono', 'ntinda', 'kololo',
            'naguru', 'bugolobi', 'muyenga', 'kira', 'gayaza', 'bweyogerere', 'kajjansi',
            'mbale', 'gulu', 'mbarara', 'masaka', 'fort portal', 'arua', 'lira', 'soroti'
        ]
        
        for service in services:
            # Check provider field
            if service.provider:
                provider_lower = service.provider.lower()
                for location in common_locations:
                    if location in provider_lower:
                        locations.add(location.capitalize())
                        service_count += 1
            
            # Check description for location mentions
            if service.description:
                desc_lower = service.description.lower()
                patterns = [
                    r'\b(?:in|at|near|around|based in|located in)\s+([a-z]+)\b',
                ]
                for pattern in patterns:
                    matches = re.findall(pattern, desc_lower)
                    for match in matches:
                        if match in common_locations:
                            locations.add(match.capitalize())
                            service_count += 1
        
        self.stdout.write(f"     Found {service_count} location references from services")
        
        # 3. Extract from ServiceBookings (address field)
        self.stdout.write('  📅 Checking service bookings...')
        bookings = ServiceBooking.objects.filter(address__isnull=False).exclude(address__exact='')
        booking_count = 0
        
        for booking in bookings[:500]:
            if booking.address:
                address_lower = booking.address.lower()
                for location in common_locations:
                    if location in address_lower:
                        locations.add(location.capitalize())
                        booking_count += 1
        
        self.stdout.write(f"     Found {booking_count} location references from bookings")
        
        # 4. Extract from User profiles
        self.stdout.write('  👤 Checking user profiles...')
        user_count = 0
        
        location_fields = ['city', 'district', 'location', 'address', 'area']
        
        for field in location_fields:
            if hasattr(User, field):
                users = User.objects.filter(
                    **{f"{field}__isnull": False}
                ).exclude(
                    **{f"{field}__exact": ""}
                )[:500]
                
                for user in users:
                    value = getattr(user, field)
                    if value and isinstance(value, str):
                        value_lower = value.lower()
                        for location in common_locations:
                            if location in value_lower:
                                locations.add(location.capitalize())
                                user_count += 1
        
        self.stdout.write(f"     Found {user_count} location references from users")
        
        # Clean and sort locations
        cleaned_locations = set()
        for loc in locations:
            if loc and isinstance(loc, str) and len(loc) > 2:
                skip_words = ['Service', 'Company', 'Limited', 'Ltd', 'Property', 'Home']
                if loc not in skip_words:
                    cleaned_locations.add(loc.strip())
        
        # Save to cache
        from django.core.cache import cache
        sorted_locations = sorted(list(cleaned_locations))
        cache.set('all_locations', sorted_locations, timeout=3600)
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Successfully extracted {len(sorted_locations)} unique locations from database!'
        ))
        
        # Print sample
        if sorted_locations:
            self.stdout.write('\n📍 Sample locations found:')
            for loc in sorted_locations[:20]:
                self.stdout.write(f"  • {loc}")
        
        # Save to a JSON file for reference
        from django.conf import settings
        
        locations_dir = os.path.join(settings.BASE_DIR, 'chatbot', 'data')
        os.makedirs(locations_dir, exist_ok=True)
        
        locations_file = os.path.join(locations_dir, 'locations.json')
        
        with open(locations_file, 'w') as f:
            json.dump({
                'locations': sorted_locations,
                'total_count': len(sorted_locations),
                'last_updated': timezone.now().isoformat()  # Fixed: use timezone.now().isoformat()
            }, f, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'\n💾 Locations saved to: {locations_file}'))
        
        # Show statistics
        self.stdout.write('\n📊 Statistics:')
        self.stdout.write(f"  • Total unique locations: {len(sorted_locations)}")
        self.stdout.write(f"  • From properties: {prop_count}")
        self.stdout.write(f"  • From services: {service_count}")
        self.stdout.write(f"  • From bookings: {booking_count}")
        self.stdout.write(f"  • From users: {user_count}")