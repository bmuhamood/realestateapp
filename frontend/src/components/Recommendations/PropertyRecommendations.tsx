import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Property } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// ─── Inject global styles once ────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('prec-styles')) {
  const style = document.createElement('style');
  style.id = 'prec-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    .prec-root * { box-sizing: border-box; }
    .prec-root {
      font-family: 'DM Sans', -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── Card base ─── */
    .prec-card {
      background: white;
      border: 1px solid #e2e5ea;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
      cursor: pointer;
      overflow: hidden;
      transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .prec-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
      border-color: #c8cdd6;
      transform: translateY(-3px);
    }

    /* ─── Image wrapper ─── */
    .prec-img-wrap {
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      background: #f7f8fa;
    }
    .prec-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
    }
    .prec-card:hover .prec-img { transform: scale(1.04); }

    /* ─── Skeleton ─── */
    @keyframes prec-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .prec-skeleton {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 400px 100%;
      animation: prec-shimmer 1.4s infinite;
    }

    /* ─── Badges ─── */
    .prec-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .prec-badge-type {
      background: rgba(255,255,255,0.92);
      color: #1a1f2e;
      border: 1px solid rgba(0,0,0,0.08);
    }
    .prec-badge-sale   { background: #edf7f2; color: #0d9948; border: 1px solid rgba(13,153,72,0.2); }
    .prec-badge-rent   { background: #eff6ff; color: #1a56db; border: 1px solid rgba(26,86,219,0.2); }
    .prec-badge-shortlet{ background: #fffbeb; color: #d97706; border: 1px solid rgba(217,119,6,0.2); }
    .prec-badge-verified { background: #edf7f2; color: #0d9948; border: 1px solid rgba(13,153,72,0.2); font-size: 10px; }
    .prec-badge-featured { background: #e84035; color: white; font-size: 10px; font-weight: 700; }

    /* ─── Like button ─── */
    @keyframes prec-heart {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.35); }
      60%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    .prec-like-btn {
      width: 34px; height: 34px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .prec-like-btn:hover {
      background: #fff0ef;
      border-color: #e84035;
      transform: scale(1.1);
    }
    .prec-like-btn.liked { animation: prec-heart 0.4s ease; }

    /* ─── Price ─── */
    .prec-price {
      font-family: 'DM Mono', monospace;
      font-size: 18px;
      font-weight: 500;
      color: #1a1f2e;
      letter-spacing: -0.03em;
    }
    .prec-price-unit {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      color: #6b7280;
      font-weight: 400;
    }

    /* ─── Stat chips ─── */
    .prec-stat-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .prec-stat {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    .prec-stat-sep {
      width: 3px; height: 3px;
      border-radius: 50%;
      background: #e2e5ea;
      flex-shrink: 0;
    }

    /* ─── Divider ─── */
    .prec-divider {
      height: 1px;
      background: #e2e5ea;
      margin: 8px 0;
    }

    /* ─── Deal / CTA button ─── */
    .prec-deal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 8px;
      border: none;
      background: #e84035;
      color: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      letter-spacing: 0.01em;
      transition: all 0.18s ease;
    }
    .prec-deal-btn:hover:not(:disabled) {
      background: #c0392b;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(232,64,53,0.3);
    }
    .prec-deal-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ─── Login prompt button ─── */
    .prec-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1.5px solid #e84035;
      background: transparent;
      color: #e84035;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.18s ease;
    }
    .prec-login-btn:hover {
      background: #fff0ef;
      transform: translateY(-1px);
    }

    /* ─── Spinner ─── */
    @keyframes prec-spin { to { transform: rotate(360deg); } }
    .prec-spinner {
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: prec-spin 0.65s linear infinite;
      flex-shrink: 0;
    }

    /* ─── Header with trending icon ─── */
    .prec-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .prec-header-icon {
      width: 32px; height: 32px;
      border-radius: 12px;
      background: #fff0ef;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .prec-header-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #1a1f2e;
      margin: 0;
    }

    /* ─── Grid ─── */
    .prec-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(4, 1fr);
    }
    @media (max-width: 1200px) { .prec-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px) { .prec-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .prec-grid { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

// ─── Helper to get full Cloudinary URL ────────────────────────────────────────
const getCloudinaryUrl = (url: string | null | undefined): string => {
  if (!url) return '/placeholder-property.svg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.includes('/')) {
    const cloudName = 'drcy2xxkg';
    return `https://res.cloudinary.com/${cloudName}/${url}`;
  }
  return url;
};

// ─── Helper to get the main image URL from property ───────────────────────────
const getPropertyImage = (property: Property): string => {
  if (property.images && property.images.length > 0) {
    const firstImage = property.images[0];
    return getCloudinaryUrl(firstImage.image_url || firstImage.image);
  }
  return '/placeholder-property.svg';
};

// ─── Format price short ───────────────────────────────────────────────────────
const fmt = (price: number): string => {
  if (price >= 1e9) return `${(price / 1e9).toFixed(1)}B`;
  if (price >= 1e6) return `${(price / 1e6).toFixed(0)}M`;
  if (price >= 1e3) return `${(price / 1e3).toFixed(0)}K`;
  return `${price}`;
};

// ─── Property type icons ──────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  house: '🏠', apartment: '🏢', land: '🌾', commercial: '🏭',
  condo: '🏙️', villa: '🏡', office: '💼', studio: '🛋️',
};

// ─── Transaction type styling ─────────────────────────────────────────────────
const TX_CLASS: Record<string, string> = {
  sale: 'prec-badge-sale',
  rent: 'prec-badge-rent',
  shortlet: 'prec-badge-shortlet',
};

const TX_LABELS: Record<string, string> = {
  sale: 'For Sale',
  rent: 'For Rent',
  shortlet: 'Short Stay',
};

interface PropertyRecommendationsProps {
  propertyId?: string;
  limit?: number;
  title?: string;
  variant?: 'horizontal' | 'vertical';
}

const PropertyRecommendations: React.FC<PropertyRecommendationsProps> = ({
  propertyId,
  limit = 4,
  title = "You Might Also Like",
  variant = 'vertical',
}) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    fetchRecommendations();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [propertyId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const endpoint = propertyId
        ? `/properties/${propertyId}/recommendations/`
        : '/properties/recommendations/';
      
      const response = await api.get(endpoint, {
        params: { limit: limit * 2, user_id: user?.id },
        signal: abortControllerRef.current?.signal,
      });
      
      const responseData = response.data;
      let properties: Property[] = [];
      
      if (responseData.results && Array.isArray(responseData.results)) {
        properties = responseData.results;
      } else if (Array.isArray(responseData)) {
        properties = responseData;
      } else if (responseData && typeof responseData === 'object') {
        properties = [responseData];
      }
      
      const uniqueMap = new Map<string, Property>();
      for (const prop of properties) {
        if (propertyId && prop.id === propertyId) continue;
        if (prop && prop.id && !uniqueMap.has(prop.id)) {
          uniqueMap.set(prop.id, prop);
        }
      }
      
      setRecommendations(Array.from(uniqueMap.values()).slice(0, limit));
    } catch (error: any) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Error fetching recommendations:', error);
      }
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  const handleLike = async (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/properties/${property.id}/like/`);
      setRecommendations(prev =>
        prev.map(p =>
          p.id === property.id ? { ...p, is_liked: !p.is_liked } : p
        )
      );
    } catch (error) {
      console.error('Error liking property:', error);
    }
  };

  const handleMakeDeal = async (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!property.owner || !property.owner.id) {
      alert('Property owner information is missing. Cannot create deal.');
      return;
    }
    if (user.id === property.owner.id) {
      alert('You cannot make a deal on your own property');
      return;
    }
    navigate(`/make-deal/${property.id}`);
  };

  const getTxClass = (type: string) => TX_CLASS[type] || 'prec-badge-sale';
  const getTxLabel = (type: string) => TX_LABELS[type] || type;

  if (loading) {
    return (
      <div className="prec-root" style={{ marginTop: 32, marginBottom: 24 }}>
        <div className="prec-header">
          <div className="prec-header-icon">✨</div>
          <h3 className="prec-header-title">{title}</h3>
        </div>
        <div className="prec-grid">
          {[1, 2, 3, 4].slice(0, limit).map((i) => (
            <div key={i} style={{ height: 280, backgroundColor: '#f7f8fa', borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  const isOwner = (property: Property) => user && property.owner && user.id === property.owner.id;

  return (
    <div className="prec-root" style={{ marginTop: 32, marginBottom: 24 }}>
      <div className="prec-header">
        <div className="prec-header-icon">✨</div>
        <h3 className="prec-header-title">{title}</h3>
      </div>
      <div className="prec-grid">
        {recommendations.map((property) => {
          const imgLoaded = imageLoaded[property.id];
          const txClass = getTxClass(property.transaction_type);
          const txLabel = getTxLabel(property.transaction_type);
          const typeIcon = TYPE_ICONS[property.property_type] || '🏠';
          const showDealButton = !isOwner(property);

          return (
            <div
              key={property.id}
              className="prec-card"
              onClick={() => handleCardClick(property.id)}
            >
              {/* Image Section */}
              <div className="prec-img-wrap" style={{ position: 'relative', paddingTop: '62%' }}>
                {!imgLoaded && <div className="prec-skeleton" />}
                <img
                  className="prec-img"
                  src={getPropertyImage(property)}
                  alt={property.title}
                  style={{ position: 'absolute', top: 0, left: 0, opacity: imgLoaded ? 1 : 0 }}
                  onLoad={() => setImageLoaded(prev => ({ ...prev, [property.id]: true }))}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-property.svg'; }}
                />

                {/* Bottom gradient for text readability */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
                  zIndex: 2,
                }} />

                {/* Top badges */}
                <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`prec-badge ${txClass}`}>{txLabel}</span>
                  {property.is_boosted && (
                    <span className="prec-badge prec-badge-featured">⭐ Featured</span>
                  )}
                </div>

                {/* Like button */}
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}>
                  <button
                    className={`prec-like-btn ${property.is_liked ? 'liked' : ''}`}
                    onClick={(e) => handleLike(e, property)}
                    title={property.is_liked ? 'Remove from favourites' : 'Save to favourites'}
                  >
                    {property.is_liked ? '❤️' : '🤍'}
                  </button>
                </div>

                {/* Property type badge */}
                <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 3 }}>
                  <span className="prec-badge prec-badge-type">
                    {typeIcon} {property.property_type}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>UGX</span>
                  <span className="prec-price">{fmt(property.price)}</span>
                  {property.transaction_type === 'rent' && (
                    <span className="prec-price-unit">/month</span>
                  )}
                  {property.transaction_type === 'shortlet' && (
                    <span className="prec-price-unit">/night</span>
                  )}
                </div>

                {/* Title & location */}
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: '#1a1f2e',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}>
                    {property.title}
                  </div>
                  <div style={{
                    fontSize: 12, color: '#6b7280', marginTop: 3,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <span>📍</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {property.district}, {property.city}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="prec-stat-row">
                  {property.bedrooms > 0 && (
                    <>
                      <div className="prec-stat">
                        <span>🛏</span>
                        <span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
                      </div>
                      <div className="prec-stat-sep" />
                    </>
                  )}
                  {property.bathrooms > 0 && (
                    <>
                      <div className="prec-stat">
                        <span>🚿</span>
                        <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
                      </div>
                      <div className="prec-stat-sep" />
                    </>
                  )}
                  <div className="prec-stat">
                    <span>📐</span>
                    <span>{property.square_meters} m²</span>
                  </div>
                </div>

                <div className="prec-divider" />

                {/* CTA Button */}
                {showDealButton && (
                  <div onClick={e => e.stopPropagation()}>
                    {!user ? (
                      <button className="prec-login-btn" onClick={(e) => handleMakeDeal(e, property)}>
                        <span>🔐</span> Log in to Make a Deal
                      </button>
                    ) : (
                      <button className="prec-deal-btn" onClick={(e) => handleMakeDeal(e, property)}>
                        <span>💰</span> Make a Deal
                      </button>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px solid #e2e5ea' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af', fontSize: 11 }}>
                    <span>👁</span>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{(property.views_count || 0).toLocaleString()}</span>
                    <span>views</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {property.is_verified && (
                      <span className="prec-badge prec-badge-verified">✓ Verified</span>
                    )}
                    <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'DM Mono' }}>
                      {new Date(property.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyRecommendations;