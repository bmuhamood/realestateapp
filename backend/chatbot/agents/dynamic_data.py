# chatbot/agents/dynamic_data.py - OPTIMIZED VERSION
from django.db.models import Q, Count, Avg, Min, Max
from django.utils import timezone
from django.core.cache import cache
from properties.models import Property
import re
from collections import Counter

class DynamicDataProvider:
    """Cached dynamic data provider - NO DELAYS"""
    
    @classmethod
    def get_all_locations(cls, force_refresh: bool = False) -> list:
        """Get locations from cache (5 min TTL)"""
        cache_key = 'all_locations'
        locations = cache.get(cache_key)
        
        if locations is None or force_refresh:
            location_set = set()
            
            cities = Property.objects.filter(
                is_available=True,
                expires_at__gt=timezone.now(),
                city__isnull=False
            ).exclude(city__exact='').values_list('city', flat=True).distinct()
            
            for city in cities:
                if city:
                    location_set.add(city.lower())
            
            districts = Property.objects.filter(
                is_available=True,
                expires_at__gt=timezone.now(),
                district__isnull=False
            ).exclude(district__exact='').values_list('district', flat=True).distinct()
            
            for district in districts:
                if district:
                    location_set.add(district.lower())
            
            locations = sorted(list(location_set))
            cache.set(cache_key, locations, 300)  # 5 minutes
        
        return locations
    
    @classmethod
    def get_property_types(cls) -> list:
        """Get property types from cache"""
        cache_key = 'property_types'
        types = cache.get(cache_key)
        
        if types is None:
            type_set = set()
            property_types = Property.objects.filter(
                is_available=True,
                property_type__isnull=False
            ).exclude(property_type__exact='').values_list('property_type', flat=True).distinct()
            
            for pt in property_types:
                if pt:
                    type_set.add(pt)
            
            types = sorted(list(type_set))
            cache.set(cache_key, types, 300)
        
        return types
    
    @classmethod
    def get_location_stats(cls, location: str) -> dict:
        """Get location stats from cache"""
        cache_key = f'location_stats_{location.lower()}'
        stats = cache.get(cache_key)
        
        if stats is None:
            queryset = Property.objects.filter(
                Q(city__icontains=location) | Q(district__icontains=location),
                is_available=True,
                expires_at__gt=timezone.now()
            )
            
            stats = queryset.aggregate(
                count=Count('id'),
                min_price=Min('price'),
                max_price=Max('price'),
                avg_price=Avg('price')
            )
            
            stats = {
                'count': stats['count'] or 0,
                'min_price': float(stats['min_price']) if stats['min_price'] else 0,
                'max_price': float(stats['max_price']) if stats['max_price'] else 0,
                'avg_price': float(stats['avg_price']) if stats['avg_price'] else 0,
            }
            cache.set(cache_key, stats, 300)
        
        return stats
    
    @classmethod
    def get_popular_locations(cls, limit: int = 5) -> list:
        """Get popular locations from cache"""
        cache_key = f'popular_locations_{limit}'
        popular = cache.get(cache_key)
        
        if popular is None:
            counter = Counter()
            properties = Property.objects.filter(is_available=True, expires_at__gt=timezone.now())
            
            for prop in properties:
                if prop.city:
                    counter[prop.city] += 1
                if prop.district:
                    counter[prop.district] += 1
            
            popular = [loc for loc, count in counter.most_common(limit)]
            cache.set(cache_key, popular, 300)
        
        return popular
    
    @classmethod
    def extract_locations_from_text(cls, text: str) -> list:
        """Fast location extraction using cached locations"""
        text_lower = text.lower()
        found = []
        all_locations = cls.get_all_locations()
        
        for location in all_locations:
            if location in text_lower:
                found.append(location.title())
                if len(found) >= 2:  # Limit to 2 locations
                    break
        
        return found
    
    @classmethod
    def extract_bedrooms(cls, text: str) -> int:
        """Fast bedroom extraction"""
        match = re.search(r'(\d+)\s*(?:bedroom|bed|br)', text.lower())
        return int(match.group(1)) if match else None
    
    @classmethod
    def extract_price_max(cls, text: str) -> float:
        """Fast price extraction"""
        match = re.search(r'under\s+(\d+(?:\.\d+)?)\s*(?:m|million)?', text.lower())
        if match:
            num = float(match.group(1))
            if 'million' in match.group(0) or 'm' in match.group(0):
                num *= 1_000_000
            return num
        return None