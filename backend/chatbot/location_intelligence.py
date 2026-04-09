# chatbot/location_intelligence.py
from django.core.cache import cache
from django.db import models
from django.db.models import Q, Count, Value, CharField
from django.db.models.functions import Concat, Lower, Trim
from properties.models import Property
from services.models import Service, ServiceBooking
from django.contrib.auth import get_user_model
import re
import time
from typing import Dict, List, Set, Tuple
import difflib
from collections import Counter

User = get_user_model()

class DynamicLocationIntelligence:
    """Dynamically learns locations from database - ZERO hardcoding!"""
    
    def __init__(self):
        self._location_cache = None
        self._last_refresh = None
    
    def get_all_locations(self, force_refresh: bool = False) -> List[str]:
        """Get all unique locations from database - completely dynamic"""
        
        # Cache for 5 minutes
        if not force_refresh and self._location_cache and self._last_refresh:
            if time.time() - self._last_refresh < 300:
                return self._location_cache
        
        locations = set()
        
        # 1. Extract from Property model
        self._extract_from_properties(locations)
        
        # 2. Extract from Service model
        self._extract_from_services(locations)
        
        # 3. Extract from ServiceBooking addresses
        self._extract_from_service_bookings(locations)
        
        # 4. Extract from User profiles
        self._extract_from_users(locations)
        
        # Clean and filter locations
        cleaned_locations = self._clean_locations(locations)
        
        self._location_cache = sorted(list(cleaned_locations))
        self._last_refresh = time.time()
        
        return self._location_cache
    
    def _extract_from_properties(self, locations: Set):
        """Extract locations from Property model"""
        # Get all unique cities and districts
        property_data = Property.objects.filter(
            is_available=True
        ).exclude(
            Q(city__isnull=True) | Q(city__exact='')
        ).values_list('city', 'district').distinct()
        
        for city, district in property_data:
            if city and isinstance(city, str) and city.strip():
                locations.add(city.strip().lower())
            if district and isinstance(district, str) and district.strip():
                locations.add(district.strip().lower())
        
        # Also get from address field if it exists
        if hasattr(Property, 'address'):
            addresses = Property.objects.filter(
                is_available=True,
                address__isnull=False
            ).exclude(address__exact='').values_list('address', flat=True)[:500]
            
            for address in addresses:
                if address:
                    self._extract_location_from_text(address, locations)
    
    def _extract_from_services(self, locations: Set):
        """Extract locations from Service model"""
        services = Service.objects.filter(is_active=True)
        
        for service in services:
            # Check provider field
            if service.provider:
                self._extract_location_from_text(service.provider, locations)
            
            # Check description
            if service.description:
                self._extract_location_from_text(service.description, locations)
            
            # Check name
            if service.name:
                self._extract_location_from_text(service.name, locations)
    
    def _extract_from_service_bookings(self, locations: Set):
        """Extract locations from booking addresses"""
        bookings = ServiceBooking.objects.filter(
            address__isnull=False
        ).exclude(address__exact='').values_list('address', flat=True)[:500]
        
        for address in bookings:
            if address:
                self._extract_location_from_text(address, locations)
    
    def _extract_from_users(self, locations: Set):
        """Extract locations from User profiles"""
        # Try different possible field names
        location_fields = ['city', 'district', 'location', 'address', 'area', 'town']
        
        for field in location_fields:
            if hasattr(User, field):
                values = User.objects.filter(
                    **{f"{field}__isnull": False}
                ).exclude(
                    **{f"{field}__exact": ""}
                ).values_list(field, flat=True).distinct()[:500]
                
                for value in values:
                    if value and isinstance(value, str):
                        self._extract_location_from_text(value, locations)
    
    def _extract_location_from_text(self, text: str, locations: Set):
        """Extract potential location names from text"""
        if not text or not isinstance(text, str):
            return
        
        text_lower = text.lower()
        
        # Look for capitalized words (potential location names)
        words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        
        for word in words:
            word_lower = word.lower()
            # Skip common non-location words
            skip_words = {'Service', 'Company', 'Limited', 'Ltd', 'Property', 'Home', 
                         'House', 'Apartment', 'Cleaning', 'Moving', 'Plumbing', 
                         'Electrical', 'Painting', 'Renovation', 'Professional'}
            
            if word not in skip_words and len(word) > 2:
                locations.add(word_lower)
        
        # Also look for patterns like "in Kampala", "at Entebbe", "near Jinja"
        patterns = [
            r'\b(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',
            r'\b(?:located in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                locations.add(match.lower())
    
    def _clean_locations(self, locations: Set) -> Set:
        """Clean and filter valid locations"""
        cleaned = set()
        
        # Common non-location words to filter out
        filters = {
            'service', 'services', 'company', 'limited', 'ltd', 'property', 'properties',
            'home', 'house', 'apartment', 'cleaning', 'moving', 'plumbing', 'electrical',
            'painting', 'renovation', 'professional', 'quality', 'affordable', 'best',
            'expert', 'trusted', 'reliable', 'since', 'years', 'experience', 'contact',
            'phone', 'email', 'address', 'working', 'hours', 'booking', 'bookings',
            'null', 'none', 'true', 'false', 'yes', 'no', 'available', 'active',
            'standard', 'premium', 'basic', 'package', 'offer', 'special', 'discount'
        }
        
        for loc in locations:
            if not loc or not isinstance(loc, str):
                continue
            
            loc_clean = loc.strip().lower()
            
            # Skip if too short or too long
            if len(loc_clean) < 3 or len(loc_clean) > 50:
                continue
            
            # Skip if contains numbers
            if re.search(r'\d', loc_clean):
                continue
            
            # Skip common filter words
            if loc_clean in filters:
                continue
            
            # Skip if it's just a single word that's a common term
            if len(loc_clean.split()) == 1 and loc_clean in filters:
                continue
            
            # Capitalize properly
            capitalized = ' '.join(word.capitalize() for word in loc_clean.split())
            cleaned.add(capitalized)
        
        return cleaned
    
    def extract_locations_from_message(self, message: str) -> List[Dict]:
        """Extract locations from user message using database locations"""
        message_lower = message.lower()
        found_locations = []
        
        # Get all real locations from DB
        all_locations = self.get_all_locations()
        
        if not all_locations:
            return []
        
        # Sort by length (longest first) to match multi-word locations first
        all_locations_sorted = sorted(all_locations, key=len, reverse=True)
        
        # Exact matching
        for location in all_locations_sorted:
            location_lower = location.lower()
            if location_lower in message_lower:
                # Check if it's a whole word match
                pattern = r'\b' + re.escape(location_lower) + r'\b'
                if re.search(pattern, message_lower):
                    found_locations.append({
                        'name': location,
                        'original': location,
                        'confidence': 1.0,
                        'type': 'exact'
                    })
        
        # If no exact matches, try fuzzy matching
        if not found_locations:
            words = re.findall(r'\b[a-z]{3,}\b', message_lower)
            for word in words:
                matches = difflib.get_close_matches(word, [loc.lower() for loc in all_locations], n=1, cutoff=0.8)
                if matches:
                    original_location = [loc for loc in all_locations if loc.lower() == matches[0]][0]
                    found_locations.append({
                        'name': original_location,
                        'original': word,
                        'confidence': 0.85,
                        'type': 'fuzzy'
                    })
        
        # Remove duplicates
        seen = set()
        unique_locations = []
        for loc in found_locations:
            if loc['name'] not in seen:
                seen.add(loc['name'])
                unique_locations.append(loc)
        
        return unique_locations[:5]
    
    def get_popular_locations(self, limit: int = 10) -> List[Dict]:
        """Get most popular locations based on property count"""
        from properties.models import Property
        
        # Count properties by city
        city_counts = Property.objects.filter(
            is_available=True,
            city__isnull=False
        ).exclude(city__exact='').values('city').annotate(
            count=Count('id')
        ).order_by('-count')[:limit]
        
        # Count properties by district
        district_counts = Property.objects.filter(
            is_available=True,
            district__isnull=False
        ).exclude(district__exact='').values('district').annotate(
            count=Count('id')
        ).order_by('-count')[:limit]
        
        # Combine and sort
        location_counts = {}
        
        for item in city_counts:
            if item['city']:
                location_counts[item['city']] = location_counts.get(item['city'], 0) + item['count']
        
        for item in district_counts:
            if item['district']:
                location_counts[item['district']] = location_counts.get(item['district'], 0) + item['count']
        
        # Sort by count
        sorted_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)
        
        results = []
        for name, count in sorted_locations[:limit]:
            results.append({
                'name': name,
                'property_count': count,
                'type': 'city' if name in [c['city'] for c in city_counts if c['city']] else 'district'
            })
        
        return results
    
    def get_location_stats(self, location: str) -> Dict:
        """Get statistics for a specific location"""
        from properties.models import Property
        
        location_lower = location.lower()
        
        # Count properties
        property_count = Property.objects.filter(
            Q(city__iexact=location_lower) | 
            Q(district__iexact=location_lower),
            is_available=True
        ).count()
        
        # Price statistics
        price_stats = Property.objects.filter(
            Q(city__iexact=location_lower) | 
            Q(district__iexact=location_lower),
            is_available=True
        ).aggregate(
            min_price=models.Min('price'),
            max_price=models.Max('price'),
            avg_price=models.Avg('price')
        )
        
        # Property types
        property_types = Property.objects.filter(
            Q(city__iexact=location_lower) | 
            Q(district__iexact=location_lower),
            is_available=True
        ).values_list('property_type', flat=True).distinct()
        
        return {
            'location': location,
            'property_count': property_count,
            'min_price': float(price_stats['min_price']) if price_stats['min_price'] else 0,
            'max_price': float(price_stats['max_price']) if price_stats['max_price'] else 0,
            'avg_price': float(price_stats['avg_price']) if price_stats['avg_price'] else 0,
            'property_types': list(property_types)
        }