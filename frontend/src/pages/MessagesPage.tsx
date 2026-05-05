// src/pages/MessagesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { Conversation, Message, PaginatedResponse } from '../types';

const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const SLATE = '#475569';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { userId?: number; propertyId?: string } | null;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  useEffect(() => {
    if (state?.userId && conversations.length > 0) {
      const existingConv = conversations.find(
        c => c.other_participant?.id === state.userId
      );
      if (existingConv) {
        handleSelectConversation(existingConv);
      } else {
        createNewConversation();
      }
    }
  }, [conversations, state]);
  
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data.results || res.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const createNewConversation = async () => {
    if (!state?.userId) return;
    try {
      const res = await chatAPI.createConversation({
        other_user_id: state.userId,
        property_id: state.propertyId,
        initial_message: "I'm interested in your property..."
      });
      setConversations(prev => [res.data, ...prev]);
      handleSelectConversation(res.data);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };
  
  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const res = await chatAPI.getMessages(conversationId);
      // ✅ Handle both array and paginated responses
      let messagesData: Message[] = [];
      if (Array.isArray(res.data)) {
        messagesData = res.data;
      } else if (res.data && typeof res.data === 'object') {
        // Check if it's a paginated response with results array
        if ('results' in res.data && Array.isArray(res.data.results)) {
          messagesData = res.data.results;
        }
      }
      setMessages(messagesData);
      await chatAPI.markMessagesRead(conversationId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };
  
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };
  
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    setSending(true);
    try {
      await chatAPI.sendMessage(selectedConversation.id, newMessage.trim());
      setNewMessage('');
      await fetchMessages(selectedConversation.id);
      await fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };
  
  const currentUserId = user?.id;
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div>Loading messages...</div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14 }}>
            ← Back
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginTop: 8 }}>Messages</h1>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', minHeight: 500 }}>
          {/* Conversations List */}
          <div style={{ borderRight: '1px solid #eef2f7', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #eef2f7', background: '#f8faff' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>All Conversations</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{conversations.length} chats</div>
            </div>
            
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <div>No conversations yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>When you message agents, they'll appear here</div>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    backgroundColor: selectedConversation?.id === conv.id ? RED_BG : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: RED }}>
                      {conv.other_participant?.first_name?.[0] || conv.other_participant?.username?.[0] || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: conv.unread_count > 0 ? 700 : 600, fontSize: 14, color: NAVY }}>
                        {conv.other_participant?.full_name || conv.other_participant?.username}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.last_message_preview}
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: RED }} />
                    )}
                  </div>
                  {conv.property_data && (
                    <div style={{ fontSize: 10, color: TEAL, marginTop: 6 }}>
                      🏠 {conv.property_data.title?.substring(0, 40)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Messages View */}
          <div style={{ display: 'flex', flexDirection: 'column', height: 550 }}>
            {!selectedConversation ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                Select a conversation to start messaging
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: RED }}>
                    {selectedConversation.other_participant?.first_name?.[0] || selectedConversation.other_participant?.username?.[0] || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: NAVY }}>
                      {selectedConversation.other_participant?.full_name || selectedConversation.other_participant?.username}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {selectedConversation.property_data ? `Re: ${selectedConversation.property_data.title}` : 'Direct Message'}
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messagesLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>No messages yet. Say hello!</div>
                  ) : (
                    messages.map(msg => {
                      const isFromCurrentUser = msg.sender === currentUserId;
                      return (
                        <div key={msg.id} style={{ alignSelf: isFromCurrentUser ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                          <div style={{
                            backgroundColor: isFromCurrentUser ? RED : '#f1f5f9',
                            color: isFromCurrentUser ? '#fff' : NAVY,
                            padding: '10px 14px',
                            borderRadius: 12,
                            borderBottomRightRadius: isFromCurrentUser ? 4 : 12,
                            borderBottomLeftRadius: isFromCurrentUser ? 12 : 4,
                          }}>
                            {!isFromCurrentUser && (
                              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: RED }}>
                                {msg.sender_name}
                              </div>
                            )}
                            <div style={{ fontSize: 13, wordWrap: 'break-word' }}>{msg.content}</div>
                            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input */}
                <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: '1.5px solid #eef2f7', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    style={{ padding: '8px 20px', borderRadius: 24, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 600, cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer', opacity: sending || !newMessage.trim() ? 0.6 : 1 }}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;