# chatbot/intelligence_dynamic.py (complete fixed version)
import re
import time
import random
from typing import Dict, List, Tuple, Optional
from decimal import Decimal
from django.db import models
from django.db.models import Q, Min, Max, Avg
from properties.models import Property
from services.models import Service
from .dynamic_topics import DynamicTopicExtractor
import difflib

class DynamicNaturalLanguageProcessor:
    """NLP that learns from database dynamically"""
    
    def __init__(self):
        self.topic_extractor = DynamicTopicExtractor()
        self._topics_cache = None
        self._last_refresh = None
    
    def get_dynamic_topics(self) -> Dict[str, List[str]]:
        """Get or refresh dynamic topics"""
        return self.topic_extractor.get_all_dynamic_topics()
    
    def extract_entities_dynamic(self, message: str) -> Dict:
        """Extract entities using dynamic database-driven topics"""
        message_lower = message.lower()
        dynamic_topics = self.get_dynamic_topics()
        
        entities = {
            'locations': [],
            'property_types': [],
            'transaction_type': None,
            'bedrooms': None,
            'bathrooms': None,
            'price_min': None,
            'price_max': None,
            'price_operator': None,
            'square_meters_min': None,
            'square_meters_max': None,
            'services': [],
            'amenities': [],
            'features': [],
            'raw_message': message
        }
        
        # Dynamic location extraction - using REAL database locations
        for location in dynamic_topics.get('location', []):
            if location in message_lower:
                # Check for whole word match
                pattern = r'\b' + re.escape(location) + r'\b'
                if re.search(pattern, message_lower):
                    entities['locations'].append(location.title())
        
        # If no exact matches, try fuzzy matching with real locations
        if not entities['locations']:
            words = re.findall(r'\b[a-z]{3,}\b', message_lower)
            all_locations = dynamic_topics.get('location', [])
            
            for word in words:
                matches = difflib.get_close_matches(word, all_locations, n=1, cutoff=0.8)
                if matches:
                    entities['locations'].append(matches[0].title())
        
        # Dynamic property type extraction
        for prop_type in dynamic_topics.get('property_type', []):
            if prop_type in message_lower:
                entities['property_types'].append(prop_type)
        
        # Extract transaction type
        transaction_keywords = {
            'rent': ['rent', 'rental', 'lease', 'for rent', 'to rent'],
            'sale': ['sale', 'buy', 'purchase', 'for sale', 'to buy'],
            'shortlet': ['shortlet', 'short let', 'vacation', 'airbnb']
        }
        
        for trans_type, keywords in transaction_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                entities['transaction_type'] = trans_type
                break
        
        # Dynamic service extraction
        for service in dynamic_topics.get('service', []):
            if service in message_lower:
                entities['services'].append(service)
        
        # Dynamic amenity extraction
        for amenity in dynamic_topics.get('amenities', []):
            if amenity in message_lower:
                entities['amenities'].append(amenity)
        
        # Dynamic feature extraction
        for feature in dynamic_topics.get('features', []):
            if feature in message_lower:
                entities['features'].append(feature)
        
        # Extract numeric values (bedrooms, bathrooms, prices)
        entities.update(self._extract_numeric_entities(message_lower))
        
        # Deduplicate
        entities['locations'] = list(dict.fromkeys(entities['locations']))
        entities['property_types'] = list(dict.fromkeys(entities['property_types']))
        
        return entities
    
    def _extract_numeric_entities(self, message_lower: str) -> Dict:
        """Extract numeric entities like bedrooms, bathrooms, prices"""
        entities = {
            'bedrooms': None,
            'bathrooms': None,
            'price_min': None,
            'price_max': None,
            'price_operator': None,
            'square_meters_min': None,
            'square_meters_max': None
        }
        
        # Bedroom extraction
        bedroom_patterns = [
            r'(\d+)\s*(?:bedroom|bed|beds|br)',
            r'(?:bedroom|bed|beds|br)\s*(\d+)',
            r'(\d+)\s*(?:bedroomed)',
        ]
        for pattern in bedroom_patterns:
            match = re.search(pattern, message_lower)
            if match:
                entities['bedrooms'] = int(match.group(1))
                break
        
        # Bathroom extraction
        bathroom_patterns = [
            r'(\d+)\s*(?:bathroom|bath|baths|ba)',
            r'(?:bathroom|bath|baths|ba)\s*(\d+)',
        ]
        for pattern in bathroom_patterns:
            match = re.search(pattern, message_lower)
            if match:
                entities['bathrooms'] = int(match.group(1))
                break
        
        # Square meters extraction
        sqm_patterns = [
            r'(\d+)\s*(?:sqm|square meters|square metres)',
            r'(\d+)\s*(?:sq\s*m)',
        ]
        for pattern in sqm_patterns:
            match = re.search(pattern, message_lower)
            if match:
                entities['square_meters_min'] = int(match.group(1))
                break
        
        # Price extraction with dynamic range detection
        entities.update(self._extract_price_entities_dynamic(message_lower))
        
        return entities
    
    def _extract_price_entities_dynamic(self, message_lower: str) -> Dict:
        """Extract price entities using dynamic patterns"""
        entities = {'price_min': None, 'price_max': None, 'price_operator': None}
        
        # Get price ranges from actual data for context
        from properties.models import Property
        from django.db.models import Min, Max, Avg
        
        price_stats = Property.objects.filter(is_available=True).aggregate(
            min_price=Min('price'),
            max_price=Max('price'),
            avg_price=Avg('price')
        )
        
        # Under/less than patterns
        under_match = re.search(r'(?:under|below|less than|max|maximum|upto|up to)\s*(\d+(?:\.\d+)?)\s*(?:m|million|b|billion)?', message_lower)
        if under_match:
            price = self._parse_price_dynamic(under_match.group(1), under_match.group(0), price_stats)
            entities['price_max'] = price
            entities['price_operator'] = 'under'
            return entities
        
        # Above/over patterns
        above_match = re.search(r'(?:above|over|more than|min|minimum|at least)\s*(\d+(?:\.\d+)?)\s*(?:m|million|b|billion)?', message_lower)
        if above_match:
            price = self._parse_price_dynamic(above_match.group(1), above_match.group(0), price_stats)
            entities['price_min'] = price
            entities['price_operator'] = 'above'
            return entities
        
        # Between patterns
        between_match = re.search(r'(?:between|from)\s*(\d+(?:\.\d+)?)\s*(?:m|million)?\s*(?:and|to)\s*(\d+(?:\.\d+)?)\s*(?:m|million)?', message_lower)
        if between_match:
            price_min = self._parse_price_dynamic(between_match.group(1), between_match.group(0), price_stats)
            price_max = self._parse_price_dynamic(between_match.group(2), between_match.group(0), price_stats)
            entities['price_min'] = min(price_min, price_max)
            entities['price_max'] = max(price_min, price_max)
            entities['price_operator'] = 'between'
        
        return entities
    
    def _parse_price_dynamic(self, value: str, context: str, price_stats: Dict) -> float:
        """Parse price with dynamic context from actual data"""
        try:
            num = float(re.search(r'[\d\.]+', value).group())
            
            if 'billion' in context or 'b' in context:
                num *= 1_000_000_000
            elif 'million' in context or 'm' in context:
                num *= 1_000_000
            else:
                # Use actual average price to determine if it's in millions
                avg_price = price_stats.get('avg_price', 0)
                if avg_price and avg_price > 0:
                    if num < 1000 and num * 1_000_000 < avg_price * 2:
                        num *= 1_000_000
                    elif num < 10000 and num * 100_000 < avg_price * 2:
                        num *= 100_000
            
            return num
        except:
            return 0
    
    def get_contextual_suggestions(self, entities: Dict, search_results: List = None) -> List[str]:
        """Generate dynamic suggestions based on actual data"""
        import random
        suggestions = []
        dynamic_topics = self.get_dynamic_topics()
        
        if search_results and len(search_results) > 0:
            prop = search_results[0]
            # Safely get title (handle if it's a dict or model instance)
            title = prop.get('title') if isinstance(prop, dict) else getattr(prop, 'title', 'this property')
            suggestions.append(f"See more like {title[:30]}...")
            
            # Get similar locations from actual data
            similar_locations = dynamic_topics.get('location', [])[:3]
            if similar_locations:
                suggestions.append(f"Properties in {similar_locations[0]}")
        
        if entities.get('locations'):
            # Suggest nearby locations from actual data
            all_locations = dynamic_topics.get('location', [])
            current = entities['locations'][0].lower()
            nearby = [loc for loc in all_locations if loc != current and loc.startswith(current[:3])][:2]
            if nearby:
                suggestions.append(f"Try {nearby[0].title()} area")
        
        if entities.get('price_max'):
            # Suggest budget adjustments based on actual data
            from properties.models import Property
            from django.db.models import Min
            
            next_tier = Property.objects.filter(
                price__gt=entities['price_max'],
                is_available=True
            ).aggregate(next_price=Min('price'))
            
            if next_tier.get('next_price'):
                suggestions.append(f"Properties just above UGX {next_tier['next_price']/1_000_000:.1f}M")
        
        # Add dynamic popular suggestions
        popular_property_types = dynamic_topics.get('property_type', [])[:3]
        if popular_property_types:
            suggestions.append(f"Popular: {popular_property_types[0]}s")
        
        # Ensure we have enough suggestions
        default_suggestions = [
            "Show me the best deals",
            "What's popular right now?",
            "New listings this week",
            "Properties with parking"
        ]
        
        while len(suggestions) < 4:
            suggestions.append(random.choice(default_suggestions))
        
        return suggestions[:4]