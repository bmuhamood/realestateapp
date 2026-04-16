/**
 * Dashboard.tsx — Agent Dashboard · PropertyHub.ug design system
 * Colors: RED #e63946 · NAVY #0d1b2e · TEAL #25a882
 * Fonts:  Sora (headings) · DM Sans (body)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Property, Booking, PropertyImage } from '../../types';
import BoostModal from '../Boost/BoostModal';
import PropertyForm from '../Forms/PropertyForm';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const RED      = '#e63946';
const RED_BG   = 'rgba(230,57,70,0.07)';
const RED_DARK = '#c1121f';
const NAVY     = '#0d1b2e';
const TEAL     = '#25a882';
const TEAL_BG  = 'rgba(37,168,130,0.08)';
const SLATE    = '#475569';
const AMBER    = '#f59e0b';
const AMBER_BG = 'rgba(245,158,11,0.08)';
const GREEN    = '#16a34a';
const GREEN_BG = 'rgba(22,163,74,0.08)';
const ORANGE   = '#f97316';
const ORANGE_BG = 'rgba(249,115,22,0.08)';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadImage { file: File; preview: string; is_main: boolean; }

interface PropertyFormData {
  title: string; description: string; property_type: string; transaction_type: string;
  price: string; bedrooms: string; bathrooms: string; square_meters: string;
  address: string; city: string; district: string; latitude: string; longitude: string;
  video_url: string; virtual_tour_url: string;
  neighborhood_name: string; neighborhood_description: string; distance_to_city_center: string;
  distance_to_airport: string; distance_to_highway: string;
  nearby_schools: string; distance_to_nearest_school: string; school_rating: string;
  nearby_roads: string; nearest_road: string; public_transport: boolean;
  nearest_bus_stop: string; nearest_taxi_stage: string;
  amenities: string[]; nearest_mall: string; distance_to_mall: string;
  nearest_supermarket: string; nearest_market: string; nearest_pharmacy: string;
  nearest_hospital: string; distance_to_hospital: string;
  nearest_restaurant: string; nearest_cafe: string; nearest_gym: string; nearest_park: string;
  year_built: string; furnishing_status: string; parking_type: string; parking_spaces: string;
  has_security: boolean; has_cctv: boolean; has_electric_fence: boolean;
  has_security_lights: boolean; has_security_guards: boolean; has_gated_community: boolean;
  has_solar: boolean; has_backup_generator: boolean; has_water_tank: boolean;
  has_borehole: boolean; has_internet: boolean; has_cable_tv: boolean;
  has_garden: boolean; has_balcony: boolean; has_terrace: boolean;
  has_swimming_pool: boolean; has_playground: boolean; has_bbq_area: boolean;
  has_air_conditioning: boolean; has_heating: boolean; has_fireplace: boolean;
  has_modern_kitchen: boolean; has_walk_in_closet: boolean; has_study_room: boolean;
  pets_allowed: boolean; smoking_allowed: boolean;
  has_title_deed: boolean; title_deed_number: string; land_registration_number: string;
  agent_phone: string; agent_email: string; viewing_instructions: string;
}

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

const EMPTY_FORM = (user: any): PropertyFormData => ({
  title: '', description: '', property_type: 'house', transaction_type: 'sale',
  price: '', bedrooms: '', bathrooms: '', square_meters: '',
  address: '', city: '', district: '', latitude: '', longitude: '',
  video_url: '', virtual_tour_url: '',
  neighborhood_name: '', neighborhood_description: '', distance_to_city_center: '',
  distance_to_airport: '', distance_to_highway: '',
  nearby_schools: '', distance_to_nearest_school: '', school_rating: '',
  nearby_roads: '', nearest_road: '', public_transport: false,
  nearest_bus_stop: '', nearest_taxi_stage: '',
  amenities: [], nearest_mall: '', distance_to_mall: '',
  nearest_supermarket: '', nearest_market: '', nearest_pharmacy: '',
  nearest_hospital: '', distance_to_hospital: '',
  nearest_restaurant: '', nearest_cafe: '', nearest_gym: '', nearest_park: '',
  year_built: '', furnishing_status: 'unfurnished', parking_type: 'none', parking_spaces: '',
  has_security: false, has_cctv: false, has_electric_fence: false,
  has_security_lights: false, has_security_guards: false, has_gated_community: false,
  has_solar: false, has_backup_generator: false, has_water_tank: false,
  has_borehole: false, has_internet: false, has_cable_tv: false,
  has_garden: false, has_balcony: false, has_terrace: false,
  has_swimming_pool: false, has_playground: false, has_bbq_area: false,
  has_air_conditioning: false, has_heating: false, has_fireplace: false,
  has_modern_kitchen: false, has_walk_in_closet: false, has_study_room: false,
  pets_allowed: true, smoking_allowed: true,
  has_title_deed: false, title_deed_number: '', land_registration_number: '',
  agent_phone: user?.phone || '', agent_email: user?.email || '', viewing_instructions: '',
});

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  pending:     { bg: '#fef3c7', color: '#92400e', dot: AMBER },
  confirmed:   { bg: '#dcfce7', color: '#166534', dot: GREEN },
  completed:   { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  cancelled:   { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  in_progress: { bg: '#fed7aa', color: '#9b2c1d', dot: ORANGE },
  available:   { bg: TEAL_BG,   color: '#166534', dot: TEAL },
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
      {/* Decorative arc */}
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
  const img = property.images?.find(i => i.is_main)?.image || property.images?.[0]?.image;
  const hasVideo = !!(property.has_video || property.video_url || property.video_file);

  return (
    <tr
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hov ? '#fafcff' : '#fff', transition: 'background-color 0.12s' }}
    >
      {/* Title + image */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#f1f5f9' }}>
            {img
              ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* Price */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: RED, fontFamily: "'Sora', sans-serif" }}>{fmtPrice(property.price)}</span>
        {property.transaction_type === 'rent' && <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>/month</span>}
      </td>

      {/* Type */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <span style={{ fontSize: 11, backgroundColor: '#f4f7fb', color: SLATE, padding: '4px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
          {property.property_type}
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <StatusBadge status={property.is_available ? 'available' : 'unavailable'} />
      </td>

      {/* Bookings */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: bookingCount > 0 ? AMBER : '#94a3b8' }}>{bookingCount}</span>
      </td>

      {/* Views */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: SLATE }}>{(property.views_count || 0).toLocaleString()}</span>
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ActionBtn color={RED}    bg={RED_BG}    label="✏️" title="Edit"   onClick={onEdit} />
          <ActionBtn color="#b91c1c" bg="#fee2e2"  label="🗑️" title={hasActiveBookings ? 'Active bookings exist' : 'Delete'} onClick={onDelete} disabled={hasActiveBookings} />
          <ActionBtn color="#92400e" bg="#fef3c7"  label="⚡" title="Boost"  onClick={onBoost} />
        </div>
      </td>
    </tr>
  );
};

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

// ─── Booking Row ──────────────────────────────────────────────────────────────
const BookingRow: React.FC<{
  booking: Booking;
  updating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
}> = ({ booking, updating, onConfirm, onCancel, onComplete }) => {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hov ? '#fafcff' : '#fff', transition: 'background 0.12s' }}
    >
      {/* Property */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 2 }}>{booking.property?.title}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{booking.property?.address}</div>
      </td>

      {/* Client */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: RED_BG, border: `1.5px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: RED, flexShrink: 0 }}>
            {(booking.user?.first_name?.[0] || booking.user?.username?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{booking.user?.first_name || booking.user?.username}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{booking.user?.phone || 'No phone'}</div>
          </div>
        </div>
      </td>

      {/* Visit date */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(booking.visit_date)}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtTime(booking.visit_date)}</div>
      </td>

      {/* Status */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <StatusBadge status={booking.status} />
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        {updating ? (
          <div style={{ width: 20, height: 20, border: '2px solid #eef2f7', borderTop: `2px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite' }} />
        ) : booking.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onConfirm} style={bk.confirmBtn}>✓ Confirm</button>
            <button onClick={onCancel}  style={bk.cancelBtn}>✗ Cancel</button>
          </div>
        ) : booking.status === 'confirmed' ? (
          <button onClick={onComplete} style={bk.completeBtn}>✓ Complete</button>
        ) : null}
      </td>
    </tr>
  );
};
const bk: Record<string, React.CSSProperties> = {
  confirmBtn:  { padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: GREEN, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  cancelBtn:   { padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  completeBtn: { padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
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

// ─── Property Detail Modal ────────────────────────────────────────────────────
const PropertyDetailModal: React.FC<{ property: Property | null; onClose: () => void }> = ({ property, onClose }) => {
  if (!property) return null;
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
          {mainImage && <img src={mainImage.image} alt={property.title} style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 16, marginBottom: 20 }} />}

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

          {/* Specs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, backgroundColor: '#f8faff', padding: 16, borderRadius: 14, marginBottom: 20 }}>
            {[
              { label: 'Type',        val: property.property_type },
              { label: 'Transaction', val: property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet' },
              { label: 'Bedrooms',    val: property.bedrooms ?? 0 },
              { label: 'Bathrooms',   val: property.bathrooms ?? 0 },
              { label: 'Area',        val: `${property.square_meters ?? 0} m²` },
              ...(property.parking_spaces ? [{ label: 'Parking', val: `${property.parking_spaces} spaces` }] : []),
              ...(property.furnishing_status && property.furnishing_status !== 'unfurnished' ? [{ label: 'Furnishing', val: property.furnishing_status.replace(/_/g, ' ') }] : []),
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, textTransform: 'capitalize' }}>{s.val}</div>
              </div>
            ))}
          </div>

          <SectionBlock title="📝 Description"><p style={{ margin: 0, color: SLATE, fontSize: 14, lineHeight: 1.7 }}>{property.description}</p></SectionBlock>
          {amenities.length > 0 && <SectionBlock title="✨ Amenities"><TagList items={amenities} bg={RED_BG} color={RED} /></SectionBlock>}
          {schools.length > 0 && <SectionBlock title="🎓 Nearby Schools"><TagList items={schools} bg="#fef3c7" color="#92400e" /></SectionBlock>}
          {(property.has_security || property.has_cctv || property.has_gated_community) && (
            <SectionBlock title="🔒 Security">
              <TagList items={[property.has_security && '🔒 Security Guard', property.has_cctv && '📹 CCTV', property.has_gated_community && '🏘️ Gated Community'].filter(Boolean) as string[]} bg="#dcfce7" color="#166534" />
            </SectionBlock>
          )}
          {otherImages.length > 0 && (
            <SectionBlock title="📷 More Photos">
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {otherImages.map(img => <img key={img.id} src={img.image} alt="" style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />)}
              </div>
            </SectionBlock>
          )}
        </div>
      </div>
    </>
  );
};

const SectionBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>{title}</h4>
    {children}
  </div>
);
const TagList: React.FC<{ items: string[]; bg: string; color: string }> = ({ items, bg, color }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {items.map((a, i) => <span key={i} style={{ padding: '4px 12px', backgroundColor: bg, color, borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{a}</span>)}
  </div>
);

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
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [activeTab,         setActiveTab]         = useState(0);
  const [properties,        setProperties]        = useState<Property[]>([]);
  const [bookings,          setBookings]          = useState<Booking[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [toast,             setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  const [addOpen,           setAddOpen]           = useState(false);
  const [editOpen,          setEditOpen]          = useState(false);
  const [deleteOpen,        setDeleteOpen]        = useState(false);
  const [boostOpen,         setBoostOpen]         = useState(false);
  const [detailOpen,        setDetailOpen]        = useState(false);
  const [selectedProp,      setSelectedProp]      = useState<Property | null>(null);
  const [propToDelete,      setPropToDelete]      = useState<Property | null>(null);
  const [boostProp,         setBoostProp]         = useState<Property | null>(null);
  const [deleteError,       setDeleteError]       = useState<string | null>(null);
  const [submitLoading,     setSubmitLoading]     = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null);

  const [images,        setImages]        = useState<UploadImage[]>([]);
  const [existingImages,setExistingImages]= useState<PropertyImage[]>([]);
  const [formData,      setFormData]      = useState<PropertyFormData>(EMPTY_FORM(user));

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pr, br] = await Promise.all([api.get('/properties/my/'), api.get('/bookings/agent/')]);
      setProperties(pr.data.results || pr.data);
      setBookings(br.data.results || br.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setFormData(EMPTY_FORM(user)); setImages([]); setExistingImages([]); setSelectedProp(null); };
  const onChange   = (f: keyof PropertyFormData, v: any) => setFormData(p => ({ ...p, [f]: v }));

  const hasBookings        = (id: number) => bookings.some(b => b.property?.id === id);
  const getPropBookings    = (id: number) => bookings.filter(b => b.property?.id === id);
  const hasActiveBookings  = (id: number) => getPropBookings(id).some(b => b.status === 'pending' || b.status === 'confirmed');

  const openEdit = (property: Property) => {
    setSelectedProp(property);
    setFormData({
      title: property.title, description: property.description,
      property_type: property.property_type, transaction_type: property.transaction_type,
      price: property.price.toString(), bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '', square_meters: property.square_meters?.toString() || '',
      address: property.address, city: property.city, district: property.district,
      latitude: property.latitude?.toString() || '', longitude: property.longitude?.toString() || '',
      video_url: property.video_url || '', virtual_tour_url: property.virtual_tour_url || '',
      neighborhood_name: property.neighborhood_name || '', neighborhood_description: property.neighborhood_description || '',
      distance_to_city_center: property.distance_to_city_center?.toString() || '',
      distance_to_airport: property.distance_to_airport?.toString() || '',
      distance_to_highway: property.distance_to_highway?.toString() || '',
      nearby_schools: property.nearby_schools || '', distance_to_nearest_school: property.distance_to_nearest_school?.toString() || '',
      school_rating: property.school_rating?.toString() || '',
      nearby_roads: property.nearby_roads || '', nearest_road: property.nearest_road || '',
      public_transport: property.public_transport || false,
      nearest_bus_stop: property.nearest_bus_stop || '', nearest_taxi_stage: property.nearest_taxi_stage || '',
      amenities: property.amenities_list || property.amenities || [],
      nearest_mall: property.nearest_mall || '', distance_to_mall: property.distance_to_mall?.toString() || '',
      nearest_supermarket: property.nearest_supermarket || '', nearest_market: property.nearest_market || '',
      nearest_pharmacy: property.nearest_pharmacy || '', nearest_hospital: property.nearest_hospital || '',
      distance_to_hospital: property.distance_to_hospital?.toString() || '',
      nearest_restaurant: property.nearest_restaurant || '', nearest_cafe: property.nearest_cafe || '',
      nearest_gym: property.nearest_gym || '', nearest_park: property.nearest_park || '',
      year_built: property.year_built?.toString() || '', furnishing_status: property.furnishing_status || 'unfurnished',
      parking_type: property.parking_type || 'none', parking_spaces: property.parking_spaces?.toString() || '',
      has_security: property.has_security || false, has_cctv: property.has_cctv || false,
      has_electric_fence: property.has_electric_fence || false, has_security_lights: property.has_security_lights || false,
      has_security_guards: property.has_security_guards || false, has_gated_community: property.has_gated_community || false,
      has_solar: property.has_solar || false, has_backup_generator: property.has_backup_generator || false,
      has_water_tank: property.has_water_tank || false, has_borehole: property.has_borehole || false,
      has_internet: property.has_internet || false, has_cable_tv: property.has_cable_tv || false,
      has_garden: property.has_garden || false, has_balcony: property.has_balcony || false,
      has_terrace: property.has_terrace || false, has_swimming_pool: property.has_swimming_pool || false,
      has_playground: property.has_playground || false, has_bbq_area: property.has_bbq_area || false,
      has_air_conditioning: property.has_air_conditioning || false, has_heating: property.has_heating || false,
      has_fireplace: property.has_fireplace || false, has_modern_kitchen: property.has_modern_kitchen || false,
      has_walk_in_closet: property.has_walk_in_closet || false, has_study_room: property.has_study_room || false,
      pets_allowed: property.pets_allowed ?? true, smoking_allowed: property.smoking_allowed ?? true,
      has_title_deed: property.has_title_deed || false, title_deed_number: property.title_deed_number || '',
      land_registration_number: property.land_registration_number || '',
      agent_phone: property.agent_phone || user?.phone || '', agent_email: property.agent_email || user?.email || '',
      viewing_instructions: property.viewing_instructions || '',
    });
    setExistingImages(property.images || []);
    setImages([]);
    setEditOpen(true);
  };

  const buildFD = (fd: PropertyFormData, imgs: UploadImage[]) => {
    const f = new FormData();
    Object.entries(fd).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        if (k === 'amenities') f.append(k, JSON.stringify(v));
        else if (typeof v === 'boolean') f.append(k, String(v));
        else f.append(k, String(v));
      }
    });
    imgs.forEach((img, i) => { f.append('images', img.file); if (img.is_main) f.append('main_image_index', i.toString()); });
    return f;
  };

  const handleAdd = async () => {
    if (images.length === 0) { showToast('Please upload at least one image', false); return; }
    setSubmitLoading(true);
    try {
      await api.post('/properties/', buildFD(formData, images), { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Property added successfully!');
      setAddOpen(false); fetchData(); resetForm();
    } catch { showToast('Failed to add property', false); }
    finally { setSubmitLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selectedProp) return;
    setSubmitLoading(true);
    try {
      const f = buildFD(formData, images);
      f.append('existing_images', JSON.stringify(existingImages.map(i => i.id)));
      const main = existingImages.find(i => i.is_main);
      if (main) f.append('main_image_id', main.id.toString());
      const newMainIdx = images.findIndex(i => i.is_main);
      if (newMainIdx !== -1) f.append('main_image_index', newMainIdx.toString());
      await api.put(`/properties/${selectedProp.id}/`, f, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Property updated successfully!');
      setEditOpen(false); fetchData(); resetForm();
    } catch { showToast('Failed to update property', false); }
    finally { setSubmitLoading(false); }
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

  const updateBookingStatus = async (id: number, status: string) => {
    setUpdatingBookingId(id);
    try {
      await api.post(`/bookings/${id}/agent-status/`, { status });
      await fetchData();
      showToast(`Booking ${status} successfully!`);
    } catch (e: any) { showToast(e.response?.data?.error || 'Failed to update booking', false); }
    finally { setUpdatingBookingId(null); }
  };

  const stats = {
    totalProperties:  properties.length,
    totalBookings:    bookings.length,
    pendingBookings:  bookings.filter(b => b.status === 'pending').length,
    totalViews:       properties.reduce((s, p) => s + (p.views_count || 0), 0),
  };

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading dashboard…</p>
      </div>
    </div>
  );

  // ── Shared modal styles ───────────────────────────────────────────────────────
  const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 28px 64px rgba(0,0,0,0.22)', animation: 'dbModalIn 0.22s ease-out', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2, flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#f4f7fb', border: 'none', cursor: 'pointer', fontSize: 15, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', top: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, backgroundColor: toast.ok ? '#1a3a2e' : '#3a1a1e', color: toast.ok ? '#4ade80' : '#f87171', border: `1px solid ${toast.ok ? TEAL : RED}33`, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.22)', animation: 'dbFadeDown 0.3s ease-out', whiteSpace: 'nowrap' }}>
          <span>{toast.ok ? '✓' : '⚠'}</span>
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', marginLeft: 4, opacity: 0.7, fontSize: 15, padding: 0 }}>×</button>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* ── Header banner ────────────────────────────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a5c 60%, ${RED}22 100%)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, animation: 'dbFadeUp 0.4s ease-out both', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative blobs */}
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
            <button onClick={() => navigate('/properties')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#f0f6ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              🔍 Browse
            </button>
            <button onClick={() => { resetForm(); setAddOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(230,57,70,0.35)' }}>
              + Add Property
            </button>
          </div>
        </div>

        {/* ── Stats grid ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="🏠" label="Total Properties" value={stats.totalProperties} color={RED}    bg={RED_BG}    sub={`${properties.filter(p => p.is_available).length} available`} delay="0s" />
          <StatCard icon="📅" label="Total Bookings"   value={stats.totalBookings}   color={AMBER}  bg={AMBER_BG}  sub="all time"  delay="0.07s" />
          <StatCard icon="⏳" label="Pending"          value={stats.pendingBookings} color={ORANGE} bg={ORANGE_BG} sub="need action" delay="0.14s" />
          <StatCard icon="👁️" label="Total Views"      value={stats.totalViews.toLocaleString()} color={GREEN} bg={GREEN_BG} sub="across all listings" delay="0.21s" />
        </div>

        {/* ── Main panel: sidebar + content ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 12px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 88, animation: 'dbFadeUp 0.4s ease-out 0.1s both' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>Menu</div>
            {[
              { icon: '🏠', label: 'My Properties', count: properties.length },
              { icon: '📅', label: 'Bookings',       count: bookings.length   },
            ].map((t, i) => <NavTab key={i} {...t} active={activeTab === i} onClick={() => setActiveTab(i)} />)}

            <div style={{ height: 1, background: '#f1f5f9', margin: '14px 0' }} />

            {/* Quick stats in sidebar */}
            {[
              { label: 'Available', val: properties.filter(p => p.is_available).length, color: TEAL },
              { label: 'Boosted',   val: properties.filter(p => p.is_boosted).length,   color: AMBER },
              { label: 'Pending',   val: stats.pendingBookings,                          color: ORANGE },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div style={{ minWidth: 0 }}>

            {/* ── Properties Tab ─────────────────────────────────────────────── */}
            {activeTab === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', animation: 'dbFadeUp 0.35s ease-out both' }}>
                <TabHead
                  title="My Properties"
                  count={properties.length}
                  action={
                    <button onClick={() => { resetForm(); setAddOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Add New
                    </button>
                  }
                />
                {properties.length === 0 ? (
                  <EmptyState icon="🏚️" title="No properties yet" desc="Add your first property to start receiving bookings from clients." btnLabel="Add Property" onClick={() => { resetForm(); setAddOpen(true); }} />
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

            {/* ── Bookings Tab ────────────────────────────────────────────────── */}
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
                            onConfirm={()  => updateBookingStatus(b.id, 'confirmed')}
                            onCancel={()   => updateBookingStatus(b.id, 'cancelled')}
                            onComplete={()  => updateBookingStatus(b.id, 'completed')}
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

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
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

      {addOpen && (
        <ModalShell title="Add New Property" onClose={() => setAddOpen(false)}>
          <PropertyForm formData={formData} onChange={onChange} onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={submitLoading} submitText="Add Property" images={images} onImagesChange={setImages} />
        </ModalShell>
      )}

      {editOpen && selectedProp && (
        <ModalShell title="Edit Property" onClose={() => setEditOpen(false)}>
          <PropertyForm formData={formData} onChange={onChange} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} loading={submitLoading} submitText="Update Property" images={images} onImagesChange={setImages} existingImages={existingImages} onExistingImagesChange={setExistingImages} />
        </ModalShell>
      )}

      <BoostModal
        open={boostOpen}
        onClose={() => { setBoostOpen(false); setBoostProp(null); }}
        propertyId={boostProp?.id || 0}
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