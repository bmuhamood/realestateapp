# chatbot/voice/speech_handler.py
import speech_recognition as sr
from gtts import gTTS
import os
import tempfile
import base64
import logging

logger = logging.getLogger(__name__)

class VoiceHandler:
    """Handle voice input and output for multiple languages"""
    
    # Language support for Uganda
    LANGUAGES = {
        'en': 'English',
        'lug': 'Luganda',
        'run': 'Runyankole',
        'luj': 'Lusoga',
        'ach': 'Acholi',
        'luo': 'Luo',
    }
    
    # Language codes for speech recognition
    RECOGNITION_LANGUAGES = {
        'en': 'en-US',
        'lug': 'lg-UG',  # Luganda
        'run': 'nyn-UG',  # Runyankole
    }
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
    
    def speech_to_text(self, audio_file, language='en'):
        """Convert speech to text in local language"""
        try:
            with sr.AudioFile(audio_file) as source:
                audio = self.recognizer.record(source)
                
                # Use Google's speech recognition (supports multiple languages)
                language_code = self.RECOGNITION_LANGUAGES.get(language, 'en-US')
                text = self.recognizer.recognize_google(audio, language=language_code)
                
                return {
                    'success': True,
                    'text': text,
                    'language': language
                }
        except sr.UnknownValueError:
            return {
                'success': False,
                'error': 'Could not understand audio'
            }
        except sr.RequestError as e:
            return {
                'success': False,
                'error': f'Speech recognition service error: {e}'
            }
    
    def text_to_speech(self, text, language='en'):
        """Convert text to speech in local language"""
        try:
            # Map language to gTTS language code
            gtts_langs = {
                'en': 'en',
                'lug': 'lg',  # Luganda
                'run': 'nyn',  # Runyankole
            }
            
            lang_code = gtts_langs.get(language, 'en')
            tts = gTTS(text=text, lang=lang_code, slow=False)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
                tts.save(fp.name)
                with open(fp.name, 'rb') as audio_file:
                    audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
                
                os.unlink(fp.name)  # Clean up temp file
                
                return {
                    'success': True,
                    'audio_base64': audio_data,
                    'text': text,
                    'language': language
                }
        except Exception as e:
            logger.error(f"Text-to-speech error: {e}")
            return {
                'success': False,
                'error': f'Text-to-speech error: {e}'
            }


class VoiceAssistant:
    """Voice-enabled assistant with local language support"""
    
    def __init__(self):
        self.handler = VoiceHandler()
    
    def process_voice_query(self, audio_file, language='en'):
        """Process voice query and return response"""
        # Convert speech to text
        speech_result = self.handler.speech_to_text(audio_file, language)
        
        if not speech_result['success']:
            return {
                'success': False,
                'error': speech_result['error'],
                'voice_response': "Sorry, I couldn't understand that. Can you please repeat?"
            }
        
        # For now, return simple response
        # In production, you would process through your chatbot
        response_text = f"You said: '{speech_result['text']}'. How can I help you with properties?"
        
        # Convert response to speech
        voice_response = self.handler.text_to_speech(response_text, language)
        
        return {
            'success': True,
            'text': response_text,
            'audio': voice_response.get('audio_base64') if voice_response['success'] else None,
            'language': language,
            'properties': []
        }
    
    def get_language_help(self, language='en'):
        """Get help text in local language"""
        help_texts = {
            'en': "You can speak in English. Try saying 'Find houses in Kololo' or 'What's the average price?'",
            'lug': "Oyinza okwogera mu Luganda. Geraako okugamba 'Noonya amayumba mu Kololo' oba 'Omutengo gwa waka ogwa wakati?'",
            'run': "Nimukozesa Runyankole. Mwogerere 'Nshaka amayumba muri Kololo' oba 'Omutengo gw'amayumba nigwe?'"
        }
        
        return help_texts.get(language, help_texts['en'])
    