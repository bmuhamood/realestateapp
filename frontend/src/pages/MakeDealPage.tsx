    // src/pages/MakeDealPage.tsx
    import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { useAuth } from '../contexts/AuthContext';
    import api, { dealAPI } from '../services/api';
    import { Property, User } from '../types';

    const RED = '#e63946';
    const NAVY = '#0d1b2e';
    const TEAL = '#25a882';
    const SLATE = '#475569';
    const GREEN = '#16a34a';
    const AMBER = '#f59e0b';

    const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
    };

    const MakeDealPage: React.FC = () => {
    const { propertyId } = useParams<{ propertyId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [dealNumber, setDealNumber] = useState<string | null>(null);

    // Form state
    const [offerAmount, setOfferAmount] = useState('');
    const [message, setMessage] = useState('');
    const [specialConditions, setSpecialConditions] = useState('');
    const [proposedClosingDate, setProposedClosingDate] = useState('');
    const [terms, setTerms] = useState(false);

    useEffect(() => {
        if (propertyId) {
        fetchProperty();
        }
    }, [propertyId]);

    const fetchProperty = async () => {
        try {
        const response = await api.get(`/properties/${propertyId}/`);
        setProperty(response.data);
        // Pre-fill offer amount with property price
        setOfferAmount(response.data.price.toString());
        } catch (err) {
        console.error('Failed to fetch property:', err);
        setError('Property not found');
        } finally {
        setLoading(false);
        }
    };

    // In MakeDealPage.tsx, fix the handleSubmit function:

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
        navigate('/login');
        return;
    }

    if (!property) return;

    if (!terms) {
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
        // Check if deal already exists
        const existingDeals = await dealAPI.getDeals();
        const existingDeal = existingDeals.data.results?.find(
        (deal: any) => deal.property_obj === property.id &&
        (deal.buyer === user.id || deal.seller === user.id)
        );

        if (existingDeal) {
        setError('A deal already exists for this property. Redirecting to deal room...');
        setTimeout(() => {
            navigate(`/deals/${existingDeal.id}`);
        }, 2000);
        return;
        }

        // In MakeDealPage.tsx, when creating the deal:
        const response = await dealAPI.createDeal({
        property_obj: property.id,
        buyer: user.id,
        seller: property.owner.id,
        agent: property.owner.is_agent ? property.owner.id : undefined,
        special_conditions: specialConditions || `Initial offer of ${formatPrice(amount)}`
        });

        if (amount !== property.price) {
        await dealAPI.updateDeal(response.data.id, { agreed_price: amount });
        }

        const newDeal = response.data;
        console.log('New deal created:', newDeal); // Debug log
        console.log('Deal ID:', newDeal.id); // Debug log
        
        setDealNumber(newDeal.deal_number);
        setSuccess(true);

        // ✅ IMPORTANT: Wait a moment before sending message to ensure deal is saved
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create initial message with offer
        try {
        await dealAPI.sendMessage(newDeal.id, 
            `🎯 **Initial Offer**\n\n` +
            `I am interested in purchasing your property "${property.title}".\n\n` +
            `**My Offer:** ${formatPrice(amount)}\n` +
            `${message ? `**Message:** ${message}\n\n` : ''}` +
            `${proposedClosingDate ? `**Proposed Closing:** ${new Date(proposedClosingDate).toLocaleDateString()}\n\n` : ''}` +
            `I look forward to negotiating with you.`
        );
        } catch (msgError) {
        console.warn('Message creation failed but deal was created:', msgError);
        // Don't fail the whole process if message fails
        }

        // Update deal with initial offer amount if different from listing price
        if (amount !== property.price) {
        try {
            await dealAPI.updateDeal(newDeal.id, { agreed_price: amount });
        } catch (updateError) {
            console.warn('Price update failed but deal was created:', updateError);
        }
        }

        // Redirect to deal room after 2 seconds
        setTimeout(() => {
        navigate(`/deals/${newDeal.id}`);
        }, 2000);

    } catch (err: any) {
        console.error('Failed to create deal:', err);
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to create deal. Please try again.';
        setError(errorMsg);
        setSubmitting(false);
    }
    };

    if (loading) {
        return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
            <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, border: `3px solid #eef2f7`, borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ color: '#94a3b8' }}>Loading property details...</p>
            </div>
        </div>
        );
    }

    if (!property) {
        return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
            <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏚️</div>
            <h2 style={{ color: NAVY, marginBottom: 8 }}>Property Not Found</h2>
            <p style={{ color: SLATE, marginBottom: 24 }}>The property you're trying to make a deal on doesn't exist.</p>
            <button onClick={() => navigate('/properties')} style={{ padding: '12px 28px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Browse Properties</button>
            </div>
        </div>
        );
    }

    if (success) {
        return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
            <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '48px', borderRadius: 20, maxWidth: 500 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: NAVY, marginBottom: 8 }}>Deal Room Created!</h2>
            <p style={{ color: SLATE, marginBottom: 8 }}>
                Your deal room <strong style={{ color: TEAL }}>{dealNumber}</strong> has been created.
            </p>
            <p style={{ color: SLATE, marginBottom: 24 }}>
                Redirecting you to the deal room...
            </p>
            <div style={{ width: 40, height: 40, border: `3px solid #eef2f7`, borderTop: `3px solid ${TEAL}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
            </div>
        </div>
        );
    }

    const ownerName = property.owner?.full_name || 
        `${property.owner?.first_name || ''} ${property.owner?.last_name || ''}`.trim() || 
        property.owner?.username || 'Property Owner';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 64 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
            
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
            <button 
                onClick={() => navigate(-1)} 
                style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
            >
                ← Back
            </button>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: NAVY, margin: 0 }}>Make a Deal</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Start a private negotiation room with the property owner</p>
            </div>

            {/* Property Summary */}
            <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '20px', 
            marginBottom: 24,
            border: `1px solid #eef2f7`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {property.images && property.images[0] && (
                <img 
                    src={property.images[0].image_url || property.images[0].image} 
                    alt={property.title}
                    style={{ width: 120, height: 100, objectFit: 'cover', borderRadius: 12 }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-property.svg'; }}
                />
                )}
                <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: NAVY }}>{property.title}</h3>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: SLATE }}>{property.district}, {property.city}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: RED }}>{formatPrice(property.price)}</span>
                    {property.transaction_type === 'rent' && <span style={{ fontSize: 14, color: SLATE }}>/month</span>}
                    <span style={{ padding: '2px 10px', backgroundColor: '#f1f5f9', borderRadius: 20, fontSize: 12 }}>🏠 {property.bedrooms} bed • 🚿 {property.bathrooms} bath • 📐 {property.square_meters}m²</span>
                </div>
                </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f8faff', border: `2px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: RED }}>
                {ownerName[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{ownerName}</div>
                <div style={{ fontSize: 11, color: SLATE }}>Property Owner</div>
                </div>
                {property.owner?.is_verified && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: GREEN, backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: 20 }}>✓ Verified</span>
                )}
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

            {/* Deal Form */}
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
                Listed price: {formatPrice(property.price)}
                {parseFloat(offerAmount) < property.price && (
                    <span style={{ color: AMBER, marginLeft: 8 }}>⚠️ Offer is below asking price</span>
                )}
                </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
                Personal Message
                </label>
                <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you're interested in this property..."
                rows={4}
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

            {/* Special Conditions */}
            <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
                Special Conditions (Optional)
                </label>
                <textarea
                value={specialConditions}
                onChange={(e) => setSpecialConditions(e.target.value)}
                placeholder="Any special conditions? e.g., financing contingency, inspection period, etc."
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

            {/* Proposed Closing Date */}
            <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 8 }}>
                Proposed Closing Date (Optional)
                </label>
                <input
                type="date"
                value={proposedClosingDate}
                onChange={(e) => setProposedClosingDate(e.target.value)}
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
            </div>

            {/* Terms Agreement */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                type="checkbox"
                id="terms"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="terms" style={{ fontSize: 13, color: SLATE, cursor: 'pointer' }}>
                I agree to the <span style={{ color: RED, cursor: 'pointer' }} onClick={() => navigate('/terms')}>Terms of Service</span> and understand that this creates a legally binding negotiation.
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
                <span>ℹ️</span> What happens next?
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#92400e' }}>
                <li>A private deal room will be created for you and the property owner</li>
                <li>You can negotiate price, terms, and conditions in real-time</li>
                <li>Share documents, schedule inspections, and track milestones</li>
                <li>All communication is recorded and legally binding</li>
                </ul>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={submitting || !terms || !offerAmount}
                style={{
                width: '100%',
                padding: '14px',
                backgroundColor: (submitting || !terms || !offerAmount) ? '#94a3b8' : RED,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: (submitting || !terms || !offerAmount) ? 'not-allowed' : 'pointer',
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
                    Creating Deal Room...
                </>
                ) : (
                <>
                    <span>🎯</span>
                    Submit Offer & Start Deal
                </>
                )}
            </button>
            </form>

            {/* Security Note */}
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            🔒 All communications are encrypted and stored securely. Your information is only shared with the property owner.
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

    export default MakeDealPage;