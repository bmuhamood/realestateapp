# chatbot/dynamic_topics.py
import time
from typing import Dict, List, Set
from collections import Counter
from django.db import models
from django.core.cache import cache
from properties.models import Property
from services.models import Service
from django.contrib.auth import get_user_model
import re

class DynamicTopicExtractor:
    """Extracts topics dynamically from database - ZERO hardcoding"""
    
    def __init__(self):
        self._topics_cache = None
        self._last_refresh = None
        self._cache_duration = 300  # 5 minutes cache
    
    def get_all_dynamic_topics(self, force_refresh: bool = False) -> Dict[str, List[str]]:
        """Get all topics dynamically from database"""
        
        if not force_refresh and self._topics_cache and self._last_refresh:
            if time.time() - self._last_refresh < self._cache_duration:
                return self._topics_cache
        
        topics = {
            'location': self._extract_locations_from_db(),
            'property_type': self._extract_property_types_from_db(),
            'budget': self._extract_budget_keywords(),
            'size': self._extract_size_keywords(),
            'action': self._extract_action_keywords(),
            'service': self._extract_service_types_from_db(),
            'amenities': self._extract_amenities_from_db(),
            'features': self._extract_features_from_db(),
        }
        
        self._topics_cache = topics
        self._last_refresh = time.time()
        
        return topics
    
    def _extract_locations_from_db(self) -> List[str]:
        """Extract all unique locations from properties and services"""
        locations = set()
        
        # From Property model
        property_locations = Property.objects.filter(
            is_available=True
        ).exclude(
            city__isnull=True
        ).values_list('city', 'district', 'area')
        
        for city, district, area in property_locations:
            if city and isinstance(city, str):
                locations.add(city.lower())
                # Add variations
                locations.add(city.lower().replace(' ', '_'))
                locations.add(city.lower().replace('-', ' '))
            if district and isinstance(district, str):
                locations.add(district.lower())
            if area and isinstance(area, str):
                locations.add(area.lower())
        
        # From Service model
        service_locations = Service.objects.filter(
            is_active=True
        ).exclude(
            location__isnull=True
        ).values_list('location', flat=True)
        
        for loc in service_locations:
            if loc and isinstance(loc, str):
                locations.add(loc.lower())
        
        # From User profiles
        User = get_user_model()
        user_locations = User.objects.filter(
            city__isnull=False
        ).exclude(
            city__exact=''
        ).values_list('city', flat=True).distinct()
        
        for loc in user_locations:
            if loc and isinstance(loc, str):
                locations.add(loc.lower())
        
        # Generate common variations
        all_locations = set()
        for loc in locations:
            all_locations.add(loc)
            # Add common variations
            all_locations.add(loc.replace(' ', ''))
            all_locations.add(loc.replace('-', ' '))
        
        return sorted(list(all_locations))[:100]  # Limit for performance
    
    def _extract_property_types_from_db(self) -> List[str]:
        """Extract property types from actual database values"""
        property_types = set()
        
        # Get from Property model's property_type field
        types_from_property = Property.objects.filter(
            property_type__isnull=False
        ).exclude(
            property_type__exact=''
        ).values_list('property_type', flat=True).distinct()
        
        for pt in types_from_property:
            if pt and isinstance(pt, str):
                property_types.add(pt.lower())
                # Add common variations
                property_types.add(pt.lower() + 's')
                property_types.add(pt.lower().replace(' ', '_'))
        
        # Also extract from titles and descriptions
        titles = Property.objects.filter(
            title__isnull=False
        ).exclude(
            title__exact=''
        ).values_list('title', flat=True)[:500]
        
        for title in titles:
            if title:
                # Look for common property type indicators in titles
                words = title.lower().split()
                for word in words:
                    if word in ['house', 'apartment', 'condo', 'villa', 'bungalow', 
                                'townhouse', 'duplex', 'mansion', 'cottage', 'studio']:
                        property_types.add(word)
                    elif word.endswith('house') or word.endswith('home'):
                        property_types.add(word)
        
        return sorted(list(property_types))
    
    def _extract_budget_keywords(self) -> List[str]:
        """Extract budget-related keywords from price data"""
        keywords = set(['price', 'cost', 'budget', 'expensive', 'cheap', 'affordable'])
        
        # Extract price ranges from actual data
        price_stats = Property.objects.filter(
            is_available=True,
            price__isnull=False
        ).aggregate(
            min_price=models.Min('price'),
            max_price=models.Max('price'),
            avg_price=models.Avg('price')
        )
        
        if price_stats['min_price']:
            min_price = float(price_stats['min_price'])
            keywords.add(f"under {int(min_price/1_000_000)}m")
            keywords.add(f"below {int(min_price/1_000_000)}m")
        
        if price_stats['max_price']:
            max_price = float(price_stats['max_price'])
            keywords.add(f"over {int(max_price/1_000_000)}m")
            keywords.add(f"above {int(max_price/1_000_000)}m")
        
        if price_stats['avg_price']:
            avg_price = float(price_stats['avg_price'])
            keywords.add(f"around {int(avg_price/1_000_000)}m")
        
        # Extract from user conversations
        from chatbot.models import ChatMessage
        price_messages = ChatMessage.objects.filter(
            content__icontains='price',
            message_type='user'
        ).values_list('content', flat=True)[:200]
        
        for msg in price_messages:
            if msg:
                # Extract price-related phrases
                price_phrases = re.findall(r'(?:under|below|over|above|around|about|less than|more than)\s+(\d+(?:\.\d+)?\s*(?:m|million|b|billion)?)', msg.lower())
                for phrase in price_phrases:
                    keywords.add(f"under {phrase}" if 'under' in msg.lower() else f"over {phrase}")
        
        return sorted(list(keywords))
    
    def _extract_size_keywords(self) -> List[str]:
        """Extract size-related keywords from property data"""
        keywords = set(['bedroom', 'bathroom', 'square', 'meters', 'acre', 'sqm', 'sqft'])
        
        # Extract bedroom counts from actual data
        bedroom_counts = Property.objects.filter(
            bedrooms__isnull=False,
            bedrooms__gt=0
        ).values_list('bedrooms', flat=True).distinct()
        
        for count in bedroom_counts:
            if count:
                keywords.add(f"{count} bedroom")
                keywords.add(f"{count} bed")
                keywords.add(f"{count}br")
        
        # Extract bathroom counts
        bathroom_counts = Property.objects.filter(
            bathrooms__isnull=False,
            bathrooms__gt=0
        ).values_list('bathrooms', flat=True).distinct()
        
        for count in bathroom_counts:
            if count:
                keywords.add(f"{count} bathroom")
                keywords.add(f"{count} bath")
                keywords.add(f"{count}ba")
        
        # Extract square meter ranges
        area_stats = Property.objects.filter(
            square_meters__isnull=False,
            square_meters__gt=0
        ).aggregate(
            min_area=models.Min('square_meters'),
            max_area=models.Max('square_meters'),
            avg_area=models.Avg('square_meters')
        )
        
        if area_stats['min_area']:
            keywords.add(f"under {int(area_stats['min_area'])} sqm")
        if area_stats['max_area']:
            keywords.add(f"over {int(area_stats['max_area'])} sqm")
        
        return sorted(list(keywords))
    
    def _extract_action_keywords(self) -> List[str]:
        """Extract action keywords from user interactions"""
        keywords = set(['book', 'view', 'schedule', 'visit', 'contact', 'see', 'tour'])
        
        from chatbot.models import ChatMessage
        
        # Extract from user messages
        action_messages = ChatMessage.objects.filter(
            message_type='user'
        ).values_list('content', flat=True)[:500]
        
        action_verbs = ['book', 'schedule', 'view', 'visit', 'see', 'check', 'show', 
                       'find', 'search', 'look', 'browse', 'explore', 'discover']
        
        for msg in action_messages:
            if msg:
                msg_lower = msg.lower()
                for verb in action_verbs:
                    if verb in msg_lower:
                        keywords.add(verb)
                        # Add common variations
                        keywords.add(verb + 'ing')
                        keywords.add(verb + 'ed')
        
        # Add context-specific actions
        keywords.add('schedule viewing')
        keywords.add('book appointment')
        keywords.add('request info')
        keywords.add('contact agent')
        
        return sorted(list(keywords))
    
    def _extract_service_types_from_db(self) -> List[str]:
        """Extract service types from actual service data"""
        service_types = set()
        
        from services.models import Service
        
        # Get from Service model
        services = Service.objects.filter(
            is_active=True,
            service_type__isnull=False
        ).exclude(
            service_type__exact=''
        ).values_list('service_type', flat=True).distinct()
        
        for st in services:
            if st and isinstance(st, str):
                service_types.add(st.lower())
                service_types.add(st.lower() + 's')
                service_types.add(st.lower() + 'ing')
        
        # Extract from service names and descriptions
        service_texts = Service.objects.filter(
            is_active=True
        ).values_list('name', 'description')[:200]
        
        service_keywords = ['cleaning', 'moving', 'plumbing', 'electrical', 'painting',
                           'renovation', 'repair', 'maintenance', 'landscaping', 'security']
        
        for name, desc in service_texts:
            text = (name + ' ' + (desc or '')).lower()
            for keyword in service_keywords:
                if keyword in text:
                    service_types.add(keyword)
                    service_types.add(keyword + 's')
                    service_types.add(keyword + 'ing')
        
        return sorted(list(service_types))
    
    def _extract_amenities_from_db(self) -> List[str]:
        """Extract amenities from property features"""
        amenities = set()
        
        # Get from Property model if amenities field exists
        if hasattr(Property, 'amenities'):
            amenities_list = Property.objects.filter(
                amenities__isnull=False
            ).exclude(
                amenities__exact=''
            ).values_list('amenities', flat=True)[:300]
            
            for amenity in amenities_list:
                if amenity:
                    if isinstance(amenity, str):
                        # Split by commas if it's a string
                        for item in amenity.split(','):
                            amenities.add(item.strip().lower())
                    elif isinstance(amenity, list):
                        for item in amenity:
                            amenities.add(str(item).lower())
        
        # Extract from property descriptions
        descriptions = Property.objects.filter(
            description__isnull=False
        ).exclude(
            description__exact=''
        ).values_list('description', flat=True)[:300]
        
        common_amenities = ['parking', 'security', 'garden', 'balcony', 'pool', 'gym',
                           'furnished', 'ac', 'heating', 'internet', 'cable', 'elevator']
        
        for desc in descriptions:
            if desc:
                desc_lower = desc.lower()
                for amenity in common_amenities:
                    if amenity in desc_lower:
                        amenities.add(amenity)
        
        return sorted(list(amenities))
    
    def _extract_features_from_db(self) -> List[str]:
        """Extract property features from descriptions"""
        features = set()
        
        # Extract from property descriptions
        descriptions = Property.objects.filter(
            description__isnull=False
        ).exclude(
            description__exact=''
        ).values_list('description', flat=True)[:500]
        
        common_features = ['modern', 'spacious', 'renovated', 'new', 'luxury', 
                          'quiet', 'secure', 'central', 'accessible', 'prime']
        
        for desc in descriptions:
            if desc:
                desc_lower = desc.lower()
                for feature in common_features:
                    if feature in desc_lower:
                        features.add(feature)
        
        # Extract from titles
        titles = Property.objects.filter(
            title__isnull=False
        ).exclude(
            title__exact=''
        ).values_list('title', flat=True)[:300]
        
        for title in titles:
            if title:
                words = title.lower().split()
                for word in words:
                    if len(word) > 4 and word not in common_features:
                        features.add(word)
        
        return sorted(list(features))
    
    def get_topic_weights(self) -> Dict[str, float]:
        """Calculate dynamic topic weights based on actual data frequency"""
        weights = {}
        
        # Calculate based on actual data presence
        property_count = Property.objects.filter(is_available=True).count()
        service_count = Service.objects.filter(is_active=True).count() if 'Service' in globals() else 0
        
        weights['location'] = min(1.0, property_count / 100) if property_count > 0 else 0.5
        weights['property_type'] = min(1.0, property_count / 50) if property_count > 0 else 0.5
        weights['budget'] = 0.8  # Always relevant
        weights['size'] = min(1.0, property_count / 200) if property_count > 0 else 0.3
        weights['action'] = 0.9  # Always relevant
        weights['service'] = min(1.0, service_count / 50) if service_count > 0 else 0.4
        
        return weights