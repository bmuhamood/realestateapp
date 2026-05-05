// src/pages/DealDetailPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dealAPI } from '../services/api';
import { DealRoom, DealMessage, DealDocument, DealStatus } from '../types';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const SLATE = '#475569';
const GREEN = '#16a34a';
const GRAY = '#94a3b8';
const AMBER = '#f59e0b';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deal, setDeal] = useState<DealRoom | null>(null);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
 // Change the poll interval from 3000 to 2000 (2 seconds)
useEffect(() => {
  if (id) {
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 2000); // Changed from 3000 to 2000
  }
  
  return () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };
}, [id]);
  
  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);
  
  const fetchDeal = async () => {
    setLoading(true);
    try {
      const [dealRes, docsRes] = await Promise.all([
        dealAPI.getDeal(id!),
        dealAPI.getDocuments(id!),
      ]);
      setDeal(dealRes.data);
      setDocuments(Array.isArray(docsRes.data) ? docsRes.data : []);
      
      await fetchMessages();
    } catch (error) {
      console.error('Failed to fetch deal:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async () => {
    try {
      const messagesRes = await dealAPI.getMessages(id!);
      const messagesData = messagesRes.data;
      let messagesArray: DealMessage[] = [];
      
      if (Array.isArray(messagesData)) {
        messagesArray = messagesData;
      } else if (messagesData && typeof messagesData === 'object') {
        const paginated = messagesData as PaginatedResponse<DealMessage>;
        if (paginated.results && Array.isArray(paginated.results)) {
          messagesArray = paginated.results;
        } else {
          messagesArray = [];
        }
      } else {
        messagesArray = [];
      }
      
      setMessages(messagesArray);
      
      // Mark messages as read after fetching
      if (messagesArray.length > 0) {
        await dealAPI.markMessagesRead(id!);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Add optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: DealMessage = {
      id: tempId,
      sender: user?.id || 0,
      sender_name: user?.first_name || user?.username || 'You',
      sender_avatar: user?.profile_picture || undefined,
      is_sender: true,
      message_type: 'general',
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
      time_ago: 'Just now',
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      await dealAPI.sendMessage(id!, messageContent);
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };
  
  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await dealAPI.updateDeal(id!, { status: status as DealStatus });
      await fetchDeal();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Not yet negotiated';
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };
  
  // Get message status icon
  const getMessageStatusIcon = (msg: DealMessage, isCurrentUser: boolean) => {
    if (!isCurrentUser) return null;
    
    if (String(msg.id).startsWith('temp-')) {
      return <span style={{ marginLeft: 4, fontSize: 10, color: GRAY }}>⌛</span>;
    }
    
    if (msg.is_read) {
      return (
        <span style={{ marginLeft: 4, fontSize: 10, color: GREEN }}>
          ✓✓
        </span>
      );
    }
    
    return (
      <span style={{ marginLeft: 4, fontSize: 10, color: GRAY }}>
        ✓
      </span>
    );
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', marginTop: 64 }}>
        <div>Loading deal...</div>
      </div>
    );
  }
  
  if (!deal) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', marginTop: 64 }}>
        <div>Deal not found</div>
      </div>
    );
  }
  
  const userRole = deal.user_role;
  const canUpdateStatus = userRole === 'seller' || userRole === 'agent' || userRole === 'admin';
  const isBuyer = userRole === 'buyer';
  
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', marginTop: 64 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14 }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: NAVY, marginTop: 8 }}>Deal Room</h1>
        <p style={{ color: '#64748b' }}>Deal #{deal.deal_number} • {deal.property_data?.title || 'Property'}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Left Column - Messages */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)', minHeight: 500 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>💬 Messages</h3>
            {messages.filter(m => !m.is_read && m.sender !== user?.id).length > 0 && (
              <span style={{ 
                backgroundColor: RED, 
                color: '#fff', 
                fontSize: 10, 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 20 
              }}>
                {messages.filter(m => !m.is_read && m.sender !== user?.id).length} unread
              </span>
            )}
          </div>
          
          {/* Messages Container */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto', 
            marginBottom: 16, 
            border: '1px solid #eef2f7', 
            borderRadius: 12, 
            padding: 16,
            backgroundColor: '#fafcff'
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.sender === user?.id || msg.is_sender === true;
                return (
                  <div 
                    key={msg.id} 
                    style={{ 
                      marginBottom: 16, 
                      display: 'flex',
                      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ 
                      maxWidth: '70%',
                      backgroundColor: isCurrentUser ? RED : '#f1f5f9',
                      color: isCurrentUser ? '#fff' : NAVY,
                      padding: '10px 14px',
                      borderRadius: 12,
                      borderBottomRightRadius: isCurrentUser ? 4 : 12,
                      borderBottomLeftRadius: isCurrentUser ? 12 : 4,
                    }}>
                      {!isCurrentUser && (
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: RED }}>
                          {msg.sender_name || 'User'}
                        </div>
                      )}
                      <div style={{ fontSize: 14, wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                      <div style={{ 
                        fontSize: 10, 
                        opacity: 0.6, 
                        marginTop: 4, 
                        textAlign: 'right',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4
                      }}>
                        <span>{formatTime(msg.created_at)}</span>
                        {getMessageStatusIcon(msg, isCurrentUser)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{ 
                flex: 1, 
                padding: '12px', 
                borderRadius: 10, 
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim()} 
              style={{ 
                padding: '12px 24px', 
                backgroundColor: sending || !newMessage.trim() ? '#94a3b8' : RED, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 10, 
                cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {sending ? (
                <>
                  <span style={{ 
                    width: 14, 
                    height: 14, 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTop: '2px solid #fff', 
                    borderRadius: '50%', 
                    animation: 'spin 0.7s linear infinite' 
                  }} />
                  Sending...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Send
                </>
              )}
            </button>
          </div>
        </div>
        
{/* Right Column - Deal Info */}
<div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 80 }}>
  <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, color: NAVY }}>📋 Deal Details</h3>
  
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Status</div>
    <div style={{ 
      fontWeight: 700, 
      color: deal.status === 'completed' ? TEAL : RED,
      textTransform: 'capitalize'
    }}>
      {deal.status_display || deal.status}
    </div>
  </div>
  
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Agreed Price</div>
    <div style={{ fontWeight: 700, fontSize: 20, color: NAVY }}>
      {formatPrice(deal.agreed_price)}
    </div>
  </div>
  
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Original Price</div>
    <div style={{ fontSize: 14, color: SLATE }}>
      {formatPrice(deal.original_listing_price)}
    </div>
  </div>
  
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Progress</div>
    <div style={{ width: '100%', height: 8, backgroundColor: '#eef2f7', borderRadius: 4, marginTop: 4 }}>
      <div style={{ width: `${deal.progress_percentage || 0}%`, height: '100%', backgroundColor: TEAL, borderRadius: 4 }} />
    </div>
    <div style={{ fontSize: 12, marginTop: 4, color: SLATE }}>{deal.progress_percentage || 0}% complete</div>
  </div>
  
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Participants</div>
    <div style={{ fontSize: 13, color: NAVY }}>
      <div>👤 Buyer: {deal.buyer_data?.first_name || deal.buyer_data?.username || 'User'}</div>
      <div>🏠 Seller: {deal.seller_data?.first_name || deal.seller_data?.username || 'User'}</div>
      {deal.agent_data && <div>🤝 Agent: {deal.agent_data?.first_name || deal.agent_data?.username}</div>}
    </div>
  </div>
  
  {deal.closing_date && (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Expected Closing</div>
      <div style={{ fontSize: 14, color: NAVY }}>{formatDate(deal.closing_date)}</div>
    </div>
  )}
  
  {canUpdateStatus && (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Update Status</div>
      <select 
        onChange={(e) => updateStatus(e.target.value)} 
        value={deal.status}
        disabled={updating}
        style={{ 
          width: '100%', 
          padding: '10px', 
          borderRadius: 8, 
          border: '1.5px solid #e2e8f0',
          fontSize: 13,
          fontFamily: 'inherit',
          cursor: 'pointer'
        }}
      >
        <option value="negotiation">🤝 Negotiation</option>
        <option value="deposit">💰 Deposit Paid</option>
        <option value="contract">📄 Contract Signed</option>
        <option value="inspection">🔍 Inspection</option>
        <option value="closing">🏁 Closing</option>
        <option value="completed">✅ Completed</option>
        <option value="cancelled">❌ Cancelled</option>
      </select>
    </div>
  )}
  
  <button 
    onClick={() => navigate(`/property/${deal.property_obj || (deal as any).property}`)}
    style={{ 
      width: '100%', 
      marginTop: 20, 
      padding: '12px', 
      backgroundColor: TEAL, 
      color: '#fff', 
      border: 'none', 
      borderRadius: 10, 
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 14
    }}
  >
    View Property Details →
  </button>
  
  {/* ✅ MAKE COUNTER OFFER BUTTON - Only for buyers when in negotiation */}
  {isBuyer && deal.status === 'negotiation' && (
    <button 
      onClick={() => navigate(`/make-offer/${deal.id}`)}
      style={{ 
        width: '100%', 
        marginTop: 12, 
        padding: '12px', 
        backgroundColor: RED, 
        color: '#fff', 
        border: 'none', 
        borderRadius: 10, 
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
      }}
    >
      <span>📝</span>
      Make a Counter Offer
    </button>
  )}
  
  {/* ✅ RESPOND TO OFFER BUTTON - For sellers when in negotiation */}
  {!isBuyer && deal.status === 'negotiation' && (
    <button 
      onClick={() => navigate(`/respond-offer/${deal.id}`)}
      style={{ 
        width: '100%', 
        marginTop: 12, 
        padding: '12px', 
        backgroundColor: AMBER, 
        color: '#fff', 
        border: 'none', 
        borderRadius: 10, 
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
      }}
    >
      <span>🤝</span>
      Respond to Offer
    </button>
  )}
</div>
      </div>
      
      {/* Add spin animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DealDetailPage;