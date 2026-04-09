# chatbot/views.py
from ast import Dict
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from decimal import Decimal
import random
import time
from datetime import datetime

from .models import ChatSession, ChatMessage, UserChatPreference, ConversationAnalytics
from .intelligence import NaturalLanguageProcessor
from .search_engine import SmartPropertySearch
from .location_intelligence import DynamicLocationIntelligence

class ChatbotMessageView(APIView):
    permission_classes = []  # Allow all for now, but track users
    
    def __init__(self):
        super().__init__()
        self.nlp = NaturalLanguageProcessor()
        self.search_engine = SmartPropertySearch()
        self.location_intel = DynamicLocationIntelligence()
    
    def post(self, request):
        start_time = time.time()
        message = request.data.get('message', '').strip()
        
        if not message:
            return Response({'reply': "Hi! What can I help you with today? 🏠"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create session
        user = request.user if request.user.is_authenticated else None
        session = self._get_or_create_session(user, request)
        
        # Get user preferences and context
        user_preferences = self._get_user_preferences(user) if user else {}
        conversation_context = self._get_conversation_context(session)
        
        # Process message with NLP
        intent, confidence = self.nlp.extract_intent(message, conversation_context)
        entities = self.nlp.extract_entities(message)
        
        # Save user message
        ChatMessage.objects.create(
            session=session,
            message_type='user',
            intent=intent,
            content=message,
            entities=entities,
            confidence_score=confidence
        )
        
        # Generate response based on intent
        response_data = self._generate_response(
            message=message,
            intent=intent,
            entities=entities,
            user=user,
            session=session,
            user_preferences=user_preferences,
            conversation_context=conversation_context
        )
        
        # Save bot response
        bot_message = ChatMessage.objects.create(
            session=session,
            message_type='bot',
            intent=intent,
            content=response_data['reply'],
            suggestions=response_data.get('suggestions', []),
            property_data=response_data.get('property'),
            service_data=response_data.get('service'),
            confidence_score=confidence
        )
        
        # Update user preferences (learning)
        if user:
            self._update_user_preferences(user, intent, entities)
        
        # Track analytics
        response_time = int((time.time() - start_time) * 1000)
        ConversationAnalytics.objects.create(
            session=session,
            user_message=message,
            bot_response=response_data['reply'],
            intent=intent,
            response_time_ms=response_time
        )
        
        # Prepare response - include both single property (back compat) and properties array
        response = {
            'reply': response_data['reply'],
            'suggestions': response_data.get('suggestions', []),
            'quick_replies': response_data.get('quick_replies', []),
            'intent': intent,
            'entities': entities
        }
        
        # Add properties (multiple) if available
        if response_data.get('properties'):
            response['properties'] = response_data['properties']
        
        # Add single property for backward compatibility
        if response_data.get('property'):
            response['property'] = response_data['property']
        
        # Add service if available
        if response_data.get('service'):
            response['service'] = response_data['service']
        
        return Response(response)
    
    def _generate_response(self, message: str, intent: str, entities: Dict, user, session, user_preferences: Dict, conversation_context: Dict) -> Dict:
        """Generate intelligent, contextual response"""
        
        user_name = user.first_name or user.username if user else None
        
        # Handle different intents
        if intent == 'property_search':
            return self._handle_property_search(message, entities, user_preferences, user_name)
        
        elif intent == 'greeting':
            return self._handle_greeting(user_name, user_preferences)
        
        elif intent == 'booking':
            return self._handle_booking(conversation_context, user)
        
        elif intent == 'services':
            return self._handle_services(entities)
        
        elif intent == 'price_inquiry':
            return self._handle_price_inquiry(entities, user_preferences)
        
        elif intent == 'location_inquiry':
            return self._handle_location_inquiry(entities)
        
        elif intent == 'favorites':
            return self._handle_favorites(user)
        
        elif intent == 'help':
            return self._handle_help()
        
        else:
            return self._handle_general(message, user_preferences)
    
    def _handle_property_search(self, message: str, entities: Dict, user_preferences: Dict, user_name: str = None) -> Dict:
        """Handle property search with dynamic results - return multiple properties"""
        
        # Search for properties - get up to 5
        properties = self.search_engine.search(entities, user_preferences, limit=5)
        
        if properties:
            # Serialize ALL properties (not just the first one)
            properties_data = [self._serialize_property(p) for p in properties]
            
            count = len(properties)
            location_text = f" in {entities['locations'][0]}" if entities.get('locations') else ""
            price_text = f" under UGX {entities['price_max']:,.0f}" if entities.get('price_max') else ""
            
            responses = [
                f"I found {count} great properties{location_text}{price_text}! 🏠 Here are the top matches:",
                f"Nice choice{', ' + user_name if user_name else ''}! I found {count} properties matching your search. Take a look:",
                f"You're in luck! There are {count} properties{location_text}{price_text}. Here's what I found:",
            ]
            
            reply = random.choice(responses)
            suggestions = self.search_engine.get_smart_suggestions(entities, properties, user_preferences)
            
            return {
                'reply': reply,
                'properties': properties_data,  # Send ALL properties as array
                'property': properties_data[0] if properties_data else None,  # Keep for backward compatibility
                'suggestions': suggestions,
                'quick_replies': ['📅 Book viewing', '💰 Similar prices', '📍 Different area']
            }
        else:
            alternatives = self._get_alternative_suggestions(entities)
            location_text = f" in {entities['locations'][0]}" if entities.get('locations') else ""
            
            return {
                'reply': f"Hmm, I couldn't find any properties matching your criteria{location_text}. 🤔\n\n{alternatives['message']}\n\nWould you like to try one of these options?",
                'suggestions': alternatives['suggestions'],
                'quick_replies': ['Show all properties', 'Popular areas', 'Adjust budget']
            }
    
    def _handle_greeting(self, user_name: str = None, user_preferences: Dict = None) -> Dict:
        """Natural greeting with personalization"""
        
        # Get dynamic popular locations for suggestion
        popular_locations = self.location_intel.get_popular_locations(3)
        popular_location = popular_locations[0]['name'] if popular_locations else "Kampala"
        
        if user_name:
            greetings = [
                f"Hey {user_name}! 👋 Ready to find your dream home? I'm here to help!",
                f"Welcome back, {user_name}! 🏠 What are you looking for today?",
                f"Hello {user_name}! ✨ I've got some great properties to show you. Shall we start?",
            ]
        else:
            greetings = [
                f"Hey there! 👋 I'm your AI property assistant. Want to find a home in {popular_location} or learn about the market?",
                f"Hello! 🏠 Ready to explore properties across Uganda? I can help you find the perfect place!",
                f"Hi! ✨ Looking for a new home or just browsing? Let me know what you need!",
            ]
        
        reply = random.choice(greetings)
        
        # Personalized suggestions based on preferences
        suggestions = []
        if user_preferences and user_preferences.get('preferred_locations'):
            loc = user_preferences['preferred_locations'][0]
            suggestions.append(f"🔍 Properties in {loc}")
        if user_preferences and user_preferences.get('budget_max'):
            suggestions.append(f"💰 Under UGX {user_preferences['budget_max']:,.0f}")
        
        suggestions.extend(['⭐ Featured properties', '🔧 Property services', '📍 Browse locations'])
        
        return {
            'reply': reply,
            'suggestions': suggestions[:4],
            'quick_replies': ['Find properties', 'Check prices', 'Get help']
        }
    
# In chatbot/views.py - Update _handle_booking method

    def _handle_booking(self, conversation_context: Dict, user) -> Dict:
        """Handle booking requests intelligently"""
        
        last_property = conversation_context.get('last_property')
        
        # Check if the message contains a property reference
        message = conversation_context.get('last_message', '').lower()
        
        if last_property:
            return {
                'reply': f"Great! Let me help you book a viewing for **{last_property.get('title')}** 📅\n\n"
                        f"📍 Location: {last_property.get('district')}, {last_property.get('city')}\n"
                        f"💰 Price: UGX {last_property.get('price'):,.0f}\n\n"
                        f"Click here to schedule your viewing:\n"
                        f"👉 [Book Now](/property/{last_property['id']})\n\n"
                        f"Would you like to:\n"
                        f"• See similar properties\n"
                        f"• Check available time slots\n"
                        f"• Contact the agent directly",
                'suggestions': ['See similar properties', 'Check availability', 'Contact agent'],
                'quick_replies': ['Yes, book now', 'Show similar', 'Later'],
                'link': f'/property/{last_property["id"]}'
            }
        else:
            # Get dynamic location for suggestion
            popular_locations = self.location_intel.get_popular_locations(1)
            location = popular_locations[0]['name'] if popular_locations else "Kololo"
            
            return {
                'reply': f"I'd love to help you book a viewing! 🏠\n\n"
                        f"First, let me find some great properties for you. What are you looking for?\n\n"
                        f"**Try these searches:**\n"
                        f"• 'Find 3 bedroom houses in {location}'\n"
                        f"• 'Apartments under 2M UGX'\n"
                        f"• 'Show me properties near me'\n\n"
                        f"Or browse all properties [here](/properties)",
                'suggestions': ['Find properties', 'Check availability', 'Viewing tips'],
                'quick_replies': [f'Find in {location}', 'Under 1M UGX', '3+ bedrooms'],
                'link': '/properties'
            }
    
    def _handle_services(self, entities: Dict) -> Dict:
        """Handle service-related queries with real data"""
        
        from services.models import Service
        
        # Determine service type from entities or message
        service_keywords = {
            'cleaning': ['cleaning', 'clean', 'house cleaning'],
            'moving': ['moving', 'relocation', 'movers'],
            'plumbing': ['plumbing', 'plumber', 'pipe'],
            'electrical': ['electrical', 'electrician', 'wiring'],
            'painting': ['painting', 'paint', 'painter'],
            'renovation': ['renovation', 'renovate', 'remodel'],
        }
        
        service_type = None
        raw_message = entities.get('raw_message', '').lower()
        for s_type, keywords in service_keywords.items():
            for keyword in keywords:
                if keyword in raw_message:
                    service_type = s_type
                    break
            if service_type:
                break
        
        # Query services
        if service_type:
            services = Service.objects.filter(
                service_type=service_type,
                is_active=True
            ).order_by('-rating', '-is_boosted')[:3]
        else:
            services = Service.objects.filter(is_active=True, is_boosted=True).order_by('-rating')[:3]
        
        if services.exists():
            service_list = []
            for s in services[:3]:
                price_val = float(s.price) if s.price else 0
                service_list.append(f"• **{s.name}** - {s.description[:100] if s.description else ''}... - UGX {price_val:,.0f}")
            
            service_text = "\n".join(service_list)
            
            return {
                'reply': f"🔧 I found some great {service_type or 'featured'} services for you!\n\n{service_text}\n\nWould you like to book any of these services?",
                'suggestions': ['Book service', 'View all services', 'Compare prices'],
                'service': self._serialize_service(services[0]) if services else None,
                'link': '/services'
            }
        else:
            return {
                'reply': "I can help you find property services! 🛠️\n\nWe offer:\n• 🧹 Professional cleaning\n• 🚚 Moving & relocation\n• 🔧 Plumbing & electrical\n• 🎨 Painting & decoration\n\n👉 Check out our [Services Page](/services) for more details!\n\nWhat service do you need?",
                'suggestions': ['Cleaning services', 'Moving services', 'Plumbing', 'Electrical'],
                'link': '/services'
            }
    
    def _handle_price_inquiry(self, entities: Dict, user_preferences: Dict) -> Dict:
        """Handle price-related questions naturally"""
        
        from properties.models import Property
        
        # Get price statistics from database
        price_stats = Property.objects.filter(is_available=True).aggregate(
            min_price=models.Min('price'),
            max_price=models.Max('price'),
            avg_price=models.Avg('price')
        )
        
        min_price = float(price_stats['min_price'] or 0)
        max_price = float(price_stats['max_price'] or 0)
        avg_price = float(price_stats['avg_price'] or 0)
        
        if entities.get('price_min') or entities.get('price_max'):
            return {
                'reply': f"Based on your budget, I'll find the best options for you! 💰\n\nThe average property in our listings is around UGX {avg_price:,.0f}. Want me to show you what's available?",
                'suggestions': ['Show properties in my budget', 'Popular price ranges', 'Price trends'],
                'quick_replies': [f'Under {int(avg_price):,.0f}', 'Premium properties', 'Best value']
            }
        else:
            return {
                'reply': f"Great question! 📊\n\nHere's what properties typically cost:\n• **Minimum:** UGX {min_price:,.0f}\n• **Average:** UGX {avg_price:,.0f}\n• **Premium:** UGX {max_price:,.0f}+\n\nWhat's your budget? I'll find the perfect match for you! 💵",
                'suggestions': [f'Properties under {int(avg_price):,.0f}', 'Show all price ranges', 'Find best deals'],
                'quick_replies': ['Under 500M', '1B to 2B', 'Premium only']
            }
    
    def _handle_location_inquiry(self, entities: Dict) -> Dict:
        """Handle location questions with dynamic real-time data"""
        
        # Get dynamic locations from database
        popular_locations = self.location_intel.get_popular_locations(10)
        
        if not popular_locations:
            return {
                'reply': "We're currently adding properties across Uganda! 🏗️\n\nCheck back soon for available locations, or contact us to list your property.",
                'suggestions': ['Contact support', 'List my property', 'Learn more']
            }
        
        # Check if user asked about a specific location
        if entities.get('locations'):
            location_name = entities['locations'][0]
            stats = self.location_intel.get_location_stats(location_name)
            
            if stats['property_count'] > 0:
                property_types_text = ', '.join(stats['property_types'][:3]) if stats['property_types'] else 'various types'
                
                return {
                    'reply': f"📍 **{location_name}** has {stats['property_count']} properties available!\n\n"
                            f"💰 Price range: UGX {stats['min_price']:,.0f} - UGX {stats['max_price']:,.0f}\n"
                            f"📊 Average: UGX {stats['avg_price']:,.0f}\n"
                            f"🏠 Property types: {property_types_text}\n\n"
                            f"Would you like to see properties in {location_name}?",
                    'suggestions': [f'Find properties in {location_name}', f'Under {stats["avg_price"]:,.0f} UGX', 'Compare areas'],
                    'link': f'/properties?location={location_name}'
                }
        
        # Generic location inquiry - show popular locations
        location_list = []
        for loc in popular_locations[:8]:
            location_list.append(f"• **{loc['name']}** ({loc['property_count']} properties)")
        
        location_text = "\n".join(location_list)
        
        return {
            'reply': f"📍 We have properties available across Uganda!\n\n**Most active areas:**\n{location_text}\n\nWhich area interests you? I can show you specific properties there! 🏠",
            'suggestions': [f'Find properties in {popular_locations[0]["name"]}', 'View all locations', 'Popular areas'],
            'link': '/properties'
        }
    
    def _handle_favorites(self, user) -> Dict:
        """Handle favorites query"""
        
        if not user:
            return {
                'reply': "🔐 You'll need to login to view your favorites! It's quick and free.\n\n👉 [Login here](/login) or [Register](/register) to save and manage your favorite properties.",
                'suggestions': ['Login', 'Register', 'Browse properties'],
                'link': '/login'
            }
        
        favorites_count = user.favorite_set.count()
        
        if favorites_count > 0:
            return {
                'reply': f"⭐ You have {favorites_count} saved favorite{'s' if favorites_count != 1 else ''}!\n\nClick below to view all your saved properties:\n\n👉 [View My Favorites](/favorites)\n\nWould you like to see similar properties to your favorites?",
                'suggestions': ['View favorites', 'Find similar', 'Remove some'],
                'link': '/favorites'
            }
        else:
            # Get dynamic popular location
            popular_locations = self.location_intel.get_popular_locations(1)
            location = popular_locations[0]['name'] if popular_locations else "Kampala"
            
            return {
                'reply': f"You haven't saved any favorites yet! 💔\n\nStart exploring properties and click the ❤️ button on ones you like. I'll help you find great options!\n\nWant me to show you some popular properties in {location} to start with?",
                'suggestions': [f'Show properties in {location}', 'Get recommendations', 'Browse all'],
                'link': '/properties'
            }
    
    def _handle_help(self) -> Dict:
        """Help menu with dynamic location examples"""
        
        # Get dynamic location for examples
        popular_locations = self.location_intel.get_popular_locations(2)
        location1 = popular_locations[0]['name'] if popular_locations else "Kololo"
        location2 = popular_locations[1]['name'] if len(popular_locations) > 1 else "Naguru"
        
        return {
            'reply': f"""🤖 **How I Can Help You** - Just talk naturally!

**🏠 Find Properties:**
• "Find 3 bedroom houses in {location1}"
• "Apartments for rent under 2M UGX"
• "Show me properties in {location2}"

**💰 Price & Budget:**
• "Properties under 500M UGX"
• "What's the average price?"
• "Show me affordable options"

**🔧 Services:**
• "I need cleaning services"
• "Find moving companies"
• "Plumbing services near me"

**📅 Bookings & Favorites:**
• "Book a viewing"
• "Save this property"
• "Show my favorites"

**💡 Pro tip:** Just tell me what you want naturally - I understand real conversations!

What would you like to do? ✨""",
            'suggestions': ['Find properties', 'Check prices', 'Book viewing', 'Services'],
            'quick_replies': ['Properties', 'Services', 'Prices', 'Help']
        }
    
    def _handle_general(self, message: str, user_preferences: Dict) -> Dict:
        """Fallback for general conversations"""
        
        # Get dynamic location for suggestion
        popular_locations = self.location_intel.get_popular_locations(1)
        location = popular_locations[0]['name'] if popular_locations else "your area"
        
        responses = [
            f"I'm here to help you find properties! 🏠 Want to search by location, budget, or property type? For example, try 'Find houses in {location}'",
            "Great question! I specialize in property searches. Tell me what you're looking for - area, budget, bedrooms, anything! ✨",
            f"I can help you find the perfect property! {self._get_smart_suggestion_text(user_preferences)} What would you like to know?",
        ]
        
        return {
            'reply': random.choice(responses),
            'suggestions': ['Find properties', 'Check prices', 'View services', 'Get help'],
            'quick_replies': ['Search properties', 'My budget', 'Popular areas']
        }
    
    # Helper methods
    def _get_or_create_session(self, user, request):
        """Get or create chat session"""
        session_id = request.headers.get('X-Session-ID')
        
        if session_id:
            try:
                session = ChatSession.objects.get(session_id=session_id, is_active=True)
                return session
            except ChatSession.DoesNotExist:
                pass
        
        return ChatSession.objects.create(user=user)
    
    def _get_conversation_context(self, session: ChatSession) -> Dict:
        """Get recent conversation context"""
        recent_messages = ChatMessage.objects.filter(session=session).order_by('-created_at')[:10]
        
        context = {
            'last_property': None,
            'recent_intents': [],
            'last_topic': None
        }
        
        for msg in recent_messages:
            if msg.message_type == 'bot' and msg.property_data:
                context['last_property'] = msg.property_data
                break
        
        return context
    
    def _get_user_preferences(self, user) -> Dict:
        """Get or create user preferences"""
        try:
            prefs = UserChatPreference.objects.get(user=user)
            return {
                'preferred_locations': prefs.preferred_locations,
                'preferred_property_types': prefs.preferred_property_types,
                'budget_min': float(prefs.budget_min) if prefs.budget_min else None,
                'budget_max': float(prefs.budget_max) if prefs.budget_max else None,
                'preferred_bedrooms': prefs.preferred_bedrooms,
            }
        except UserChatPreference.DoesNotExist:
            return {}
    
    def _update_user_preferences(self, user, intent: str, entities: Dict):
        """Learn from user interactions"""
        prefs, created = UserChatPreference.objects.get_or_create(user=user)
        
        # Update location preferences
        if entities.get('locations'):
            new_locations = [loc for loc in entities['locations'] if loc not in prefs.preferred_locations]
            prefs.preferred_locations = (prefs.preferred_locations + new_locations)[:5]
        
        # Update property type preferences
        if entities.get('property_types'):
            new_types = [pt for pt in entities['property_types'] if pt not in prefs.preferred_property_types]
            prefs.preferred_property_types = (prefs.preferred_property_types + new_types)[:5]
        
        # Update budget preferences
        if entities.get('price_max') and (not prefs.budget_max or entities['price_max'] < prefs.budget_max):
            prefs.budget_max = entities['price_max']
        if entities.get('price_min') and (not prefs.budget_min or entities['price_min'] > prefs.budget_min):
            prefs.budget_min = entities['price_min']
        
        # Update bedroom preference
        if entities.get('bedrooms') and (not prefs.preferred_bedrooms or entities['bedrooms'] > prefs.preferred_bedrooms):
            prefs.preferred_bedrooms = entities['bedrooms']
        
        # Track intent frequency
        prefs.frequent_intents[intent] = prefs.frequent_intents.get(intent, 0) + 1
        prefs.total_interactions += 1
        
        prefs.save()
    
    def _get_alternative_suggestions(self, entities: Dict) -> Dict:
        """Generate alternative suggestions when no results found"""
        
        suggestions = []
        message_parts = []
        
        if entities.get('locations'):
            suggestions.append("🔍 Try a nearby location")
            message_parts.append("expand your search to nearby areas")
        
        if entities.get('price_max'):
            suggestions.append("💰 Increase your budget slightly")
            message_parts.append("try a higher budget")
        
        if entities.get('bedrooms'):
            suggestions.append("🛏️ Adjust bedroom count")
            message_parts.append(f"consider {entities['bedrooms'] - 1} or {entities['bedrooms'] + 1} bedrooms")
        
        if not suggestions:
            suggestions = ["📍 Browse all locations", "⭐ View featured properties", "🔧 Check property services"]
            message_parts = ["browse all available properties"]
        
        return {
            'message': f"Try these suggestions: {' or '.join(message_parts)}.",
            'suggestions': suggestions[:3]
        }
    
    def _get_smart_suggestion_text(self, user_preferences: Dict) -> str:
        """Generate personalized suggestion text"""
        if user_preferences and user_preferences.get('preferred_locations'):
            loc = user_preferences['preferred_locations'][0]
            return f"Since you like {loc}, want to see properties there?"
        return "Just tell me what you're looking for!"
    
    def _serialize_property(self, property) -> Dict:
        """Serialize property for API response"""
        price_val = float(property.price) if isinstance(property.price, Decimal) else property.price
        
        image_url = None
        first_image = property.images.first()
        if first_image and first_image.image:
            image_url = first_image.image.url
        
        return {
            'id': property.id,
            'title': property.title,
            'price': price_val,
            'transaction_type': property.transaction_type,
            'district': property.district,
            'city': property.city,
            'bedrooms': property.bedrooms,
            'bathrooms': property.bathrooms,
            'square_meters': property.square_meters,
            'image': image_url,
            'is_boosted': property.is_boosted
        }
    
    def _serialize_service(self, service) -> Dict:
        """Serialize service for API response"""
        price_val = float(service.price) if service.price else 0
        
        return {
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'price': price_val,
            'price_unit': service.price_unit,
            'rating': float(service.rating) if service.rating else 0,
            'image': service.image.url if service.image else None
        }