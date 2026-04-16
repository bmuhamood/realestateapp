# chatbot/agents/orchestrator.py - FAST & INTELLIGENT VERSION
from typing import Dict, Any
import logging
import re
from django.db.models import Q
from django.utils import timezone
from properties.models import Property
from .dynamic_data import DynamicDataProvider

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """Fast, intelligent orchestrator - no delays, smart responses"""
    
    def __init__(self):
        self.last_response_time = 0
    
    def process_query(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process user query FAST"""
        message = context.get('original', '')
        msg_lower = message.lower()
        
        # FIRST: Check for simple greetings (fast path)
        if msg_lower in ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']:
            return self._fast_greeting()
        
        # SECOND: Check for help (fast path)
        if any(word in msg_lower for word in ['help', 'what can you do', 'commands']):
            return self._fast_help()
        
        # THIRD: Extract search parameters (optimized)
        locations = DynamicDataProvider.extract_locations_from_text(msg_lower)
        bedrooms = DynamicDataProvider.extract_bedrooms(msg_lower)
        price_max = DynamicDataProvider.extract_price_max(msg_lower)
        
        # Build query - USE INDEXES for speed
        queryset = Property.objects.filter(
            is_available=True,
            expires_at__gt=timezone.now()
        )
        
        # Apply filters efficiently
        if locations:
            location_q = Q()
            for loc in locations:
                location_q |= Q(city__icontains=loc) | Q(district__icontains=loc)
            queryset = queryset.filter(location_q)
        
        if bedrooms:
            queryset = queryset.filter(bedrooms__gte=bedrooms)
        
        if price_max:
            queryset = queryset.filter(price__lte=price_max)
        
        # Get count first (fast with index)
        count = queryset.count()
        
        # If no results and user asked for specific location, suggest popular areas
        if count == 0 and locations:
            popular = DynamicDataProvider.get_popular_locations(3)
            if popular:
                return {
                    'reply': f"I don't have properties in {locations[0]} right now. 🔍\n\nBut we have great options in {', '.join(popular)}!\n\nWhich area would you like to see? 🏠",
                    'agent_used': 'Property Finder',
                    'quick_replies': [f'Show {p}' for p in popular] + ['Browse all']
                }
        
        # If we found properties
        if count > 0:
            # Get only 3 properties for speed
            properties = list(queryset.order_by('-is_boosted', '-views_count')[:3])
            properties_data = self._serialize_properties(properties)
            
            # Build smart response
            location_text = f" in {locations[0]}" if locations else ""
            bedrooms_text = f" with {bedrooms}+ bedrooms" if bedrooms else ""
            price_text = f" under UGX {price_max:,.0f}" if price_max else ""
            
            if count == 1:
                reply = f"🏠 Found **1 property**{location_text}{bedrooms_text}{price_text}!"
            else:
                reply = f"🏠 Found **{count} properties**{location_text}{bedrooms_text}{price_text}!\n\nHere are the top {min(3, count)}:"
            
            return {
                'reply': reply,
                'properties': properties_data,
                'agent_used': 'Property Finder',
                'suggestions': ['Show more', 'Filter by price', 'Book viewing'],
                'quick_replies': ['See more 📱', 'Price range 💰', 'Book viewing 📅']
            }
        
        # If user asked for price specifically
        if any(word in msg_lower for word in ['price', 'cost', 'budget', 'how much']):
            return self._fast_price_response(locations[0] if locations else None)
        
        # If user asked for popular areas
        if any(word in msg_lower for word in ['popular', 'best areas', 'hot areas']):
            return self._fast_popular_areas()
        
        # Smart fallback
        return self._smart_fallback(message)
    
    def _fast_greeting(self) -> Dict:
        """Fast greeting response"""
        return {
            'reply': "👋 Hi there! I'm PropertyGPT. I can help you find properties in Uganda instantly.\n\nTry: 'Find 3 bedroom houses in Kololo' or 'Properties under 500M'",
            'agent_used': 'Orchestrator',
            'quick_replies': ['Find properties', 'Popular areas', 'Price guide']
        }
    
    def _fast_help(self) -> Dict:
        """Fast help response"""
        return {
            'reply': "🤖 **Quick Help**\n\n"
                    "🏠 **Find properties:** 'Find houses in Kampala'\n"
                    "💰 **Check prices:** 'Average price in Kira'\n"
                    "📍 **Popular areas:** 'Show me popular areas'\n\n"
                    "Just type what you're looking for!",
            'agent_used': 'Orchestrator',
            'quick_replies': ['Find properties', 'Popular areas', 'Price check']
        }
    
    def _fast_price_response(self, location: str = None) -> Dict:
        """Fast price response using cached data"""
        queryset = Property.objects.filter(is_available=True)
        
        if location:
            queryset = queryset.filter(Q(city__icontains=location) | Q(district__icontains=location))
        
        stats = queryset.aggregate(avg_price=models.Avg('price'), count=models.Count('id'))
        
        if stats['count'] == 0:
            return {
                'reply': f"I don't have price data for {location} yet. Try Kampala or Wakiso! 📊",
                'agent_used': 'Price Analyst',
                'quick_replies': ['Kampala prices', 'Wakiso prices']
            }
        
        avg_price = float(stats['avg_price'])
        location_text = f" in {location}" if location else " across Uganda"
        
        return {
            'reply': f"💰 **Average price{location_text}:** UGX {avg_price:,.0f}\n\nWant to see properties in this range? 🏠",
            'agent_used': 'Price Analyst',
            'quick_replies': ['Show properties', 'Lower budget', 'Higher budget']
        }
    
    def _fast_popular_areas(self) -> Dict:
        """Fast popular areas response"""
        popular = DynamicDataProvider.get_popular_locations(5)
        
        if not popular:
            return {
                'reply': "📍 Popular areas include Kampala, Wakiso, Entebbe, and Jinja. Which area interests you?",
                'agent_used': 'Location Expert',
                'quick_replies': ['Kampala', 'Wakiso', 'Entebbe']
            }
        
        reply = "📍 **Most popular areas right now:**\n\n"
        for i, loc in enumerate(popular, 1):
            stats = DynamicDataProvider.get_location_stats(loc)
            reply += f"{i}. **{loc}** - {stats['count']} properties\n"
        reply += "\nWhich area would you like to explore?"
        
        return {
            'reply': reply,
            'agent_used': 'Location Expert',
            'quick_replies': [f'Show {p}' for p in popular[:3]]
        }
    
    def _smart_fallback(self, message: str) -> Dict:
        """Smart fallback that doesn't sound dumb"""
        # Try to extract any location mentioned
        locations = DynamicDataProvider.extract_locations_from_text(message.lower())
        
        if locations:
            return {
                'reply': f"I can help you find properties in {locations[0]}! 🏠\n\nJust tell me:\n• How many bedrooms?\n• What's your budget?\n\nExample: '3 bedroom house under 500M'",
                'agent_used': 'Orchestrator',
                'quick_replies': ['Find properties', 'Price guide', 'Popular areas']
            }
        
        return {
            'reply': "I can help you find properties across Uganda! 🇺🇬\n\nTry:\n• 'Find houses in Kampala'\n• '3 bedroom apartments in Kololo'\n• 'Properties under 500M'\n\nWhat are you looking for?",
            'agent_used': 'Orchestrator',
            'quick_replies': ['Find properties', 'Popular areas', 'Price guide']
        }
    
    def _serialize_properties(self, properties) -> list:
        """Fast property serialization"""
        data = []
        for prop in properties:
            prop_data = {
                'id': prop.id,
                'title': prop.title[:50],  # Limit title length
                'price': float(prop.price),
                'transaction_type': prop.transaction_type,
                'district': prop.district,
                'city': prop.city,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
            }
            # Only get image if needed (lazy loading)
            try:
                first_image = prop.images.first()
                if first_image and first_image.image:
                    prop_data['image'] = first_image.image.url
            except:
                pass
            data.append(prop_data)
        return data


# Add missing import at top
from django.db import models