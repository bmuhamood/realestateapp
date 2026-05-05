// src/components/Property/PropertyCard.tsx — Bayut-inspired redesign

import React, { useState } from 'react';
import { Property } from '../../types';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Inject global styles once ────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('pcard-styles')) {
  const style = document.createElement('style');
  style.id = 'pcard-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    :root {
      --pc-white:       #ffffff;
      --pc-bg:          #f7f8fa;
      --pc-border:      #e2e5ea;
      --pc-border-hover:#c8cdd6;
      --pc-text:        #1a1f2e;
      --pc-text-muted:  #6b7280;
      --pc-text-light:  #9ca3af;
      --pc-brand:       #e84035;
      --pc-brand-dark:  #c0392b;
      --pc-brand-bg:    #fff0ef;
      --pc-green:       #0d9948;
      --pc-green-bg:    #edf7f2;
      --pc-blue:        #1a56db;
      --pc-blue-bg:     #eff6ff;
      --pc-amber:       #d97706;
      --pc-amber-bg:    #fffbeb;
      --pc-purple:      #7c3aed;
      --pc-purple-bg:   #f5f3ff;
      --pc-shadow-sm:   0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
      --pc-shadow-md:   0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
      --pc-shadow-lg:   0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07);
      --pc-radius:      12px;
      --pc-radius-sm:   8px;
      --pc-radius-xs:   6px;
    }

    .pcard-root * { box-sizing: border-box; }
    .pcard-root {
      font-family: 'DM Sans', -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── Animations ─── */
    @keyframes pc-fade-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pc-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes pc-heart {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.35); }
      60%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes pc-toast-in {
      from { opacity: 0; transform: translateY(6px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ─── Card base ─── */
    .pcard-v, .pcard-h {
      background: var(--pc-white);
      border: 1px solid var(--pc-border);
      border-radius: var(--pc-radius);
      box-shadow: var(--pc-shadow-sm);
      cursor: pointer;
      overflow: hidden;
      animation: pc-fade-up 0.35s ease both;
      transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    .pcard-v:hover, .pcard-h:hover {
      box-shadow: var(--pc-shadow-md);
      border-color: var(--pc-border-hover);
    }

    /* ─── Vertical ─── */
    .pcard-v {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .pcard-v:hover { transform: translateY(-3px); }

    /* ─── Horizontal ─── */
    .pcard-h {
      display: flex;
      margin-bottom: 12px;
    }
    .pcard-h:hover { transform: translateX(2px); }

    /* ─── Image wrapper ─── */
    .pcard-img-wrap {
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--pc-bg);
    }
    .pcard-img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
    }
    .pcard-v:hover .pcard-img,
    .pcard-h:hover .pcard-img { transform: scale(1.04); }

    /* ─── Skeleton ─── */
    .pcard-skeleton {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 400px 100%;
      animation: pc-shimmer 1.4s infinite;
    }

    /* ─── Badges ─── */
    .pc-badge {
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
    .pc-badge-type {
      background: rgba(255,255,255,0.92);
      color: var(--pc-text);
      border: 1px solid rgba(0,0,0,0.08);
    }
    .pc-badge-sale   { background: #edf7f2; color: #0d9948; border: 1px solid rgba(13,153,72,0.2); }
    .pc-badge-rent   { background: #eff6ff; color: #1a56db; border: 1px solid rgba(26,86,219,0.2); }
    .pc-badge-shortlet{ background: #fffbeb; color: #d97706; border: 1px solid rgba(217,119,6,0.2); }
    .pc-badge-verified { 
      background: #edf7f2; color: #0d9948;
      border: 1px solid rgba(13,153,72,0.2);
      font-size: 10px;
    }
    .pc-badge-boosted {
      background: #fffbeb; color: #d97706;
      border: 1px solid rgba(217,119,6,0.2);
      font-size: 10px;
    }
    .pc-badge-featured {
      background: var(--pc-brand); color: white;
      font-size: 10px;
      font-weight: 700;
    }

    /* ─── Like button ─── */
    .pc-like-btn {
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
    .pc-like-btn:hover {
      background: var(--pc-brand-bg);
      border-color: var(--pc-brand);
      transform: scale(1.1);
    }
    .pc-like-btn.liked { animation: pc-heart 0.4s ease; }

    /* ─── Price ─── */
    .pc-price {
      font-family: 'DM Mono', monospace;
      font-size: 20px;
      font-weight: 500;
      color: var(--pc-text);
      letter-spacing: -0.03em;
    }
    .pc-price-lg { font-size: 22px; }
    .pc-price-unit {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      color: var(--pc-text-muted);
      font-weight: 400;
    }

    /* ─── Stat chips ─── */
    .pc-stat-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pc-stat {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: var(--pc-text-muted);
      font-weight: 500;
    }
    .pc-stat-sep {
      width: 3px; height: 3px;
      border-radius: 50%;
      background: var(--pc-border);
      flex-shrink: 0;
    }

    /* ─── Divider ─── */
    .pc-divider {
      height: 1px;
      background: var(--pc-border);
      margin: 10px 0;
    }

    /* ─── Deal / CTA button ─── */
    .pc-deal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 10px 16px;
      border-radius: var(--pc-radius-sm);
      border: none;
      background: var(--pc-brand);
      color: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      letter-spacing: 0.01em;
      transition: all 0.18s ease;
      position: relative;
      overflow: hidden;
    }
    .pc-deal-btn:hover:not(:disabled) {
      background: var(--pc-brand-dark);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(232,64,53,0.3);
    }
    .pc-deal-btn:active:not(:disabled) { transform: scale(0.98); }
    .pc-deal-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ─── Login prompt button ─── */
    .pc-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 10px 16px;
      border-radius: var(--pc-radius-sm);
      border: 1.5px solid var(--pc-brand);
      background: transparent;
      color: var(--pc-brand);
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      letter-spacing: 0.01em;
      transition: all 0.18s ease;
    }
    .pc-login-btn:hover {
      background: var(--pc-brand-bg);
      transform: translateY(-1px);
    }

    /* ─── Toast/validation message ─── */
    .pc-toast {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      padding: 10px 14px;
      border-radius: var(--pc-radius-sm);
      font-size: 12px;
      font-weight: 500;
      line-height: 1.4;
      z-index: 20;
      animation: pc-toast-in 0.22s ease;
      display: flex;
      align-items: flex-start;
      gap: 7px;
      pointer-events: none;
    }
    .pc-toast-error   { background: #fff0ef; color: #c0392b; border: 1px solid rgba(192,57,43,0.18); }
    .pc-toast-success { background: #edf7f2; color: #0d9948; border: 1px solid rgba(13,153,72,0.18); }
    .pc-toast-info    { background: #eff6ff; color: #1a56db; border: 1px solid rgba(26,86,219,0.18); }

    /* ─── Inline validation under button ─── */
    .pc-validation {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      font-weight: 500;
      padding: 6px 10px;
      border-radius: var(--pc-radius-xs);
      margin-top: 6px;
    }
    .pc-validation-error   { background: #fff0ef; color: #c0392b; }
    .pc-validation-success { background: #edf7f2; color: #0d9948; }
    .pc-validation-info    { background: #eff6ff; color: #1a56db; }

    /* ─── Spinner ─── */
    @keyframes pc-spin { to { transform: rotate(360deg); } }
    .pc-spinner {
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: pc-spin 0.65s linear infinite;
      flex-shrink: 0;
    }

    /* ─── Responsive ─── */
    @media (max-width: 600px) {
      .pcard-h { flex-direction: column; }
      .pcard-h .pcard-img-wrap { width: 100% !important; height: 200px !important; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PropertyCardProps {
  property: Property;
  onLike?: () => void;
  variant?: 'horizontal' | 'vertical';
  showDealButton?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getImageUrl = (image: any): string => {
  if (!image) return '/placeholder-property.svg';
  if (typeof image === 'string') {
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    if (image.includes('/')) return `https://res.cloudinary.com/drcy2xxkg/${image}`;
    return image;
  }
  if (typeof image === 'object')
    return image.image_url || image.thumbnail_url || image.medium_url || '/placeholder-property.svg';
  return '/placeholder-property.svg';
};

const fmt = (p: number) => {
  if (p >= 1e9) return `${(p / 1e9).toFixed(1)}B`;
  if (p >= 1e6) return `${(p / 1e6).toFixed(0)}M`;
  if (p >= 1e3) return `${(p / 1e3).toFixed(0)}K`;
  return `${p}`;
};

// ─── Type / Transaction metadata ──────────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  house: '🏠', apartment: '🏢', land: '🌾', commercial: '🏭',
  condo: '🏙️', villa: '🏡', office: '💼', studio: '🛋️',
};

const TX_CLASS: Record<string, string> = {
  sale: 'pc-badge-sale',
  rent: 'pc-badge-rent',
  shortlet: 'pc-badge-shortlet',
};

const TX_LABELS: Record<string, string> = {
  sale: 'For Sale',
  rent: 'For Rent',
  shortlet: 'Short Stay',
  lease: 'For Lease',
};

// ─── Validation message component ─────────────────────────────────────────────
type MsgType = 'error' | 'success' | 'info';
interface ValidationMsgProps {
  message: string;
  type: MsgType;
}
const ValidationMsg: React.FC<ValidationMsgProps> = ({ message, type }) => {
  const icons: Record<MsgType, string> = { error: '✕', success: '✓', info: 'ℹ' };
  return (
    <div className={`pc-validation pc-validation-${type}`}>
      <span style={{ fontWeight: 700, fontSize: 12 }}>{icons[type]}</span>
      {message}
    </div>
  );
};

// ─── Stat row ─────────────────────────────────────────────────────────────────
const StatRow: React.FC<{ beds: number; baths: number; sqm: number }> = ({ beds, baths, sqm }) => {
  const items = [];
  if (beds > 0)  items.push({ icon: '🛏', label: `${beds} bed${beds > 1 ? 's' : ''}` });
  if (baths > 0) items.push({ icon: '🚿', label: `${baths} bath${baths > 1 ? 's' : ''}` });
  if (sqm > 0)   items.push({ icon: '📐', label: `${sqm} m²` });
  if (items.length === 0) return null;
  return (
    <div className="pc-stat-row">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className="pc-stat-sep" />}
          <div className="pc-stat">
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onLike,
  variant = 'horizontal',
  showDealButton = true,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [imageLoaded, setImageLoaded]   = useState(false);
  const [makingDeal, setMakingDeal]     = useState(false);
  const [liking, setLiking]             = useState(false);
  const [validationMsg, setValidationMsg] = useState<{ text: string; type: MsgType } | null>(null);

  // ─── Derived values ─────────────────────────────────────────────────────
  const mainImage = property.images?.[0];
  const imageUrl  = getImageUrl(mainImage);
  const typeIcon  = TYPE_ICONS[property.property_type] || '🏠';
  const txClass   = TX_CLASS[property.transaction_type] || 'pc-badge-sale';
  const txLabel   = TX_LABELS[property.transaction_type] || property.transaction_type;

  // Show deal button if:
  // - showDealButton prop is true
  // - Either not logged in (show login-gate button) OR logged in but not the owner
  const isOwner     = user && property.owner && user.id === property.owner.id;
  const showCTA     = showDealButton && !isOwner;

  // ─── Validation helper ──────────────────────────────────────────────────
  const showMsg = (text: string, type: MsgType, autoHideMs = 3500) => {
    setValidationMsg({ text, type });
    setTimeout(() => setValidationMsg(null), autoHideMs);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showMsg('Log in to save properties to your favourites.', 'info');
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      await api.post(`/properties/${property.id}/like/`);
      if (onLike) onLike();
    } catch (err: any) {
      showMsg('Could not update favourites. Please try again.', 'error');
    } finally {
      setLiking(false);
    }
  };

  const handleMakeDeal = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Not logged in → redirect with helpful message
    if (!user) {
      navigate('/login', { state: { returnTo: `/make-deal/${property.id}`, reason: 'deal' } });
      return;
    }

    // Validation: owner check
    if (!property.owner || !property.owner.id) {
      showMsg('Owner information is unavailable. Cannot start a deal at this time.', 'error');
      return;
    }
    if (user.id === property.owner.id) {
      showMsg('You cannot make a deal on your own listing.', 'error');
      return;
    }

    navigate(`/make-deal/${property.id}`);
  };

  // ─── Shared pieces ───────────────────────────────────────────────────────

  const priceBlock = (size: 'lg' | 'md') => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontSize: 12, color: 'var(--pc-text-muted)', fontWeight: 500 }}>UGX</span>
      <span className={`pc-price${size === 'lg' ? ' pc-price-lg' : ''}`}>{fmt(property.price)}</span>
      {property.transaction_type === 'rent' && (
        <span className="pc-price-unit">/month</span>
      )}
      {property.transaction_type === 'shortlet' && (
        <span className="pc-price-unit">/night</span>
      )}
    </div>
  );

  // CTA button — adapts based on auth state
  const ctaButton = showCTA ? (
    <div>
      {!user ? (
        // Not logged in: show login-gate button
        <button
          className="pc-login-btn"
          onClick={handleMakeDeal}
          title="Log in to make a deal"
        >
          <span style={{ fontSize: 14 }}>🔐</span>
          Log in to Make a Deal
        </button>
      ) : (
        // Logged in and not owner
        <button
          className="pc-deal-btn"
          onClick={handleMakeDeal}
          disabled={makingDeal}
        >
          {makingDeal
            ? <><div className="pc-spinner" /> Processing…</>
            : <><span style={{ fontSize: 14 }}>💰</span> Make a Deal</>
          }
        </button>
      )}
      {validationMsg && (
        <ValidationMsg message={validationMsg.text} type={validationMsg.type} />
      )}
    </div>
  ) : null;

  const footerRow = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--pc-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--pc-text-light)', fontSize: 11.5 }}>
        <span style={{ fontSize: 12 }}>👁</span>
        <span style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{(property.views_count || 0).toLocaleString()}</span>
        <span style={{ marginLeft: 2 }}>views</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {property.is_verified && (
          <span className="pc-badge pc-badge-verified">✓ Verified</span>
        )}
        {property.is_boosted && (
          <span className="pc-badge pc-badge-boosted">⚡ Top Pick</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--pc-text-light)', fontFamily: 'DM Mono' }}>
          {new Date(property.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );

  // ─── VERTICAL VARIANT ────────────────────────────────────────────────────
  if (variant === 'vertical') {
    return (
      <div className="pcard-root pcard-v" onClick={() => navigate(`/property/${property.id}`)}>
        {/* Image */}
        <div className="pcard-img-wrap" style={{ position: 'relative', paddingTop: '62%' }}>
          {!imageLoaded && <div className="pcard-skeleton" />}
          <img
            className="pcard-img"
            src={imageUrl}
            alt={property.title}
            style={{ position: 'absolute', top: 0, left: 0, opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
            onLoad={() => setImageLoaded(true)}
            onError={e => { (e.target as HTMLImageElement).src = '/placeholder-property.svg'; }}
          />

          {/* Subtle gradient only at bottom for text readability */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
            zIndex: 2,
          }} />

          {/* Top badges row */}
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={`pc-badge ${txClass}`}>{txLabel}</span>
            {property.is_boosted && (
              <span className="pc-badge pc-badge-featured">⚡ Featured</span>
            )}
          </div>

          {/* Like button top-right */}
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}>
            <button
              className={`pc-like-btn${property.is_liked ? ' liked' : ''}`}
              onClick={handleLike}
              disabled={liking}
              title={property.is_liked ? 'Remove from favourites' : 'Save to favourites'}
            >
              {property.is_liked ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Property type badge bottom-left */}
          <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 3 }}>
            <span className="pc-badge pc-badge-type">{typeIcon} {property.property_type}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
          {/* Price */}
          {priceBlock('md')}

          {/* Title & location */}
          <div>
            <div style={{
              fontSize: 14, fontWeight: 600, color: 'var(--pc-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.4,
            }}>
              {property.title}
            </div>
            <div style={{
              fontSize: 12, color: 'var(--pc-text-muted)', marginTop: 3,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 12 }}>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {property.district}, {property.city}
              </span>
            </div>
          </div>

          {/* Stats */}
          <StatRow beds={property.bedrooms} baths={property.bathrooms} sqm={property.square_meters} />

          <div className="pc-divider" style={{ margin: '2px 0' }} />

          {/* CTA */}
          {ctaButton && <div onClick={e => e.stopPropagation()}>{ctaButton}</div>}

          {/* Footer */}
          {footerRow}
        </div>
      </div>
    );
  }

  // ─── HORIZONTAL VARIANT ──────────────────────────────────────────────────
  return (
    <div className="pcard-root pcard-h" onClick={() => navigate(`/property/${property.id}`)}>
      {/* Image */}
      <div className="pcard-img-wrap" style={{ position: 'relative', width: 260, minWidth: 220, maxWidth: 280 }}>
        {!imageLoaded && <div className="pcard-skeleton" />}
        <img
          className="pcard-img"
          src={imageUrl}
          alt={property.title}
          style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s', height: '100%' }}
          onLoad={() => setImageLoaded(true)}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-property.svg'; }}
        />

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
          zIndex: 2,
        }} />

        {/* Badges top-left */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span className={`pc-badge ${txClass}`}>{txLabel}</span>
          <span className="pc-badge pc-badge-type">{typeIcon} {property.property_type}</span>
        </div>

        {/* Like button top-right */}
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}>
          <button
            className={`pc-like-btn${property.is_liked ? ' liked' : ''}`}
            onClick={handleLike}
            disabled={liking}
            title={property.is_liked ? 'Remove from favourites' : 'Save to favourites'}
          >
            {property.is_liked ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Boosted bottom */}
        {property.is_boosted && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 3 }}>
            <span className="pc-badge pc-badge-featured">⚡ Featured</span>
          </div>
        )}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {/* Top row: price + verified */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          {priceBlock('lg')}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {property.is_verified && (
              <span className="pc-badge pc-badge-verified">✓ Verified</span>
            )}
          </div>
        </div>

        {/* Title + location */}
        <div>
          <div style={{
            fontSize: 15, fontWeight: 600, color: 'var(--pc-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}>
            {property.title}
          </div>
          <div style={{
            fontSize: 12.5, color: 'var(--pc-text-muted)', marginTop: 4,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <span style={{ fontSize: 13 }}>📍</span>
            {property.district}, {property.city}
          </div>
        </div>

        {/* Stats */}
        <StatRow beds={property.bedrooms} baths={property.bathrooms} sqm={property.square_meters} />

        <div className="pc-divider" />

        {/* CTA — stopPropagation so card click doesn't fire */}
        {ctaButton && (
          <div style={{ maxWidth: 220 }} onClick={e => e.stopPropagation()}>
            {ctaButton}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto' }}>{footerRow}</div>
      </div>
    </div>
  );
};

export default PropertyCard;