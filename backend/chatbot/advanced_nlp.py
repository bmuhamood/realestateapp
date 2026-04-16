# chatbot/advanced_nlp.py
import random
import re
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import json

class HumanLikeConversationEngine:
    """Creates natural, context-aware conversations with personality"""
    
    def __init__(self):
        self.conversation_memory = defaultdict(lambda: {
            'topics': [],
            'preferences': {},
            'emotional_state': 'neutral',
            'last_interaction': None,
            'unanswered_questions': [],
            'follow_up_needed': False,
            'personality_traits': self._generate_personality()
        })
        
    def _generate_personality(self) -> Dict:
        """Give the bot a consistent, friendly personality"""
        return {
            'humor_level': random.uniform(0.3, 0.7),
            'empathy_level': 0.8,
            'formality_level': 0.3,  # Casual and friendly
            'excitement_level': 0.6,
            'patience_level': 0.9,
            'tone': 'friendly_professional'
        }
    
    def process_with_context(self, message: str, user_id: str, session_data: Dict) -> Dict:
        """Process message with full conversational context"""
        
        # Get user's conversation memory
        memory = self.conversation_memory[user_id]
        
        # Analyze emotional tone
        emotional_tone = self._analyze_emotional_tone(message)
        
        # Extract conversation context
        context = self._extract_conversation_context(message, memory, session_data)
        
        # Check for follow-ups
        if memory['follow_up_needed']:
            context['is_follow_up'] = True
        
        # Detect if user is asking about something mentioned earlier
        context['referencing_previous'] = self._detect_references(message, memory)
        
        # Track topics
        current_topics = self._extract_topics(message)
        memory['topics'].extend(current_topics)
        memory['topics'] = memory['topics'][-10:]  # Keep last 10 topics
        
        # Update emotional state
        memory['emotional_state'] = emotional_tone
        memory['last_interaction'] = datetime.now()
        
        # Generate natural response
        response = self._generate_natural_response(
            message=message,
            context=context,
            memory=memory,
            personality=memory['personality_traits']
        )
        
        return response
    
    def _analyze_emotional_tone(self, message: str) -> str:
        """Detect emotional tone of user message"""
        message_lower = message.lower()
        
        emotional_indicators = {
            'excited': ['excited', 'can\'t wait', 'love', 'perfect', 'amazing', 'wow'],
            'frustrated': ['frustrated', 'annoying', 'not working', 'why', 'ugh', 'problem'],
            'confused': ['confused', 'not sure', 'don\'t understand', 'what do you mean', 'huh'],
            'urgent': ['urgent', 'asap', 'quick', 'fast', 'immediately', 'right now'],
            'happy': ['happy', 'great', 'good', 'nice', 'awesome', 'fantastic'],
            'worried': ['worried', 'concerned', 'anxious', 'nervous', 'unsure'],
            'grateful': ['thanks', 'thank you', 'appreciate', 'helpful']
        }
        
        for emotion, indicators in emotional_indicators.items():
            if any(indicator in message_lower for indicator in indicators):
                return emotion
        
        return 'neutral'
    
    def _extract_conversation_context(self, message: str, memory: Dict, session_data: Dict) -> Dict:
        """Extract rich conversation context"""
        return {
            'time_of_day': self._get_time_based_context(),
            'session_duration': self._get_session_duration(memory),
            'conversation_depth': len(memory['topics']),
            'user_frustration': 'frustrated' in memory['emotional_state'],
            'previous_topics': memory['topics'][-3:],
            'recent_properties': session_data.get('recent_properties', [])
        }
    
    def _get_time_based_context(self) -> str:
        """Get time-appropriate greeting/context"""
        hour = datetime.now().hour
        
        if hour < 12:
            return 'morning'
        elif hour < 17:
            return 'afternoon'
        elif hour < 21:
            return 'evening'
        else:
            return 'night'
    
    def _get_session_duration(self, memory: Dict) -> int:
        """Calculate how long user has been chatting"""
        if memory['last_interaction']:
            delta = datetime.now() - memory['last_interaction']
            return delta.seconds // 60  # minutes
        return 0
    
    def _detect_references(self, message: str, memory: Dict) -> bool:
        """Detect if user is referencing previous conversation"""
        message_lower = message.lower()
        
        reference_words = ['that', 'those', 'them', 'it', 'earlier', 'before', 'previous', 'last']
        if not any(word in message_lower for word in reference_words):
            return False
        
        # Check if previous topics are mentioned
        for topic in memory['topics'][-3:]:
            if topic in message_lower:
                return True
        
        return False
    
    def _extract_topics(self, message: str) -> List[str]:
        """Extract main topics from message"""
        topics = []
        
        topic_keywords = {
            'location': ['kampala', 'wakiso', 'entebbe', 'jinja', 'mukono'],
            'property_type': ['house', 'apartment', 'land', 'commercial', 'condo'],
            'budget': ['price', 'cost', 'budget', 'expensive', 'cheap'],
            'size': ['bedroom', 'bathroom', 'square', 'meters', 'acre'],
            'action': ['book', 'view', 'schedule', 'visit', 'contact'],
            'service': ['clean', 'move', 'plumbing', 'electric', 'paint']
        }
        
        message_lower = message.lower()
        for topic, keywords in topic_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def _generate_natural_response(self, message: str, context: Dict, memory: Dict, personality: Dict) -> Dict:
        """Generate natural, human-like response with personality"""
        
        # Add contextual opening
        opening = self._get_contextual_opening(context, memory)
        
        # Generate main response
        main_response = self._generate_main_response(message, context, memory)
        
        # Add emotional acknowledgment
        emotional_ack = self._acknowledge_emotion(memory['emotional_state'], personality)
        
        # Add natural transition
        transition = self._get_natural_transition(context)
        
        # Add follow-up question (makes it conversational)
        follow_up = self._generate_follow_up(message, context, memory)
        
        # Combine naturally
        parts = []
        if opening:
            parts.append(opening)
        if emotional_ack:
            parts.append(emotional_ack)
        parts.append(main_response)
        if transition:
            parts.append(transition)
        if follow_up:
            parts.append(follow_up)
        
        # Add natural filler words occasionally
        if random.random() < 0.2:
            fillers = ["You know, ", "I mean, ", "Honestly, ", "To be honest, "]
            parts.insert(1, random.choice(fillers))
        
        full_response = " ".join(parts)
        
        # Mark if follow-up is needed
        memory['follow_up_needed'] = bool(follow_up)
        
        return {
            'reply': full_response,
            'emotional_tone': memory['emotional_state'],
            'context': context,
            'follow_up_needed': memory['follow_up_needed']
        }
    
    def _get_contextual_opening(self, context: Dict, memory: Dict) -> str:
        """Generate contextual opening based on time and session"""
        
        # First interaction of session
        if context['conversation_depth'] == 0:
            time_greetings = {
                'morning': "Good morning! ☀️ ",
                'afternoon': "Good afternoon! 😊 ",
                'evening': "Good evening! 🌙 ",
                'night': "Hey there! Even though it's late, I'm here to help! 🌟 "
            }
            return time_greetings.get(context['time_of_day'], "Hello! ")
        
        # Returning after a break
        if context['session_duration'] > 5:
            return "Welcome back! "
        
        # User seems frustrated
        if context['user_frustration']:
            return "I understand your frustration. "
        
        return ""
    
    def _acknowledge_emotion(self, emotion: str, personality: Dict) -> str:
        """Acknowledge user's emotional state"""
        
        if emotion == 'excited':
            responses = [
                "That's exciting! 🎉 ",
                "I love your enthusiasm! ✨ ",
                "How awesome! 😊 "
            ]
            return random.choice(responses) if random.random() < 0.7 else ""
        
        elif emotion == 'frustrated':
            responses = [
                "I hear you, and I'm sorry you're dealing with that. ",
                "I understand how that can be frustrating. Let me help. ",
                "You're right to be frustrated. Let's sort this out. "
            ]
            return random.choice(responses)
        
        elif emotion == 'confused':
            responses = [
                "Let me clarify that for you. ",
                "I can see how that might be confusing. Let me explain. ",
                "No worries, let me break that down. "
            ]
            return random.choice(responses)
        
        elif emotion == 'grateful':
            responses = [
                "You're very welcome! 😊 ",
                "My pleasure! Happy to help! ",
                "Anytime! That's what I'm here for. "
            ]
            return random.choice(responses)
        
        return ""
    
    def _get_natural_transition(self, context: Dict) -> str:
        """Generate natural transition phrases"""
        
        if context['referencing_previous']:
            transitions = [
                "Speaking of which, ",
                "About that, ",
                "Following up on that, "
            ]
            return random.choice(transitions) if random.random() < 0.5 else ""
        
        return ""
    
    def _generate_main_response(self, message: str, context: Dict, memory: Dict) -> str:
        """Generate the main response content"""
        # This would integrate with your existing response generation
        # Return empty here to let your existing logic handle it
        return ""
    
    def _generate_follow_up(self, message: str, context: Dict, memory: Dict) -> str:
        """Generate natural follow-up questions to keep conversation flowing"""
        
        # Don't always add follow-up
        if random.random() > 0.6:
            return ""
        
        # Based on conversation depth
        if context['conversation_depth'] < 3:
            follow_ups = [
                "What do you think? 🤔",
                "Does that help?",
                "What exactly are you looking for?",
                "Would you like to see some options?",
                "Should I show you what's available?"
            ]
        else:
            follow_ups = [
                "Want me to show you similar options?",
                "Should I save this search for you?",
                "Would you like to book a viewing?",
                "Interested in seeing more like this?",
                "Ready to take the next step?"
            ]
        
        return random.choice(follow_ups)