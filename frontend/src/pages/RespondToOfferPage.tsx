// src/pages/RespondToOfferPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dealAPI } from '../services/api';
import { DealRoom, DealOffer } from '../types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const SLATE = '#475569';
const GREEN = '#16a34a';
const AMBER = '#f59e0b';

const formatPrice = (price?: number) => {
  if (!price) return 'Not yet negotiated';
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const RespondToOfferPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deal, setDeal] = useState<DealRoom | null>(null);
  const [offers, setOffers] = useState<DealOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<DealOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [counterAmount, setCounterAmount] = useState('');
  const [counterTerms, setCounterTerms] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  
  useEffect(() => {
    if (id) {
      fetchDealAndOffers();
    }
  }, [id]);
  
  const fetchDealAndOffers = async () => {
    try {
      const [dealRes, offersRes] = await Promise.all([
        dealAPI.getDeal(id!),
        dealAPI.getOffers(id!)
      ]);
      setDeal(dealRes.data);
      
      const offersDataRaw = offersRes.data;
      let offersArray: DealOffer[] = [];
      
      if (Array.isArray(offersDataRaw)) {
        offersArray = offersDataRaw;
      } else if (offersDataRaw && typeof offersDataRaw === 'object') {
        const paginated = offersDataRaw as PaginatedResponse<DealOffer>;
        if (paginated.results && Array.isArray(paginated.results)) {
          offersArray = paginated.results;
        }
      }
      
      setOffers(offersArray);
      
      const pendingOffer = offersArray.find(
        (o: DealOffer) => o.status === 'pending' && o.made_by !== user?.id
      );
      if (pendingOffer) {
        setSelectedOffer(pendingOffer);
        setCounterAmount(pendingOffer.amount.toString());
      }
    } catch (error) {
      console.error('Failed to fetch deal:', error);
      setError('Failed to load deal information');
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessageToDeal = async (content: string) => {
    try {
      await dealAPI.sendMessage(id!, content);
      console.log('Message sent successfully:', content.substring(0, 100));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const handleAccept = async () => {
    if (!selectedOffer) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // First, send the message
      const messageContent = `✅ **Offer Accepted**\n\nI have accepted the offer of ${formatPrice(selectedOffer.amount)}.\n\n${responseMessage ? `**Message:** ${responseMessage}` : ''}`;
      await sendMessageToDeal(messageContent);
      
      // Then, respond to the offer
      await dealAPI.respondToOffer(id!, {
        offer_id: selectedOffer.id,
        action: 'accept'
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/deals/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to accept offer:', err);
      setError(err.response?.data?.error || 'Failed to accept offer. Please try again.');
      setSubmitting(false);
    }
  };
  
  const handleReject = async () => {
    if (!selectedOffer) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // First, send the message
      const messageContent = `❌ **Offer Declined**\n\nI have declined the offer of ${formatPrice(selectedOffer.amount)}.\n\n${responseMessage ? `**Message:** ${responseMessage}` : ''}`;
      await sendMessageToDeal(messageContent);
      
      // Then, respond to the offer
      await dealAPI.respondToOffer(id!, {
        offer_id: selectedOffer.id,
        action: 'reject'
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/deals/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to reject offer:', err);
      setError(err.response?.data?.error || 'Failed to reject offer. Please try again.');
      setSubmitting(false);
    }
  };
  
  const handleCounter = async () => {
    if (!selectedOffer) return;
    
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid counter offer amount');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // First, send the counter offer message
      const messageContent = `🔄 **Counter Offer**\n\nI have made a counter offer of ${formatPrice(amount)}.\n\n${counterTerms ? `**Terms:** ${counterTerms}\n\n` : ''}${responseMessage ? `**Message:** ${responseMessage}` : ''}`;
      await sendMessageToDeal(messageContent);
      
      // Then, respond to the offer with counter
      await dealAPI.respondToOffer(id!, {
        offer_id: selectedOffer.id,
        action: 'counter',
        counter_amount: amount,
        counter_terms: counterTerms
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/deals/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to make counter offer:', err);
      setError(err.response?.data?.error || 'Failed to make counter offer. Please try again.');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: `3px solid #eef2f7`, borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#94a3b8' }}>Loading offer details...</p>
        </div>
      </div>
    );
  }
  
  if (!deal || !selectedOffer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
          <h2 style={{ color: NAVY, marginBottom: 8 }}>No Pending Offers</h2>
          <p style={{ color: SLATE, marginBottom: 24 }}>There are no pending offers to respond to at this time.</p>
          <button onClick={() => navigate(`/deals/${id}`)} style={{ padding: '12px 28px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back to Deal Room</button>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: NAVY, marginBottom: 8 }}>Response Submitted!</h2>
          <p style={{ color: SLATE, marginBottom: 24 }}>Your response has been sent. Redirecting to deal room...</p>
          <div style={{ width: 40, height: 40, border: `3px solid #eef2f7`, borderTop: `3px solid ${TEAL}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        </div>
      </div>
    );
  }
  
  const isBuyer = deal.user_role === 'buyer';
  const offerMaker = isBuyer ? deal.seller_data : deal.buyer_data;
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        
        <div style={{ marginBottom: 24 }}>
          <button 
            onClick={() => navigate(`/deals/${id}`)} 
            style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back to Deal Room
          </button>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: NAVY, margin: 0 }}>Respond to Offer</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Review and respond to the offer from the other party</p>
        </div>
        
        {/* Offer Summary */}
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          padding: '24px', 
          marginBottom: 24,
          border: `2px solid ${AMBER}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ 
              width: 50, height: 50, borderRadius: '50%', backgroundColor: AMBER + '20', 
              border: `2px solid ${AMBER}`, display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: 24
            }}>
              📝
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Pending Offer from</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                {offerMaker?.first_name || offerMaker?.username || 'User'}
              </div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f8faff', 
            borderRadius: 12, 
            padding: '16px',
            marginBottom: 16
          }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Offer Amount</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif" }}>
              {formatPrice(selectedOffer.amount)}
            </div>
            {selectedOffer.terms && (
              <>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 12, marginBottom: 4 }}>Terms</div>
                <div style={{ fontSize: 13, color: SLATE }}>{selectedOffer.terms}</div>
              </>
            )}
            {selectedOffer.expiry_date && (
              <div style={{ fontSize: 11, color: AMBER, marginTop: 12 }}>
                ⏰ Expires: {new Date(selectedOffer.expiry_date).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div style={{ fontSize: 13, color: SLATE, fontStyle: 'italic', padding: '8px 0' }}>
            {isBuyer 
              ? `As the buyer, you can accept, reject, or counter this offer from the seller.`
              : `As the seller, you can accept, reject, or counter this offer from the buyer.`}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: `1px solid #fecaca`, 
            borderRadius: 12, 
            padding: '14px 16px', 
            marginBottom: 20,
            color: '#991b1b',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {/* Response Options */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          
          <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Your Response</h3>
          
          {/* Response Message */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
              Response Message (Optional)
            </label>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Add a message to accompany your response..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
          
          {/* Counter Offer Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Counter Offer (Optional)</div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>UGX</span>
              <input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="Enter counter offer amount"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 60px',
                  borderRadius: 10,
                  border: '1.5px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <textarea
              value={counterTerms}
              onChange={(e) => setCounterTerms(e.target.value)}
              placeholder="Counter offer terms (e.g., inspection period, closing date, etc.)"
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleAccept}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: GREEN,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>✅</span>
              Accept Offer
            </button>
            
            <button
              onClick={handleReject}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: RED,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>❌</span>
              Reject Offer
            </button>
            
            <button
              onClick={handleCounter}
              disabled={submitting || !counterAmount}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: AMBER,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: (submitting || !counterAmount) ? 'not-allowed' : 'pointer',
                opacity: (submitting || !counterAmount) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>🔄</span>
              Send Counter Offer
            </button>
          </div>
        </div>
        
        <div style={{ 
          marginTop: 20, 
          backgroundColor: '#e0f2fe', 
          borderRadius: 12, 
          padding: '14px 16px',
          borderLeft: `4px solid ${TEAL}`
        }}>
          <div style={{ fontSize: 13, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💡</span>
            <span>Once you accept an offer, the agreed price will be updated and the deal will move to the next stage.</span>
          </div>
        </div>
      </div>
      
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

export default RespondToOfferPage;