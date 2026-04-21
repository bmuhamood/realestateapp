# chatbot/agents/dynamic_data.py - ADD THE MISSING METHOD
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
    def get_popular_locations(cls, limit: int = 5) -> list:
        """Get most popular locations based on property count"""
        cache_key = f'popular_locations_{limit}'
        popular = cache.get(cache_key)
        
        if popular is None:
            # Count properties per location
            location_counts = {}
            
            # Count by city
            city_counts = Property.objects.filter(
                is_available=True,
                expires_at__gt=timezone.now(),
                city__isnull=False
            ).exclude(city__exact='').values('city').annotate(count=Count('id'))
            
            for item in city_counts:
                if item['city']:
                    location_counts[item['city']] = location_counts.get(item['city'], 0) + item['count']
            
            # Count by district
            district_counts = Property.objects.filter(
                is_available=True,
                expires_at__gt=timezone.now(),
                district__isnull=False
            ).exclude(district__exact='').values('district').annotate(count=Count('id'))
            
            for item in district_counts:
                if item['district']:
                    location_counts[item['district']] = location_counts.get(item['district'], 0) + item['count']
            
            # Sort by count and get top locations
            sorted_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)
            popular = [loc for loc, count in sorted_locations[:limit]]
            
            cache.set(cache_key, popular, 300)  # 5 minutes
        
        return popular
    
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
    
    @classmethod
    def get_nearby_areas(cls, location: str) -> list:
        """Get nearby areas based on property data"""
        cache_key = f'nearby_areas_{location.lower()}'
        nearby = cache.get(cache_key)
        
        if nearby is None:
            location_lower = location.lower()
            nearby_set = set()
            
            # Find properties in same district/city cluster
            city_props = Property.objects.filter(
                Q(city__icontains=location_lower) | Q(district__icontains=location_lower),
                is_available=True
            ).values_list('city', 'district').distinct()
            
            for city, district in city_props:
                if city and city.lower() != location_lower:
                    nearby_set.add(city)
                if district and district.lower() != location_lower:
                    nearby_set.add(district)
            
            # Get other areas with similar price range
            avg_price = Property.objects.filter(
                Q(city__icontains=location_lower) | Q(district__icontains=location_lower)
            ).aggregate(avg=Avg('price'))['avg']
            
            if avg_price:
                nearby_price = Property.objects.filter(
                    price__between=(avg_price * 0.7, avg_price * 1.3),
                    is_available=True
                ).exclude(
                    Q(city__icontains=location_lower) | Q(district__icontains=location_lower)
                ).values_list('city', 'district').distinct()[:3]
                
                for city, district in nearby_price:
                    if city:
                        nearby_set.add(city)
                    if district:
                        nearby_set.add(district)
            
            nearby = list(nearby_set)[:5]
            cache.set(cache_key, nearby, 3600)
        
        return nearby