// src/pages/ProfilePage.tsx — Complete with Cover Photo Support
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const RED_DARK = '#c1121f';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const GOLD = '#f59e0b';
const GOLD_BG = 'rgba(245,158,11,0.08)';
const ORANGE = '#F97316';
const ORANGE_BG = 'rgba(249,115,22,0.08)';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  id: number; username: string; email: string; phone: string;
  first_name: string; last_name: string; profile_picture: string | null;
  cover_photo: string | null;
  bio: string; location: string; district: string; city: string;
  is_agent: boolean; is_service_provider: boolean; is_verified: boolean;
  followers_count: number; following_count: number; created_at: string;
  full_name: string; is_following?: boolean;
}
interface Property {
  id: number; title: string; description: string; price: number;
  property_type: string; transaction_type: string; bedrooms: number;
  bathrooms: number; square_meters: number; city: string; district: string;
  address: string; is_available: boolean; is_verified: boolean;
  is_boosted: boolean; views_count: number; likes_count: number;
  images: { image: string; is_main: boolean }[]; created_at: string;
}
interface Service {
  id: number; name: string; description: string; price: number;
  price_unit: string; image: string; duration: string; provider: string;
  rating: number; reviews_count: number; is_featured: boolean; category_name: string;
}
interface Review {
  id: number;
  user: { id: number; username: string; first_name: string; last_name: string; profile_picture: string | null };
  agent: number;
  property: { id: number; title: string } | null;
  service?: { id: number; name: string } | null;
  rating: number; comment: string; created_at: string; updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);

const fmtDate = (d: string) => {
  if (!d) return 'N/A';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return 'N/A'; }
};

const StarRating: React.FC<{ value: number; max?: number }> = ({ value, max = 5 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(value) ? GOLD : '#e2e8f0', fontSize: 13 }}>★</span>
    ))}
  </div>
);

// ─── SVG icons ────────────────────────────────────────────────────────────────
const IcoEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoFollow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
const IcoUnfollow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
const IcoPin = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z"/><circle cx="12" cy="10.5" r="3"/></svg>;
const IcoEmail = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IcoPhone = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.6 5a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.9a16 16 0 0 0 6.09 6.09l1.07-1.07a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoCamera = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcoClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoBed = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round"><path d="M2 4v16M22 4v16M2 8h20M2 16h20"/></svg>;
const IcoBath = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round"><path d="M9 6 L4 6 L4 19 L20 19 L20 14"/><path d="M12 14c0-2.21-1.79-4-4-4"/></svg>;
const IcoArea = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const IcoEye = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoClock = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoVerified = () => <svg width="16" height="16" viewBox="0 0 24 24" fill={TEAL}><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z"/></svg>;

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spin = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <span style={{ width: size, height: size, border: `2.5px solid ${color}33`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'ppSpin 0.7s linear infinite', flexShrink: 0 }} />
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const ProfileAvatar: React.FC<{ src?: string | null; initials: string; size: number; accentColor: string; style?: React.CSSProperties }> = ({ src, initials, size, accentColor, style }) => (
  src ? (
    <img src={src} alt="profile" style={{ width: size, height: size, borderRadius: size * 0.22, objectFit: 'cover', display: 'block', ...style }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor === RED ? RED_DARK : '#ea580c'} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif", flexShrink: 0, ...style }}>
      {initials}
    </div>
  )
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast: React.FC<{ msg: string; severity: 'success' | 'error'; onClose: () => void }> = ({ msg, severity, onClose }) => (
  <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, backgroundColor: severity === 'success' ? '#1a3a2e' : '#3a1a1e', color: severity === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${severity === 'success' ? TEAL : RED}33`, borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'ppFadeUp 0.3s ease-out', whiteSpace: 'nowrap' }}>
    <span>{severity === 'success' ? '✓' : '⚠'}</span>
    {msg}
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', fontSize: 16, marginLeft: 6, opacity: 0.7, padding: 0 }}>×</button>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skel: React.FC<{ w?: string | number; h: number; r?: number; style?: React.CSSProperties }> = ({ w = '100%', h, r = 8, style }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: '#eef2f7', animation: 'ppShimmer 1.5s infinite', ...style }} />
);

// ─── Property Card ────────────────────────────────────────────────────────────
const PropertyCard: React.FC<{ property: Property; onNavigate: (id: number) => void }> = ({ property, onNavigate }) => {
  const [hov, setHov] = useState(false);
  const img = property.images?.find(i => i.is_main)?.image || property.images?.[0]?.image;
  return (
    <div
      style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid #eef2f7', transition: 'all 0.22s', animation: 'ppFadeUp 0.38s ease-out both', boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)', transform: hov ? 'translateY(-2px)' : 'none' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onNavigate(property.id)}
    >
      <div style={{ position: 'relative', paddingTop: '66.67%', overflow: 'hidden' }}>
        <img src={img || 'https://via.placeholder.com/400x300?text=No+Image'} alt={property.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 2 }}>
          {property.is_boosted && <span style={{ backgroundColor: GOLD, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, boxShadow: '0 2px 6px rgba(245,158,11,.4)' }}>⭐ Featured</span>}
          {property.is_verified && <span style={{ backgroundColor: TEAL, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>✓ Verified</span>}
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2 }}>
          <span style={{ backgroundColor: 'rgba(13,27,46,0.72)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
            {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'}
          </span>
        </div>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
          {fmtPrice(property.price)}
          {property.transaction_type === 'rent' && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, marginLeft: 3 }}>/mo</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{property.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
          <IcoPin /> {property.district}, {property.city}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' as const }}>
          {property.property_type !== 'land' && (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 500 }}><IcoBed />{property.bedrooms} Beds</div>
            <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#d1d5db' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 500 }}><IcoBath />{property.bathrooms} Baths</div>
            <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#d1d5db' }} />
          </>)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 500 }}><IcoArea />{property.square_meters} m²</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}><IcoEye /> {property.views_count} views</div>
          <span style={{ backgroundColor: RED_BG, color: RED, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' as const }}>{property.property_type}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Service Card ────────────────────────────────────────────────────────────
const ServiceCard: React.FC<{ service: Service; onNavigate: (id: number) => void }> = ({ service, onNavigate }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid #eef2f7', transition: 'all 0.22s', animation: 'ppFadeUp 0.38s ease-out both', boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)', transform: hov ? 'translateY(-2px)' : 'none' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onNavigate(service.id)}
    >
      <div style={{ position: 'relative', paddingTop: '66.67%', overflow: 'hidden' }}>
        <img src={service.image || 'https://via.placeholder.com/400x300?text=No+Image'} alt={service.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
        {service.is_featured && <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: GOLD, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, zIndex: 2 }}>⭐ Featured</span>}
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
          {fmtPrice(service.price)}
          {service.price_unit && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, marginLeft: 3 }}>/{service.price_unit}</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{service.name}</div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{service.description}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}><IcoClock /> {service.duration}</div>
          <StarRating value={service.rating} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>({service.reviews_count})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <span style={{ backgroundColor: ORANGE_BG, color: ORANGE, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{service.category_name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>Book Now →</span>
        </div>
      </div>
    </div>
  );
};

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: Review; accentColor: string }> = ({ review, accentColor }) => {
  const initials = ((review.user?.first_name?.[0] || '') + (review.user?.last_name?.[0] || '') || review.user?.username?.[0] || 'U').toUpperCase();
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #eef2f7', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'ppFadeUp 0.38s ease-out both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProfileAvatar src={review.user?.profile_picture} initials={initials} size={44} accentColor={accentColor} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: "'Sora', sans-serif" }}>
              {review.user?.first_name ? `${review.user.first_name} ${review.user.last_name || ''}` : review.user?.username}
            </div>
            <StarRating value={review.rating} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>{fmtDate(review.created_at)}</span>
      </div>
      {review.property && (
        <div style={{ fontSize: 11, color: TEAL, fontWeight: 600, backgroundColor: TEAL_BG, padding: '4px 10px', borderRadius: 20, display: 'inline-block', alignSelf: 'flex-start' }}>
          🏠 {review.property.title}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{review.comment}</p>
    </div>
  );
};

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabBtn: React.FC<{ label: string; icon: React.ReactNode; active: boolean; accentColor: string; onClick: () => void }> = ({ label, icon, active, accentColor, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500, fontFamily: "'DM Sans', sans-serif", color: active ? accentColor : '#64748b', borderBottom: `2.5px solid ${active ? accentColor : 'transparent'}`, transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
    {icon} {label}
  </button>
);

// ─── About Row ────────────────────────────────────────────────────────────────
const AboutRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: 13, color: NAVY, fontWeight: 600, textAlign: 'right' as const, maxWidth: '60%' }}>{value}</span>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #eef2f7', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', color: NAVY, backgroundColor: '#fafcff',
  boxSizing: 'border-box',
};

// ─── Edit Dialog with Cover Photo ────────────────────────────────────────────
const EditDialog: React.FC<{
  open: boolean; saving: boolean; accentColor: string;
  form: Record<string, string>; profile: UserProfile;
  avatarPreview: string | null;
  coverPreview: string | null;
  onChange: (key: string, val: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ open, saving, accentColor, form, profile, avatarPreview, coverPreview, onChange, onAvatarChange, onCoverChange, onSave, onClose }) => {
  if (!open) return null;
  const initials = ((form.first_name?.[0] || '') + (form.last_name?.[0] || '') || profile.username?.[0] || 'U').toUpperCase();
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(600px, 95vw)', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: 20, zIndex: 1001, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.2)', animation: 'ppFadeUp 0.25s ease-out' }}>
        <div style={{ padding: '18px 24px', background: `linear-gradient(135deg, ${NAVY} 0%, ${accentColor === RED ? '#1a2a3e' : '#2a1a0e'} 100%)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: '#fff' }}>Edit Profile</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><IcoClose /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Cover Photo Section */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Cover Photo</label>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 140, backgroundColor: '#f1f5f9' }}>
              {(coverPreview || profile.cover_photo) ? (
                <img src={coverPreview || profile.cover_photo || undefined} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}40 100%)` }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>No cover photo</span>
                </div>
              )}
              <label style={{ position: 'absolute', bottom: 12, right: 12, width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)' }}>
                <IcoCamera />
                <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/webp" onChange={onCoverChange} />
              </label>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 10, color: '#94a3b8' }}>Recommended size: 1200x400px (max 5MB)</p>
          </div>

          {/* Avatar Section */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <ProfileAvatar src={avatarPreview || profile.profile_picture} initials={initials} size={80} accentColor={accentColor} style={{ border: `2px solid ${accentColor}` }} />
                <label style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', backgroundColor: accentColor, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <IcoCamera />
                  <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/webp" onChange={onAvatarChange} />
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Square image recommended (500x500px). Max 5MB.</p>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 20 }} />

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[{ key: 'first_name', label: 'First Name' }, { key: 'last_name', label: 'Last Name' }].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => onChange(f.key, e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Bio</label>
            <textarea value={form.bio} onChange={e => onChange('bio', e.target.value)} rows={3} placeholder="Tell us about yourself…" style={{ ...inputStyle, resize: 'none', height: 'auto' }} />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Location</label>
            <input value={form.location} onChange={e => onChange('location', e.target.value)} placeholder="e.g. Kampala, Uganda" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            {[{ key: 'district', label: 'District' }, { key: 'city', label: 'City / Town' }].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => onChange(f.key, e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Phone Number</label>
            <input value={form.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+256…" style={inputStyle} />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Email Address</label>
            <input value={profile.email} disabled style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1.5px solid #eef2f7`, backgroundColor: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onSave} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', backgroundColor: accentColor, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 12px ${accentColor}44` }}>
            {saving ? <><Spin size={18} /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Empty State Helper ───────────────────────────────────────────────────────
const EmptyState: React.FC<{ icon: string; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
    <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
    <h3 style={{ margin: '0 0 8px', fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY }}>{title}</h3>
    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{sub}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  
  // File states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', bio: '', location: '', city: '', district: '', phone: '' });

  const isOwn = currentUser?.username === username || (!username && !!currentUser);
  const targetUser = username || currentUser?.username;
  const isAgent = !!profile?.is_agent;
  const isSP = !!profile?.is_service_provider;
  const accent = isAgent ? RED : isSP ? ORANGE : RED;

  const showToast = (msg: string, severity: 'success' | 'error' = 'success') => {
    setToast({ msg, severity });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProfile = useCallback(async () => {
    if (!targetUser) return;
    setLoading(true); setError(null);
    try {
      const r = isOwn ? await api.get('/users/me/') : await api.get(`/users/${targetUser}/`);
      setProfile(r.data);
      if (isOwn) {
        setEditForm({
          first_name: r.data.first_name || '',
          last_name: r.data.last_name || '',
          bio: r.data.bio || '',
          location: r.data.location || '',
          city: r.data.city || '',
          district: r.data.district || '',
          phone: r.data.phone || ''
        });
        setAvatarPreview(r.data.profile_picture || null);
        setCoverPreview(r.data.cover_photo || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
      if (err.response?.status === 404) navigate('/404');
    } finally { setLoading(false); }
  }, [targetUser, isOwn, navigate]);

  const fetchListings = useCallback(async () => {
    if (!profile?.id) return;
    setListingsLoading(true);
    try {
      if (isAgent) {
        const r = await api.get(`/properties/?owner=${profile.id}`);
        setProperties(r.data.results || r.data || []);
        setServices([]);
      } else if (isSP) {
        const r = await api.get(`/services/?provider_user=${profile.id}`);
        setServices(r.data.results || r.data || []);
        setProperties([]);
      }
    } catch { setProperties([]); setServices([]); }
    finally { setListingsLoading(false); }
  }, [profile?.id, isAgent, isSP]);

  const fetchReviews = useCallback(async () => {
    if (!profile?.id) return;
    setReviewsLoading(true);
    try {
      const r = await api.get(`/reviews/?agent=${profile.id}`);
      setReviews(r.data.results || r.data || []);
    } catch { setReviews([]); }
    finally { setReviewsLoading(false); }
  }, [profile?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (profile) { fetchListings(); fetchReviews(); } }, [profile, fetchListings, fetchReviews]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) { navigate('/login'); return; }
    try {
      if (profile.is_following) {
        await api.delete(`/users/${profile.username}/follow/`);
        setProfile(p => p ? { ...p, is_following: false, followers_count: Math.max(0, p.followers_count - 1) } : p);
        showToast(`Unfollowed ${profile.first_name}`);
      } else {
        await api.post(`/users/${profile.username}/follow/`);
        setProfile(p => p ? { ...p, is_following: true, followers_count: p.followers_count + 1 } : p);
        showToast(`Following ${profile.first_name}`);
      }
    } catch (err: any) { showToast(err.response?.data?.error || 'Action failed', 'error'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append('profile_picture', avatarFile);
      if (coverFile) fd.append('cover_photo', coverFile);
      const r = await api.patch('/users/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(r.data);
      setAvatarPreview(r.data.profile_picture || null);
      setCoverPreview(r.data.cover_photo || null);
      setAvatarFile(null);
      setCoverFile(null);
      setEditOpen(false);
      showToast('Profile updated successfully');
    } catch (err: any) { showToast(err.response?.data?.error || 'Failed to update', 'error'); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // Inject global keyframes
  if (typeof document !== 'undefined' && !document.getElementById('profile-page-styles')) {
    const el = document.createElement('style');
    el.id = 'profile-page-styles';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes ppSpin { to { transform: rotate(360deg); } }
      @keyframes ppFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      @keyframes ppShimmer { 0%,100%{opacity:1} 50%{opacity:.5} }
      .pp-card-entry { animation: ppFadeUp 0.38s ease-out both; }
    `;
    document.head.appendChild(el);
  }

  // Loading State
  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
          <Skel h={180} r={0} />
          <div style={{ padding: '0 28px 28px' }}>
            <Skel w={120} h={120} r={24} style={{ marginTop: -40, marginBottom: 16, border: '4px solid #fff' }} />
            <Skel w="55%" h={28} style={{ marginBottom: 10 }} />
            <Skel w="35%" h={18} style={{ marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 24 }}>{[1, 2, 3].map(i => <Skel key={i} w={60} h={44} />)}</div>
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <Skel key={i} h={200} r={14} />)}
          </div>
        </div>
      </div>
    </div>
  );

  // Error State
  if (error || !profile) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 16, padding: '40px 48px', textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{error || 'User not found'}</div>
        <button onClick={() => navigate('/')} style={{ marginTop: 12, padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Go Home</button>
      </div>
    </div>
  );

  const initials = ((profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || profile.username?.[0] || 'U').toUpperCase();

  // Tabs config
  type TabCfg = { label: string; icon: React.ReactNode };
  const tabs: TabCfg[] = [];
  if (isAgent) tabs.push({ label: 'Properties', icon: <span>🏠</span> });
  if (isSP) tabs.push({ label: 'Services', icon: <span>🔧</span> });
  tabs.push({ label: 'Reviews', icon: <span>⭐</span> });
  tabs.push({ label: 'About', icon: <span>ℹ️</span> });

  const listingsTab = (isAgent || isSP) ? 0 : -1;
  const reviewsTab = (isAgent || isSP) ? 1 : 0;
  const aboutTab = (isAgent || isSP) ? 2 : 1;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>

      {/* Profile Header Card */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px 0' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', animation: 'ppFadeUp 0.4s ease-out' }}>

          {/* Cover */}
          <div style={{ height: 190, position: 'relative', background: profile.cover_photo ? `url(${profile.cover_photo}) center/cover no-repeat` : `linear-gradient(135deg, ${NAVY} 0%, ${isAgent ? '#1e3a5c' : isSP ? '#2a1f0a' : '#1e3a5c'} 60%, ${accent}55 100%)`, overflow: 'hidden' }}>
            {!profile.cover_photo && (
              <>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `${accent}18`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 160, height: 160, borderRadius: '50%', background: `${TEAL}12`, pointerEvents: 'none' }} />
              </>
            )}
            <div style={{ position: 'absolute', top: 14, right: 16 }}>
              {profile.is_verified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(37,168,130,0.2)', border: '1px solid rgba(37,168,130,0.35)', borderRadius: 30, padding: '5px 12px' }}>
                  <IcoVerified />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#86efac', letterSpacing: '0.05em' }}>VERIFIED</span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '0 28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: -48, marginBottom: 20 }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <ProfileAvatar
                  src={profile.profile_picture}
                  initials={initials}
                  size={96}
                  accentColor={accent}
                  style={{ border: '4px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                />
                <span style={{ position: 'absolute', bottom: 6, right: 6, width: 13, height: 13, borderRadius: '50%', backgroundColor: TEAL, border: '2.5px solid #fff', boxShadow: `0 0 6px ${TEAL}` }} />
              </div>

              {/* Action button */}
              <div style={{ paddingBottom: 4 }}>
                {isOwn ? (
                  <button onClick={() => setEditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${accent}`, backgroundColor: RED_BG, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <IcoEdit /> Edit Profile
                  </button>
                ) : (
                  <button onClick={handleFollowToggle} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: profile.is_following ? `1.5px solid ${accent}` : 'none', backgroundColor: profile.is_following ? RED_BG : accent, color: profile.is_following ? accent : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: profile.is_following ? 'none' : `0 3px 10px ${accent}44` }}>
                    {profile.is_following ? <><IcoUnfollow /> Unfollow</> : <><IcoFollow /> Follow</>}
                  </button>
                )}
              </div>
            </div>

            {/* Name & badges */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontWeight: 800, color: NAVY, letterSpacing: '-0.02em' }}>
                  {profile.full_name}
                </h1>
                {isAgent && <span style={{ backgroundColor: RED_BG, color: RED, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>🏠 Real Estate Agent</span>}
                {isSP && <span style={{ backgroundColor: ORANGE_BG, color: ORANGE, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>🔧 Service Provider</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', flexWrap: 'wrap' }}>
                <span>@{profile.username}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#d1d5db' }} />
                <span>Member since {fmtDate(profile.created_at)}</span>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#475569', lineHeight: 1.7, maxWidth: 600 }}>{profile.bio}</p>
            )}

            {/* Contact info (own profile only) */}
            {isOwn && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                {profile.location && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}><span style={{ color: RED }}><IcoPin /></span>{profile.location}</div>}
                {profile.city && profile.district && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}><span style={{ color: RED }}><IcoPin /></span>{profile.district}, {profile.city}</div>}
                {profile.email && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}><span style={{ color: '#94a3b8' }}><IcoEmail /></span>{profile.email}</div>}
                {profile.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}><span style={{ color: '#94a3b8' }}><IcoPhone /></span>{profile.phone}</div>}
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 0, backgroundColor: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden', alignSelf: 'flex-start', width: 'fit-content' }}>
              {[
                { num: profile.followers_count, label: 'Followers', onClick: () => navigate(`/profile/${profile.username}/followers`) },
                { num: profile.following_count, label: 'Following', onClick: () => navigate(`/profile/${profile.username}/following`) },
                ...(isAgent ? [{ num: properties.length, label: 'Properties', onClick: undefined }] : []),
                ...(isSP ? [{ num: services.length, label: 'Services', onClick: undefined }] : []),
                { num: reviews.length, label: 'Reviews', onClick: undefined },
              ].map((stat, i, arr) => (
                <div key={stat.label}
                  onClick={stat.onClick}
                  style={{ padding: '12px 22px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: stat.onClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
                  onMouseEnter={e => stat.onClick && ((e.currentTarget as HTMLDivElement).style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={e => stat.onClick && ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{stat.num}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 40, animation: 'ppFadeUp 0.5s ease-out' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', overflowX: 'auto', padding: '0 8px' }}>
            {tabs.map((t, i) => (
              <TabBtn key={t.label} label={t.label} icon={t.icon} active={tab === i} accentColor={accent} onClick={() => setTab(i)} />
            ))}
          </div>

          <div style={{ padding: '24px' }}>
            {/* Properties Tab */}
            {tab === listingsTab && isAgent && (
              listingsLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {[1, 2, 3, 4].map(i => <Skel key={i} h={280} r={14} />)}
                </div>
              ) : properties.length === 0 ? (
                <EmptyState icon="🏚️" title="No properties yet" sub={isOwn ? "You haven't listed any properties yet" : `${profile.first_name || profile.username} hasn't listed any properties yet`} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {properties.map((p, i) => (
                    <div key={p.id} className="pp-card-entry" style={{ animationDelay: `${i * 0.04}s` }}>
                      <PropertyCard property={p} onNavigate={id => navigate(`/property/${id}`)} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Services Tab */}
            {tab === listingsTab && isSP && (
              listingsLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {[1, 2, 3, 4].map(i => <Skel key={i} h={280} r={14} />)}
                </div>
              ) : services.length === 0 ? (
                <EmptyState icon="🔧" title="No services yet" sub={isOwn ? "You haven't listed any services yet" : `${profile.first_name || profile.username} hasn't listed any services yet`} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {services.map((svc, i) => (
                    <div key={svc.id} className="pp-card-entry" style={{ animationDelay: `${i * 0.04}s` }}>
                      <ServiceCard service={svc} onNavigate={id => navigate(`/services/${id}`)} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Reviews Tab */}
            {tab === reviewsTab && (
              reviewsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3].map(i => <Skel key={i} h={120} r={14} />)}
                </div>
              ) : reviews.length === 0 ? (
                <EmptyState icon="⭐" title="No reviews yet" sub={isOwn ? "You haven't received any reviews yet" : `${profile.first_name || profile.username} doesn't have any reviews yet`} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map((r, i) => (
                    <div key={r.id} className="pp-card-entry" style={{ animationDelay: `${i * 0.05}s` }}>
                      <ReviewCard review={r} accentColor={accent} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* About Tab */}
            {tab === aboutTab && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Personal Information</div>
                  <AboutRow label="Full Name" value={profile.full_name} />
                  <AboutRow label="Username" value={<span style={{ color: '#64748b' }}>@{profile.username}</span>} />
                  {isOwn && <>
                    <AboutRow label="Email" value={profile.email} />
                    <AboutRow label="Phone" value={profile.phone || <span style={{ color: '#d1d5db' }}>Not provided</span>} />
                  </>}
                  <AboutRow label="Member Since" value={fmtDate(profile.created_at)} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Location & Verification</div>
                  <AboutRow label="Location" value={profile.location || <span style={{ color: '#d1d5db' }}>Not provided</span>} />
                  <AboutRow label="District" value={profile.district || <span style={{ color: '#d1d5db' }}>Not provided</span>} />
                  <AboutRow label="City" value={profile.city || <span style={{ color: '#d1d5db' }}>Not provided</span>} />
                  <AboutRow label="Verified" value={
                    <span style={{ backgroundColor: profile.is_verified ? TEAL_BG : '#f1f5f9', color: profile.is_verified ? TEAL : '#94a3b8', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      {profile.is_verified ? '✓ Verified' : 'Unverified'}
                    </span>
                  } />
                  <AboutRow label="Role" value={
                    <span style={{ backgroundColor: isAgent ? RED_BG : isSP ? ORANGE_BG : '#f1f5f9', color: isAgent ? RED : isSP ? ORANGE : '#64748b', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      {isAgent ? '🏠 Agent' : isSP ? '🔧 Service Provider' : '👤 User'}
                    </span>
                  } />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditDialog
        open={editOpen}
        saving={saving}
        accentColor={accent}
        form={editForm}
        profile={profile}
        avatarPreview={avatarPreview}
        coverPreview={coverPreview}
        onChange={(k, v) => setEditForm(f => ({ ...f, [k]: v }))}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
        onSave={handleSave}
        onClose={() => {
          setEditOpen(false);
          setAvatarFile(null);
          setCoverFile(null);
          setAvatarPreview(profile.profile_picture);
          setCoverPreview(profile.cover_photo);
        }}
      />

      {/* Toast */}
      {toast && <Toast msg={toast.msg} severity={toast.severity} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ProfilePage;