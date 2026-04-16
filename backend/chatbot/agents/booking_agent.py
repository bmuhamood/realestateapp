# chatbot/agents/booking_agent.py
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
from .base_agent import BaseAgent

class BookingAgent(BaseAgent):
    """Specialized agent for handling property viewings and appointments"""
    
    def __init__(self):
        super().__init__(
            name="Booking Specialist",
            expertise="Property viewings, scheduling, and appointment management"
        )
        self.booking_keywords = ['book', 'viewing', 'schedule', 'visit', 'appointment',
                                 'see property', 'tour', 'check availability']
    
    def can_handle(self, context: Dict[str, Any]) -> Tuple[bool, float]:
        """Check if this is a booking query"""
        message = context.get('original', '').lower()
        
        score = 0
        for keyword in self.booking_keywords:
            if keyword in message:
                score += 0.25
        
        # Check if there's a property in context
        if context.get('last_property'):
            score += 0.3
        
        confidence = min(score, 1.0)
        return (confidence > self.confidence_threshold, confidence)
    
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle booking requests"""
        
        # Check if user has a specific property in mind
        if context.get('last_property'):
            return self._schedule_viewing(context['last_property'])
        
        # Check if user mentioned a property ID
        property_id = self._extract_property_id(context.get('original', ''))
        if property_id:
            return self._schedule_viewing({'id': property_id})
        
        # General booking help
        return self._booking_guide()
    
    def _schedule_viewing(self, property_info: Dict) -> Dict[str, Any]:
        """Schedule a viewing for a specific property"""
        
        # In production, you'd integrate with your calendar/booking system
        available_slots = self._get_available_slots()
        
        reply = f"📅 **Schedule Your Property Viewing**\n\n"
        reply += f"Great choice! Let me help you book a viewing.\n\n"
        reply += f"**Available Time Slots:**\n"
        
        for slot in available_slots[:3]:
            reply += f"• {slot['date']} at {slot['time']}\n"
        
        reply += f"\n💡 **How to Book:**\n"
        reply += f"1. Tap 'Book Now' below\n"
        reply += f"2. Choose your preferred time\n"
        reply += f"3. Confirm your contact details\n\n"
        reply += f"Would you like to proceed with booking?"
        
        return {
            'success': True,
            'reply': reply,
            'booking_link': f'/property/{property_info["id"]}/book',
            'available_slots': available_slots,
            'suggestions': ['Book now', 'Check other times', 'Ask questions'],
            'quick_replies': ['Book now 📅', 'Later ⏰', 'Questions ❓'],
            'agent_used': self.name
        }
    
    def _booking_guide(self) -> Dict[str, Any]:
        """Provide general booking guidance"""
        reply = """📅 **How to Book a Property Viewing**

**Step 1:** Find a property you like
**Step 2:** Tap "Schedule Viewing" 
**Step 3:** Choose your preferred date & time
**Step 4:** Confirm your details

**What happens next?**
• You'll receive a confirmation SMS/email
• The agent will confirm within 2 hours
• You'll get a reminder 1 day before

**Tips for a successful viewing:**
✅ Prepare your questions in advance
✅ Check the neighborhood at different times
✅ Bring a checklist of your requirements

**Ready to find properties to view?** Let me help you search! 🏠"""
        
        return {
            'success': True,
            'reply': reply,
            'suggestions': ['Find properties', 'Viewing checklist', 'Contact agent'],
            'quick_replies': ['Search properties', 'Viewing tips', 'Ask agent'],
            'agent_used': self.name
        }
    
    def _get_available_slots(self) -> list:
        """Get available viewing slots (simplified)"""
        now = datetime.now()
        slots = []
        
        for i in range(3):
            date = now + timedelta(days=i+1)
            slots.append({
                'date': date.strftime('%A, %B %d'),
                'time': '10:00 AM'
            })
            slots.append({
                'date': date.strftime('%A, %B %d'),
                'time': '2:00 PM'
            })
            slots.append({
                'date': date.strftime('%A, %B %d'),
                'time': '4:00 PM'
            })
        
        return slots[:6]
    
    def _extract_property_id(self, message: str) -> int:
        """Extract property ID from message"""
        import re
        match = re.search(r'property\s*#?(\d+)', message)
        if match:
            return int(match.group(1))
        return None