# chat/views.py - FIXED VERSION

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(
            Q(participants=self.request.user),
            is_active=True
        ).order_by('-last_message_time')


class CreateConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        other_user_id = request.data.get('other_user_id')
        property_id = request.data.get('property_id')
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()
        
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
            
            if property_id:
                from properties.models import Property
                try:
                    property_obj = Property.objects.get(id=property_id)
                    conversation.property = property_obj
                    conversation.save()
                except Property.DoesNotExist:
                    pass
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        return conversation.messages.all().order_by('created_at')
    
    def create(self, request, *args, **kwargs):
        # ✅ FIXED: Don't access request.body after DRF parsed it
        print("=" * 60)
        print("📨 MESSAGE CREATE REQUEST")
        print(f"Content-Type: {request.content_type}")
        print(f"Request Data: {request.data}")
        print("=" * 60)
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        content = self.request.data.get('content', '')
        print(f"📝 Content received: '{content}'")
        
        if not content or not content.strip():
            from rest_framework import serializers as drf_serializers
            raise drf_serializers.ValidationError({"content": "Message content cannot be empty"})
        
        print(f"✅ Saving message: '{content[:50]}...'")
        
        serializer.save(
            conversation=conversation,
            sender=self.request.user,
            content=content.strip()
        )
        
        # Update conversation
        conversation.last_message = content.strip()[:200]
        conversation.last_message_time = timezone.now()
        conversation.save(update_fields=['last_message', 'last_message_time'])
        print(f"✅ Conversation {conversation.id} updated")


class MarkMessagesReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        updated = Message.objects.filter(
            conversation=conversation
        ).exclude(
            sender=request.user
        ).update(is_read=True)
        return Response({'status': 'marked as read', 'updated': updated})


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        conversations = Conversation.objects.filter(participants=request.user)
        unread_count = 0
        for conv in conversations:
            unread_count += conv.messages.filter(is_read=False).exclude(sender=request.user).count()
        return Response({'unread_count': unread_count})