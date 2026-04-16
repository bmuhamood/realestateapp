# chatbot/views_dynamic.py - FAST VERSION
from rest_framework.views import APIView
from rest_framework.response import Response
from .agents.orchestrator import AgentOrchestrator
import logging
import time

logger = logging.getLogger(__name__)

class UltimatePropertyChatbotView(APIView):
    """Fast, intelligent property chatbot"""
    
    permission_classes = []
    
    def __init__(self):
        super().__init__()
        self.orchestrator = AgentOrchestrator()
    
    def post(self, request):
        start_time = time.time()
        
        try:
            message = request.data.get('message', '').strip()
            session_id = request.data.get('session_id', 'anonymous')
            
            if not message:
                return Response({
                    'reply': "Hello! How can I help you find properties today? 🏠",
                    'quick_replies': ['Find properties', 'Popular areas', 'Price guide']
                })
            
            # Process query
            context = {'original': message, 'session_id': session_id}
            result = self.orchestrator.process_query(context)
            
            # Log response time
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"Response time: {elapsed:.0f}ms")
            
            return Response(result)
             
        except Exception as e:
            logger.error(f"Chatbot error: {e}", exc_info=True)
            return Response({
                'reply': "Quick question - what kind of property are you looking for? 🏠",
                'quick_replies': ['Find properties', 'Popular areas', 'Price guide']
            })