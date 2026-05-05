// src/pages/MakeOfferPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dealAPI } from '../services/api';
import { DealRoom } from '../types';

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

const MakeOfferPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deal, setDeal] = useState<DealRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [offerAmount, setOfferAmount] = useState('');
  const [terms, setTerms] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [message, setMessage] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);
  
  const fetchDeal = async () => {
    try {
      const response = await dealAPI.getDeal(id!);
      setDeal(response.data);
      // Pre-fill offer amount with current agreed price or original price
      const defaultAmount = response.data.agreed_price || response.data.original_listing_price;
      if (defaultAmount) {
        setOfferAmount(defaultAmount.toString());
      }
    } catch (error) {
      console.error('Failed to fetch deal:', error);
      setError('Deal not found');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!deal) return;
    
    if (!agreeTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }
    
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid offer amount');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create the counter offer
      await dealAPI.makeOffer(id!, {
        amount: amount,
        terms: terms,
        expiry_date: expiryDate || undefined
      });
      
      // Send a message with the offer
      const offerMessage = `📝 **Counter Offer**\n\n` +
        `I am making a counter offer of ${formatPrice(amount)}.\n\n` +
        `${message ? `**Additional terms:** ${message}\n\n` : ''}` +
        `${expiryDate ? `**Offer expires:** ${new Date(expiryDate).toLocaleDateString()}\n\n` : ''}` +
        `Please review and respond to this offer.`;
      
      await dealAPI.sendMessage(id!, offerMessage);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/deals/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to make offer:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to make offer. Please try again.';
      setError(errorMsg);
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: `3px solid #eef2f7`, borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#94a3b8' }}>Loading deal details...</p>
        </div>
      </div>
    );
  }
  
  if (!deal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏚️</div>
          <h2 style={{ color: NAVY, marginBottom: 8 }}>Deal Not Found</h2>
          <p style={{ color: SLATE, marginBottom: 24 }}>The deal you're trying to make an offer on doesn't exist.</p>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 28px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
          <h2 style={{ color: NAVY, marginBottom: 8 }}>Counter Offer Sent!</h2>
          <p style={{ color: SLATE, marginBottom: 8 }}>
            Your counter offer has been submitted.
          </p>
          <p style={{ color: SLATE, marginBottom: 24 }}>
            Redirecting you to the deal room...
          </p>
          <div style={{ width: 40, height: 40, border: `3px solid #eef2f7`, borderTop: `3px solid ${TEAL}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        </div>
      </div>
    );
  }
  
  const isBuyer = deal.user_role === 'buyer';
  const currentPrice = deal.agreed_price || deal.original_listing_price;
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button 
            onClick={() => navigate(`/deals/${id}`)} 
            style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back to Deal Room
          </button>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: NAVY, margin: 0 }}>Make a Counter Offer</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Submit a counter offer for this property deal</p>
        </div>
        
        {/* Deal Summary */}
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          padding: '20px', 
          marginBottom: 24,
          border: `1px solid #eef2f7`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Deal #{deal.deal_number}</div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: NAVY }}>{deal.property_data?.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: SLATE }}>{deal.property_data?.district}, {deal.property_data?.city}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Current Price</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif" }}>
                {formatPrice(currentPrice)}
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f8faff', 
              border: `2px solid ${RED}`, display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: 16, fontWeight: 800, color: RED
            }}>
              {isBuyer ? 'B' : 'S'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                You are the {isBuyer ? 'Buyer' : 'Seller'}
              </div>
              <div style={{ fontSize: 11, color: SLATE }}>
                {isBuyer 
                  ? `Making an offer to ${deal.seller_data?.first_name || deal.seller_data?.username}`
                  : `Responding to ${deal.buyer_data?.first_name || deal.buyer_data?.username}'s offer`}
              </div>
            </div>
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
        
        {/* Offer Form */}
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          
          {/* Offer Amount */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
              Your Offer Amount <span style={{ color: RED }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>UGX</span>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Enter your offer amount"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 60px',
                  borderRadius: 10,
                  border: '1.5px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                required
              />
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
              Current asking price: {formatPrice(currentPrice)}
              {parseFloat(offerAmount) < (currentPrice || 0) && (
                <span style={{ color: AMBER, marginLeft: 8 }}>⚠️ Offer is below asking price</span>
              )}
              {parseFloat(offerAmount) > (currentPrice || 0) && (
                <span style={{ color: GREEN, marginLeft: 8 }}>✓ Offer is above asking price</span>
              )}
            </div>
          </div>
          
          {/* Additional Terms */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
              Additional Terms (Optional)
            </label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g., Inspection required, financing contingency, etc."
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
          
          {/* Message */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any additional information about your offer..."
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
          
          {/* Expiry Date */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
              Offer Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              If not specified, offer expires in 7 days
            </div>
          </div>
          
          {/* Terms Agreement */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="terms" style={{ fontSize: 13, color: SLATE, cursor: 'pointer' }}>
              I confirm that this offer is made in good faith and understand that it may be binding upon acceptance.
            </label>
          </div>
          
          {/* Info Box */}
          <div style={{ 
            backgroundColor: '#fef3c7', 
            borderRadius: 12, 
            padding: '14px 16px', 
            marginBottom: 24,
            borderLeft: `4px solid ${AMBER}`
          }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>ℹ️</span> Important Information
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#92400e' }}>
              <li>Your offer will be sent to the other party for review</li>
              <li>They can accept, reject, or counter your offer</li>
              <li>Once accepted, the agreed price will be updated</li>
              <li>All communication is recorded in the deal room</li>
            </ul>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !agreeTerms || !offerAmount}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: (submitting || !agreeTerms || !offerAmount) ? '#94a3b8' : RED,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: (submitting || !agreeTerms || !offerAmount) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {submitting ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Submitting Offer...
              </>
            ) : (
              <>
                <span>📝</span>
                Submit Counter Offer
              </>
            )}
          </button>
        </form>
        
        {/* Security Note */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
          🔒 All offers are legally binding. Please review your offer carefully before submitting.
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

export default MakeOfferPage;