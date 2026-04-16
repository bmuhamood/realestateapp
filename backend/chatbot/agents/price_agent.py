# chatbot/agents/price_agent.py
from typing import Dict, Any, Tuple
from django.db.models import Q, Avg, Min, Max, Count
from django.utils import timezone
from properties.models import Property
from .base_agent import BaseAgent
from .dynamic_data import DynamicDataProvider

class PriceAgent(BaseAgent):
    """Specialized agent for price analysis - FULLY DYNAMIC"""
    
    def __init__(self):
        super().__init__(name="Price Analyst", expertise="Property pricing and market analysis")
        self.price_keywords = ['price', 'cost', 'budget', 'how much', 'expensive', 
                               'cheap', 'affordable', 'value', 'worth']
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a price-related query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.price_keywords:
            if keyword in message:
                score += 0.25
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide price analysis using real database data"""
        location = context.get('locations', [None])[0]
        
        queryset = Property.objects.filter(
            is_available=True,
            expires_at__gt=timezone.now()
        )
        
        if location:
            queryset = queryset.filter(
                Q(city__icontains=location) | Q(district__icontains=location)
            )
        
        stats = queryset.aggregate(
            min_price=Min('price'),
            max_price=Max('price'),
            avg_price=Avg('price'),
            total_count=Count('id')
        )
        
        if stats['total_count'] == 0:
            popular = DynamicDataProvider.get_popular_locations(3)
            reply = f"I don't have price data for {location if location else 'that area'}. Try checking popular areas like {', '.join(popular)}! 📊"
        else:
            min_price = float(stats['min_price']) if stats['min_price'] else 0
            max_price = float(stats['max_price']) if stats['max_price'] else 0
            avg_price = float(stats['avg_price']) if stats['avg_price'] else 0
            
            location_text = f" in {location}" if location else " across Uganda"
            
            reply = f"💰 **Price Overview{location_text}**\n\n"
            reply += f"Based on {stats['total_count']} active properties:\n"
            reply += f"• 📉 **Minimum:** UGX {min_price:,.0f}\n"
            reply += f"• 📊 **Average:** UGX {avg_price:,.0f}\n"
            reply += f"• 📈 **Maximum:** UGX {max_price:,.0f}\n\n"
            
            if avg_price > 0:
                if avg_price < 200_000_000:
                    reply += "💡 **Insight:** Affordable area - great for first-time buyers!"
                elif avg_price < 500_000_000:
                    reply += "💡 **Insight:** Mid-range properties - good value for money!"
                else:
                    reply += "💡 **Insight:** Premium area - strong investment potential!"
        
        return {
            'success': True,
            'reply': reply,
            'agent_used': self.name,
            'suggestions': ['Show properties', 'Compare areas', 'Investment advice'],
            'quick_replies': ['Show properties', 'Compare areas', 'Investment']
        }