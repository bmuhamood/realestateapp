# chatbot/agents/property_agent.py
from typing import Dict, Any, Tuple
from django.db.models import Q
from django.utils import timezone
from properties.models import Property
from .base_agent import BaseAgent
from .dynamic_data import DynamicDataProvider

class PropertyAgent(BaseAgent):
    """Specialized agent for finding properties - FULLY DYNAMIC"""
    
    def __init__(self):
        super().__init__(name="Property Finder", expertise="Finding properties based on user criteria")
        self.search_keywords = ['find', 'search', 'looking for', 'property', 'house', 
                                'apartment', 'home', 'show me', 'need a', 'want a']
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a property search query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.search_keywords:
            if keyword in message:
                score += 0.2
        
        if context.get('property_types') or context.get('bedrooms'):
            score += 0.3
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute property search using dynamic data"""
        queryset = Property.objects.filter(
            is_available=True,
            expires_at__gt=timezone.now()
        )
        
        # Apply dynamic location filters
        locations = context.get('locations', [])
        if locations:
            location_q = Q()
            for loc in locations:
                location_q |= Q(city__icontains=loc) | Q(district__icontains=loc)
            queryset = queryset.filter(location_q)
        
        # Apply property type filter
        property_type = context.get('property_type')
        if property_type:
            queryset = queryset.filter(property_type=property_type)
        
        # Apply transaction type filter
        transaction_type = context.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Apply bedroom filter
        bedrooms = context.get('bedrooms')
        if bedrooms:
            queryset = queryset.filter(bedrooms__gte=bedrooms)
        
        # Apply price filters
        if context.get('price_max'):
            queryset = queryset.filter(price__lte=context['price_max'])
        
        if context.get('price_min'):
            queryset = queryset.filter(price__gte=context['price_min'])
        
        count = queryset.count()
        
        if count > 0:
            properties = list(queryset.order_by('-is_boosted', '-views_count')[:5])
            properties_data = self._serialize_properties(properties)
            
            location_text = f" in {locations[0]}" if locations else ""
            
            if count == 1:
                reply = f"🏠 I found **1 property**{location_text}! Here it is:"
            elif count <= 3:
                reply = f"🏠 I found **{count} properties**{location_text}:"
            else:
                reply = f"🏠 Great news! I found **{count} properties**{location_text}. Here are the top {min(5, count)}:"
            
            return {
                'success': True,
                'reply': reply,
                'properties': properties_data,
                'agent_used': self.name,
                'suggestions': ['Filter by price', 'See more', 'Book viewing'],
                'quick_replies': ['Show more 📱', 'Filter by price 💰', 'Schedule viewing 📅']
            }
        else:
            # No properties - suggest popular locations from database
            popular = DynamicDataProvider.get_popular_locations(3)
            if popular:
                reply = f"I couldn't find properties matching your criteria. Try popular areas like {', '.join(popular)}. 🏠"
            else:
                reply = "I couldn't find properties matching your criteria. Try adjusting your search. 🔍"
            
            return {
                'success': True,
                'reply': reply,
                'agent_used': self.name,
                'suggestions': ['Browse all properties', 'Check prices', 'Popular areas'],
                'quick_replies': ['Browse all', 'Price guide', 'Popular areas']
            }
    
    def _serialize_properties(self, properties) -> list:
        """Serialize properties for response"""
        data = []
        for prop in properties:
            prop_data = {
                'id': prop.id,
                'title': prop.title,
                'price': float(prop.price),
                'transaction_type': prop.transaction_type,
                'district': prop.district,
                'city': prop.city,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
            }
            try:
                first_image = prop.images.first()
                if first_image and first_image.image:
                    prop_data['image'] = first_image.image.url
            except:
                pass
            data.append(prop_data)
        return data