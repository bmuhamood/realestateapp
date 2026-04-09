# backend/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
import asyncio
from decimal import Decimal

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = None
        self.keep_alive_task = None
        self.room_group_name = None
        
        # Get token from query string
        query_string = self.scope['query_string'].decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        print(f"WebSocket connection attempt with token: {token[:20] if token else 'No token'}...")
        
        if token:
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                self.user = await self.get_user(user_id)
                
                if self.user and self.user.is_authenticated:
                    self.room_group_name = f'user_{self.user.id}'
                    
                    # Add to user's group
                    await self.channel_layer.group_add(
                        self.room_group_name,
                        self.channel_name
                    )
                    await self.accept()
                    
                    print(f"✅ WebSocket connected for user: {self.user.username} (ID: {self.user.id})")
                    
                    # Send connection confirmation (matching frontend expectation)
                    await self.send(text_data=json.dumps({
                        'type': 'connection_established',
                        'message': 'Connected to notification service'
                    }))
                    
                    # Start keep-alive task
                    self.keep_alive_task = asyncio.create_task(self.send_keep_alive())
                    return
                else:
                    print(f"❌ User not authenticated or not found for token")
            except Exception as e:
                print(f"❌ Token validation error: {e}")
        
        print(f"❌ WebSocket connection rejected - no valid token")
        await self.close()
    
    async def disconnect(self, close_code):
        print(f"WebSocket disconnected for user: {self.user.username if self.user else 'Unknown'}, code: {close_code}")
        
        if self.keep_alive_task:
            self.keep_alive_task.cancel()
        
        if self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def send_keep_alive(self):
        """Send ping to keep connection alive"""
        while True:
            try:
                await asyncio.sleep(30)  # Send ping every 30 seconds
                await self.send(text_data=json.dumps({'type': 'ping'}))
                print(f"💓 Ping sent to user: {self.user.username if self.user else 'Unknown'}")
            except Exception as e:
                print(f"Keep-alive error: {e}")
                break
    
    async def receive(self, text_data):
        """Handle incoming messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', '')
            
            print(f"📨 Received from client: {message_type}")
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({'type': 'pong'}))
            elif message_type == 'handshake':
                # Acknowledge handshake
                await self.send(text_data=json.dumps({
                    'type': 'connection_established',
                    'message': 'Handshake complete'
                }))
            elif message_type == 'chat':
                await self.handle_chat_message(data)
                
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
        except Exception as e:
            print(f"Error receiving message: {e}")
    
    async def handle_chat_message(self, data):
        """Process chat messages and send responses"""
        message = data.get('message', '').lower().strip()
        
        if not message:
            await self.send(text_data=json.dumps({
                'type': 'chat_response',
                'reply': 'Please enter a message.'
            }))
            return
        
        # Generate response
        response_data = await self.generate_response(message)
        
        # Send response to client
        await self.send(text_data=json.dumps({
            'type': 'chat_response',
            'reply': response_data['reply'],
            'suggestions': response_data.get('suggestions', []),
            'property': response_data.get('property')
        }))
    
    async def generate_response(self, message):
        """Generate intelligent responses"""
        
        # Property search patterns
        if any(word in message for word in ['find', 'looking for', 'search', 'property', 'house', 'apartment']):
            return await self.search_properties(message)
        
        # Booking help
        if 'book' in message or 'viewing' in message or 'visit' in message:
            return {
                'reply': "To schedule a property viewing, go to the property details page and click 'Schedule Viewing'. Would you like me to help you find properties first?",
                'suggestions': ['Find properties in Kampala', 'Show me luxury homes', 'Properties under 500k']
            }
        
        # Price help
        if 'price' in message or 'cost' in message or 'budget' in message:
            return {
                'reply': "Property prices vary by location. In Kampala, rent ranges from UGX 400k to UGX 5M/month, while sales range from UGX 100M to UGX 1B+. What's your budget?",
                'suggestions': ['Properties under 1M', 'Properties under 500k', 'Show affordable options']
            }
        
        # Default responses
        import random
        default_responses = [
            "I can help you find properties, schedule viewings, or answer questions. What would you like to know?",
            "Feel free to ask me about properties for sale/rent, booking viewings, or our services!",
            "I'm your property assistant. Ask me about available properties, prices, or how to book a viewing."
        ]
        
        return {
            'reply': random.choice(default_responses),
            'suggestions': [
                'Find properties in Kampala',
                'How to book a viewing?',
                'Property prices',
                'Become an agent'
            ]
        }
    
    async def search_properties(self, message):
        """Search for properties based on message"""
        
        # Extract location
        locations = ['kampala', 'wakiso', 'kira', 'ntinda', 'kololo', 'naguru', 'muyenga']
        location = None
        for loc in locations:
            if loc in message:
                location = loc.capitalize()
                break
        
        # Build query using database_sync_to_async
        property = await self.get_property_by_location(location)
        
        if property:
            # Convert Decimal to float for JSON serialization
            price_value = float(property.price) if isinstance(property.price, Decimal) else property.price
            
            # Get image URL safely
            image_url = await self.get_property_image(property)
            
            return {
                'reply': f"I found {property.title} in {property.district}! Price: UGX {price_value:,.0f}{'/month' if property.transaction_type == 'rent' else ''}. Would you like to see more details?",
                'suggestions': ['View property details', 'See similar properties', 'Book a viewing'],
                'property': {
                    'id': property.id,
                    'title': property.title,
                    'price': price_value,
                    'transaction_type': property.transaction_type,
                    'district': property.district,
                    'city': property.city,
                    'bedrooms': property.bedrooms,
                    'bathrooms': property.bathrooms,
                    'image': image_url
                }
            }
        else:
            return {
                'reply': "I couldn't find properties matching your criteria. Would you like to browse all properties?",
                'suggestions': ['Show all properties', 'Browse by location']
            }
    
    # This method is called when a notification is sent to the group
    async def notification_message(self, event):
        """Send notification to WebSocket (called by Django signals or other services)"""
        print(f"📢 Sending notification to user: {self.user.username if self.user else 'Unknown'}")
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': {
                'id': event.get('id'),
                'title': event.get('title'),
                'message': event.get('message'),
                'type': event.get('type', 'system'),
                'url': event.get('url', '/'),
                'created_at': event.get('created_at')
            }
        }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_property_by_location(self, location):
        from properties.models import Property
        from django.db.models import Q
        
        queryset = Property.objects.filter(is_available=True)
        if location:
            queryset = queryset.filter(Q(city__icontains=location) | Q(district__icontains=location))
        return queryset.order_by('-views_count').first()
    
    @database_sync_to_async
    def get_property_image(self, property):
        """Get first image URL safely"""
        try:
            first_image = property.images.first()
            if first_image and first_image.image:
                return first_image.image.url
        except:
            pass
        return None


# Helper function to send notifications from anywhere in your Django app
async def send_notification(user_id, title, message, notification_type='system', url='/'):
    """
    Send a notification to a specific user via WebSocket
    Usage: from backend.consumers import send_notification
    """
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f'user_{user_id}',
        {
            'type': 'notification_message',
            'id': None,
            'title': title,
            'message': message,
            'type': notification_type,
            'url': url,
            'created_at': None
        }
    )