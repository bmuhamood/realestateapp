# chatbot/search_engine.py
from django.db.models import Q, Count, Avg
from properties.models import Property
from decimal import Decimal
from typing import Dict, List, Optional
import random

class SmartPropertySearch:
    """Intelligent property search with context awareness and personalization"""
    
    @classmethod
    def search(cls, entities: Dict, user_preferences: Dict = None, limit: int = 5) -> List:
        """Search properties based on extracted entities and user preferences"""
        
        queryset = Property.objects.filter(is_available=True, is_verified=True)
        
        # Apply location filter
        if entities.get('locations'):
            location_q = Q()
            for location in entities['locations']:
                location_q |= Q(city__icontains=location) | Q(district__icontains=location)
            queryset = queryset.filter(location_q)
        
        # Apply property type filter
        if entities.get('property_types'):
            queryset = queryset.filter(property_type__in=entities['property_types'])
        
        # Apply transaction type filter
        if entities.get('transaction_type'):
            queryset = queryset.filter(transaction_type=entities['transaction_type'])
        
        # Apply bedroom filter
        if entities.get('bedrooms'):
            queryset = queryset.filter(bedrooms__gte=entities['bedrooms'])
        
        # Apply bathroom filter
        if entities.get('bathrooms'):
            queryset = queryset.filter(bathrooms__gte=entities['bathrooms'])
        
        # Apply price filters
        if entities.get('price_min'):
            queryset = queryset.filter(price__gte=entities['price_min'])
        if entities.get('price_max'):
            queryset = queryset.filter(price__lte=entities['price_max'])
        
        # Apply user preferences if no explicit filters
        if not queryset.exists() and user_preferences:
            if user_preferences.get('preferred_locations'):
                location_q = Q()
                for loc in user_preferences['preferred_locations'][:3]:
                    location_q |= Q(city__icontains=loc) | Q(district__icontains=loc)
                queryset = queryset.filter(location_q)
            
            if user_preferences.get('budget_max'):
                queryset = queryset.filter(price__lte=user_preferences['budget_max'])
        
        # Sort by relevance (boosted first, then views, then recent)
        queryset = queryset.order_by(
            '-is_boosted',
            '-views_count',
            '-created_at'
        )
        
        return list(queryset[:limit])
    
    @classmethod
    def get_smart_suggestions(cls, entities: Dict, search_results: List, user_preferences: Dict = None) -> List[str]:
        """Generate intelligent suggestions based on context"""
        suggestions = []
        
        if search_results:
            # Suggest actions based on found property
            prop = search_results[0]
            suggestions.append(f"📅 Book viewing for {prop.title[:30]}")
            suggestions.append(f"💰 Similar properties under UGX {prop.price:,.0f}")
            
            if prop.bedrooms:
                suggestions.append(f"🛏️ {prop.bedrooms}+ bedroom properties")
        
        if entities.get('locations'):
            suggestions.append(f"📍 More in {entities['locations'][0]}")
        
        if entities.get('price_max'):
            suggestions.append(f"💰 Properties under UGX {entities['price_max']:,.0f}")
        
        # Add default suggestions if needed
        if len(suggestions) < 3:
            suggestions.extend([
                "⭐ Show featured properties",
                "🔧 Property services",
                "📍 Browse all locations"
            ])
        
        return suggestions[:4]
    
    @classmethod
    def get_similar_properties(cls, property_id: int, limit: int = 3) -> List:
        """Find similar properties based on multiple criteria"""
        try:
            current = Property.objects.get(id=property_id)
            
            similar = Property.objects.filter(
                is_available=True,
                is_verified=True
            ).exclude(id=property_id)
            
            # Build similarity score
            similar = similar.annotate(
                similarity_score=(
                    Q(property_type=current.property_type) +
                    Q(city=current.city) +
                    Q(district=current.district) +
                    (Q(price__range=(current.price * 0.7, current.price * 1.3)) if current.price else 0) +
                    (Q(bedrooms__range=(current.bedrooms - 1, current.bedrooms + 1)) if current.bedrooms else 0)
                )
            ).order_by('-similarity_score', '-views_count')[:limit]
            
            return list(similar)
        except Property.DoesNotExist:
            return []
    
    @classmethod
    def get_popular_in_area(cls, location: str, limit: int = 3) -> List:
        """Get most viewed properties in a specific area"""
        return list(Property.objects.filter(
            Q(city__icontains=location) | Q(district__icontains=location),
            is_available=True
        ).order_by('-views_count', '-likes_count')[:limit])