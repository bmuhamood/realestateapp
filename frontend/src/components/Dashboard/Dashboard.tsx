// src/components/Dashboard/Dashboard.tsx - WITH CLOUDINARY IMAGE SUPPORT

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Property, Booking, PropertyImage } from '../../types';
import BoostModal from '../Boost/BoostModal';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const SLATE = '#475569';
const AMBER = '#f59e0b';
const AMBER_BG = 'rgba(245,158,11,0.08)';
const GREEN = '#16a34a';
const GREEN_BG = 'rgba(22,163,74,0.08)';
const ORANGE = '#f97316';
const ORANGE_BG = 'rgba(249,115,22,0.08)';

// ─── Cloudinary Configuration ────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'drcy2xxkg';

const getCloudinaryUrl = (image: string | null | undefined): string => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) {
    // If it's a Cloudinary URL, add auto format optimization
    if (image.includes('cloudinary.com') && !image.includes('f_auto')) {
      const parts = image.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
      }
    }
    return image;
  }
  // Remove any existing 'image/upload/' to prevent duplication
  let cleanUrl = image;
  if (cleanUrl.includes('image/upload/')) {
    cleanUrl = cleanUrl.replace('image/upload/', '');
  }
  cleanUrl = cleanUrl.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${cleanUrl}`;
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadImage { file: File; preview: string; is_main: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};
const fmtTime = (d: string) => {
  try { return new Date(d).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return ''; }
};
const getInitials = (user: any) =>
  ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() ||
  user?.username?.[0]?.toUpperCase() || '?';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e', dot: AMBER },
  confirmed: { bg: '#dcfce7', color: '#166534', dot: GREEN },
  completed: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  in_progress: { bg: '#fed7aa', color: '#9b2c1d', dot: ORANGE },
  available: { bg: TEAL_BG, color: '#166534', dot: TEAL },
  unavailable: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_STYLES[status] || { bg: '#f1f5f9', color: SLATE, dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string; bg: string; sub?: string; delay?: string }> =
  ({ icon, label, value, color, bg, sub, delay = '0s' }) => {
    const [hov, setHov] = useState(false);
    return (
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          backgroundColor: '#fff', borderRadius: 18, padding: '20px 20px',
          border: `1.5px solid ${hov ? color : '#eef2f7'}`,
          boxShadow: hov ? `0 10px 28px rgba(0,0,0,0.09)` : '0 1px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.22s', animation: `dbFadeUp 0.4s ease-out ${delay} both`,
          transform: hov ? 'translateY(-4px)' : 'none',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', backgroundColor: `${color}12`, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Sora', sans-serif", lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

// ─── Nav Tab ──────────────────────────────────────────────────────────────────
const NavTab: React.FC<{ icon: string; label: string; count?: number; active: boolean; onClick: () => void }> = ({ icon, label, count, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    transition: 'all 0.15s',
    backgroundColor: active ? RED_BG : 'transparent',
    color: active ? RED : SLATE,
    fontWeight: active ? 700 : 500, fontSize: 13,
  }}>
    <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {count != null && count > 0 && (
      <span style={{ backgroundColor: active ? RED : '#eef2f7', color: active ? '#fff' : '#64748b', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
        {count}
      </span>
    )}
  </button>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn: React.FC<{ color: string; bg: string; label: string; title: string; onClick: () => void; disabled?: boolean }> =
  ({ color, bg, label, title, onClick, disabled }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick} title={title} disabled={disabled}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          padding: '6px 10px', borderRadius: 8,
          border: `1.5px solid ${color}33`,
          backgroundColor: hov ? color : bg,
          fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s', opacity: disabled ? 0.45 : 1,
          lineHeight: 1,
        }}
      >
        {label}
      </button>
    );
  };

// ─── Property Row (table row with thumbnail) ──────────────────────────────────
const PropertyRow: React.FC<{
  property: Property;
  bookingCount: number;
  hasActiveBookings: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBoost: () => void;
}> = ({ property, bookingCount, hasActiveBookings, onView, onEdit, onDelete, onBoost }) => {
  const [hov, setHov] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const getImageUrl = () => {
    if (imgError) return '';
    const img = property.images?.find(i => i.is_main)?.image_url || property.images?.find(i => i.is_main)?.image || property.images?.[0]?.image_url || property.images?.[0]?.image;
    if (!img) return '';
    return getCloudinaryUrl(img);
  };
  
  const imageUrl = getImageUrl();
  const hasVideo = !!(property.has_video || property.video_url || property.video_file);

  return (
    <tr
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hov ? '#fafcff' : '#fff', transition: 'background-color 0.12s' }}
    >
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#f1f5f9' }}>
            {imageUrl
              ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏠</div>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div onClick={onView} style={{ fontWeight: 700, color: NAVY, fontSize: 13, cursor: 'pointer', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{property.title}</span>
              {hasVideo && <span title="Video tour" style={{ fontSize: 11 }}>🎬</span>}
              {property.is_boosted && <span title="Boosted" style={{ fontSize: 11 }}>⚡</span>}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{property.district}, {property.city}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: RED, fontFamily: "'Sora', sans-serif" }}>{fmtPrice(property.price)}</span>
        {property.transaction_type === 'rent' && <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>/month</span>}
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <span style={{ fontSize: 11, backgroundColor: '#f4f7fb', color: SLATE, padding: '4px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
          {property.property_type}
        </span>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <StatusBadge status={property.is_available ? 'available' : 'unavailable'} />
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: bookingCount > 0 ? AMBER : '#94a3b8' }}>{bookingCount}</span>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: SLATE }}>{(property.views_count || 0).toLocaleString()}</span>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ActionBtn color={RED} bg={RED_BG} label="✏️" title="Edit" onClick={onEdit} />
          <ActionBtn color="#b91c1c" bg="#fee2e2" label="🗑️" title={hasActiveBookings ? 'Active bookings exist' : 'Delete'} onClick={onDelete} disabled={hasActiveBookings} />
          <ActionBtn color="#92400e" bg="#fef3c7" label="⚡" title="Boost" onClick={onBoost} />
        </div>
      </td>
    </tr>
  );
};

// ─── Booking Row (unchanged) ──────────────────────────────────────────────────
const BookingRow: React.FC<{
  booking: Booking;
  updating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
}> = ({ booking, updating, onConfirm, onCancel, onComplete }) => {
  const [hov, setHov] = useState(false);
  const property = typeof booking.property === 'object' ? booking.property : booking.property_detail;
  
  return (
    <tr
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hov ? '#fafcff' : '#fff', transition: 'background 0.12s' }}
    >
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 2 }}>{property?.title || 'Property'}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{property?.address || ''}</div>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: RED_BG, border: `1.5px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: RED, flexShrink: 0 }}>
            {(booking.user_detail?.first_name?.[0] || booking.user_detail?.username?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{booking.user_detail?.first_name || booking.user_detail?.username}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{booking.user_detail?.phone || 'No phone'}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(booking.visit_date)}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtTime(booking.visit_date)}</div>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <StatusBadge status={booking.status} />
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        {updating ? (
          <div style={{ width: 20, height: 20, border: '2px solid #eef2f7', borderTop: `2px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite' }} />
        ) : booking.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onConfirm} style={{ padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: GREEN, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✓ Confirm</button>
            <button onClick={onCancel} style={{ padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✗ Cancel</button>
          </div>
        ) : booking.status === 'confirmed' ? (
          <button onClick={onComplete} style={{ padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✓ Complete</button>
        ) : null}
      </td>
    </tr>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ icon: string; title: string; desc: string; btnLabel: string; onClick: () => void }> = ({ icon, title, desc, btnLabel, onClick }) => (
  <div style={{ textAlign: 'center', padding: '64px 24px' }}>
    <div style={{ fontSize: 56, marginBottom: 14 }}>{icon}</div>
    <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800 }}>{title}</h3>
    <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
    <button onClick={onClick} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(230,57,70,0.28)' }}>
      {btnLabel}
    </button>
  </div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{ title: string; desc: string; onConfirm: () => void; onClose: () => void; loading?: boolean }> = ({ title, desc, onConfirm, onClose, loading }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(5px)', zIndex: 1000 }} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: '30px 28px', zIndex: 1001, boxShadow: '0 28px 64px rgba(0,0,0,0.2)', animation: 'dbModalIn 0.22s ease-out' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>🗑️</div>
      <h3 style={{ margin: '0 0 10px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 19, fontWeight: 800 }}>{title}</h3>
      <p style={{ margin: '0 0 26px', color: SLATE, fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite' }} />Deleting…</> : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </>
);

// ─── Property Detail Modal with Cloudinary images ─────────────────────────────
const PropertyDetailModal: React.FC<{ property: Property | null; onClose: () => void }> = ({ property, onClose }) => {
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  
  if (!property) return null;
  
  const getModalImageUrl = (image: any) => {
    if (!image) return '';
    const url = image.image_url || image.image;
    return getCloudinaryUrl(url);
  };
  
  const mainImage = property.images?.find(i => i.is_main) || property.images?.[0];
  const otherImages = property.images?.filter(i => i.id !== mainImage?.id) || [];
  const amenities = property.amenities_list || property.amenities || [];
  const schools = property.nearby_schools_list || [];
  
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(5px)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 880, maxHeight: '88vh', backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', zIndex: 1001, boxShadow: '0 28px 64px rgba(0,0,0,0.22)', animation: 'dbModalIn 0.22s ease-out', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 19, fontWeight: 800 }}>Property Details</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#f4f7fb', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
          {mainImage && (
            <img 
              src={getModalImageUrl(mainImage)} 
              alt={property.title} 
              style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 16, marginBottom: 20 }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/880x280?text=No+Image'; }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" }}>{property.title}</h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>{property.address}, {property.district}, {property.city}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>{fmtPrice(property.price)}</div>
              {property.transaction_type === 'rent' && <div style={{ fontSize: 12, color: '#94a3b8' }}>/month</div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, backgroundColor: '#f8faff', padding: 16, borderRadius: 14, marginBottom: 20 }}>
            {[
              { label: 'Type', val: property.property_type },
              { label: 'Transaction', val: property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet' },
              { label: 'Bedrooms', val: property.bedrooms ?? 0 },
              { label: 'Bathrooms', val: property.bathrooms ?? 0 },
              { label: 'Area', val: `${property.square_meters ?? 0} m²` },
              ...(property.parking_spaces ? [{ label: 'Parking', val: `${property.parking_spaces} spaces` }] : []),
              ...(property.furnishing_status && property.furnishing_status !== 'unfurnished' ? [{ label: 'Furnishing', val: property.furnishing_status.replace(/_/g, ' ') }] : []),
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, textTransform: 'capitalize' }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>📝 Description</h4>
            <p style={{ margin: 0, color: SLATE, fontSize: 14, lineHeight: 1.7 }}>{property.description}</p>
          </div>
          {amenities.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>✨ Amenities</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {amenities.map((a, i) => <span key={i} style={{ padding: '4px 12px', backgroundColor: RED_BG, color: RED, borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{a}</span>)}
              </div>
            </div>
          )}
          {schools.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>🎓 Nearby Schools</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {schools.map((s, i) => <span key={i} style={{ padding: '4px 12px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s}</span>)}
              </div>
            </div>
          )}
          {(property.has_security || property.has_cctv || property.has_gated_community) && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>🔒 Security</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {property.has_security && <span style={{ padding: '4px 12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🔒 Security Guard</span>}
                {property.has_cctv && <span style={{ padding: '4px 12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>📹 CCTV</span>}
                {property.has_gated_community && <span style={{ padding: '4px 12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🏘️ Gated Community</span>}
              </div>
            </div>
          )}
          {otherImages.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>📷 More Photos</h4>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {otherImages.map(img => (
                  <img 
                    key={img.id} 
                    src={getModalImageUrl(img)} 
                    alt="" 
                    style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/110x80?text=No+Image'; }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const TabHead: React.FC<{ title: string; count: number; action?: React.ReactNode }> = ({ title, count, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', backgroundColor: '#f4f7fb', padding: '3px 10px', borderRadius: 20 }}>{count} total</span>
    </div>
    {action}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [propToDelete, setPropToDelete] = useState<Property | null>(null);
  const [boostProp, setBoostProp] = useState<Property | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pr, br] = await Promise.all([api.get('/properties/my/'), api.get('/bookings/agent/')]);
      const propertiesData = pr.data.results || pr.data;
      // Process image URLs for Cloudinary
      const processedProperties = propertiesData.map((p: Property) => ({
        ...p,
        images: p.images?.map((img: any) => ({
          ...img,
          image_url: getCloudinaryUrl(img.image || img.image_url)
        }))
      }));
      setProperties(processedProperties);
      setBookings(br.data.results || br.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // UUID-based helper functions (IDs are strings)
  const getPropBookings = (id: string) => bookings.filter(b => {
    const prop = b.property_detail;
    return prop?.id === id;
  });

  const hasActiveBookings = (id: string) => getPropBookings(id).some(b => b.status === 'pending' || b.status === 'confirmed');
  
  const openEdit = (property: Property) => {
    navigate(`/dashboard/properties/edit/${property.id}`);
  };

  const handleDelete = async () => {
    if (!propToDelete) return;
    setSubmitLoading(true);
    try {
      await api.delete(`/properties/${propToDelete.id}/`);
      showToast('Property deleted successfully.');
      setDeleteOpen(false); setPropToDelete(null); fetchData();
    } catch (e: any) { showToast(e.response?.data?.error || 'Failed to delete property.', false); }
    finally { setSubmitLoading(false); }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    setUpdatingBookingId(id);
    try {
      await api.post(`/bookings/${id}/agent-status/`, { status });
      await fetchData();
      showToast(`Booking ${status} successfully!`);
    } catch (e: any) { showToast(e.response?.data?.error || 'Failed to update booking', false); }
    finally { setUpdatingBookingId(null); }
  };

  const stats = {
    totalProperties: properties.length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalViews: properties.reduce((s, p) => s + (p.views_count || 0), 0),
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, backgroundColor: toast.ok ? '#1a3a2e' : '#3a1a1e', color: toast.ok ? '#4ade80' : '#f87171', border: `1px solid ${toast.ok ? TEAL : RED}33`, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.22)', animation: 'dbFadeDown 0.3s ease-out', whiteSpace: 'nowrap' }}>
          <span>{toast.ok ? '✓' : '⚠'}</span>
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', marginLeft: 4, opacity: 0.7, fontSize: 15, padding: 0 }}>×</button>
        </div>
      )}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* Header section remains the same */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a5c 60%, ${RED}22 100%)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, animation: 'dbFadeUp 0.4s ease-out both', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${RED}18`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: '40%', width: 140, height: 140, borderRadius: '50%', background: `${TEAL}12`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: RED_BG, border: `2.5px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
              {getInitials(user)}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(176,196,222,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Agent Dashboard</div>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: '#f0f6ff', margin: 0, letterSpacing: '-0.02em' }}>
                Welcome back, {user?.first_name || user?.username}!
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, zIndex: 1 }}>
            <button onClick={() => navigate('/properties')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#f0f6ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔍 Browse</button>
            <button onClick={() => navigate('/dashboard/properties/add')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(230,57,70,0.35)' }}>+ Add Property</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="🏠" label="Total Properties" value={stats.totalProperties} color={RED} bg={RED_BG} sub={`${properties.filter(p => p.is_available).length} available`} delay="0s" />
          <StatCard icon="📅" label="Total Bookings" value={stats.totalBookings} color={AMBER} bg={AMBER_BG} sub="all time" delay="0.07s" />
          <StatCard icon="⏳" label="Pending" value={stats.pendingBookings} color={ORANGE} bg={ORANGE_BG} sub="need action" delay="0.14s" />
          <StatCard icon="👁️" label="Total Views" value={stats.totalViews.toLocaleString()} color={GREEN} bg={GREEN_BG} sub="across all listings" delay="0.21s" />
        </div>

        {/* Main Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Sidebar Navigation */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 12px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 88, animation: 'dbFadeUp 0.4s ease-out 0.1s both' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>Menu</div>
            <NavTab icon="🏠" label="My Properties" count={properties.length} active={activeTab === 0} onClick={() => setActiveTab(0)} />
            <NavTab icon="📅" label="Bookings" count={bookings.length} active={activeTab === 1} onClick={() => setActiveTab(1)} />
            <div style={{ height: 1, background: '#f1f5f9', margin: '14px 0' }} />
            {[
              { label: 'Available', val: properties.filter(p => p.is_available).length, color: TEAL },
              { label: 'Boosted', val: properties.filter(p => p.is_boosted).length, color: AMBER },
              { label: 'Pending', val: stats.pendingBookings, color: ORANGE },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div style={{ minWidth: 0 }}>
            {activeTab === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', animation: 'dbFadeUp 0.35s ease-out both' }}>
                <TabHead
                  title="My Properties"
                  count={properties.length}
                  action={<button onClick={() => navigate('/dashboard/properties/add')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add New</button>}
                />
                {properties.length === 0 ? (
                  <EmptyState icon="🏚️" title="No properties yet" desc="Add your first property to start receiving bookings from clients." btnLabel="Add Property" onClick={() => navigate('/dashboard/properties/add')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8faff' }}>
                          {['Property', 'Price', 'Type', 'Status', 'Bookings', 'Views', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #eef2f7' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map(p => (
                          <PropertyRow
                            key={p.id}
                            property={p}
                            bookingCount={getPropBookings(p.id).length}
                            hasActiveBookings={hasActiveBookings(p.id)}
                            onView={() => { setSelectedProp(p); setDetailOpen(true); }}
                            onEdit={() => openEdit(p)}
                            onDelete={() => {
                              setPropToDelete(p);
                              const active = getPropBookings(p.id).filter(b => b.status === 'pending' || b.status === 'confirmed');
                              setDeleteError(active.length > 0 ? `Cannot delete — ${active.length} active booking(s) exist.` : null);
                              setDeleteOpen(true);
                            }}
                            onBoost={() => { setBoostProp(p); setBoostOpen(true); }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 1 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', animation: 'dbFadeUp 0.35s ease-out both' }}>
                <TabHead title="Property Bookings" count={bookings.length} />
                {bookings.length === 0 ? (
                  <EmptyState icon="📅" title="No bookings yet" desc="When clients book your properties, they'll appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8faff' }}>
                          {['Property', 'Client', 'Visit Date', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #eef2f7' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <BookingRow
                            key={b.id}
                            booking={b}
                            updating={updatingBookingId === b.id}
                            onConfirm={() => updateBookingStatus(b.id, 'confirmed')}
                            onCancel={() => updateBookingStatus(b.id, 'cancelled')}
                            onComplete={() => updateBookingStatus(b.id, 'completed')}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteOpen && propToDelete && (
        <ConfirmModal
          title="Delete Property?"
          desc={deleteError || `Are you sure you want to delete "${propToDelete.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
          loading={submitLoading}
        />
      )}

      <PropertyDetailModal property={detailOpen ? selectedProp : null} onClose={() => { setDetailOpen(false); setSelectedProp(null); }} />

      <BoostModal
        open={boostOpen}
        onClose={() => { setBoostOpen(false); setBoostProp(null); }}
        propertyId={boostProp?.id || ''}
        propertyTitle={boostProp?.title || ''}
        onBoostSuccess={() => { fetchData(); showToast('Property boosted successfully!'); }}
      />
    </div>
  );
};

// ─── Global keyframes ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('db-styles-v2')) {
  const el = document.createElement('style');
  el.id = 'db-styles-v2';
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes dbSpin    { to { transform: rotate(360deg); } }
    @keyframes dbFadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes dbFadeDown{ from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes dbModalIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
    ::-webkit-scrollbar       { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    input:focus, textarea:focus, select:focus { border-color: ${RED} !important; outline: none; }
  `;
  document.head.appendChild(el);
}

export default Dashboard;