# chatbot/agents/base_agent.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all specialized agents"""
    
    def __init__(self, name: str, expertise: str):
        self.name = name
        self.expertise = expertise
        self.confidence_threshold = 0.7
        self.conversation_memory = {}
    
    @abstractmethod
    def can_handle(self, context: Dict[str, Any]) -> tuple[bool, float]:
        """Check if this agent can handle the query. Returns (can_handle, confidence)"""
        pass
    
    @abstractmethod
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process the query and return response"""
        pass
    
    def add_to_memory(self, session_id: str, data: Dict[str, Any]):
        """Store conversation context for learning"""
        if session_id not in self.conversation_memory:
            self.conversation_memory[session_id] = []
        self.conversation_memory[session_id].append({
            'timestamp': datetime.now(),
            'data': data
        })
        # Keep only last 50 interactions
        if len(self.conversation_memory[session_id]) > 50:
            self.conversation_memory[session_id] = self.conversation_memory[session_id][-50:]
    
    def get_memory(self, session_id: str) -> list:
        """Retrieve conversation memory"""
        return self.conversation_memory.get(session_id, [])