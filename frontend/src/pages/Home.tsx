/**
 * Home.tsx — Bayut-inspired redesign
 * Clean whites · crisp typography · responsive · Chatbot removed
 * Logic unchanged — only UI overhauled
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Property, Service } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import HeroSection from '../components/Hero/HeroSection';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer/Footer';

// ─── Inject global styles ──────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('home-styles')) {
  const s = document.createElement('style');
  s.id = 'home-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,700&family=DM+Mono:wght@400;500&display=swap');

    :root {
      --h-red:       #e84035;
      --h-red-dark:  #c0392b;
      --h-red-bg:    #fff5f4;
      --h-red-bdr:   rgba(232,64,53,0.2);
      --h-navy:      #0f1923;
      --h-navy2:     #1e2d3d;
      --h-teal:      #0d9948;
      --h-teal-bg:   #edf7f2;
      --h-teal-bdr:  rgba(13,153,72,0.2);
      --h-amber:     #d97706;
      --h-amber-bg:  #fffbeb;
      --h-blue:      #1a56db;
      --h-blue-bg:   #eff6ff;
      --h-slate:     #64748b;
      --h-muted:     #94a3b8;
      --h-light:     #cbd5e1;
      --h-border:    #e2e8f0;
      --h-border2:   #f1f5f9;
      --h-bg:        #f8fafc;
      --h-white:     #ffffff;
      --h-shadow-xs: 0 1px 4px rgba(0,0,0,0.06);
      --h-shadow-sm: 0 2px 10px rgba(0,0,0,0.08);
      --h-shadow-md: 0 6px 24px rgba(0,0,0,0.10);
      --h-shadow-lg: 0 12px 40px rgba(0,0,0,0.13);
      --h-font:      'DM Sans', -apple-system, sans-serif;
      --h-display:   'Fraunces', Georgia, serif;
      --h-mono:      'DM Mono', monospace;
      --h-radius:    14px;
      --h-radius-sm: 10px;
      --h-radius-xs: 7px;
    }

    *, *::before, *::after { box-sizing: border-box; }

    .home-root {
      font-family: var(--h-font);
      -webkit-font-smoothing: antialiased;
      color: var(--h-navy);
      background: var(--h-bg);
    }

    /* ─── Animations ─── */
    @keyframes h-fade-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes h-shimmer {
      0%   { background-position:-600px 0; }
      100% { background-position:600px 0; }
    }
    @keyframes h-spin {
      to { transform:rotate(360deg); }
    }
    @keyframes h-pulse {
      0%,100% { opacity:1; }
      50%      { opacity:0.6; }
    }

    /* ─── Shimmer skeleton ─── */
    .h-skeleton {
      background: linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%);
      background-size: 600px 100%;
      animation: h-shimmer 1.5s infinite;
      border-radius: 8px;
    }

    /* ─── Section label ─── */
    .h-section-label {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .h-section-label::before {
      content: '';
      display: inline-block;
      width: 20px; height: 3px;
      border-radius: 2px;
      background: currentColor;
    }

    /* ─── Section title ─── */
    .h-section-title {
      font-family: var(--h-display);
      font-size: clamp(1.4rem, 2.5vw, 2rem);
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: var(--h-navy);
      margin: 0;
    }

    /* ─── CTA outline button ─── */
    .h-cta-outline {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 22px;
      border-radius: 30px;
      border: 1.5px solid var(--h-red);
      background: transparent;
      color: var(--h-red);
      font-family: var(--h-font);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
      white-space: nowrap;
    }
    .h-cta-outline:hover {
      background: var(--h-red);
      color: white;
      box-shadow: 0 4px 16px rgba(232,64,53,0.25);
    }
    .h-cta-outline.teal {
      border-color: var(--h-teal);
      color: var(--h-teal);
    }
    .h-cta-outline.teal:hover {
      background: var(--h-teal);
      color: white;
      box-shadow: 0 4px 16px rgba(13,153,72,0.25);
    }

    /* ─── Card hover lift ─── */
    .h-lift {
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
    }
    .h-lift:hover {
      transform: translateY(-5px);
      box-shadow: var(--h-shadow-lg) !important;
    }

    /* ─── Stats strip ─── */
    .h-stat-btn {
      padding: 24px 28px;
      border: none;
      border-right: 1px solid rgba(255,255,255,0.07);
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: var(--h-font);
      transition: background 0.15s;
    }
    .h-stat-btn:hover { background: rgba(255,255,255,0.04); }
    .h-stat-btn:last-child { border-right: none; }

    /* ─── Property type tile ─── */
    .h-type-tile {
      position: relative;
      border-radius: var(--h-radius);
      overflow: hidden;
      cursor: pointer;
      border: none;
      padding: 0;
      width: 100%;
      aspect-ratio: 3/4;
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
    }
    .h-type-tile:hover {
      transform: translateY(-6px);
      box-shadow: var(--h-shadow-lg);
    }
    .h-type-tile img {
      width:100%; height:100%; object-fit:cover;
      transition: transform 0.5s ease;
    }
    .h-type-tile:hover img { transform: scale(1.07); }

    /* ─── Service card ─── */
    .h-service-card {
      flex-shrink: 0;
      width: 230px;
      border-radius: var(--h-radius);
      overflow: hidden;
      border: 1.5px solid var(--h-border);
      background: var(--h-white);
      cursor: pointer;
      text-align: left;
      font-family: var(--h-font);
      transition: all 0.22s ease;
    }
    .h-service-card:hover {
      border-color: var(--h-teal);
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(13,153,72,0.1);
    }
    .h-service-card:hover .h-svc-img { transform: scale(1.06); }
    .h-svc-img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }

    /* ─── Trust card ─── */
    .h-trust-card {
      flex: 1 1 220px;
      background: var(--h-white);
      border-radius: var(--h-radius);
      padding: 28px 24px;
      border: 1.5px solid var(--h-border);
      cursor: default;
      transition: all 0.22s ease;
    }
    .h-trust-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--h-shadow-md);
    }

    /* ─── Neighbourhood card ─── */
    .h-nb-card {
      position: relative;
      border-radius: var(--h-radius);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.28s ease, box-shadow 0.28s ease;
    }
    .h-nb-card:hover { transform: translateY(-4px); box-shadow: var(--h-shadow-lg); }
    .h-nb-card:hover img { transform: scale(1.05); }
    .h-nb-card img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s; display:block; }

    /* ─── App store badge ─── */
    .h-app-badge {
      display: flex; align-items: center; gap: 10px;
      background: #111;
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 12px; padding: 10px 18px;
      text-decoration: none; color: #fff;
      transition: border-color 0.2s;
    }
    .h-app-badge:hover { border-color: rgba(255,255,255,0.35); }

    /* ─── Scroll container (horizontal) ─── */
    .h-scroll-x {
      display: flex; gap: 16px;
      overflow-x: auto;
      padding-bottom: 6px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .h-scroll-x::-webkit-scrollbar { display: none; }

    /* ─── Tab pills ─── */
    .h-tab {
      padding: 9px 24px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--h-font);
      transition: all 0.18s;
    }
    .h-tab.active {
      background: var(--h-navy);
      color: white;
      box-shadow: 0 2px 10px rgba(15,25,35,0.2);
    }
    .h-tab:not(.active) {
      background: transparent;
      color: var(--h-slate);
    }
    .h-tab:not(.active):hover { background: var(--h-border2); color: var(--h-navy); }

    /* ─── Responsive ─── */
    @media (max-width: 1024px) {
      .h-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
      .h-nb-bento { grid-template-columns: repeat(2,1fr) !important; }
      .h-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
    }
    @media (max-width: 768px) {
      .h-sec { padding: 40px 0 !important; }
      .h-inner { padding: 0 16px !important; }
      .h-grid-auto { grid-template-columns: repeat(auto-fill, minmax(260px,1fr)) !important; }
      .h-grid-3 { grid-template-columns: 1fr !important; }
      .h-nb-bento { grid-template-columns: 1fr !important; }
      .h-nb-bento > :first-child { grid-row: span 1 !important; }
      .h-type-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .h-type-tile { aspect-ratio: 4/3 !important; }
      .h-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
      .h-stat-btn { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.07); }
      .h-agent-row { flex-direction: column !important; gap: 24px !important; }
      .h-trust-card { flex: 1 1 100% !important; }
      .h-footer-cols { flex-direction: column !important; gap: 28px !important; }
      .h-footer-top { flex-direction: column !important; gap: 20px !important; }
      .h-section-hd { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
      .h-tab-row { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .h-tab-row::-webkit-scrollbar { display: none; }
    }
    @media (max-width: 480px) {
      .h-stat-grid { grid-template-columns: 1fr !important; }
      .h-type-grid { grid-template-columns: 1fr 1fr !important; }
      .h-section-title { font-size: 1.3rem !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'drcy2xxkg';

const getCloudinaryUrl = (image: string | null | undefined): string => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  let clean = image;
  if (clean.includes('image/upload/')) clean = clean.replace('image/upload/', '');
  clean = clean.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${clean}`;
};

function toPropertiesUrl(params: { search?: string; property_type?: string; transaction_type?: string; bedrooms?: string; location?: string; sort?: string }) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k === 'sort' ? 'ordering' : k, v); });
  return `/properties${p.toString() ? `?${p.toString()}` : ''}`;
}

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

// ─── Inner container ──────────────────────────────────────────────────────────
const Inner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-inner" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px' }}>
    {children}
  </div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Sec: React.FC<{ bg?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ bg = 'var(--h-white)', children, style }) => (
  <section className="h-sec" style={{ background: bg, padding: '60px 0', ...style }}>
    <Inner>{children}</Inner>
  </section>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  label?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  accentColor?: string;
}> = ({ label, title, subtitle, ctaLabel, ctaUrl, accentColor = 'var(--h-red)' }) => {
  const navigate = useNavigate();
  return (
    <div className="h-section-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
      <div>
        {label && (
          <div className="h-section-label" style={{ color: accentColor }}>{label}</div>
        )}
        <h2 className="h-section-title">{title}</h2>
        {subtitle && (
          <p style={{ fontSize: 14, color: 'var(--h-muted)', margin: '6px 0 0', lineHeight: 1.55 }}>{subtitle}</p>
        )}
      </div>
      {ctaLabel && ctaUrl && (
        <button
          className={`h-cta-outline${accentColor === 'var(--h-teal)' ? ' teal' : ''}`}
          onClick={() => navigate(ctaUrl)}
        >
          {ctaLabel}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}
    </div>
  );
};

// ─── Property grid ────────────────────────────────────────────────────────────
const PropGrid: React.FC<{ properties: Property[]; onLike: () => void }> = ({ properties, onLike }) => (
  <div
    className="h-grid-auto"
    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 20 }}
  >
    {properties.map((p, i) => (
      <div key={p.id} style={{ animation: `h-fade-up 0.35s ease both`, animationDelay: `${Math.min(i * 50, 250)}ms` }}>
        <PropertyCard property={p} onLike={onLike} variant="vertical" />
      </div>
    ))}
  </div>
);

// ─── Stats Strip ──────────────────────────────────────────────────────────────
const StatsStrip: React.FC<{ stats: { total: number; forSale: number; forRent: number; forShortlet: number } }> = ({ stats }) => {
  const navigate = useNavigate();
  const items = [
    { label: 'Total Listings', value: stats.total,       path: '/properties',                              color: '#fff',            sub: 'Active properties' },
    { label: 'For Sale',       value: stats.forSale,     path: toPropertiesUrl({ transaction_type: 'sale' }), color: '#f87171',      sub: 'Ownership ready' },
    { label: 'For Rent',       value: stats.forRent,     path: toPropertiesUrl({ transaction_type: 'rent' }), color: '#34d399',      sub: 'Move-in ready' },
    { label: 'Short Stay',     value: stats.forShortlet, path: toPropertiesUrl({ transaction_type: 'shortlet' }), color: '#fbbf24', sub: 'Furnished & ready' },
  ];
  return (
    <div style={{ background: 'var(--h-navy)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px' }}>
        <div className="h-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {items.map(item => (
            <button key={item.label} className="h-stat-btn" onClick={() => navigate(item.path)}>
              <div style={{ fontFamily: 'var(--h-mono)', fontSize: 'clamp(1.5rem, 2.2vw, 2.2rem)', fontWeight: 500, color: item.color, lineHeight: 1 }}>
                {item.value.toLocaleString()}+
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '5px 0 2px' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{item.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Property type tiles ──────────────────────────────────────────────────────
const PROP_TYPES = [
  { type: 'house',      img: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=600&h=400&fit=crop',   label: 'Houses',     icon: '🏠' },
  { type: 'apartment',  img: 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=600&h=400&fit=crop', label: 'Apartments', icon: '🏢' },
  { type: 'land',       img: 'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=600&h=400&fit=crop',   label: 'Land',       icon: '🌾' },
  { type: 'commercial', img: 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=600&h=400&fit=crop',   label: 'Commercial', icon: '🏭' },
  { type: 'condo',      img: 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?w=600&h=400&fit=crop', label: 'Condos',     icon: '🏙️' },
];

const TX_LABELS = { sale: 'For Sale', rent: 'For Rent', shortlet: 'Short Stay' };
const TX_COLORS = { sale: 'var(--h-teal)', rent: 'var(--h-blue)', shortlet: 'var(--h-amber)' };

const PropTypeTile: React.FC<{ item: typeof PROP_TYPES[0]; tx: 'sale' | 'rent' | 'shortlet'; count?: number }> = ({ item, tx, count }) => {
  const navigate = useNavigate();
  const color = TX_COLORS[tx];
  return (
    <button
      className="h-type-tile"
      onClick={() => navigate(toPropertiesUrl({ property_type: item.type, transaction_type: tx }))}
    >
      <img src={item.img} alt={item.label} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,25,35,0.92) 0%, rgba(15,25,35,0.18) 60%, transparent 100%)' }} />
      {count !== undefined && count > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--h-red)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
          {count}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px' }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
        <div style={{ fontFamily: 'var(--h-display)', fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{item.label}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {TX_LABELS[tx]}
        </div>
      </div>
    </button>
  );
};

// ─── Service Card ─────────────────────────────────────────────────────────────
const ServiceCard: React.FC<{ service: Service; onPress: () => void }> = ({ service, onPress }) => {
  const [imgError, setImgError] = useState(false);
  const emo: Record<string, string> = { cleaning: '🧹', moving: '🚚', renovation: '🔨', electrical: '⚡', plumbing: '🔧', painting: '🖌️', security: '🔒', landscaping: '🌿', general: '🏠' };

  const imageUrl = useMemo(() => {
    if (imgError) return '';
    return getCloudinaryUrl(service.image_url || service.image);
  }, [service.image_url, service.image, imgError]);

  return (
    <button className="h-service-card" onClick={onPress}>
      <div style={{ height: 148, position: 'relative', overflow: 'hidden', background: 'var(--h-bg)' }}>
        {imageUrl ? (
          <img className="h-svc-img" src={imageUrl} alt={service.name} onError={() => setImgError(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
            {emo[service.category_name?.toLowerCase()] || '🔧'}
          </div>
        )}
        {service.is_featured && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--h-amber)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>⭐ Featured</span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--h-navy)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--h-muted)', marginBottom: 10 }}>by {service.provider || 'Professional'}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>★</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-navy)' }}>{service.rating || 4.5}</span>
            <span style={{ fontSize: 11, color: 'var(--h-muted)' }}>({service.reviews_count || 0})</span>
          </div>
          <div style={{ fontFamily: 'var(--h-mono)', fontSize: 13, fontWeight: 500, color: 'var(--h-red)' }}>
            {fmtPrice(service.price || 0)}
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Neighbourhood bento card ─────────────────────────────────────────────────
const NB_IMGS = [
  'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?w=800&h=600&fit=crop',
  'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=800&h=600&fit=crop',
  'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=800&h=600&fit=crop',
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=800&h=600&fit=crop',
  'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=800&h=600&fit=crop',
  'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?w=800&h=600&fit=crop',
];

const NbCard: React.FC<{ district: string; count: number; tall?: boolean }> = ({ district, count, tall }) => {
  const navigate = useNavigate();
  const img = NB_IMGS[Math.abs(district.charCodeAt(0) + district.length) % NB_IMGS.length];
  return (
    <div className="h-nb-card" style={{ height: tall ? 360 : 220 }} onClick={() => navigate(toPropertiesUrl({ location: district }))}>
      <img src={img} alt={district} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,25,35,0.88) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>
          {count} {count === 1 ? 'property' : 'properties'}
        </span>
      </div>
      <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
        <h3 style={{ fontFamily: 'var(--h-display)', fontSize: tall ? 22 : 17, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{district}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.6)', fontSize: 11.5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          Uganda
        </div>
      </div>
    </div>
  );
};

// ─── Trust cards ──────────────────────────────────────────────────────────────
const TRUST = [
  {
    icon: '✓', color: 'var(--h-teal)', borderHover: 'var(--h-teal)',
    title: 'Verified Listings',
    desc: 'Every listing is reviewed by our team. Zero fakes, zero duplicates.',
    stat: '100%', sl: 'Verified',
  },
  {
    icon: '🇺🇬', color: 'var(--h-navy2)', borderHover: 'var(--h-navy2)',
    title: 'Nationwide Coverage',
    desc: 'Kampala to Gulu, Jinja to Mbarara — every district covered.',
    stat: '40+', sl: 'Districts',
  },
  {
    icon: '🔒', color: 'var(--h-amber)', borderHover: 'var(--h-amber)',
    title: 'Safe Transactions',
    desc: 'Verified agents and secure payments for total peace of mind.',
    stat: '5K+', sl: 'Safe Deals',
  },
  {
    icon: '💬', color: 'var(--h-red)', borderHover: 'var(--h-red)',
    title: 'Expert Support',
    desc: 'Local property experts ready 7 days a week to help you find your home.',
    stat: '7/7', sl: 'Days Open',
  },
];

const TrustCard: React.FC<typeof TRUST[0]> = ({ icon, color, borderHover, title, desc, stat, sl }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="h-trust-card"
      style={{ borderColor: hov ? borderHover : 'var(--h-border)', boxShadow: hov ? 'var(--h-shadow-md)' : 'none' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ width: 48, height: 48, borderRadius: 13, background: hov ? color : 'var(--h-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 20, transition: 'background 0.22s', color: hov ? '#fff' : undefined }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--h-display)', fontSize: 17, fontWeight: 700, color: 'var(--h-navy)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--h-slate)', lineHeight: 1.65, marginBottom: 20 }}>{desc}</div>
      <div style={{ borderTop: '1px solid var(--h-border)', paddingTop: 16, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--h-mono)', fontSize: 22, fontWeight: 500, color }}>{stat}</span>
        <span style={{ fontSize: 11, color: 'var(--h-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{sl}</span>
      </div>
    </div>
  );
};

// ─── Featured badge strip ─────────────────────────────────────────────────────
const FeatureBadge: React.FC<{ icon: string; text: string; sub: string }> = ({ icon, text, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'var(--h-white)', borderRadius: 'var(--h-radius-sm)', border: '1.5px solid var(--h-border)', flex: '1 1 180px' }}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--h-navy)' }}>{text}</div>
      <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>{sub}</div>
    </div>
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 14, background: 'var(--h-bg)' }}>
    <div style={{ width: 40, height: 40, border: '3px solid var(--h-border)', borderTop: '3px solid var(--h-red)', borderRadius: '50%', animation: 'h-spin 0.7s linear infinite' }} />
    <p style={{ color: 'var(--h-muted)', fontSize: 14, margin: 0 }}>Loading properties…</p>
  </div>
);

// ─── Main Home component ──────────────────────────────────────────────────────
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [properties, setProperties]   = useState<Property[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [loading, setLoading]         = useState(true);
  const [stats, setStats]             = useState({ total: 0, forSale: 0, forRent: 0, forShortlet: 0 });
  const [heroTxType, setHeroTxType]   = useState<'sale' | 'rent' | 'shortlet'>('sale');
  const [propTxType, setPropTxType]   = useState<'sale' | 'rent' | 'shortlet'>('sale');

  // ─── Data fetching (unchanged logic) ───────────────────────────────────
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/', { params: { page_size: 200 } });
      const data: Property[] = res.data.results ?? res.data;
      setProperties(data);
      setStats({
        total:       data.length,
        forSale:     data.filter(p => p.transaction_type === 'sale').length,
        forRent:     data.filter(p => p.transaction_type === 'rent').length,
        forShortlet: data.filter(p => p.transaction_type === 'shortlet').length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/services/', { params: { page_size: 8, is_featured: true } });
      let data: Service[] = res.data.results ?? res.data;
      data = data.map(s => ({ ...s, image_url: getCloudinaryUrl(s.image || s.image_url) }));
      setServices(data.slice(0, 8));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchProperties(); fetchServices(); }, [fetchProperties, fetchServices]);

  // ─── Derived lists (unchanged logic) ───────────────────────────────────
  const bf = useCallback((items: Property[]) =>
    [...items.filter(p => p.is_boosted), ...items.filter(p => !p.is_boosted)], []);

  const premium  = useMemo(() => bf(properties.filter(p => p.is_boosted)).slice(0, 8), [properties, bf]);
  const featured = useMemo(() => bf([
    ...properties.filter(p => p.is_boosted),
    ...properties.filter(p => p.is_verified && !p.is_boosted),
  ]).slice(0, 12), [properties, bf]);
  const forSale  = useMemo(() => bf(properties.filter(p => p.transaction_type === 'sale')).slice(0, 6), [properties, bf]);
  const forRent  = useMemo(() => bf(properties.filter(p => p.transaction_type === 'rent')).slice(0, 6), [properties, bf]);
  const forShort = useMemo(() => bf(properties.filter(p => p.transaction_type === 'shortlet')).slice(0, 6), [properties, bf]);

  const neighbourhoods = useMemo(() => {
    const m: Record<string, number> = {};
    properties.forEach(p => { if (p.district) m[p.district] = (m[p.district] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d, c]) => ({ district: d, count: c }));
  }, [properties]);

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    properties.filter(p => p.transaction_type === propTxType).forEach(p => { if (p.property_type) m[p.property_type] = (m[p.property_type] || 0) + 1; });
    return m;
  }, [properties, propTxType]);

  if (loading) return <LoadingScreen />;

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="home-root">

      {/* Hero */}
      <HeroSection
        onSearch={(f) => navigate(toPropertiesUrl(f))}
        stats={stats}
        heroTxType={heroTxType}
        setHeroTxType={setHeroTxType}
      />

      {/* Stats strip */}
      {stats.total > 0 && <StatsStrip stats={stats} />}

      {/* Feature badges row */}
      <Sec bg="var(--h-bg)" style={{ padding: '28px 0' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <FeatureBadge icon="✅" text="Verified listings only"   sub="No fake or duplicate properties" />
          <FeatureBadge icon="🤝" text="Trusted deal rooms"       sub="Safe negotiation platform" />
          <FeatureBadge icon="🗺️" text="All Uganda covered"       sub="Every district, every city" />
          <FeatureBadge icon="⚡" text="Updated daily"            sub="Fresh listings every morning" />
        </div>
      </Sec>

      {/* Services */}
      {services.length > 0 && (
        <Sec bg="var(--h-white)">
          <SectionHeader label="Home Services" title="Trusted Professionals" subtitle="From cleaning to renovation — all in one place" ctaLabel="Browse all services" ctaUrl="/services" accentColor="var(--h-teal)" />
          <div className="h-scroll-x">
            {services.map(s => (
              <ServiceCard key={s.id} service={s} onPress={() => navigate(`/services/${s.id}`)} />
            ))}
          </div>
        </Sec>
      )}

      {/* Premium / boosted */}
      {premium.length > 0 && (
        <Sec bg="var(--h-bg)">
          <SectionHeader
            label="Premium"
            title="Top Featured Properties"
            subtitle="The most prominent listings — handpicked and boosted"
            ctaLabel="View all featured"
            ctaUrl="/properties?is_boosted=true"
          />
          <PropGrid properties={premium} onLike={fetchProperties} />
        </Sec>
      )}

      {/* Handpicked / verified */}
      {featured.length > 0 && (
        <Sec bg="var(--h-white)">
          <SectionHeader
            label="Featured"
            title="Handpicked Properties"
            subtitle="Verified, trusted, and ready to view"
            ctaLabel="See all properties"
            ctaUrl="/properties"
          />
          <PropGrid properties={featured} onLike={fetchProperties} />
        </Sec>
      )}

      {/* Property types */}
      <Sec bg="var(--h-bg)">
        <SectionHeader label="Browse" title="Explore by Property Type" subtitle="Filter by what you're looking for" />
        {/* Tab toggle */}
        <div
          className="h-tab-row"
          style={{ display: 'flex', gap: 4, marginBottom: 28, padding: 4, background: 'var(--h-white)', borderRadius: 12, border: '1px solid var(--h-border)', width: 'fit-content' }}
        >
          {(['sale', 'rent', 'shortlet'] as const).map(t => (
            <button key={t} className={`h-tab${propTxType === t ? ' active' : ''}`} onClick={() => setPropTxType(t)}>
              {t === 'sale' ? '🏠 For Sale' : t === 'rent' ? '🔑 For Rent' : '⏱️ Short Stay'}
            </button>
          ))}
        </div>
        <div className="h-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px,1fr))', gap: 16 }}>
          {PROP_TYPES.map(item => (
            <PropTypeTile key={item.type} item={item} tx={propTxType} count={typeCounts[item.type]} />
          ))}
        </div>
      </Sec>

      {/* Neighbourhoods bento */}
      {neighbourhoods.length > 0 && (
        <Sec bg="var(--h-white)">
          <SectionHeader label="Locations" title="Popular Neighbourhoods" subtitle="Browse by area across Uganda" ctaLabel="All locations" ctaUrl="/properties" accentColor="var(--h-teal)" />
          <div className="h-nb-bento" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {neighbourhoods.map((n, i) => (
              <div key={n.district} style={{ gridRow: i === 0 ? 'span 2' : 'span 1' }}>
                <NbCard district={n.district} count={n.count} tall={i === 0} />
              </div>
            ))}
          </div>
        </Sec>
      )}

      {/* For Sale */}
      {forSale.length > 0 && (
        <Sec bg="var(--h-bg)">
          <SectionHeader label="For Sale" title="Latest Properties for Sale" subtitle="Fresh listings — updated daily" ctaLabel="All for sale" ctaUrl="/properties?transaction_type=sale" />
          <PropGrid properties={forSale} onLike={fetchProperties} />
        </Sec>
      )}

      {/* For Rent */}
      {forRent.length > 0 && (
        <Sec bg="var(--h-white)">
          <SectionHeader label="For Rent" title="Latest Properties for Rent" subtitle="Available now across Uganda" ctaLabel="All for rent" ctaUrl="/properties?transaction_type=rent" accentColor="var(--h-teal)" />
          <PropGrid properties={forRent} onLike={fetchProperties} />
        </Sec>
      )}

      {/* Short stay */}
      {forShort.length > 0 && (
        <Sec bg="var(--h-bg)">
          <SectionHeader label="Short Stay" title="Furnished Short-Term Stays" subtitle="Ready to move in — flexible durations" ctaLabel="All short stay" ctaUrl="/properties?transaction_type=shortlet" accentColor="var(--h-amber)" />
          <PropGrid properties={forShort} onLike={fetchProperties} />
        </Sec>
      )}

      {/* Why us — trust cards */}
      <Sec bg="var(--h-white)">
        <SectionHeader label="Why Us" title="The Metro Difference" subtitle="Built specifically for Uganda's property market" />
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {TRUST.map(item => <TrustCard key={item.title} {...item} />)}
        </div>
      </Sec>

      {/* Agent / developer CTA banner */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--h-navy)', padding: '64px 0' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'rgba(232,64,53,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(13,153,72,0.05)', pointerEvents: 'none' }} />
        {/* Accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--h-red), var(--h-teal), var(--h-red))', opacity: 0.7 }} />

        <Inner>
          <div className="h-agent-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32, position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 520 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--h-teal)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                For Agents &amp; Developers
              </div>
              <h2 style={{ fontFamily: 'var(--h-display)', fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Grow Your Business<br />with Metro Care Properties
              </h2>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.7 }}>
                List your properties and connect with thousands of serious buyers and renters across Uganda every day.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
              <button
                onClick={() => navigate('/register')}
                style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'var(--h-red)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(232,64,53,0.4)', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--h-red-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--h-red)'; e.currentTarget.style.transform = 'none'; }}
              >
                List a Property
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ padding: '14px 32px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Agent Login
              </button>
            </div>
          </div>
        </Inner>
      </div>

      <Footer />

      {/* ─── Chatbot DISABLED ─── */}
      {/* <Chatbot /> */}
    </div>
  );
};

export default Home;