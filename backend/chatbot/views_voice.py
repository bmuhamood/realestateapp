# chatbot/views_voice.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .voice.speech_handler import VoiceAssistant
import base64
import logging

logger = logging.getLogger(__name__)

class VoiceChatbotView(APIView):
    """Voice-enabled chatbot endpoint"""
    parser_classes = (MultiPartParser, FormParser)
    
    def __init__(self):
        super().__init__()
        self.voice_assistant = VoiceAssistant()
    
    def post(self, request):
        try:
            audio_file = request.FILES.get('audio')
            language = request.data.get('language', 'en')
            
            if not audio_file:
                return Response({
                    'error': 'No audio file provided'
                }, status=400)
            
            # Process voice query
            result = self.voice_assistant.process_voice_query(audio_file, language)
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"Voice processing error: {e}")
            return Response({
                'error': str(e),
                'voice_response': "Sorry, something went wrong. Please try again."
            }, status=500)
    
    def get(self, request):
        """Get language help"""
        language = request.query_params.get('language', 'en')
        help_text = self.voice_assistant.get_language_help(language)
        
        return Response({
            'supported_languages': self.voice_assistant.handler.LANGUAGES,
            'help': help_text
        })


class TextToSpeechView(APIView):
    """Convert text to speech"""
    
    def __init__(self):
        super().__init__()
        from .voice.speech_handler import VoiceHandler
        self.handler = VoiceHandler()
    
    def post(self, request):
        text = request.data.get('text', '')
        language = request.data.get('language', 'en')
        
        if not text:
            return Response({'error': 'No text provided'}, status=400)
        
        result = self.handler.text_to_speech(text, language)
        
        if result['success']:
            return Response({
                'audio_base64': result['audio_base64'],
                'language': language,
                'text': text
            })
        else:
            return Response({'error': result['error']}, status=500)