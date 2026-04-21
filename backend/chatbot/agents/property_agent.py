# chatbot/agents/property_agent.py - FULLY DYNAMIC
from typing import Dict, Any, Tuple
from django.db.models import Q, Count
from django.utils import timezone
from properties.models import Property
from .base_agent import BaseAgent
from .dynamic_data import DynamicDataProvider
import re

class PropertyAgent(BaseAgent):
    """Fully dynamic property search agent"""
    
    def __init__(self):
        super().__init__(name="Property Finder", expertise="Finding properties using real data")
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        return (True, 0.8)  # This agent can handle most queries
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute dynamic property search"""
        queryset = Property.objects.filter(
            is_available=True,
            expires_at__gt=timezone.now()
        )
        
        # Apply location filter (dynamic)
        if context.get('locations'):
            location_q = Q()
            for loc in context['locations']:
                location_q |= Q(city__icontains=loc) | Q(district__icontains=loc)
            queryset = queryset.filter(location_q)
        
        # Apply property type filter
        if context.get('property_type'):
            queryset = queryset.filter(property_type=context['property_type'])
        
        # Apply transaction type filter
        if context.get('transaction_type'):
            queryset = queryset.filter(transaction_type=context['transaction_type'])
        
        # Apply bedroom filter
        if context.get('bedrooms'):
            queryset = queryset.filter(bedrooms__gte=context['bedrooms'])
        
        # Apply price filter
        if context.get('price_max'):
            queryset = queryset.filter(price__lte=context['price_max'])
        
        count = queryset.count()
        
        if count > 0:
            properties = list(queryset.order_by('-is_boosted', '-views_count')[:5])
            
            # If no results in exact location, suggest nearby areas
            if count == 0 and context.get('locations'):
                nearby = DynamicDataProvider.get_nearby_areas(context['locations'][0])
                if nearby:
                    return {
                        'reply': f"I don't have properties in {context['locations'][0]} right now. But we have great options in {', '.join(nearby[:3])}! 🏠\n\nWhich area would you like to explore?",
                        'agent_used': self.name,
                        'quick_replies': [f'Show {area}' for area in nearby[:3]] + ['Browse all'],
                        'suggestions': nearby[:3]
                    }
            
            # Build response
            location_text = f" in {context['locations'][0]}" if context.get('locations') else ""
            bedrooms_text = f" with {context['bedrooms']}+ bedrooms" if context.get('bedrooms') else ""
            price_text = f" under UGX {context['price_max']:,.0f}" if context.get('price_max') else ""
            
            reply = f"🏠 Found **{count} properties**{location_text}{bedrooms_text}{price_text}!\n\n"
            
            if count > 3:
                reply += f"Here are the top {min(5, count)} matches:\n\n"
            
            return {
                'reply': reply,
                'properties': self._serialize_properties(properties),
                'agent_used': self.name,
                'quick_replies': ['Show more', 'Filter by price', 'Book viewing'],
                'suggestions': ['See more properties', 'Adjust search', 'Popular areas']
            }
        else:
            return self._suggest_alternatives(context)
    
    def _serialize_properties(self, properties) -> list:
        """Serialize properties for response"""
        data = []
        for prop in properties:
            data.append({
                'id': prop.id,
                'title': prop.title[:50],
                'price': float(prop.price),
                'transaction_type': prop.transaction_type,
                'district': prop.district,
                'city': prop.city,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
                'square_meters': prop.square_meters,
                'property_type': prop.property_type,
            })
        return data
    
    def _suggest_alternatives(self, context: Dict) -> Dict:
        """Suggest alternatives when no properties found"""
        popular = DynamicDataProvider.get_popular_locations(5)
        
        reply = "I couldn't find properties matching your exact criteria. 🔍\n\n"
        reply += "**Popular areas with active listings:**\n"
        
        for loc in popular[:3]:
            stats = DynamicDataProvider.get_location_stats(loc)
            reply += f"• **{loc}** - {stats['count']} properties\n"
        
        reply += "\nWhich area would you like to explore?"
        
        return {
            'reply': reply,
            'agent_used': self.name,
            'quick_replies': [f'Show {loc}' for loc in popular[:3]],
            'suggestions': popular[:3]
        }