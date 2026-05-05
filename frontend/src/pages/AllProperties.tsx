/**
 * AllProperties.tsx — Bayut-inspired, fully redesigned
 * Clean whites, crisp typography, login-gate deal buttons, full filter + map support
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Property } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import PropertyRecommendations from '../components/Recommendations/PropertyRecommendations';

// ─── Inject page-level styles once ───────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('ap-styles')) {
  const s = document.createElement('style');
  s.id = 'ap-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

    :root {
      --ap-red:        #e84035;
      --ap-red-dark:   #c0392b;
      --ap-red-bg:     #fff5f4;
      --ap-red-border: rgba(232,64,53,0.25);
      --ap-navy:       #1a1f2e;
      --ap-navy2:      #2d3748;
      --ap-green:      #0d9948;
      --ap-green-bg:   #edf7f2;
      --ap-blue:       #1a56db;
      --ap-blue-bg:    #eff6ff;
      --ap-amber:      #d97706;
      --ap-amber-bg:   #fffbeb;
      --ap-purple:     #7c3aed;
      --ap-purple-bg:  #f5f3ff;
      --ap-slate:      #64748b;
      --ap-muted:      #94a3b8;
      --ap-light:      #cbd5e1;
      --ap-border:     #e2e8f0;
      --ap-border2:    #f1f5f9;
      --ap-bg:         #f8fafc;
      --ap-bg2:        #f1f5f9;
      --ap-white:      #ffffff;
      --ap-shadow-xs:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --ap-shadow-sm:  0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05);
      --ap-shadow-md:  0 4px 20px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05);
      --ap-shadow-lg:  0 8px 32px rgba(0,0,0,0.12), 0 3px 10px rgba(0,0,0,0.06);
      --ap-font:       'DM Sans', -apple-system, sans-serif;
      --ap-mono:       'DM Mono', monospace;
      --ap-radius:     12px;
      --ap-radius-sm:  8px;
      --ap-radius-xs:  6px;
    }

    *, *::before, *::after { box-sizing: border-box; }

    .ap-root {
      font-family: var(--ap-font);
      -webkit-font-smoothing: antialiased;
      color: var(--ap-navy);
    }

    /* ─── Animations ─── */
    @keyframes ap-fade-up {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes ap-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes ap-drawer-in {
      from { transform: translateX(100%); opacity:0.5; }
      to   { transform: translateX(0);   opacity:1; }
    }
    @keyframes ap-scale-in {
      from { opacity:0; transform:scale(0.96); }
      to   { opacity:1; transform:scale(1); }
    }
    @keyframes ap-spin {
      to { transform:rotate(360deg); }
    }
    @keyframes ap-heart {
      0%  { transform:scale(1); }
      30% { transform:scale(1.4); }
      60% { transform:scale(0.88); }
      100%{ transform:scale(1); }
    }

    /* ─── Shimmer skeleton ─── */
    .ap-skeleton {
      background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
      background-size: 600px 100%;
      animation: ap-shimmer 1.5s infinite;
      border-radius: 6px;
    }

    /* ─── Filter bar inputs ─── */
    .ap-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--ap-radius-sm);
      border: 1.5px solid var(--ap-border);
      font-family: var(--ap-font);
      font-size: 13.5px;
      color: var(--ap-navy);
      background: var(--ap-white);
      outline: none;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .ap-input:focus {
      border-color: var(--ap-red);
      box-shadow: 0 0 0 3px rgba(232,64,53,0.1);
    }
    .ap-input::placeholder { color: var(--ap-muted); }

    /* ─── Filter pill buttons ─── */
    .ap-pill {
      padding: 8px 16px;
      border-radius: 24px;
      border: 1.5px solid var(--ap-border);
      background: var(--ap-white);
      color: var(--ap-slate);
      font-family: var(--ap-font);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.16s ease;
      white-space: nowrap;
    }
    .ap-pill:hover {
      border-color: var(--ap-red);
      color: var(--ap-red);
      background: var(--ap-red-bg);
    }
    .ap-pill.active {
      border-color: var(--ap-red);
      background: var(--ap-red-bg);
      color: var(--ap-red);
      font-weight: 600;
    }

    /* ─── View toggle buttons ─── */
    .ap-view-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: var(--ap-radius-xs);
      border: none;
      background: transparent;
      color: var(--ap-slate);
      font-family: var(--ap-font);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .ap-view-btn.active {
      background: var(--ap-red);
      color: white;
      font-weight: 600;
    }
    .ap-view-btn:hover:not(.active) {
      background: var(--ap-bg2);
      color: var(--ap-navy);
    }

    /* ─── List card ─── */
    .ap-list-card {
      display: flex;
      background: var(--ap-white);
      border-radius: var(--ap-radius);
      border: 1px solid var(--ap-border);
      box-shadow: var(--ap-shadow-xs);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      animation: ap-fade-up 0.35s ease both;
    }
    .ap-list-card:hover {
      box-shadow: var(--ap-shadow-md);
      border-color: rgba(232,64,53,0.3);
      transform: translateY(-2px);
    }
    .ap-list-card:hover .ap-list-img { transform: scale(1.04); }

    .ap-list-img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
    }

    /* ─── Deal/CTA buttons ─── */
    .ap-deal-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 10px 18px;
      border-radius: var(--ap-radius-sm);
      border: none;
      background: var(--ap-red);
      color: white;
      font-family: var(--ap-font);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
      white-space: nowrap;
    }
    .ap-deal-btn:hover:not(:disabled) {
      background: var(--ap-red-dark);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(232,64,53,0.3);
    }
    .ap-deal-btn:disabled { opacity:0.6; cursor:not-allowed; }

    .ap-login-deal-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 10px 18px;
      border-radius: var(--ap-radius-sm);
      border: 1.5px solid var(--ap-red);
      background: var(--ap-red-bg);
      color: var(--ap-red);
      font-family: var(--ap-font);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
      white-space: nowrap;
    }
    .ap-login-deal-btn:hover {
      background: var(--ap-red);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(232,64,53,0.3);
    }

    /* ─── Badges ─── */
    .ap-badge {
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
    .ap-badge-sale     { background: var(--ap-green-bg); color: var(--ap-green); border: 1px solid rgba(13,153,72,0.2); }
    .ap-badge-rent     { background: var(--ap-blue-bg);  color: var(--ap-blue);  border: 1px solid rgba(26,86,219,0.2); }
    .ap-badge-shortlet { background: var(--ap-amber-bg); color: var(--ap-amber); border: 1px solid rgba(217,119,6,0.2); }
    .ap-badge-featured { background: var(--ap-red); color: white; }
    .ap-badge-verified { background: var(--ap-green-bg); color: var(--ap-green); border: 1px solid rgba(13,153,72,0.2); }
    .ap-badge-type     { background: rgba(255,255,255,0.92); color: var(--ap-navy); border: 1px solid rgba(0,0,0,0.1); backdrop-filter: blur(6px); }

    /* ─── Like button ─── */
    .ap-like-btn {
      width: 34px; height: 34px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .ap-like-btn:hover { transform:scale(1.12); background:var(--ap-red-bg); border-color:var(--ap-red); }
    .ap-like-btn.liked { animation: ap-heart 0.4s ease; }

    /* ─── Drawer ─── */
    .ap-drawer {
      position: fixed; top:0; right:0; bottom:0;
      width: 420px;
      background: var(--ap-white);
      z-index: 1001;
      display: flex; flex-direction: column;
      box-shadow: -8px 0 40px rgba(0,0,0,0.12);
      animation: ap-drawer-in 0.25s ease-out;
    }

    /* ─── Map popup ─── */
    .leaflet-popup-content-wrapper { border-radius: 12px !important; padding: 0 !important; overflow: hidden; }
    .leaflet-popup-content { margin: 0 !important; }

    /* ─── Spinner ─── */
    .ap-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: ap-spin 0.65s linear infinite;
    }

    /* ─── Responsive ─── */
    @media (max-width: 768px) {
      .ap-list-card { flex-direction: column; }
      .ap-drawer { width: 100%; }
    }
  `;
  document.head.appendChild(s);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRICE_MAX = 5_000_000_000;

// ─── Leaflet setup ────────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MARKER_COLORS: Record<string, string> = {
  house: '#e84035', apartment: '#1a56db', land: '#0d9948',
  commercial: '#7c3aed', condo: '#d97706', villa: '#db2777',
};

const makeMarkerIcon = (type: string) => L.divIcon({
  html: `<div style="
    background:${MARKER_COLORS[type] || '#64748b'};
    width:14px;height:14px;border-radius:50%;
    border:2.5px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`,
  className: '', iconSize: [14, 14], popupAnchor: [0, -9],
});

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtShort = (p: number): string => {
  if (p >= 1e9) return `${(p / 1e9).toFixed(1)}B`;
  if (p >= 1e6) return `${(p / 1e6).toFixed(0)}M`;
  if (p >= 1e3) return `${(p / 1e3).toFixed(0)}K`;
  return `${p}`;
};

// ─── Filter types ─────────────────────────────────────────────────────────────
interface Filters {
  search:          string;
  location:        string;
  propertyType:    string;
  transactionType: string;
  bedrooms:        string;
  minPrice:        number;
  maxPrice:        number;
  sortBy:          string;
  viewMode:        'list' | 'grid' | 'split';
}

const DEFAULTS: Filters = {
  search: '', location: '', propertyType: '',
  transactionType: '', bedrooms: '',
  minPrice: 0, maxPrice: PRICE_MAX,
  sortBy: 'newest', viewMode: 'grid',
};

// ─── URL helpers ──────────────────────────────────────────────────────────────
function urlToFilters(params: URLSearchParams): Partial<Filters> {
  const out: Partial<Filters> = {};
  const s = params.get('search') || params.get('q') || '';
  if (s) out.search = decodeURIComponent(s);
  const loc = params.get('location') || params.get('district') || '';
  if (loc) out.location = decodeURIComponent(loc);
  const type = params.get('type') || params.get('property_type') || '';
  if (type) out.propertyType = type;
  const tx = params.get('tx') || params.get('transaction_type') || '';
  if (tx) out.transactionType = tx;
  const beds = params.get('bedrooms') || '';
  if (beds) out.bedrooms = beds;
  const minP = params.get('minPrice') || '';
  if (minP) out.minPrice = Number(minP);
  const maxP = params.get('maxPrice') || '';
  if (maxP) out.maxPrice = Number(maxP);
  const sort = params.get('sort') || '';
  if (sort) out.sortBy = sort;
  const view = params.get('view');
  if (view === 'list' || view === 'grid' || view === 'split') out.viewMode = view;
  return out;
}

function filtersToUrl(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search)          p.set('search',   f.search);
  if (f.location)        p.set('location', f.location);
  if (f.propertyType)    p.set('type',     f.propertyType);
  if (f.transactionType) p.set('tx',       f.transactionType);
  if (f.bedrooms)        p.set('bedrooms', f.bedrooms);
  if (f.minPrice > 0)    p.set('minPrice', String(f.minPrice));
  if (f.maxPrice < PRICE_MAX) p.set('maxPrice', String(f.maxPrice));
  if (f.sortBy !== 'newest')  p.set('sort', f.sortBy);
  if (f.viewMode !== 'grid')  p.set('view', f.viewMode);
  return p;
}

// ─── Map controller ───────────────────────────────────────────────────────────
const FlyTo: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 0.8 }); }, [center, zoom]);
  return null;
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ mode?: 'grid' | 'list' }> = ({ mode = 'grid' }) => (
  mode === 'list' ? (
    <div style={{ display: 'flex', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', height: 160 }}>
      <div className="ap-skeleton" style={{ width: 240, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="ap-skeleton" style={{ height: 18, width: '40%' }} />
        <div className="ap-skeleton" style={{ height: 14, width: '70%' }} />
        <div className="ap-skeleton" style={{ height: 12, width: '50%' }} />
        <div className="ap-skeleton" style={{ height: 12, width: '30%', marginTop: 'auto' }} />
      </div>
    </div>
  ) : (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div className="ap-skeleton" style={{ paddingTop: '62%' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="ap-skeleton" style={{ height: 18, width: '55%' }} />
        <div className="ap-skeleton" style={{ height: 13, width: '80%' }} />
        <div className="ap-skeleton" style={{ height: 11, width: '40%' }} />
      </div>
    </div>
  )
);

// ─── Deal CTA — central component handling auth state ─────────────────────────
interface DealCTAProps {
  property: Property;
  user: any;
  compact?: boolean;
  fullWidth?: boolean;
}
const DealCTA: React.FC<DealCTAProps> = ({ property, user, compact = false, fullWidth = false }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const isOwner = user && property.owner && user.id === property.owner.id;
  if (isOwner) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { returnTo: `/make-deal/${property.id}`, reason: 'deal' } });
      return;
    }
    if (!property.owner?.id) return;
    navigate(`/make-deal/${property.id}`);
  };

  if (!user) {
    return (
      <button
        className="ap-login-deal-btn"
        onClick={handleClick}
        style={{ width: fullWidth ? '100%' : undefined, fontSize: compact ? 12 : 13, padding: compact ? '7px 13px' : '10px 18px' }}
        title="Log in to make a deal on this property"
      >
        <span style={{ fontSize: compact ? 13 : 15 }}>🔐</span>
        {compact ? 'Login to Deal' : 'Login to Make a Deal'}
      </button>
    );
  }

  return (
    <button
      className="ap-deal-btn"
      onClick={handleClick}
      disabled={busy}
      style={{ width: fullWidth ? '100%' : undefined, fontSize: compact ? 12 : 13, padding: compact ? '7px 13px' : '10px 18px' }}
    >
      {busy ? <div className="ap-spinner" /> : <span style={{ fontSize: compact ? 13 : 15 }}>💰</span>}
      {busy ? 'Opening…' : compact ? 'Make a Deal' : 'Make a Deal'}
    </button>
  );
};

// ─── Stat chips ───────────────────────────────────────────────────────────────
const StatRow: React.FC<{ beds: number; baths: number; sqm: number; compact?: boolean }> = ({ beds, baths, sqm, compact }) => {
  const items: { icon: string; label: string }[] = [];
  if (beds > 0)  items.push({ icon: '🛏', label: `${beds} bed${beds !== 1 ? 's' : ''}` });
  if (baths > 0) items.push({ icon: '🚿', label: `${baths} bath${baths !== 1 ? 's' : ''}` });
  if (sqm > 0)   items.push({ icon: '📐', label: `${sqm} m²` });
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 12, flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0, display: 'inline-block' }} />}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: compact ? 12 : 13, color: '#64748b', fontWeight: 500 }}>
            <span style={{ fontSize: compact ? 12 : 13 }}>{item.icon}</span>
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── TX Badge helper ──────────────────────────────────────────────────────────
const TXBadge: React.FC<{ type: string }> = ({ type }) => {
  const cls = type === 'sale' ? 'ap-badge-sale' : type === 'rent' ? 'ap-badge-rent' : 'ap-badge-shortlet';
  const label = type === 'sale' ? 'For Sale' : type === 'rent' ? 'For Rent' : type === 'shortlet' ? 'Short Stay' : 'For Lease';
  return <span className={`ap-badge ${cls}`}>{label}</span>;
};

// ─── Horizontal List Card ─────────────────────────────────────────────────────
const ListCard: React.FC<{ property: Property; onLike: () => void; user: any; animDelay?: number }> = ({
  property, onLike, user, animDelay = 0,
}) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(property.is_liked ?? false);
  const mainImg = property.images?.[0];
  const imgUrl = mainImg?.image_url || mainImg?.image || '/placeholder-property.svg';
  const typeEmojis: Record<string, string> = { house: '🏠', apartment: '🏢', land: '🌾', commercial: '🏭', condo: '🏙️', villa: '🏡' };

  return (
    <div
      className="ap-list-card"
      onClick={() => navigate(`/property/${property.id}`)}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: 280, minWidth: 220, maxWidth: 280, flexShrink: 0, overflow: 'hidden' }}>
        <img className="ap-list-img" src={imgUrl} alt={property.title}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-property.svg'; }} />
        {/* Gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.38) 100%)' }} />
        {/* Top badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 2 }}>
          <TXBadge type={property.transaction_type} />
          {property.is_boosted && <span className="ap-badge ap-badge-featured">⚡ Featured</span>}
        </div>
        {/* Like */}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <button
            className={`ap-like-btn${liked ? ' liked' : ''}`}
            onClick={e => { e.stopPropagation(); setLiked(l => !l); onLike(); }}
            title={liked ? 'Remove from favourites' : 'Save to favourites'}
          >
            {liked ? '❤️' : '🤍'}
          </button>
        </div>
        {/* Type bottom */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2 }}>
          <span className="ap-badge ap-badge-type">
            {typeEmojis[property.property_type] || '🏠'} {property.property_type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {/* Price row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>UGX</span>
            <span style={{ fontFamily: 'var(--ap-mono)', fontSize: 22, fontWeight: 500, color: 'var(--ap-navy)', letterSpacing: '-0.03em' }}>
              {fmtShort(property.price)}
            </span>
            {property.transaction_type === 'rent' && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>/mo</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {property.is_verified && <span className="ap-badge ap-badge-verified">✓ Verified</span>}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ap-navy)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.title}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ap-slate)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>📍</span> {property.district}, {property.city}
          </p>
        </div>

        {/* Stats */}
        <StatRow beds={property.bedrooms} baths={property.bathrooms} sqm={property.square_meters} />

        {/* Divider + footer */}
        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--ap-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          {/* Owner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--ap-red-bg)', border: '1.5px solid var(--ap-red-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--ap-red)', flexShrink: 0,
            }}>
              {property.owner?.first_name?.[0]?.toUpperCase() || property.owner?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ap-navy)' }}>
                {property.owner?.first_name ? `${property.owner.first_name} ${property.owner.last_name || ''}`.trim() : property.owner?.username || 'Agent'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ap-muted)' }}>Listed by</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <DealCTA property={property} user={user} compact />
            <button
              onClick={e => { e.stopPropagation(); navigate(`/property/${property.id}`); }}
              style={{
                padding: '7px 16px', borderRadius: 8,
                border: '1.5px solid var(--ap-border)',
                background: 'var(--ap-white)',
                color: 'var(--ap-navy)',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ap-red)'; e.currentTarget.style.color = 'var(--ap-red)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ap-border)'; e.currentTarget.style.color = 'var(--ap-navy)'; }}
            >
              View →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Grid Card with deal CTA overlay + inline ────────────────────────────────
const GridCard: React.FC<{ property: Property; onLike: () => void; user: any; animDelay?: number }> = ({
  property, onLike, user, animDelay = 0,
}) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [liked, setLiked] = useState(property.is_liked ?? false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const mainImg = property.images?.[0];
  const imgUrl = mainImg?.image_url || mainImg?.image || '/placeholder-property.svg';
  const typeEmojis: Record<string, string> = { house: '🏠', apartment: '🏢', land: '🌾', commercial: '🏭', condo: '🏙️', villa: '🏡' };
  const isOwner = user && property.owner && user.id === property.owner.id;

  return (
    <div
      style={{
        background: 'var(--ap-white)',
        borderRadius: 'var(--ap-radius)',
        border: `1px solid ${hov ? 'rgba(232,64,53,0.28)' : 'var(--ap-border)'}`,
        boxShadow: hov ? 'var(--ap-shadow-md)' : 'var(--ap-shadow-xs)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition: 'all 0.22s ease',
        display: 'flex', flexDirection: 'column',
        animation: `ap-fade-up 0.35s ease both`,
        animationDelay: `${animDelay}ms`,
      }}
      onClick={() => navigate(`/property/${property.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Image area */}
      <div style={{ position: 'relative', paddingTop: '64%', overflow: 'hidden', background: 'var(--ap-bg2)' }}>
        {!imgLoaded && <div className="ap-skeleton" style={{ position: 'absolute', inset: 0 }} />}
        <img
          src={imgUrl} alt={property.title}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s, transform 0.4s',
            transform: hov ? 'scale(1.05)' : 'scale(1)',
          }}
          onLoad={() => setImgLoaded(true)}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-property.svg'; setImgLoaded(true); }}
        />
        {/* Bottom gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(transparent, rgba(0,0,0,0.45))', zIndex: 1 }} />

        {/* Top-left badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <TXBadge type={property.transaction_type} />
          {property.is_boosted && <span className="ap-badge ap-badge-featured">⚡</span>}
        </div>

        {/* Like button top-right */}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <button
            className={`ap-like-btn${liked ? ' liked' : ''}`}
            onClick={e => { e.stopPropagation(); setLiked(l => !l); onLike(); }}
            title={liked ? 'Remove from favourites' : 'Save'}
          >
            {liked ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Type tag bottom-left */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2 }}>
          <span className="ap-badge ap-badge-type">{typeEmojis[property.property_type] || '🏠'} {property.property_type}</span>
        </div>

        {/* Verified bottom-right */}
        {property.is_verified && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 2 }}>
            <span className="ap-badge ap-badge-verified">✓</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>UGX</span>
          <span style={{ fontFamily: 'var(--ap-mono)', fontSize: 20, fontWeight: 500, color: 'var(--ap-navy)', letterSpacing: '-0.03em' }}>
            {fmtShort(property.price)}
          </span>
          {property.transaction_type === 'rent' && <span style={{ fontSize: 11, color: '#94a3b8' }}>/mo</span>}
          {property.transaction_type === 'shortlet' && <span style={{ fontSize: 11, color: '#94a3b8' }}>/night</span>}
        </div>

        {/* Title & location */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ap-navy)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ap-slate)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span>📍</span> {property.district}, {property.city}
          </div>
        </div>

        {/* Stats */}
        <StatRow beds={property.bedrooms} baths={property.bathrooms} sqm={property.square_meters} compact />

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--ap-border)', margin: '2px 0' }} />

        {/* CTA */}
        {!isOwner && (
          <div onClick={e => e.stopPropagation()}>
            <DealCTA property={property} user={user} fullWidth />
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--ap-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>👁</span>
            <span style={{ fontFamily: 'var(--ap-mono)', fontSize: 11 }}>{(property.views_count || 0).toLocaleString()}</span>
          </span>
          <span style={{ fontFamily: 'var(--ap-mono)', fontSize: 10 }}>
            {new Date(property.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Active filter chips row ──────────────────────────────────────────────────
const ActiveChips: React.FC<{ filters: Filters; onChange: (p: Partial<Filters>) => void }> = ({ filters, onChange }) => {
  const chips: { label: string; clear: Partial<Filters> }[] = [];
  if (filters.propertyType)    chips.push({ label: `Type: ${filters.propertyType}`,           clear: { propertyType: '' } });
  if (filters.transactionType) chips.push({ label: `For: ${filters.transactionType}`,         clear: { transactionType: '' } });
  if (filters.bedrooms)        chips.push({ label: `${filters.bedrooms}+ beds`,               clear: { bedrooms: '' } });
  if (filters.maxPrice < PRICE_MAX) chips.push({ label: `≤ UGX ${fmtShort(filters.maxPrice)}`, clear: { maxPrice: PRICE_MAX } });
  if (!chips.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 20px', borderBottom: '1px solid var(--ap-border)', background: 'var(--ap-white)' }}>
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onChange(chip.clear)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 20,
            background: 'var(--ap-red-bg)', border: '1.5px solid var(--ap-red-border)',
            color: 'var(--ap-red)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {chip.label} <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
        </button>
      ))}
    </div>
  );
};

// ─── Filters Drawer ───────────────────────────────────────────────────────────
const FiltersDrawer: React.FC<{
  filters: Filters;
  onChange: (p: Partial<Filters>) => void;
  onReset: () => void;
  onClose: () => void;
  count: number;
}> = ({ filters, onChange, onReset, onClose, count }) => {
  const [localMax, setLocalMax] = useState(filters.maxPrice);
  const timer = useRef<any>(null);

  const PillGroup: React.FC<{ options: {v:string;l:string}[]; current: string; key_: keyof Filters }> = ({ options, current, key_ }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.v} className={`ap-pill${current === o.v ? ' active' : ''}`}
          onClick={() => onChange({ [key_]: o.v } as Partial<Filters>)}>
          {o.l}
        </button>
      ))}
    </div>
  );

  const SectionLabel: React.FC<{ children: string }> = ({ children }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ap-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
      {children}
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,40,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
      <div className="ap-drawer">
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--ap-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ap-navy)' }}>Filter Properties</div>
            <div style={{ fontSize: 12, color: 'var(--ap-muted)', marginTop: 2 }}>
              {count} {count === 1 ? 'result' : 'results'} match your filters
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--ap-border)', background: 'var(--ap-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ap-slate)' }}>×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Purpose */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Purpose</SectionLabel>
            <PillGroup key_="transactionType" current={filters.transactionType} options={[
              { v: '', l: 'All' }, { v: 'sale', l: '🏷 For Sale' }, { v: 'rent', l: '🔑 For Rent' }, { v: 'shortlet', l: '🌙 Short Stay' },
            ]} />
          </div>

          {/* Property Type */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Property Type</SectionLabel>
            <PillGroup key_="propertyType" current={filters.propertyType} options={[
              { v: '', l: 'All' }, { v: 'house', l: '🏠 House' }, { v: 'apartment', l: '🏢 Apartment' },
              { v: 'land', l: '🌾 Land' }, { v: 'commercial', l: '🏭 Commercial' }, { v: 'condo', l: '🏙️ Condo' }, { v: 'villa', l: '🏡 Villa' },
            ]} />
          </div>

          {/* Bedrooms */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Bedrooms</SectionLabel>
            <PillGroup key_="bedrooms" current={filters.bedrooms} options={[
              { v: '', l: 'Any' }, { v: '1', l: '1+' }, { v: '2', l: '2+' }, { v: '3', l: '3+' }, { v: '4', l: '4+' }, { v: '5', l: '5+' },
            ]} />
          </div>

          {/* Price */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Max Price</SectionLabel>
            <input
              type="range" min={0} max={PRICE_MAX} step={10_000_000}
              value={localMax}
              onChange={e => {
                const v = Number(e.target.value);
                setLocalMax(v);
                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(() => onChange({ maxPrice: v }), 150);
              }}
              style={{ width: '100%', accentColor: 'var(--ap-red)', height: 4, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--ap-muted)' }}>UGX 0</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ap-red)', fontFamily: 'var(--ap-mono)' }}>
                ≤ UGX {fmtShort(localMax)}
              </span>
            </div>
          </div>

          {/* Sort */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Sort By</SectionLabel>
            <PillGroup key_="sortBy" current={filters.sortBy} options={[
              { v: 'newest', l: 'Newest First' }, { v: 'price_low', l: 'Price ↑ Low' }, { v: 'price_high', l: 'Price ↓ High' }, { v: 'views', l: 'Most Viewed' },
            ]} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ap-border)', display: 'flex', gap: 12 }}>
          <button onClick={onReset} style={{
            flex: 1, padding: 12, borderRadius: 10,
            border: '1.5px solid var(--ap-border)', background: 'var(--ap-white)',
            color: 'var(--ap-slate)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Reset All
          </button>
          <button onClick={onClose} style={{
            flex: 2, padding: 12, borderRadius: 10,
            border: 'none', background: 'var(--ap-red)',
            color: 'white', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(232,64,53,0.3)',
          }}>
            Show {count} {count === 1 ? 'Result' : 'Results'}
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div style={{
    textAlign: 'center', padding: '80px 40px',
    background: 'var(--ap-white)', borderRadius: 16,
    border: '1px solid var(--ap-border)',
    animation: 'ap-scale-in 0.3s ease',
  }}>
    <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ap-navy)', margin: '0 0 8px' }}>No properties found</h3>
    <p style={{ color: 'var(--ap-slate)', fontSize: 14, margin: '0 0 24px' }}>
      We couldn't find any properties matching your filters.<br />Try adjusting your search criteria.
    </p>
    <button onClick={onReset} style={{
      padding: '10px 28px', borderRadius: 10,
      border: 'none', background: 'var(--ap-red)',
      color: 'white', fontSize: 14, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit',
    }}>
      Clear All Filters
    </button>
  </div>
);

// ─── Main AllProperties component ─────────────────────────────────────────────
const AllProperties: React.FC = () => {
  const urlLocation = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [showLocDrop, setShowLocDrop] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0.3136, 32.5811]);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  const locRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<any>(null);
  const urlSyncTimer = useRef<any>(null);
  const prevUrlSearch = useRef('');
  const didMount = useRef(false);

  // Load all properties
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/properties/', { params: { page_size: 200 } });
        setProperties(res.data.results ?? res.data);
      } catch {
        setError('Could not load properties. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Click-outside for location dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) {
        setShowLocDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync from URL on load/navigation
  useEffect(() => {
    const params = new URLSearchParams(urlLocation.search);
    const fromUrl = urlToFilters(params);
    setFilters({ ...DEFAULTS, ...fromUrl });
    setSearchVal(fromUrl.search || '');
    setLocationVal(fromUrl.location || '');
    prevUrlSearch.current = urlLocation.search;
  }, [urlLocation.search]);

  // Sync filters to URL
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    urlSyncTimer.current = setTimeout(() => {
      const params = filtersToUrl(filters);
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      if (prevUrlSearch.current !== newSearch) {
        prevUrlSearch.current = newSearch;
        navigate(`/properties${newSearch}`, { replace: true });
      }
    }, 300);
  }, [filters, navigate]);

  const applyFilter = useCallback((partial: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  }, []);

  const resetAll = useCallback(() => {
    setFilters({ ...DEFAULTS, viewMode: filters.viewMode });
    setSearchVal('');
    setLocationVal('');
  }, [filters.viewMode]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchVal(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilter({ search: val }), 280);
  }, [applyFilter]);

  const handleLocationSelect = useCallback((val: string) => {
    setLocationVal(val);
    applyFilter({ location: val });
    setShowLocDrop(false);
  }, [applyFilter]);

  // Filter + sort logic
  const filtered = useMemo(() => {
    let list = properties.filter(p => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!p.title?.toLowerCase().includes(q) && !p.district?.toLowerCase().includes(q) && !p.city?.toLowerCase().includes(q)) return false;
      }
      if (filters.location) {
        const l = filters.location.toLowerCase();
        if (!p.district?.toLowerCase().includes(l) && !p.city?.toLowerCase().includes(l)) return false;
      }
      if (filters.propertyType && p.property_type !== filters.propertyType) return false;
      if (filters.transactionType && p.transaction_type !== filters.transactionType) return false;
      if (filters.bedrooms && (p.bedrooms ?? 0) < parseInt(filters.bedrooms)) return false;
      if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;
      return true;
    });

    const sortFns: Record<string, (a: Property, b: Property) => number> = {
      price_low:  (a, b) => a.price - b.price,
      price_high: (a, b) => b.price - a.price,
      views:      (a, b) => (b.views_count ?? 0) - (a.views_count ?? 0),
      newest:     (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    };
    const fn = sortFns[filters.sortBy] ?? sortFns.newest;
    return [...list.filter(p => p.is_boosted).sort(fn), ...list.filter(p => !p.is_boosted).sort(fn)];
  }, [properties, filters]);

  // Distinct locations for dropdown
  const locations = useMemo(() =>
    Array.from(new Set(properties.map(p => p.district).filter(Boolean))).slice(0, 10),
    [properties]
  );

  // Active filter count
  const activeCount = useMemo(() =>
    [filters.search, filters.location, filters.propertyType, filters.transactionType, filters.bedrooms]
      .filter(Boolean).length + (filters.maxPrice < PRICE_MAX ? 1 : 0) + (filters.minPrice > 0 ? 1 : 0),
    [filters]
  );

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ap-root" style={{ minHeight: '100vh', background: 'var(--ap-bg)', marginTop: 64 }}>
        {/* Filter bar skeleton */}
        <div style={{ background: 'var(--ap-white)', borderBottom: '1px solid var(--ap-border)', padding: '14px 24px' }}>
          <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', gap: 12 }}>
            <div className="ap-skeleton" style={{ flex: 1, height: 42, borderRadius: 8 }} />
            <div className="ap-skeleton" style={{ width: 160, height: 42, borderRadius: 8 }} />
            <div className="ap-skeleton" style={{ width: 120, height: 42, borderRadius: 8 }} />
          </div>
        </div>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="ap-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 64, background: 'var(--ap-bg)' }}>
        <div style={{ textAlign: 'center', padding: 40, background: 'var(--ap-white)', borderRadius: 16, border: '1px solid var(--ap-border)', boxShadow: 'var(--ap-shadow-sm)', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ap-navy)', margin: '0 0 8px' }}>Something went wrong</h3>
          <p style={{ color: 'var(--ap-slate)', fontSize: 14, margin: '0 0 24px' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'var(--ap-red)', color: 'white',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="ap-root" style={{ minHeight: '100vh', background: 'var(--ap-bg)', marginTop: 64 }}>

      {/* ── Sticky Filter Bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'var(--ap-white)',
        borderBottom: '1px solid var(--ap-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--ap-muted)', pointerEvents: 'none' }}>🔍</span>
            <input
              className="ap-input"
              type="text"
              placeholder="Search by title, location…"
              value={searchVal}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ paddingLeft: 38, borderColor: filters.search ? 'var(--ap-red)' : undefined }}
            />
            {searchVal && (
              <button onClick={() => { setSearchVal(''); applyFilter({ search: '' }); }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--ap-muted)', lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>

          {/* Location */}
          <div ref={locRef} style={{ position: 'relative', minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--ap-muted)', pointerEvents: 'none' }}>📍</span>
            <input
              className="ap-input"
              type="text"
              placeholder="Location"
              value={locationVal}
              onChange={e => { setLocationVal(e.target.value); applyFilter({ location: e.target.value }); setShowLocDrop(true); }}
              onFocus={() => setShowLocDrop(true)}
              style={{ paddingLeft: 34, borderColor: filters.location ? 'var(--ap-red)' : undefined }}
            />
            {showLocDrop && locations.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: 'var(--ap-white)', border: '1px solid var(--ap-border)',
                borderRadius: 'var(--ap-radius-sm)', zIndex: 300,
                boxShadow: 'var(--ap-shadow-md)',
                overflow: 'hidden',
                animation: 'ap-scale-in 0.15s ease',
              }}>
                {locations
                  .filter(l => !locationVal || l.toLowerCase().includes(locationVal.toLowerCase()))
                  .map(loc => (
                    <div key={loc}
                      onClick={() => handleLocationSelect(loc)}
                      style={{
                        padding: '10px 16px', cursor: 'pointer', fontSize: 13.5,
                        color: 'var(--ap-navy)',
                        borderBottom: '1px solid var(--ap-border2)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--ap-bg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      📍 {loc}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Filter drawer trigger */}
          <button
            className={`ap-pill${activeCount > 0 ? ' active' : ''}`}
            onClick={() => setShowDrawer(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>⚙️</span>
            Filters
            {activeCount > 0 && (
              <span style={{
                background: 'var(--ap-red)', color: 'white',
                borderRadius: '50%', width: 18, height: 18,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {activeCount}
              </span>
            )}
          </button>

          {/* Clear all */}
          {activeCount > 0 && (
            <button className="ap-pill" onClick={resetAll} style={{ color: 'var(--ap-red)', borderColor: 'var(--ap-red-border)' }}>
              Clear ×
            </button>
          )}

          {/* Sort quick access */}
          <select
            value={filters.sortBy}
            onChange={e => applyFilter({ sortBy: e.target.value })}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--ap-border)',
              fontSize: 13, fontFamily: 'inherit', background: 'var(--ap-white)',
              color: 'var(--ap-navy)', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="views">Most Viewed</option>
          </select>

          {/* View mode */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--ap-bg2)', borderRadius: 10, padding: 3 }}>
            {([
              { mode: 'grid', icon: '⊞', label: 'Grid' },
              { mode: 'list', icon: '≡', label: 'List' },
              { mode: 'split', icon: '⊟', label: 'Map' },
            ] as const).map(({ mode, icon, label }) => (
              <button key={mode} className={`ap-view-btn${filters.viewMode === mode ? ' active' : ''}`}
                onClick={() => applyFilter({ viewMode: mode })}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          {/* Count */}
          <div style={{ fontSize: 13, color: 'var(--ap-muted)', flexShrink: 0 }}>
            <strong style={{ color: 'var(--ap-navy)', fontFamily: 'var(--ap-mono)' }}>{filtered.length}</strong> listings
          </div>
        </div>

        {/* Active filter chips */}
        <ActiveChips filters={filters} onChange={applyFilter} />
      </div>

      {/* ── Main layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: filters.viewMode === 'split' ? '1fr 480px' : '1fr',
        maxWidth: 1600, margin: '0 auto',
        padding: '24px 20px', gap: 24,
        alignItems: 'start',
      }}>

        {/* Results */}
        <div>
          {filtered.length === 0 ? (
            <EmptyState onReset={resetAll} />
          ) : filters.viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filtered.map((p, i) => (
                <GridCard key={p.id} property={p} user={user} onLike={() => {}} animDelay={Math.min(i * 40, 240)} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map((p, i) => (
                <ListCard key={p.id} property={p} user={user} onLike={() => {}} animDelay={Math.min(i * 40, 200)} />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <PropertyRecommendations limit={4} />
            </div>
          )}
        </div>

        {/* Map panel (split mode) */}
        {filters.viewMode === 'split' && (
          <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 100px)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--ap-border)', boxShadow: 'var(--ap-shadow-md)' }}>
            <MapContainer center={[0.3136, 32.5811]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <FlyTo center={mapCenter} zoom={mapZoom} />
              {filtered.map(p => p.latitude && p.longitude ? (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={makeMarkerIcon(p.property_type)}
                  eventHandlers={{ click: () => { setMapCenter([p.latitude, p.longitude]); setMapZoom(15); setSelectedProp(p); } }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'var(--ap-font)', padding: 0, minWidth: 200 }}>
                      <img
                        src={p.images?.[0]?.image_url || '/placeholder-property.svg'} alt={p.title}
                        style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'var(--ap-mono)', fontSize: 16, fontWeight: 500, color: 'var(--ap-navy)' }}>
                          UGX {fmtShort(p.price)}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ap-navy)', margin: '4px 0 2px' }}>{p.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ap-muted)', marginBottom: 10 }}>📍 {p.district}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => navigate(`/property/${p.id}`)}
                            style={{ flex: 1, padding: '7px', background: 'var(--ap-red)', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null)}
            </MapContainer>

            {/* Selected property card on map */}
            {selectedProp && (
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 1000, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--ap-shadow-lg)', animation: 'ap-fade-up 0.2s ease' }}>
                <button
                  onClick={() => setSelectedProp(null)}
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >
                  ×
                </button>
                <PropertyCard property={selectedProp} variant="horizontal" showDealButton={false} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Drawer */}
      {showDrawer && (
        <FiltersDrawer
          filters={filters}
          onChange={applyFilter}
          onReset={resetAll}
          onClose={() => setShowDrawer(false)}
          count={filtered.length}
        />
      )}
    </div>
  );
};

export default AllProperties;