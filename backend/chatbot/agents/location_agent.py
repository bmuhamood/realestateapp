# chatbot/agents/location_agent.py
from typing import Dict, Any, Tuple
from django.db.models import Q
from .base_agent import BaseAgent
from .dynamic_data import DynamicDataProvider

class LocationAgent(BaseAgent):
    """Specialized agent for location information - FULLY DYNAMIC"""
    
    def __init__(self):
        super().__init__(name="Location Expert", expertise="Neighborhood analysis and location insights")
        self.location_keywords = ['location', 'area', 'neighborhood', 'district', 'city',
                                  'where', 'tell me about', 'what is']
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a location query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.location_keywords:
            if keyword in message:
                score += 0.2
        
        if context.get('locations'):
            score += 0.3
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide location information using dynamic data"""
        locations = context.get('locations', [])
        
        if locations:
            location = locations[0]
            stats = DynamicDataProvider.get_location_stats(location)
            
            if stats['count'] > 0:
                reply = f"📍 **{location} Property Market**\n\n"
                reply += f"🏠 Active properties: {stats['count']}\n"
                reply += f"💰 Price range: UGX {stats['min_price']:,.0f} - {stats['max_price']:,.0f}\n"
                reply += f"📊 Average price: UGX {stats['avg_price']:,.0f}\n\n"
                reply += f"Would you like to see available properties in {location}?"
            else:
                popular = DynamicDataProvider.get_popular_locations(5)
                reply = f"I don't have data for {location}. Here are our most popular locations:\n\n"
                for i, loc in enumerate(popular, 1):
                    loc_stats = DynamicDataProvider.get_location_stats(loc)
                    reply += f"{i}. **{loc}** - {loc_stats['count']} properties\n"
                reply += f"\nWhich area interests you?"
        else:
            # Show popular locations
            popular = DynamicDataProvider.get_popular_locations(10)
            
            if popular:
                reply = "📍 **Popular Property Locations in Uganda**\n\n"
                for i, loc in enumerate(popular, 1):
                    stats = DynamicDataProvider.get_location_stats(loc)
                    reply += f"{i}. **{loc}** - {stats['count']} properties\n"
                reply += f"\nWhich area would you like to explore? 🏠"
            else:
                reply = "📍 I can help you find properties across Uganda. Which area are you interested in?"
        
        return {
            'success': True,
            'reply': reply,
            'agent_used': self.name,
            'suggestions': [f'Properties in {loc}' for loc in popular[:3]] if 'popular' in locals() else ['Browse all properties'],
            'quick_replies': ['Show properties', 'Price guide', 'Compare areas']
        }