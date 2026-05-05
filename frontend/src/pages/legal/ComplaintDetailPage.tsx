import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Complaint, ComplaintMessage } from '../../types';

const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const SLATE = '#475569';
const TEAL = '#25a882';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  investigating: { bg: '#fed7aa', color: '#9b2c1d' },
  resolved: { bg: '#dcfce7', color: '#166534' },
  dismissed: { bg: '#f1f5f9', color: '#64748b' },
  escalated: { bg: '#fee2e2', color: '#991b1b' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const style = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const [complaintRes, messagesRes] = await Promise.all([
        api.get(`/complaints/${id}/`),
        api.get(`/complaints/${id}/messages/`),
      ]);
      setComplaint(complaintRes.data);
      
      // ✅ FIX: Handle both array and paginated responses with type safety
      const messagesData = messagesRes.data;
      let messagesArray: ComplaintMessage[] = [];
      
      if (Array.isArray(messagesData)) {
        messagesArray = messagesData;
      } else if (messagesData && typeof messagesData === 'object') {
        if (messagesData.results && Array.isArray(messagesData.results)) {
          messagesArray = messagesData.results;
        } else {
          // Try to find any array property in the response
          const possibleArray = Object.values(messagesData).find(val => Array.isArray(val));
          // Ensure it's an array of ComplaintMessage type
          if (possibleArray && Array.isArray(possibleArray)) {
            messagesArray = possibleArray as ComplaintMessage[];
          } else {
            messagesArray = [];
          }
        }
      }
      
      setMessages(messagesArray);
    } catch (err) {
      console.error('Failed to fetch complaint:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await api.post(`/complaints/${id}/messages/`, { content: newMessage });
      setNewMessage('');
      fetchComplaint();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-UG', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div>Complaint not found</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        <button onClick={() => navigate('/dashboard/complaints')} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back to Complaints
        </button>

        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{complaint.complaint_number}</div>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: NAVY, margin: 0 }}>{complaint.title}</h1>
            </div>
            <StatusBadge status={complaint.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: '16px', backgroundColor: '#f8faff', borderRadius: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Category</div>
              <div style={{ fontWeight: 600, color: NAVY }}>{complaint.category_display}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Priority</div>
              <div style={{ fontWeight: 600, color: complaint.priority === 'urgent' ? '#ef4444' : complaint.priority === 'high' ? '#f97316' : '#f59e0b' }}>
                {complaint.priority?.toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Filed On</div>
              <div style={{ fontWeight: 600, color: NAVY }}>{fmtDate(complaint.created_at)}</div>
            </div>
            {complaint.resolved_at && (
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Resolved On</div>
                <div style={{ fontWeight: 600, color: TEAL }}>{fmtDate(complaint.resolved_at)}</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Description</h3>
            <p style={{ color: SLATE, lineHeight: 1.6, margin: 0 }}>{complaint.description}</p>
          </div>

          {complaint.admin_response && (
            <div style={{ marginBottom: 24, backgroundColor: '#f8faff', padding: '16px', borderRadius: 12, borderLeft: `4px solid ${TEAL}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: TEAL, marginBottom: 8 }}>Admin Response</h3>
              <p style={{ color: NAVY, margin: 0 }}>{complaint.admin_response}</p>
            </div>
          )}

          {complaint.resolution_details && (
            <div style={{ marginBottom: 24, backgroundColor: '#dcfce7', padding: '16px', borderRadius: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Resolution</h3>
              <p style={{ color: '#166534', margin: 0 }}>{complaint.resolution_details}</p>
            </div>
          )}
        </div>

        {/* Messages Section */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Communication</h3>
          
          <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 20 }}>
            {!messages || messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No messages yet</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: 16, display: 'flex', justifyContent: msg.sender_type === 'admin' ? 'flex-start' : 'flex-end' }}>
                  <div style={{ maxWidth: '70%', backgroundColor: msg.sender_type === 'admin' ? '#f1f5f9' : RED_BG, borderRadius: 16, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      {msg.sender_name} • {msg.sender_type === 'admin' ? 'Support Team' : 'You'} • {fmtDate(msg.created_at)}
                    </div>
                    <div style={{ fontSize: 14, color: NAVY }}>{msg.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {complaint.status !== 'resolved' && complaint.status !== 'dismissed' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Add a message or provide additional information..."
                rows={3}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  border: '1.5px solid #e2e8f0',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
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
                  alignSelf: 'flex-end',
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailPage;