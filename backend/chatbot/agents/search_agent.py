# chatbot/agents/search_agent.py
from typing import Dict, Any, Tuple
from django.db.models import Q, Count
from django.utils import timezone
from properties.models import Property
from .base_agent import BaseAgent
import re

class SearchAgent(BaseAgent):
    """Specialized agent for finding properties"""
    
    def __init__(self):
        super().__init__(
            name="Property Finder",
            expertise="Finding properties based on user criteria"
        )
        self.search_keywords = ['find', 'search', 'looking for', 'property', 'house', 
                                'apartment', 'home', 'show me', 'need a', 'want a']
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a property search query"""
        message = context.get('original', '').lower()
        
        # Check for search keywords
        score = 0
        for keyword in self.search_keywords:
            if keyword in message:
                score += 0.2
        
        # Check if it has property-related entities
        if context.get('property_types') or context.get('bedrooms'):
            score += 0.3
        
        # Check if it's NOT a price or investment question
        if not any(word in message for word in ['price', 'cost', 'invest', 'compare']):
            score += 0.2
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute property search"""
        queryset = Property.objects.filter(
            is_available=True,
            expires_at__gt=timezone.now()
        )
        
        # Apply filters from context
        if context.get('locations'):
            location_q = Q()
            for loc in context['locations']:
                location_q |= Q(city__icontains=loc) | Q(district__icontains=loc)
            queryset = queryset.filter(location_q)
        
        if context.get('property_types'):
            queryset = queryset.filter(property_type__in=context['property_types'])
        
        if context.get('transaction_type'):
            queryset = queryset.filter(transaction_type=context['transaction_type'])
        
        if context.get('bedrooms'):
            queryset = queryset.filter(bedrooms__gte=context['bedrooms'])
        
        if context.get('price_max'):
            queryset = queryset.filter(price__lte=context['price_max'])
        
        if context.get('price_min'):
            queryset = queryset.filter(price__gte=context['price_min'])
        
        count = queryset.count()
        
        if count > 0:
            properties = queryset.order_by('-is_boosted', '-views_count')[:5]
            properties_data = self._serialize_properties(properties)
            
            # Generate smart response based on result count
            if count == 1:
                reply = f"🎯 **Perfect match!** I found exactly 1 property that fits your needs."
            elif count <= 3:
                reply = f"🏠 **Great news!** I found {count} properties that match what you're looking for."
            else:
                reply = f"🔥 **You're in luck!** I found {count} properties. Here are the top {min(5, count)} matches:"
            
            # Add personalized insight
            if context.get('urgency') == 'urgent':
                reply += " Since you need it quickly, these are the most responsive agents."
            
            return {
                'success': True,
                'reply': reply,
                'properties': properties_data,
                'count': count,
                'suggestions': self._get_suggestions(context, properties),
                'agent_used': self.name
            }
        else:
            # Smart fallback - suggest alternatives
            return self._suggest_alternatives(context)
    
    def _serialize_properties(self, properties) -> list:
        """Convert properties to serializable format"""
        properties_data = []
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
                'square_meters': prop.square_meters,
                'property_type': prop.property_type,
            }
            try:
                first_image = prop.images.first()
                if first_image and first_image.image:
                    prop_data['image'] = first_image.image.url
            except:
                pass
            properties_data.append(prop_data)
        return properties_data
    
    def _get_suggestions(self, context: Dict, properties) -> list:
        """Generate smart suggestions"""
        suggestions = []
        
        if properties and len(properties) > 0:
            prop = properties[0]
            suggestions.append(f"See more like {prop.title[:30]}...")
        
        if context.get('locations'):
            suggestions.append(f"Other areas near {context['locations'][0]}")
        
        if context.get('price_max'):
            suggestions.append(f"Properties just above UGX {context['price_max']/1_000_000:.1f}M")
        
        suggestions.extend(['Filter by price', 'Save search', 'Book viewing'])
        
        return suggestions[:4]
    
    def _suggest_alternatives(self, context: Dict) -> Dict[str, Any]:
        """Suggest alternatives when no properties found"""
        # Try removing one filter at a time
        relaxed_context = context.copy()
        
        if relaxed_context.get('price_max'):
            # Increase budget by 50%
            relaxed_context['price_max'] = relaxed_context['price_max'] * 1.5
            reply = f"I couldn't find properties in your exact budget range. However, if you can stretch to UGX {relaxed_context['price_max']/1_000_000:.1f}M, I found some great options! 🏠"
        elif relaxed_context.get('bedrooms'):
            # Try with one less bedroom
            relaxed_context['bedrooms'] = max(1, relaxed_context['bedrooms'] - 1)
            reply = f"No exact matches for {context['bedrooms']} bedrooms. But I found some fantastic {relaxed_context['bedrooms']}-bedroom properties you might love! 🏠"
        elif relaxed_context.get('locations'):
            # Try nearby areas
            nearby = self._get_nearby_areas(context['locations'][0])
            if nearby:
                reply = f"I don't have properties in {context['locations'][0]} right now. But {nearby[0]} is nearby and has some amazing options! Want to see them? 🏠"
            else:
                reply = "Let me show you our most popular properties instead! 🔥"
        else:
            # Show popular properties
            reply = "I couldn't find exact matches. Here are our most viewed properties this week: 🔥"
        
        # Get alternative properties
        queryset = Property.objects.filter(is_available=True).order_by('-views_count')[:3]
        properties_data = self._serialize_properties(queryset) if queryset.exists() else []
        
        return {
            'success': True,
            'reply': reply,
            'properties': properties_data,
            'count': len(properties_data),
            'suggestions': ['Adjust search', 'Different area', 'Higher budget'],
            'agent_used': self.name,
            'is_alternative': True
        }
    
    def _get_nearby_areas(self, location: str) -> list:
        """Get nearby areas from database"""
        nearby_map = {
            'kampala': ['Wakiso', 'Kira', 'Nansana'],
            'kololo': ['Naguru', 'Ntinda', 'Bukoto'],
            'ntinda': ['Kololo', 'Naguru', 'Kulambiro'],
            'wakiso': ['Kampala', 'Entebbe', 'Kira'],
        }
        return nearby_map.get(location.lower(), ['Kampala', 'Wakiso', 'Entebbe'])