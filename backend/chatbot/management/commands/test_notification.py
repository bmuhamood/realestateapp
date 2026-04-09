# chatbot/management/commands/test_notification.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import asyncio
from channels.layers import get_channel_layer

User = get_user_model()

class Command(BaseCommand):
    help = 'Send a test notification to a user'
    
    def add_arguments(self, parser):
        parser.add_argument('user_id', type=int, help='User ID to send notification to')
        parser.add_argument('--title', type=str, default='Test Notification', help='Notification title')
        parser.add_argument('--message', type=str, default='Your WebSocket is working! 🎉', help='Notification message')
    
    def handle(self, *args, **options):
        user_id = options['user_id']
        title = options['title']
        message = options['message']
        
        async def send_notification():
            channel_layer = get_channel_layer()
            await channel_layer.group_send(
                f'user_{user_id}',
                {
                    'type': 'notification_message',
                    'id': None,
                    'title': title,
                    'message': message,
                    'type': 'system',
                    'url': '/dashboard',
                    'created_at': None
                }
            )
            print(f"✅ Notification sent to user {user_id}")
        
        asyncio.run(send_notification())
        self.stdout.write(self.style.SUCCESS(f"Test notification sent to user {user_id}"))