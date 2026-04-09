# chatbot/intelligence.py
import random
import re
from typing import Dict, List, Tuple, Optional
from decimal import Decimal
from django.db.models import Q
import json
from .location_intelligence import DynamicLocationIntelligence

class NaturalLanguageProcessor:
    """Advanced NLP for extracting intent and entities from natural language"""
    
    # Property types (these are standard categories, not location-specific)
    PROPERTY_TYPES = {
        'house': ['house', 'houses', 'home', 'homes', 'bungalow', 'villa'],
        'apartment': ['apartment', 'apartments', 'flat', 'flats', 'condo', 'condominium'],
        'land': ['land', 'plot', 'plots', 'acre', 'acres'],
        'commercial': ['commercial', 'office', 'shop', 'store', 'warehouse', 'retail'],
        'condo': ['condo', 'condominium', 'condos'],
    }
    
    # Transaction types
    TRANSACTION_TYPES = {
        'sale': ['sale', 'buy', 'purchase', 'sell', 'selling', 'for sale', 'to buy'],
        'rent': ['rent', 'rental', 'lease', 'for rent', 'to rent', 'monthly rent'],
        'shortlet': ['shortlet', 'short let', 'short stay', 'temporary', 'vacation', 'airbnb'],
    }
    
    def __init__(self):
        """Initialize with dynamic location intelligence"""
        self.location_intel = DynamicLocationIntelligence()
    
    def extract_intent(self, message: str, user_context: Dict = None) -> Tuple[str, float]:
        """Extract primary intent with confidence score"""
        message_lower = message.lower()
        
        intent_patterns = {
            'property_search': {
                'keywords': ['find', 'looking for', 'search', 'property', 'house', 'apartment', 'home', 'want', 'need'],
                'weight': 1.5
            },
            'booking': {
                'keywords': ['book', 'viewing', 'schedule', 'visit', 'appointment', 'see property', 'tour'],
                'weight': 1.3
            },
            'services': {
                'keywords': ['service', 'cleaning', 'moving', 'renovation', 'plumbing', 'electrical', 'painting', 'handyman'],
                'weight': 1.4
            },
            'price_inquiry': {
                'keywords': ['price', 'cost', 'budget', 'expensive', 'cheap', 'affordable', 'how much'],
                'weight': 1.2
            },
            'location_inquiry': {
                'keywords': ['location', 'area', 'neighborhood', 'where', 'district', 'city', 'places', 'areas'],
                'weight': 1.1
            },
            'favorites': {
                'keywords': ['favorite', 'saved', 'like', 'wishlist', 'my list'],
                'weight': 1.3
            },
            'greeting': {
                'keywords': ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
                'weight': 1.0
            },
            'help': {
                'keywords': ['help', 'what can you do', 'commands', 'how to', 'guide', 'assist'],
                'weight': 1.0
            },
        }
        
        scores = {}
        for intent, data in intent_patterns.items():
            score = 0
            for keyword in data['keywords']:
                if keyword in message_lower:
                    score += data['weight']
            scores[intent] = score
        
        if scores:
            best_intent = max(scores, key=scores.get)
            confidence = min(scores[best_intent] / 3, 1.0)
            return best_intent, confidence
        
        return 'general', 0.5
    
    def extract_entities(self, message: str) -> Dict:
        """Extract structured entities using dynamic location data"""
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
            'raw_message': message
        }
        
        message_lower = message.lower()
        
        # DYNAMIC LOCATION EXTRACTION - No hardcoding!
        extracted_locations = self.location_intel.extract_locations_from_message(message)
        entities['locations'] = [loc['name'].capitalize() for loc in extracted_locations]
        
        # Extract property types
        for prop_type, patterns in self.PROPERTY_TYPES.items():
            for pattern in patterns:
                if pattern in message_lower:
                    entities['property_types'].append(prop_type)
                    break
        
        # Extract transaction type
        for trans_type, patterns in self.TRANSACTION_TYPES.items():
            for pattern in patterns:
                if pattern in message_lower:
                    entities['transaction_type'] = trans_type
                    break
        
        # Extract bedroom count
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
        
        # Extract bathroom count
        bathroom_patterns = [
            r'(\d+)\s*(?:bathroom|bath|baths|ba)',
            r'(?:bathroom|bath|baths|ba)\s*(\d+)',
        ]
        for pattern in bathroom_patterns:
            match = re.search(pattern, message_lower)
            if match:
                entities['bathrooms'] = int(match.group(1))
                break
        
        # Extract price information
        entities.update(self._extract_price_entities(message_lower))
        
        return entities
    
    def _extract_price_entities(self, message_lower: str) -> Dict:
        """Extract price-related entities"""
        entities = {'price_min': None, 'price_max': None, 'price_operator': None}
        
        # Under/less than patterns
        under_match = re.search(r'(?:under|below|less than|max|maximum)\s*(\d+(?:\.\d+)?)\s*(?:m|million|b|billion)?', message_lower)
        if under_match:
            price = self._parse_price(under_match.group(1), under_match.group(0))
            entities['price_max'] = price
            entities['price_operator'] = 'under'
            return entities
        
        # Above/over patterns
        above_match = re.search(r'(?:above|over|more than|min|minimum)\s*(\d+(?:\.\d+)?)\s*(?:m|million|b|billion)?', message_lower)
        if above_match:
            price = self._parse_price(above_match.group(1), above_match.group(0))
            entities['price_min'] = price
            entities['price_operator'] = 'above'
            return entities
        
        # Between patterns
        between_match = re.search(r'(?:between|from)\s*(\d+(?:\.\d+)?)\s*(?:m|million)?\s*(?:and|to)\s*(\d+(?:\.\d+)?)\s*(?:m|million)?', message_lower)
        if between_match:
            price_min = self._parse_price(between_match.group(1), between_match.group(0))
            price_max = self._parse_price(between_match.group(2), between_match.group(0))
            entities['price_min'] = price_min
            entities['price_max'] = price_max
            entities['price_operator'] = 'between'
        
        return entities
    
    def _parse_price(self, value: str, context: str) -> float:
        """Parse price value with million/billion handling"""
        try:
            num = float(re.search(r'[\d\.]+', value).group())
            
            if 'billion' in context or 'b' in context:
                num *= 1_000_000_000
            elif 'million' in context or 'm' in context:
                num *= 1_000_000
            else:
                if num < 1000:
                    num *= 1_000_000
            
            return num
        except:
            return 0
    
    def generate_natural_response(self, intent: str, entities: Dict, properties: List, user_name: str = None) -> str:
        """Generate natural, conversational responses"""
        
        if intent == 'property_search':
            if properties:
                count = len(properties)
                first = properties[0]
                
                location_text = f" in {entities['locations'][0]}" if entities.get('locations') else ""
                price_text = f" under UGX {entities['price_max']:,.0f}" if entities.get('price_max') else ""
                
                responses = [
                    f"I found {count} great properties{location_text}{price_text}! 🏠 {first.title} looks amazing - it's {first.bedrooms} beds, {first.bathrooms} baths in {first.district} for UGX {first.price:,.0f}.",
                    f"Nice choice! I found {count} properties matching what you're looking for. Here's one that caught my eye: {first.title} in {first.district} for UGX {first.price:,.0f}.",
                    f"You're in luck! There are {count} properties{location_text}{price_text}. {first.title} seems perfect for you - {first.bedrooms} bedrooms in {first.district}.",
                ]
            else:
                responses = [
                    f"Hmm, I couldn't find any properties matching your criteria. Would you like me to suggest some alternatives? Maybe try a different location or budget? 🤔",
                    f"No properties found. But don't worry! We're adding new listings daily. Want me to show you some popular properties instead?",
                ]
            
            return random.choice(responses)
        
        elif intent == 'greeting':
            name_part = f" {user_name}!" if user_name else "!"
            return random.choice([
                f"Hey{name_part} Welcome back! What kind of property are you looking for today? 🏠",
                f"Hello{name_part} Ready to find your dream home? I'm here to help! ✨",
                f"Hi there{name_part} Looking for a place to call home? Let me know what you need! 🔍",
            ])
        
        elif intent == 'price_inquiry':
            if entities.get('price_min') or entities.get('price_max'):
                return f"Let me find properties within your budget! I'll show you the best options! 💰"
            else:
                return f"Great question! Our properties range from affordable to luxury. What's your budget? I can find the perfect match for you! 💵"
        
        else:
            return random.choice([
                f"I can help you find properties, book viewings, or connect you with services. What would you like to do? 🏠",
                f"Need help? Just tell me what you're looking for - location, budget, property type, anything! I'm here to make your property search easy! ✨",
            ])