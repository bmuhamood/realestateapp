# chatbot/agents/orchestrator.py - USES ALL AGENTS
from typing import Dict, Any, List
import logging
import re
from django.db.models import Q
from django.utils import timezone
from properties.models import Property
from .dynamic_data import DynamicDataProvider
from .property_agent import PropertyAgent
from .price_agent import PriceAgent
from .investment_agent import InvestmentAgent
from .location_agent import LocationAgent
from .booking_agent import BookingAgent
from .mortgage_agent import MortgageAgent
from .legal_agent import LegalAgent
from .construction_agent import ConstructionAgent

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """Intelligent orchestrator that routes to the right agent"""
    
    def __init__(self):
        # Initialize all agents
        self.agents = {
            'property': PropertyAgent(),
            'price': PriceAgent(),
            'investment': InvestmentAgent(),
            'location': LocationAgent(),
            'booking': BookingAgent(),
            'mortgage': MortgageAgent(),
            'legal': LegalAgent(),
            'construction': ConstructionAgent(),
        }
    
    def process_query(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Route query to the best agent"""
        message = context.get('original', '').lower()
        
        # Step 1: Determine primary intent
        intent = self._detect_intent(message)
        
        # Step 2: Route to appropriate agent
        if intent == 'property_search':
            return self.agents['property'].process(context)
        elif intent == 'price_check':
            return self.agents['price'].process(context)
        elif intent == 'investment':
            return self.agents['investment'].process(context)
        elif intent == 'location_info':
            return self.agents['location'].process(context)
        elif intent == 'booking':
            return self.agents['booking'].process(context)
        elif intent == 'mortgage':
            return self.agents['mortgage'].process(context)
        elif intent == 'legal':
            return self.agents['legal'].process(context)
        elif intent == 'construction':
            return self.agents['construction'].process(context)
        else:
            # Use property agent as default
            return self.agents['property'].process(context)
    
    def _detect_intent(self, message: str) -> str:
        """Detect user intent from message"""
        intents = {
            'property_search': ['find', 'search', 'looking for', 'property', 'house', 'apartment', 'home', 'show me'],
            'price_check': ['price', 'cost', 'budget', 'how much', 'expensive', 'cheap'],
            'investment': ['invest', 'roi', 'return', 'profit', 'yield', 'appreciation'],
            'location_info': ['area', 'neighborhood', 'location', 'surrounding', 'nearby'],
            'booking': ['book', 'viewing', 'schedule', 'appointment', 'visit', 'tour'],
            'mortgage': ['mortgage', 'loan', 'finance', 'bank', 'interest', 'payment'],
            'legal': ['legal', 'lawyer', 'title', 'deed', 'contract', 'tenant', 'landlord'],
            'construction': ['build', 'construct', 'renovate', 'contractor', 'materials'],
        }
        
        for intent, keywords in intents.items():
            for keyword in keywords:
                if keyword in message:
                    return intent
        
        return 'general'
    
    def _extract_context(self, message: str, user_id: str = None) -> Dict[str, Any]:
        """Extract rich context from message"""
        context = {'original': message}
        
        # Extract locations using dynamic data
        locations = DynamicDataProvider.extract_locations_from_text(message)
        if locations:
            context['locations'] = locations
        
        # Extract bedrooms
        bedrooms = self._extract_bedrooms(message)
        if bedrooms:
            context['bedrooms'] = bedrooms
        
        # Extract price
        price = self._extract_price(message)
        if price:
            context['price_max'] = price
        
        # Extract property type
        property_type = self._extract_property_type(message)
        if property_type:
            context['property_type'] = property_type
        
        # Extract transaction type
        if 'rent' in message or 'for rent' in message:
            context['transaction_type'] = 'rent'
        elif 'shortlet' in message or 'short stay' in message:
            context['transaction_type'] = 'shortlet'
        elif 'sale' in message or 'buy' in message:
            context['transaction_type'] = 'sale'
        
        return context
    
    def _extract_bedrooms(self, text: str) -> int:
        """Extract bedroom count"""
        patterns = [
            r'(\d+)\s*(?:bedroom|bed|br)',
            r'(\d+)\s*beds?',
        ]
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return int(match.group(1))
        return None
    
    def _extract_price(self, text: str) -> float:
        """Extract price from text"""
        patterns = [
            r'under\s+(\d+(?:\.\d+)?)\s*(?:billion|b)',
            r'under\s+(\d+(?:\.\d+)?)\s*(?:million|m)',
            r'under\s+(\d+(?:\.\d+)?)',
            r'budget\s+(\d+(?:\.\d+)?)\s*(?:million|m)?',
        ]
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                num = float(match.group(1))
                if 'billion' in pattern or 'b' in pattern:
                    num *= 1_000_000_000
                elif 'million' in pattern or 'm' in pattern:
                    num *= 1_000_000
                return num
        return None
    
    def _extract_property_type(self, text: str) -> str:
        """Extract property type"""
        types = {
            'house': ['house', 'houses', 'home'],
            'apartment': ['apartment', 'apartments', 'flat', 'flats'],
            'land': ['land', 'plot', 'acre'],
            'commercial': ['commercial', 'office', 'shop', 'retail'],
            'condo': ['condo', 'condos'],
            'villa': ['villa', 'villas'],
        }
        
        text_lower = text.lower()
        for prop_type, keywords in types.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return prop_type
        return None