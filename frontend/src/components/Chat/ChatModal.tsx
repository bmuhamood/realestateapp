// src/components/Chat/ChatModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { Conversation, Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const SLATE = '#475569';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: number;
  recipientName: string;
  propertyId?: string;
  propertyTitle?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  propertyId,
  propertyTitle,
}) => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [debug, setDebug] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && recipientId) {
      initializeChat();
    }
  }, [isOpen, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebug(msg);
    setTimeout(() => setDebug(''), 3000);
  };

  const initializeChat = async () => {
    setLoading(true);
    addDebug('Initializing chat...');
    
    try {
      // Get or create conversation
      addDebug('Fetching conversations...');
      const convsRes = await chatAPI.getConversations();
      const conversations = convsRes.data.results || convsRes.data || [];
      console.log('Conversations:', conversations);
      
      let existingConv = conversations.find(
        (c: Conversation) => c.other_participant?.id === recipientId
      );
      
      if (!existingConv) {
        addDebug('Creating new conversation...');
        const newConvRes = await chatAPI.createConversation({
          other_user_id: recipientId,
          property_id: propertyId,
          initial_message: `Hi! I'm interested in${propertyTitle ? ` your property "${propertyTitle}"` : ' learning more'}.`,
        });
        existingConv = newConvRes.data;
        console.log('New conversation created:', existingConv);
      }
      
      if (!existingConv || !existingConv.id) {
        addDebug('Error: No conversation ID!');
        setLoading(false);
        return;
      }
      
      addDebug(`Conversation ID: ${existingConv.id}`);
      setConversation(existingConv);
      
      // Fetch messages
      await refreshMessages(existingConv.id);
      
      // Mark as read
      await chatAPI.markMessagesRead(existingConv.id);
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      addDebug('Error: ' + (error as Error).message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

const refreshMessages = async (convId: string) => {
  try {
    addDebug(`Fetching messages for conv: ${convId}`);
    const messagesRes = await chatAPI.getMessages(convId);
    console.log('Full messages response:', messagesRes);
    console.log('Response data:', messagesRes.data);
    
    // ✅ Handle both array and paginated responses
    let messagesArray: Message[] = [];
    if (Array.isArray(messagesRes.data)) {
      messagesArray = messagesRes.data;
    } else if (messagesRes.data && typeof messagesRes.data === 'object') {
      // Check if it's a paginated response with results array
      if ('results' in messagesRes.data && Array.isArray(messagesRes.data.results)) {
        messagesArray = messagesRes.data.results;
      } else {
        messagesArray = [];
      }
    }
    
    console.log('Processed messages array:', messagesArray);
    setMessages(messagesArray);
    addDebug(`Loaded ${messagesArray.length} messages`);
  } catch (error) {
    console.error('Failed to refresh messages:', error);
    addDebug('Error loading messages');
  }
};
  const sendMessage = async () => {
    if (!conversation || !newMessage.trim() || sending) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);
    addDebug(`Sending: "${messageContent}"`);
    
    try {
      console.log('Sending to conversation:', conversation.id);
      await chatAPI.sendMessage(conversation.id, messageContent);
      addDebug('Message sent!');
      
      // Refresh messages after sending
      await refreshMessages(conversation.id);
      
      // Mark as read
      await chatAPI.markMessagesRead(conversation.id);
      
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      addDebug('Send failed: ' + (error as Error).message);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      />
      
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 380,
          height: 500,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1001,
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            backgroundColor: RED,
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>Chat with {recipientName}</div>
            {propertyTitle && (
              <div style={{ fontSize: 11, opacity: 0.8 }}>Regarding: {propertyTitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ×
          </button>
        </div>
        
        {/* Debug Banner */}
        {debug && (
          <div
            style={{
              margin: '8px 12px',
              padding: '6px 10px',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 6,
              fontSize: 11,
              color: '#92400e',
              textAlign: 'center',
            }}
          >
            {debug}
          </div>
        )}
        
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#f9fafb',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender === user?.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      backgroundColor: isCurrentUser ? RED : '#fff',
                      color: isCurrentUser ? '#fff' : NAVY,
                      padding: '10px 14px',
                      borderRadius: 12,
                      borderBottomRightRadius: isCurrentUser ? 4 : 12,
                      borderBottomLeftRadius: isCurrentUser ? 12 : 4,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    {!isCurrentUser && (
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: RED }}>
                        {msg.sender_name}
                      </div>
                    )}
                    <div style={{ fontSize: 13, wordWrap: 'break-word' }}>{msg.content}</div>
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.6,
                        marginTop: 4,
                        textAlign: 'right',
                      }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #eef2f7',
            display: 'flex',
            gap: 8,
            backgroundColor: '#fff',
          }}
        >
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={2}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 20,
              border: '1.5px solid #eef2f7',
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: RED,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
              opacity: sending || !newMessage.trim() ? 0.6 : 1,
              alignSelf: 'flex-end',
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
      
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default ChatModal;