/**
 * Home.tsx — MODERN REDESIGN with Cloudinary Support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Property, Service } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import Chatbot from '../components/Chatbot/Chatbot';
import HeroSection from '../components/Hero/HeroSection';
import { useAuth } from '../contexts/AuthContext';

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const C = {
  red:     '#e63946',
  redDark: '#c1121f',
  redBg:   'rgba(230,57,70,0.06)',
  teal:    '#25a882',
  tealBg:  'rgba(37,168,130,0.07)',
  navy:    '#0d1b2e',
  slate:   '#475569',
  muted:   '#94a3b8',
  border:  '#eef2f7',
  pageBg:  '#f5f7fa',
  white:   '#ffffff',
};

// ─── Cloudinary Configuration ────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'drcy2xxkg';

const getCloudinaryUrl = (image: string | null | undefined): string => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  // Remove any existing 'image/upload/' to prevent duplication
  let cleanUrl = image;
  if (cleanUrl.includes('image/upload/')) {
    cleanUrl = cleanUrl.replace('image/upload/', '');
  }
  cleanUrl = cleanUrl.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${cleanUrl}`;
};

function toPropertiesUrl(params: { search?: string; property_type?: string; transaction_type?: string; bedrooms?: string; location?: string; sort?: string }) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k === 'sort' ? 'ordering' : k, v); });
  return `/properties${p.toString() ? `?${p.toString()}` : ''}`;
}

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ label?: string; title: string; subtitle?: string; ctaLabel?: string; ctaUrl?: string; accent?: string }> = ({
  label, title, subtitle, ctaLabel, ctaUrl, accent = C.red,
}) => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
      <div>
        {label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: accent, display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{label}</span>
          </div>
        )}
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 800, color: C.navy, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: 14, color: C.muted, margin: '6px 0 0', lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
      {ctaLabel && ctaUrl && (
        <button onClick={() => navigate(ctaUrl)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: accent, border: `1.5px solid ${accent}`, backgroundColor: 'transparent', padding: '8px 20px', borderRadius: 30, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, transition: 'all 0.15s' }} className="sh-cta">
          {ctaLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}
    </div>
  );
};

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Sec: React.FC<{ bg?: string; pad?: string; children: React.ReactNode }> = ({ bg = C.white, pad = '60px 0', children }) => (
  <section style={{ backgroundColor: bg, padding: pad }}>
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px' }}>{children}</div>
  </section>
);

// ─── Stats Strip ──────────────────────────────────────────────────────────────
const StatsStrip: React.FC<{ stats: { total: number; forSale: number; forRent: number; forShortlet: number } }> = ({ stats }) => {
  const navigate = useNavigate();
  const items = [
    { label: 'Total Listings', value: stats.total,       path: '/properties',                         color: '#fff' },
    { label: 'For Sale',       value: stats.forSale,     path: '/properties?transaction_type=sale',   color: C.red },
    { label: 'For Rent',       value: stats.forRent,     path: '/properties?transaction_type=rent',   color: C.teal },
    { label: 'Short Stay',     value: stats.forShortlet, path: '/properties?transaction_type=shortlet', color: '#f59e0b' },
  ];
  return (
    <div style={{ backgroundColor: C.navy }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {items.map((item, i) => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{ padding: '22px 24px', border: 'none', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background-color 0.15s' }} className="stat-btn">
            <div style={{ fontSize: 'clamp(1.4rem, 2vw, 2rem)', fontWeight: 800, color: item.color, fontFamily: "'Sora',sans-serif", lineHeight: 1 }}>{item.value.toLocaleString()}+</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5, fontWeight: 500, letterSpacing: '0.03em' }}>{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Property Type Tiles ──────────────────────────────────────────────────────
const PROP_TYPES = [
  { type: 'house',      img: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=600&h=400&fit=crop',   label: 'Houses',     icon: '🏠' },
  { type: 'apartment',  img: 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=600&h=400&fit=crop', label: 'Apartments', icon: '🏢' },
  { type: 'land',       img: 'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=600&h=400&fit=crop',   label: 'Land',       icon: '🌾' },
  { type: 'commercial', img: 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=600&h=400&fit=crop',   label: 'Commercial', icon: '🏭' },
  { type: 'condo',      img: 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?w=600&h=400&fit=crop', label: 'Condos',     icon: '🏙️' },
];

const PropTypeTile: React.FC<{ item: typeof PROP_TYPES[0]; tx: 'sale'|'rent'|'shortlet'; count?: number }> = ({ item, tx, count }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => navigate(toPropertiesUrl({ property_type: item.type, transaction_type: tx }))} style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', width: '100%', aspectRatio: '3/4', border: 'none', padding: 0, transform: hov ? 'translateY(-6px)' : 'none', boxShadow: hov ? '0 20px 48px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s' }}>
      <img src={item.img} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.5s' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,27,46,0.92) 0%, rgba(13,27,46,0.25) 55%, transparent 100%)' }} />
      {count !== undefined && count > 0 && (
        <div style={{ position: 'absolute', top: 13, right: 13, backgroundColor: C.red, color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>{count}</div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 16px' }}>
        <div style={{ fontSize: 24, marginBottom: 5 }}>{item.icon}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Sora',sans-serif" }}>{item.label}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700, marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          {tx === 'sale' ? 'For Sale' : tx === 'rent' ? 'For Rent' : 'Short Stay'}
        </div>
      </div>
    </button>
  );
};

// ─── Service Card with Cloudinary Support ─────────────────────────────────────
const ServiceCard: React.FC<{ service: Service; onPress: () => void }> = ({ service, onPress }) => {
  const [hov, setHov] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const emo: Record<string, string> = { cleaning: '🧹', moving: '🚚', renovation: '🔨', electrical: '⚡', plumbing: '🔧', painting: '🖌️', security: '🔒', landscaping: '🌿', general: '🏠' };
  
  const imageUrl = useMemo(() => {
    if (imgError) return '';
    const rawUrl = service.image_url || service.image;
    return getCloudinaryUrl(rawUrl);
  }, [service.image_url, service.image, imgError]);

  return (
    <button onClick={onPress} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ flexShrink: 0, width: 230, borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${hov ? C.teal : C.border}`, backgroundColor: C.white, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 12px 32px rgba(37,168,130,0.12)' : '0 1px 6px rgba(0,0,0,0.04)', transition: 'all 0.25s' }}>
      <div style={{ height: 148, position: 'relative', overflow: 'hidden', backgroundColor: '#f4f7fb' }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={service.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{emo[service.category_name?.toLowerCase()] || '🔧'}</div>
        )}
        {service.is_featured && <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>⭐ Featured</span>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>by {service.provider || 'Professional'}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ color: '#f59e0b', fontSize: 13 }}>★</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{service.rating || 4.5}</span>
            <span style={{ fontSize: 11, color: C.muted }}>({service.reviews_count || 0})</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>{fmtPrice(service.price || 0)}</div>
        </div>
      </div>
    </button>
  );
};

// ─── Neighbourhood Card ───────────────────────────────────────────────────────
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
  const [hov, setHov] = useState(false);
  const img = NB_IMGS[Math.abs(district.charCodeAt(0) + district.length) % NB_IMGS.length];
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => navigate(toPropertiesUrl({ location: district }))} style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', height: tall ? 360 : 220, cursor: 'pointer', boxShadow: hov ? '0 20px 48px rgba(0,0,0,0.18)' : '0 2px 12px rgba(0,0,0,0.06)', transform: hov ? 'translateY(-4px)' : 'none', transition: 'transform 0.3s, box-shadow 0.3s' }}>
      <img src={img} alt={district} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: hov ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,27,46,0.9) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
        {count} {count === 1 ? 'property' : 'properties'}
      </div>
      <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
        <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: tall ? 22 : 17, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{district}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Uganda
        </div>
      </div>
    </div>
  );
};

// ─── Trust Cards ──────────────────────────────────────────────────────────────
const TRUST = [
  { icon: '✓', color: C.teal,    bg: C.tealBg,                   title: 'Verified Listings',   desc: 'Every listing is reviewed by our team. Zero fakes, zero duplicates.',        stat: '100%', sl: 'Verified'    },
  { icon: '🇺🇬', color: C.navy, bg: 'rgba(13,27,46,0.06)',       title: 'Nationwide Coverage', desc: 'Kampala to Gulu, Jinja to Mbarara — every district covered.',               stat: '40+',  sl: 'Districts'   },
  { icon: '🔒', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   title: 'Safe Transactions',   desc: 'Verified agents and secure payments for total peace of mind.',              stat: '5K+',  sl: 'Safe Deals'  },
  { icon: '💬', color: C.red,    bg: C.redBg,                    title: 'Expert Support',      desc: 'Local property experts ready 7 days a week to help you find your home.',   stat: '7/7',  sl: 'Days Open'   },
];

const TrustCard: React.FC<typeof TRUST[0]> = ({ icon, color, bg, title, desc, stat, sl }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ flex: '1 1 220px', backgroundColor: C.white, borderRadius: 20, padding: '28px 24px', border: `1.5px solid ${hov ? color : C.border}`, transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? `0 12px 32px ${bg}` : '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.25s', cursor: 'default' }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>{title}</div>
      <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.6, marginBottom: 20 }}>{desc}</div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Sora',sans-serif" }}>{stat}</span>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{sl}</span>
      </div>
    </div>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer: React.FC = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const cols = [
    { h: 'Buy',     links: [{ l: 'Houses for Sale', p: toPropertiesUrl({ property_type: 'house', transaction_type: 'sale' }) }, { l: 'Apartments', p: toPropertiesUrl({ property_type: 'apartment', transaction_type: 'sale' }) }, { l: 'Land for Sale', p: toPropertiesUrl({ property_type: 'land', transaction_type: 'sale' }) }, { l: 'Commercial', p: toPropertiesUrl({ property_type: 'commercial', transaction_type: 'sale' }) }] },
    { h: 'Rent',    links: [{ l: 'Houses for Rent', p: toPropertiesUrl({ property_type: 'house', transaction_type: 'rent' }) }, { l: 'Apartments for Rent', p: toPropertiesUrl({ property_type: 'apartment', transaction_type: 'rent' }) }, { l: 'Short Stay', p: toPropertiesUrl({ transaction_type: 'shortlet' }) }] },
    { h: 'Explore', links: [{ l: 'All Properties', p: '/properties' }, { l: 'Newest Listings', p: toPropertiesUrl({ sort: '-created_at' }) }, { l: 'Most Viewed', p: toPropertiesUrl({ sort: '-views_count' }) }, { l: 'Services', p: '/services' }] },
  ];
  return (
    <footer style={{ backgroundColor: '#07111e' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '36px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.teal, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Download the App</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Sora',sans-serif" }}>Property search, on the go</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { href: 'https://play.google.com/store', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3.18 23.82A2 2 0 0 1 2 22.09V1.91A2 2 0 0 1 3.18.18L13.94 12 3.18 23.82Z" fill="#34A853"/><path d="M17.8 15.7l-3.33-3.7 3.33-3.7 3.7 2.13a1.6 1.6 0 0 1 0 3.14L17.8 15.7Z" fill="#FBBC04"/><path d="M3.18.18l10.76 11.82L8.55 17 3.18.18Z" fill="#4285F4"/><path d="M8.55 7L3.18 23.82 13.94 12 8.55 7Z" fill="#EA4335"/></svg>, top: 'GET IT ON', big: 'Google Play' },
              { href: 'https://apps.apple.com', icon: <svg width="20" height="24" viewBox="0 0 22 26" fill="white"><path d="M18.05 13.75c-.03-3.07 2.5-4.56 2.62-4.63-1.43-2.09-3.65-2.37-4.44-2.4-1.89-.19-3.7 1.12-4.66 1.12-.96 0-2.44-1.09-4.01-1.06-2.06.03-3.97 1.2-5.03 3.04-2.15 3.73-.55 9.24 1.54 12.26 1.03 1.48 2.24 3.14 3.84 3.08 1.54-.06 2.12-.99 3.98-.99 1.86 0 2.39.99 4.01.96 1.66-.03 2.71-1.5 3.72-2.99a14.1 14.1 0 0 0 1.7-3.46c-3.04-1.17-3.27-5.93-.27-6.93ZM14.96 4.3C15.82 3.27 16.4 1.84 16.24.4c-1.23.05-2.72.82-3.6 1.83-.79.89-1.49 2.35-1.3 3.73 1.38.11 2.78-.68 3.62-1.66Z"/></svg>, top: 'DOWNLOAD ON THE', big: 'App Store' },
            ].map(b => (
              <a key={b.href} href={b.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#111', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 18px', textDecoration: 'none', color: '#fff', transition: 'border-color 0.2s' }} className="app-badge">
                {b.icon}
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{b.top}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{b.big}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '44px 28px 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
        <div style={{ maxWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.navy, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={C.teal}/><polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Sora',sans-serif", letterSpacing: '-0.02em' }}>Metro Care Properties</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Uganda's #1 Real Estate</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#3d5566', lineHeight: 1.7, margin: 0 }}>The most trusted property marketplace in Uganda. Find your perfect home, office, or land investment.</p>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          {cols.map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.teal, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 16 }}>{col.h}</div>
              {col.links.map(lk => (
                <button key={lk.l} onClick={() => navigate(lk.p)} style={{ display: 'block', background: 'none', border: 'none', color: '#3d5566', fontSize: 13, marginBottom: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0, transition: 'color 0.15s' }} className="ft-link">{lk.l}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '16px 28px', maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#243545' }}>© {year} Metro Properties. All rights reserved.</span>
        <span style={{ fontSize: 12, color: '#243545' }}>🇺🇬 Kampala, Uganda</span>
      </div>
    </footer>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, forSale: 0, forRent: 0, forShortlet: 0 });
  const [heroTxType, setHeroTxType] = useState<'sale'|'rent'|'shortlet'>('sale');
  const [propTxType, setPropTxType] = useState<'sale'|'rent'|'shortlet'>('sale');

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/', { params: { page_size: 200 } });
      const data = res.data.results ?? res.data;
      setProperties(data);
      setStats({ total: data.length, forSale: data.filter((p: Property) => p.transaction_type === 'sale').length, forRent: data.filter((p: Property) => p.transaction_type === 'rent').length, forShortlet: data.filter((p: Property) => p.transaction_type === 'shortlet').length });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/services/', { params: { page_size: 8, is_featured: true } });
      let servicesData = res.data.results ?? res.data;
      // ONLY add this line to process image URLs
      servicesData = servicesData.map((s: Service) => ({
        ...s,
        image_url: getCloudinaryUrl(s.image || s.image_url)
      }));
      setServices(servicesData.slice(0, 8));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchProperties(); fetchServices(); }, [fetchProperties, fetchServices]);

  const bf = useCallback((items: Property[]) => [...items.filter(p => p.is_boosted), ...items.filter(p => !p.is_boosted)], []);
  const premium  = useMemo(() => bf(properties.filter(p => p.is_boosted)).slice(0, 8), [properties, bf]);
  const featured = useMemo(() => bf([...properties.filter(p => p.is_boosted), ...properties.filter(p => p.is_verified && !p.is_boosted)]).slice(0, 12), [properties, bf]);
  const forSale  = useMemo(() => bf(properties.filter(p => p.transaction_type === 'sale')).slice(0, 6), [properties, bf]);
  const forRent  = useMemo(() => bf(properties.filter(p => p.transaction_type === 'rent')).slice(0, 6), [properties, bf]);
  const forShort = useMemo(() => bf(properties.filter(p => p.transaction_type === 'shortlet')).slice(0, 6), [properties, bf]);

  const neighbourhoods = useMemo(() => {
    const map: Record<string, number> = {};
    properties.forEach(p => { if (p.district) map[p.district] = (map[p.district] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d, c]) => ({ district: d, count: c }));
  }, [properties]);

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    properties.filter(p => p.transaction_type === propTxType).forEach(p => { if (p.property_type) m[p.property_type] = (m[p.property_type] || 0) + 1; });
    return m;
  }, [properties, propTxType]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.red}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: C.muted, marginTop: 12, fontSize: 13 }}>Loading properties...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.pageBg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <HeroSection onSearch={(f) => navigate(toPropertiesUrl(f))} stats={stats} heroTxType={heroTxType} setHeroTxType={setHeroTxType} />

      {stats.total > 0 && <StatsStrip stats={stats} />}

      {/* Services Section with Inspection Card */}
      {(services.length > 0) && (
        <Sec bg={C.white}>
          <SectionHeader label="Services" title="Home Services" subtitle="Trusted professionals for every need" ctaLabel="Browse all" ctaUrl="/services" accent={C.teal} />
          <div style={{ display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' as any }}>
            {services.map(s => <ServiceCard key={s.id} service={s} onPress={() => navigate(`/services/${s.id}`)} />)}
          </div>
        </Sec>
      )}

      {premium.length > 0 && (
        <Sec bg={C.pageBg}>
          <SectionHeader label="Premium" title="Top Premium Properties 💎" subtitle="The most prominent listings right now" ctaLabel="View all" ctaUrl="/properties?is_boosted=true" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 20 }}>
            {premium.map(p => <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />)}
          </div>
        </Sec>
      )}

      {featured.length > 0 && (
        <Sec bg={C.white}>
          <SectionHeader label="Featured" title="Handpicked Properties" subtitle="Verified, trusted, and ready to view" ctaLabel="See all" ctaUrl="/properties" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 20 }}>
            {featured.map(p => <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />)}
          </div>
        </Sec>
      )}

      {/* ── Property Types ── */}
      <Sec bg={C.pageBg}>
        <SectionHeader label="Browse" title="Explore by Property Type" subtitle="Filter by what you're looking for" />
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, padding: 4, backgroundColor: C.white, borderRadius: 14, border: `1px solid ${C.border}`, width: 'fit-content' }}>
          {(['sale', 'rent', 'shortlet'] as const).map(t => (
            <button key={t} onClick={() => setPropTxType(t)} style={{ padding: '8px 22px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', backgroundColor: propTxType === t ? C.navy : 'transparent', color: propTxType === t ? '#fff' : C.slate, boxShadow: propTxType === t ? '0 2px 8px rgba(13,27,46,0.2)' : 'none' }}>
              {t === 'sale' ? '🏠 For Sale' : t === 'rent' ? '🔑 For Rent' : '⏱️ Short Stay'}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px,1fr))', gap: 16 }}>
          {PROP_TYPES.map(item => <PropTypeTile key={item.type} item={item} tx={propTxType} count={typeCounts[item.type]} />)}
        </div>
      </Sec>

      {/* ── Neighbourhoods — bento grid ── */}
      {neighbourhoods.length > 0 && (
        <Sec bg={C.white}>
          <SectionHeader label="Locations" title="Popular Neighbourhoods" subtitle="Browse by area across Uganda" ctaLabel="All areas" ctaUrl="/properties" accent={C.teal} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {neighbourhoods.map((n, i) => (
              <div key={n.district} style={{ gridRow: i === 0 ? 'span 2' : 'span 1' }}>
                <NbCard district={n.district} count={n.count} tall={i === 0} />
              </div>
            ))}
          </div>
        </Sec>
      )}

      {forSale.length > 0 && (
        <Sec bg={C.pageBg}>
          <SectionHeader label="For Sale" title="Latest Properties for Sale" subtitle="Fresh listings — updated daily" ctaLabel="All for sale" ctaUrl="/properties?transaction_type=sale" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 20 }}>
            {forSale.map(p => <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />)}
          </div>
        </Sec>
      )}

      {forRent.length > 0 && (
        <Sec bg={C.white}>
          <SectionHeader label="For Rent" title="Latest Properties for Rent" subtitle="Available now across Uganda" ctaLabel="All for rent" ctaUrl="/properties?transaction_type=rent" accent={C.teal} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 20 }}>
            {forRent.map(p => <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />)}
          </div>
        </Sec>
      )}

      {forShort.length > 0 && (
        <Sec bg={C.pageBg}>
          <SectionHeader label="Short Stay" title="Short-Term Stays" subtitle="Furnished and ready to move in" ctaLabel="All short stay" ctaUrl="/properties?transaction_type=shortlet" accent="#f59e0b" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 20 }}>
            {forShort.map(p => <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />)}
          </div>
        </Sec>
      )}

      {/* ── Why Choose Us ── */}
      <Sec bg={C.white}>
        <SectionHeader label="Why Us" title="The Metro Difference" subtitle="Built specifically for Uganda's property market" />
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {TRUST.map(item => <TrustCard key={item.title} {...item} />)}
        </div>
      </Sec>

      {/* ── Agent CTA ── */}
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: C.navy, padding: '60px 0' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', backgroundColor: 'rgba(230,57,70,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: '35%', width: 240, height: 240, borderRadius: '50%', backgroundColor: 'rgba(37,168,130,0.06)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.teal, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>For Agents & Developers</div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.025em', lineHeight: 1.15 }}>Grow Your Business<br />with Metro Care Properties</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0, maxWidth: 460, lineHeight: 1.7 }}>List your properties and connect with thousands of serious buyers and renters across Uganda every day.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', backgroundColor: C.red, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(230,57,70,0.4)', transition: 'all 0.15s' }} className="ag-cta">List a Property</button>
            <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.18)', backgroundColor: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }} className="ag-login">Agent Login</button>
          </div>
        </div>
      </div>

      <Footer />
      <Chatbot />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { display: none; }
        .sh-cta:hover { opacity: 0.82; transform: translateY(-1px); }
        .stat-btn:hover { background-color: rgba(255,255,255,0.04) !important; }
        .ft-link:hover { color: #fff !important; }
        .app-badge:hover { border-color: rgba(255,255,255,0.3) !important; }
        .ag-cta:hover { background-color: ${C.redDark} !important; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(230,57,70,0.5) !important; }
        .ag-login:hover { background-color: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.35) !important; }
        button { font-family: inherit; }
      `}</style>
    </div>
  );
};

export default Home;