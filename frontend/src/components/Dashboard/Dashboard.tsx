// src/components/Dashboard/Dashboard.tsx - COMPLETE WITH BOOKING HISTORY

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { chatAPI, complaintAPI, dealAPI, kycAPI } from '../../services/api';
import { Property, Booking } from '../../types';
import BoostModal from '../Boost/BoostModal';

import type {
  Conversation,
  Message,
  Complaint,
  DealRoom,
  KYCStatus,
} from '../../types';

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
const PURPLE = '#8b5cf6';
const PURPLE_BG = 'rgba(139,92,246,0.08)';

// ─── Cloudinary ───────────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'drcy2xxkg';

const getCloudinaryUrl = (image: string | null | undefined): string => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) {
    if (image.includes('cloudinary.com') && !image.includes('f_auto')) {
      const parts = image.split('/upload/');
      if (parts.length === 2) return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
    }
    return image;
  }
  let c = image.includes('image/upload/') ? image.replace('image/upload/', '') : image;
  c = c.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${c}`;
};

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

interface KYCStatusData {
  status: KYCStatus;
  rejection_reason?: string;
  admin_notes?: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e', dot: AMBER },
  confirmed: { bg: '#dcfce7', color: '#166534', dot: GREEN },
  completed: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },  cancelled: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  available: { bg: TEAL_BG, color: '#166534', dot: TEAL },
  unavailable: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  approved: { bg: '#dcfce7', color: '#166534', dot: GREEN },
  rejected: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  negotiation: { bg: PURPLE_BG, color: '#6d28d9', dot: PURPLE },
  deposit: { bg: AMBER_BG, color: '#92400e', dot: AMBER },
  contract: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  closing: { bg: TEAL_BG, color: '#166534', dot: TEAL },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_STYLES[status] || { bg: '#f1f5f9', color: SLATE, dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      backgroundColor: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, padding: '4px 10px',
      borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: string; label: string; value: string | number;
  color: string; bg: string; sub?: string; delay?: string;
}> = ({ icon, label, value, color, bg, sub, delay = '0s' }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      backgroundColor: '#fff', borderRadius: 18, padding: '20px',
      border: `1.5px solid ${hov ? color : '#eef2f7'}`,
      boxShadow: hov ? `0 10px 28px rgba(0,0,0,0.09)` : '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'all 0.22s', animation: `dbFadeUp 0.4s ease-out ${delay} both`,
      transform: hov ? 'translateY(-4px)' : 'none',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', backgroundColor: `${color}12`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Sora', sans-serif", lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
      </div>
    </div>
  );
};

// ─── Nav Tab ──────────────────────────────────────────────────────────────────
const NavTab: React.FC<{
  icon: string; label: string; count?: number; unread?: number;
  active: boolean; onClick: () => void;
}> = ({ icon, label, count, unread, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
    textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
    backgroundColor: active ? RED_BG : 'transparent',
    color: active ? RED : SLATE, fontWeight: active ? 700 : 500, fontSize: 13,
  }}>
    <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {unread && unread > 0 ? (
      <span style={{ backgroundColor: RED, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
        {unread > 9 ? '9+' : unread}
      </span>
    ) : count != null && count > 0 ? (
      <span style={{ backgroundColor: active ? RED : '#eef2f7', color: active ? '#fff' : '#64748b', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
        {count}
      </span>
    ) : null}
  </button>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn: React.FC<{
  color: string; bg: string; label: string; title: string;
  onClick: () => void; disabled?: boolean;
}> = ({ color, bg, label, title, onClick, disabled }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${color}33`,
        backgroundColor: hov ? color : bg, fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
        opacity: disabled ? 0.45 : 1, lineHeight: 1,
      }}>{label}</button>
  );
};

// ─── Property Row ─────────────────────────────────────────────────────────────
const PropertyRow: React.FC<{
  property: Property; bookingCount: number; hasActiveBookings: boolean;
  onView: () => void; onEdit: () => void; onDelete: () => void;
  onBoost: () => void; onMessage?: () => void;
}> = ({ property, bookingCount, hasActiveBookings, onView, onEdit, onDelete, onBoost, onMessage }) => {
  const [hov, setHov] = useState(false);
  const [imgError, setImgError] = useState(false);

  const getImageUrl = () => {
    if (imgError) return '';
    const img = property.images?.find(i => i.is_main)?.image_url ||
      property.images?.find(i => i.is_main)?.image ||
      property.images?.[0]?.image_url ||
      property.images?.[0]?.image;
    return img ? getCloudinaryUrl(img) : '';
  };
  const imageUrl = getImageUrl();
  const hasVideo = !!(property.has_video || property.video_url || property.video_file);

  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hov ? '#fafcff' : '#fff', transition: 'background-color 0.12s' }}>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#f1f5f9' }}>
            {imageUrl ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏠</div>}
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
        <span style={{ fontSize: 11, backgroundColor: '#f4f7fb', color: SLATE, padding: '4px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{property.property_type}</span>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}><StatusBadge status={property.is_available ? 'available' : 'unavailable'} /></td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: bookingCount > 0 ? AMBER : '#94a3b8' }}>{bookingCount}</span>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: SLATE }}>{(property.views_count || 0).toLocaleString()}</span>
      </td>
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <ActionBtn color={RED} bg={RED_BG} label="✏️" title="Edit" onClick={onEdit} />
          <ActionBtn color="#b91c1c" bg="#fee2e2" label="🗑️" title={hasActiveBookings ? 'Active bookings exist' : 'Delete'} onClick={onDelete} disabled={hasActiveBookings} />
          <ActionBtn color="#92400e" bg="#fef3c7" label="⚡" title="Boost" onClick={onBoost} />
          {onMessage && <ActionBtn color={TEAL} bg={TEAL_BG} label="💬" title="Message" onClick={onMessage} />}
        </div>
      </td>
    </tr>
  );
};

// ─── Booking History Modal ────────────────────────────────────────────────────
const BookingHistoryModal: React.FC<{
  booking: Booking | null;
  history: any[];
  loading: boolean;
  onClose: () => void;
}> = ({ booking, history, loading, onClose }) => {
  if (!booking) return null;
  const property = booking.property_detail;
  
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '95%', maxWidth: 560, background: '#fff', borderRadius: 22, zIndex: 1001,
        boxShadow: '0 30px 80px rgba(0,0,0,0.25)', overflow: 'hidden', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid #eef2f7`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800 }}>Booking History</h3>
            {property?.title && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>🏠 {property.title}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', padding: 4 }}>✕</button>
        </div>

        {/* Booking Summary */}
        <div style={{ padding: '16px 24px', background: '#f8faff', borderBottom: `1px solid #eef2f7` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Visit Date</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{fmtDate(booking.visit_date)}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtTime(booking.visit_date)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Status</div>
              <StatusBadge status={booking.status} />
            </div>
            {booking.message && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Note</div>
                <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>"{booking.message}"</div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Activity Timeline</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ width: 24, height: 24, border: `2px solid #eef2f7`, borderTop: `2px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 10px' }} />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No history recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {history.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                  {i < history.length - 1 && <div style={{ position: 'absolute', left: 15, top: 28, bottom: -4, width: 2, background: '#eef2f7' }} />}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: h.new_status === 'confirmed' ? '#ecfdf5'
                      : h.new_status === 'completed' ? '#eff6ff'
                      : h.new_status === 'cancelled' ? '#fef2f2' : '#f8faff',
                    border: `2px solid ${h.new_status === 'confirmed' ? '#16a34a'
                      : h.new_status === 'completed' ? '#3b82f6'
                      : h.new_status === 'cancelled' ? '#ef4444' : '#e2e8f0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  }}>
                    {h.new_status === 'confirmed' ? '✓' : h.new_status === 'completed' ? '🏁' : h.new_status === 'cancelled' ? '✗' : '📅'}
                  </div>
                  <div style={{ paddingBottom: 20, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'capitalize' }}>
                      {h.action_display || h.action}
                      {h.old_status && h.new_status && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> — {h.old_status} → {h.new_status}</span>}
                    </div>
                    {h.notes && <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{h.notes}</div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                      {h.changed_by_name && <span>by {h.changed_by_name} · </span>}
                      {fmtDate(h.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid #eef2f7` }}>
          <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #eef2f7', background: '#fff', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Close</button>
        </div>
      </div>
    </>
  );
};

// ─── Booking Row (with History button) ────────────────────────────────────────
const BookingRow: React.FC<{
  booking: Booking; updating: boolean;
  onConfirm: () => void; onCancel: () => void; onComplete: () => void; 
  onMessage?: () => void; onHistory?: () => void;
}> = ({ booking, updating, onConfirm, onCancel, onComplete, onMessage, onHistory }) => {
  const [hov, setHov] = useState(false);
  const property = booking.property_detail;
  const client = booking.user_detail;
  
  const clientName = client?.full_name
    || ((client?.first_name || '') + ' ' + (client?.last_name || '')).trim()
    || client?.username
    || 'Client';
  
  const clientInitial = clientName !== 'Client' ? clientName[0].toUpperCase() : 'C';
  const clientPhone = client?.phone || null;

  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hov ? '#fafcff' : '#fff', transition: 'background 0.12s' }}>
      
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 2 }}>
          {property?.title || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Property details loading…</span>}
        </div>
        {property?.address && <div style={{ fontSize: 11, color: '#94a3b8' }}>{property.address}</div>}
      </td>
      
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: RED_BG, border: `1.5px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: RED, flexShrink: 0 }}>
            {clientInitial}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{clientName}</div>
            {clientPhone && <div style={{ fontSize: 11, color: '#94a3b8' }}>📞 {clientPhone}</div>}
          </div>
        </div>
      </td>
      
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(booking.visit_date)}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtTime(booking.visit_date)}</div>
      </td>
      
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <StatusBadge status={booking.status} />
        {booking.message && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={booking.message}>
            "{booking.message}"
          </div>
        )}
      </td>
      
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {updating ? (
            <div style={{ width: 20, height: 20, border: '2px solid #eef2f7', borderTop: `2px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite' }} />
          ) : booking.status === 'pending' ? (
            <>
              <button onClick={onConfirm} style={{ padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: GREEN, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Confirm</button>
              <button onClick={onCancel} style={{ padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✗ Cancel</button>
            </>
            ) : booking.status === 'confirmed' ? (
  <>
    <button onClick={onComplete} style={{ padding: '6px 13px', borderRadius: 8, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Complete</button>
    {onMessage && <button onClick={onMessage} style={{ padding: '6px 9px', borderRadius: 8, border: `1px solid ${RED}`, backgroundColor: 'transparent', color: RED, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>💬 Message</button>}
    {onHistory && <button onClick={onHistory} style={{ padding: '6px 9px', borderRadius: 8, border: `1px solid ${PURPLE}`, backgroundColor: PURPLE_BG, color: PURPLE, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📋 History</button>}
  </>
) : booking.status === 'completed' ? (
  <>
    <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, backgroundColor: GREEN_BG, padding: '4px 10px', borderRadius: 20 }}>✓ Completed</span>
    {onMessage && <button onClick={onMessage} style={{ padding: '6px 9px', borderRadius: 8, border: `1px solid ${RED}`, backgroundColor: 'transparent', color: RED, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>💬 Message</button>}
    {onHistory && <button onClick={onHistory} style={{ padding: '6px 9px', borderRadius: 8, border: `1px solid ${PURPLE}`, backgroundColor: PURPLE_BG, color: PURPLE, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📋 History</button>}
  </>
) : null}
        </div>
      </td>
    </tr>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{
  icon: string; title: string; desc: string; btnLabel: string; onClick: () => void;
}> = ({ icon, title, desc, btnLabel, onClick }) => (
  <div style={{ textAlign: 'center', padding: '64px 24px' }}>
    <div style={{ fontSize: 56, marginBottom: 14 }}>{icon}</div>
    <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800 }}>{title}</h3>
    <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
    <button onClick={onClick} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(230,57,70,0.28)' }}>
      {btnLabel}
    </button>
  </div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
  title: string; desc: string;
  onConfirm: () => void; onClose: () => void; loading?: boolean; blocked?: boolean;
}> = ({ title, desc, onConfirm, onClose, loading, blocked }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(5px)', zIndex: 1000 }} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: '30px 28px', zIndex: 1001, boxShadow: '0 28px 64px rgba(0,0,0,0.2)', animation: 'dbModalIn 0.22s ease-out' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: blocked ? '#fef3c7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
        {blocked ? '⚠️' : '🗑️'}
      </div>
      <h3 style={{ margin: '0 0 10px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 19, fontWeight: 800 }}>{title}</h3>
      <p style={{ margin: '0 0 26px', color: SLATE, fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {blocked ? 'Close' : 'Cancel'}
        </button>
        {!blocked && (
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite' }} />Deleting…</> : 'Yes, Delete'}
          </button>
        )}
      </div>
    </div>
  </>
);

// ─── Property Detail Modal ────────────────────────────────────────────────────
const PropertyDetailModal: React.FC<{
  property: Property | null; onClose: () => void;
}> = ({ property, onClose }) => {
  if (!property) return null;
  const getModalImgUrl = (image: any) => getCloudinaryUrl(image?.image_url || image?.image);
  const mainImage = property.images?.find(i => i.is_main) || property.images?.[0];
  const otherImages = property.images?.filter(i => i.id !== mainImage?.id) || [];
  const amenities = property.amenities_list || (property.amenities as string[]) || [];
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
            <img src={getModalImgUrl(mainImage)} alt={property.title}
              style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 16, marginBottom: 20 }}
              onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/880x280?text=No+Image'; }} />
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
          {property.description && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>📝 Description</h4>
              <p style={{ margin: 0, color: SLATE, fontSize: 14, lineHeight: 1.7 }}>{property.description}</p>
            </div>
          )}
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
                  <img key={img.id} src={getModalImgUrl(img)} alt=""
                    style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/110x80?text=No+Image'; }} />
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

// ─── Conversation List ────────────────────────────────────────────────────────
const ConversationList: React.FC<{
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  selectedId?: string;
}> = ({ conversations, onSelect, selectedId }) => {
  if (conversations.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>No conversations yet</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>When users message you about properties, they'll appear here</div>
      </div>
    );
  }
  return (
    <div>
      {conversations.map(conv => (
        <div key={conv.id} onClick={() => onSelect(conv)}
          style={{
            padding: '14px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
            backgroundColor: selectedId === conv.id ? RED_BG : conv.unread_count > 0 ? '#fef7f7' : '#fff',
            transition: 'background 0.15s',
            borderLeft: selectedId === conv.id ? `3px solid ${RED}` : '3px solid transparent',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden', flexShrink: 0 }}>
              {conv.other_participant?.profile_picture_url
                ? <img src={conv.other_participant.profile_picture_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ fontWeight: 700, color: RED, fontSize: 14 }}>{conv.other_participant?.first_name?.[0] || conv.other_participant?.username?.[0] || 'U'}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: conv.unread_count > 0 ? 700 : 600, fontSize: 14, color: NAVY }}>
                  {conv.other_participant?.full_name || conv.other_participant?.username}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>
                  {new Date(conv.last_message_time).toLocaleDateString()}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conv.last_message_preview}
              </div>
              {conv.property_data && (
                <div style={{ fontSize: 10, color: TEAL, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  🏠 {conv.property_data.title?.substring(0, 40)}
                </div>
              )}
            </div>
            {conv.unread_count > 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: RED, flexShrink: 0 }} />}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Message View ─────────────────────────────────────────────────────────────
const MessageView: React.FC<{
  conversation: Conversation | null;
  messages: Message[];
  onSend: (content: string) => void;
  loading: boolean;
  currentUserId?: number;
}> = ({ conversation, messages, onSend, loading, currentUserId }) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (conversation && inputRef.current) setTimeout(() => inputRef.current?.focus(), 80);
  }, [conversation?.id]);

  const handleSend = useCallback(() => {
    const t = text.trim();
    if (!t || !conversation) return;
    onSend(t);
    setText('');
    inputRef.current?.focus();
  }, [text, conversation, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const isMine = (msg: Message): boolean => {
    if (typeof msg.is_sender === 'boolean') return msg.is_sender;
    if (currentUserId != null) return msg.sender === currentUserId;
    return false;
  };

  if (!conversation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
        <div style={{ fontSize: 44 }}>💬</div>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, fontFamily: "'Sora', sans-serif" }}>Select a conversation</div>
        <div style={{ color: '#94a3b8', fontSize: 12 }}>Choose a chat on the left to start messaging</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, backgroundColor: '#f8faff' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: RED, flexShrink: 0 }}>
          {conversation.other_participant?.first_name?.[0] || conversation.other_participant?.username?.[0] || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{conversation.other_participant?.full_name || conversation.other_participant?.username}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{conversation.property_data ? `Re: ${conversation.property_data.title}` : 'Direct Message'}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 13 }}>No messages yet — say hello! 👋</div>
        ) : messages.map(msg => {
          const mine = isMine(msg);
          return (
            <div key={msg.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
              {!mine && <div style={{ fontSize: 10, fontWeight: 700, color: RED, marginBottom: 3, marginLeft: 4 }}>{msg.sender_name}</div>}
              <div style={{
                backgroundColor: mine ? RED : '#f1f5f9', color: mine ? '#fff' : NAVY,
                padding: '10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: 13, wordBreak: 'break-word', lineHeight: 1.55,
                boxShadow: mine ? '0 2px 8px rgba(230,57,70,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {msg.content}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine && <span style={{ marginLeft: 4 }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'center', backgroundColor: '#fff', flexShrink: 0 }}>
        <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: '1.5px solid #eef2f7', fontSize: 13, outline: 'none', fontFamily: 'inherit', backgroundColor: '#f8faff', color: NAVY }} />
        <button onClick={handleSend} disabled={!text.trim() || loading}
          style={{ padding: '10px 20px', borderRadius: 24, border: 'none', backgroundColor: !text.trim() || loading ? '#eef2f7' : RED, color: !text.trim() || loading ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 700, cursor: !text.trim() || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0, boxShadow: !text.trim() ? 'none' : '0 4px 12px rgba(230,57,70,0.3)' }}>
          Send ↑
        </button>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [deals, setDeals] = useState<DealRoom[]>([]);
  const [kycStatus, setKycStatus] = useState<KYCStatusData | null>(null);

  // Booking history state
  const [historyBooking, setHistoryBooking] = useState<Booking | null>(null);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [stats, setStats] = useState({ properties: 0, bookings: 0, pending: 0, views: 0, unread: 0, complaints: 0, deals: 0 });
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [propToDelete, setPropToDelete] = useState<Property | null>(null);
  const [boostProp, setBoostProp] = useState<Property | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pr, br, convRes, complaintsRes, dealsRes, kycRes] = await Promise.allSettled([
        api.get('/properties/my/'),
        api.get('/bookings/agent/'),
        chatAPI.getConversations(),
        complaintAPI.getComplaintsAgainstMe(),
        dealAPI.getDeals(),
        kycAPI.getStatus(),
      ]);

      const propertiesRaw = pr.status === 'fulfilled' ? (pr.value.data?.results ?? pr.value.data ?? []) : [];
      const processedProperties = propertiesRaw.map((p: Property) => ({
        ...p,
        images: p.images?.map((img: any) => ({ ...img, image_url: getCloudinaryUrl(img.image || img.image_url) })),
      }));
      setProperties(processedProperties);

      const bookingsRaw = br.status === 'fulfilled' ? (br.value.data?.results ?? br.value.data ?? []) : [];
      const enrichedBookings = bookingsRaw.map((b: Booking) => ({
        ...b,
        property_detail: b.property_detail ?? processedProperties.find((p: Property) => p.id === b.property) ?? null,
      }));
      setBookings(enrichedBookings);

      setConversations(convRes.status === 'fulfilled' ? (convRes.value.data?.results ?? convRes.value.data ?? []) : []);
      
      const complaintsRaw: Complaint[] = (() => {
        if (complaintsRes.status !== 'fulfilled') return [];
        const d = complaintsRes.value.data as any;
        return (Array.isArray(d) ? d : (d?.results ?? [])) as Complaint[];
      })();
      setComplaints(complaintsRaw);

      setDeals(dealsRes.status === 'fulfilled' ? (dealsRes.value.data?.results ?? dealsRes.value.data ?? []) : []);
      setKycStatus(kycRes.status === 'fulfilled' && kycRes.value?.data ? (kycRes.value.data as KYCStatusData) : null);

      const pendingBookings = bookingsRaw.filter((b: Booking) => b.status === 'pending').length;
      const totalViews = processedProperties.reduce((s: number, p: Property) => s + (p.views_count || 0), 0);
      const unreadCount = convRes.status === 'fulfilled' ? (convRes.value.data?.results ?? convRes.value.data ?? []).reduce((acc: number, c: Conversation) => acc + (c.unread_count || 0), 0) : 0;
      
      setStats({
        properties: processedProperties.length,
        bookings: bookingsRaw.length,
        pending: pendingBookings,
        views: totalViews,
        unread: unreadCount,
        complaints: complaintsRaw.length,
        deals: dealsRes.status === 'fulfilled' ? (dealsRes.value.data?.results ?? dealsRes.value.data ?? []).length : 0,
      });
    } catch (e) { console.error('fetchAllData error:', e); setComplaints([]); }
    finally { setLoading(false); }
  };

  const fetchBookingHistory = async (booking: Booking) => {
    setHistoryBooking(booking);
    setBookingHistory([]);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/bookings/${booking.id}/history/`);
      const data = res.data?.results ?? res.data ?? [];
      setBookingHistory(Array.isArray(data) ? data : []);
    } catch (error) { console.error('Failed to fetch history:', error); setBookingHistory([]); }
    finally { setHistoryLoading(false); }
  };

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const res = await chatAPI.getMessages(conversationId);
      let data: Message[] = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data && 'results' in res.data) data = (res.data as any).results;
      setMessages(data);
      await chatAPI.markMessagesRead(conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c));
    } catch (e) { console.error('fetchMessages error:', e); }
    finally { setMessagesLoading(false); }
  };

  const handleSelectConversation = (conv: Conversation) => { setSelectedConversation(conv); fetchMessages(conv.id); };
  
  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;
    try {
      await chatAPI.sendMessage(selectedConversation.id, content);
      fetchMessages(selectedConversation.id);
      const convRes = await chatAPI.getConversations();
      setConversations(convRes.data?.results ?? convRes.data ?? []);
    } catch (e) { console.error('sendMessage error:', e); showToast('Failed to send message', false); }
  };

  const getPropBookings = (id: string) => bookings.filter(b => b.property_detail?.id === id);
  const hasPropActiveBookings = (id: string) => getPropBookings(id).some(b => b.status === 'pending' || b.status === 'confirmed');
  const openEdit = (property: Property) => navigate(`/dashboard/properties/edit/${property.id}`);

  const handleDelete = async () => {
    if (!propToDelete || deleteBlocked) return;
    setSubmitLoading(true);
    try {
      await api.delete(`/properties/${propToDelete.id}/`);
      showToast('Property deleted successfully.');
      setDeleteOpen(false); setPropToDelete(null);
      fetchAllData();
    } catch (e: any) { showToast(e.response?.data?.error || 'Failed to delete property.', false); }
    finally { setSubmitLoading(false); }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    setUpdatingBookingId(id);
    try {
      await api.post(`/bookings/${id}/agent-status/`, { status });
      await fetchAllData();
      showToast(`Booking ${status} successfully!`);
    } catch (e: any) { showToast(e.response?.data?.error || 'Failed to update booking', false); }
    finally { setUpdatingBookingId(null); }
  };

  const handleMessageUser = (userId: number | undefined, propertyId?: string) => {
    if (!userId) { showToast('User information not available', false); return; }
    setActiveTab(2);
    const match = conversations.find(c => c.other_participant?.id === userId || (propertyId && c.property_data?.id === propertyId));
    if (match) { setSelectedConversation(match); fetchMessages(match.id); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const TABS: Array<{ icon: string; label: string; count?: number; unread?: number }> = [
    { icon: '🏠', label: 'Properties', count: stats.properties },
    { icon: '📅', label: 'Bookings', count: stats.bookings },
    { icon: '💬', label: 'Messages', unread: stats.unread },
    { icon: '🤝', label: 'Deals', count: stats.deals },
    { icon: '⚖️', label: 'Disputes', count: stats.complaints },
    { icon: '✅', label: 'Verification', count: kycStatus?.status === 'approved' ? undefined : kycStatus ? 1 : undefined },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, backgroundColor: toast.ok ? '#1a3a2e' : '#3a1a1e', color: toast.ok ? '#4ade80' : '#f87171', border: `1px solid ${toast.ok ? TEAL : RED}33`, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.22)', animation: 'dbFadeDown 0.3s ease-out', whiteSpace: 'nowrap' }}>
          <span>{toast.ok ? '✓' : '⚠'}</span> {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', marginLeft: 4, opacity: 0.7, fontSize: 15, padding: 0 }}>×</button>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a5c 60%, ${RED}22 100%)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, animation: 'dbFadeUp 0.4s ease-out both', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${RED}18`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: '40%', width: 140, height: 140, borderRadius: '50%', background: `${TEAL}12`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: RED_BG, border: `2.5px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>{getInitials(user)}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(176,196,222,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Agent Dashboard</div>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: '#f0f6ff', margin: 0, letterSpacing: '-0.02em' }}>Welcome back, {user?.first_name || user?.username}!</h1>
              {kycStatus?.status && <div style={{ marginTop: 6 }}><StatusBadge status={kycStatus.status} /></div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, zIndex: 1 }}>
            <button onClick={() => navigate('/properties')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#f0f6ff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🔍 Browse</button>
            <button onClick={() => navigate('/dashboard/properties/add')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(230,57,70,0.35)' }}>+ Add Property</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="🏠" label="Properties" value={stats.properties} color={RED} bg={RED_BG} delay="0s" />
          <StatCard icon="📅" label="Bookings" value={stats.bookings} color={AMBER} bg={AMBER_BG} delay="0.07s" />
          <StatCard icon="⏳" label="Pending" value={stats.pending} color={ORANGE} bg={ORANGE_BG} delay="0.14s" />
          <StatCard icon="👁️" label="Views" value={stats.views.toLocaleString()} color={GREEN} bg={GREEN_BG} delay="0.21s" />
          <StatCard icon="💬" label="Unread" value={stats.unread} color={PURPLE} bg={PURPLE_BG} delay="0.28s" />
          <StatCard icon="🤝" label="Active Deals" value={stats.deals} color={TEAL} bg={TEAL_BG} delay="0.35s" />
        </div>

        {/* Main Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 12px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 88 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>Menu</div>
            {TABS.map((tab, i) => (<NavTab key={i} icon={tab.icon} label={tab.label} count={tab.count} unread={tab.unread} active={activeTab === i} onClick={() => setActiveTab(i)} />))}
            <div style={{ height: 1, background: '#f1f5f9', margin: '14px 0' }} />
            <button onClick={() => navigate('/legal/complaints/new')} style={{ width: '100%', padding: '9px', borderRadius: 10, border: '1.5px dashed #eef2f7', background: '#f8faff', color: SLATE, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>+ Report an Issue</button>
          </div>

          <div style={{ minWidth: 0 }}>
            {/* Properties Tab */}
            {activeTab === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
                <TabHead title="My Properties" count={properties.length} action={<button onClick={() => navigate('/dashboard/properties/add')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add New</button>} />
                {properties.length === 0 ? (
                  <EmptyState icon="🏚️" title="No properties yet" desc="Add your first property to start receiving bookings" btnLabel="Add Property" onClick={() => navigate('/dashboard/properties/add')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                      <thead><tr style={{ backgroundColor: '#f8faff' }}>{['Property', 'Price', 'Type', 'Status', 'Bookings', 'Views', 'Actions'].map(h => (<th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #eef2f7' }}>{h}</th>))}</tr></thead>
                      <tbody>{properties.map(p => (<PropertyRow key={p.id} property={p} bookingCount={getPropBookings(p.id).length} hasActiveBookings={hasPropActiveBookings(p.id)} onView={() => { setSelectedProp(p); setDetailOpen(true); }} onEdit={() => openEdit(p)} onDelete={() => { setPropToDelete(p); setDeleteBlocked(hasPropActiveBookings(p.id)); setDeleteOpen(true); }} onBoost={() => { setBoostProp(p); setBoostOpen(true); }} onMessage={() => handleMessageUser(p.owner?.id, p.id)} />))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 1 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
                <TabHead title="Property Bookings" count={bookings.length} />
                {bookings.length === 0 ? (
                  <EmptyState icon="📅" title="No bookings yet" desc="When clients book your properties, they'll appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                      <thead><tr style={{ backgroundColor: '#f8faff' }}>{['Property', 'Client', 'Visit Date', 'Status & Note', 'Actions'].map(h => (<th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '1px solid #eef2f7' }}>{h}</th>))}</tr></thead>
                      <tbody>
                        {bookings.map(b => (
                        <BookingRow key={b.id} booking={b} updating={updatingBookingId === b.id}
                          onConfirm={() => updateBookingStatus(b.id, 'confirmed')}
                          onCancel={() => updateBookingStatus(b.id, 'cancelled')}
                          onComplete={() => updateBookingStatus(b.id, 'completed')}
                          onMessage={() => handleMessageUser(b.user_detail?.id, b.property_detail?.id)}
                          onHistory={() => fetchBookingHistory(b)}
                        />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 2 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', display: 'grid', gridTemplateColumns: '300px 1fr', height: 580, overflow: 'hidden' }}>
                <div style={{ borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8faff', flexShrink: 0 }}><div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Messages</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</div></div>
                  <div style={{ flex: 1, overflowY: 'auto' }}><ConversationList conversations={conversations} onSelect={handleSelectConversation} selectedId={selectedConversation?.id} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                  <MessageView conversation={selectedConversation} messages={messages} onSend={handleSendMessage} loading={messagesLoading} currentUserId={user?.id} />
                </div>
              </div>
            )}

            {/* Deals Tab */}
            {activeTab === 3 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
                <TabHead title="Active Deals" count={deals.length} action={<button onClick={() => navigate('/deals')} style={{ fontSize: 12, color: RED, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>} />
                {deals.length === 0 ? <EmptyState icon="🤝" title="No active deals" desc="When you accept offers, deals will appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} /> : (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>{deals.slice(0, 5).map(deal => (
                    <div key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} style={{ padding: '14px', borderRadius: 12, border: '1px solid #eef2f7', cursor: 'pointer', transition: 'box-shadow 0.15s, background 0.15s', backgroundColor: '#f8faff' }} onMouseEnter={e => { (e.currentTarget as any).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as any).style.backgroundColor = '#fff'; }} onMouseLeave={e => { (e.currentTarget as any).style.boxShadow = 'none'; (e.currentTarget as any).style.backgroundColor = '#f8faff'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div><div style={{ fontWeight: 700, color: NAVY }}>{deal.property_data?.title || 'Property Deal'}</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Deal #{deal.deal_number}</div></div>
                        <StatusBadge status={deal.status} />
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div>{deal.agreed_price && <span style={{ fontWeight: 800, color: RED }}>{fmtPrice(deal.agreed_price)}</span>}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 100, height: 4, backgroundColor: '#eef2f7', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${deal.progress_percentage}%`, height: '100%', backgroundColor: TEAL, transition: 'width 0.4s' }} /></div>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{deal.progress_percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}</div>
                )}
              </div>
            )}

            {/* Disputes Tab */}
            {activeTab === 4 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
                <TabHead title="Disputes & Complaints" count={complaints.length} action={<button onClick={() => navigate('/legal/complaints/new')} style={{ fontSize: 12, color: RED, background: 'none', border: 'none', cursor: 'pointer' }}>+ New Complaint</button>} />
                {complaints.length === 0 ? <EmptyState icon="⚖️" title="No disputes" desc="Any complaints filed against you will appear here." btnLabel="Learn More" onClick={() => navigate('/safety')} /> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ backgroundColor: '#f8faff' }}>{['Complaint #', 'Title', 'Category', 'Status', 'Date'].map(h => (<th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #eef2f7' }}>{h}</th>))}</tr></thead>
                      <tbody>{complaints.map(c => (<tr key={c.id} onClick={() => navigate(`/legal/complaints/${c.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onMouseEnter={e => { (e.currentTarget as any).style.backgroundColor = '#fafcff'; }} onMouseLeave={e => { (e.currentTarget as any).style.backgroundColor = ''; }}>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}><span style={{ fontFamily: 'monospace', background: '#f4f7fb', padding: '2px 8px', borderRadius: 6 }}>{c.complaint_number}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: NAVY }}>{c.title}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: SLATE }}>{c.category_display}</td>
                        <td style={{ padding: '12px 16px' }}><StatusBadge status={c.status} /></td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>{fmtDate(c.created_at)}</td>
                      </tr>))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Verification Tab */}
{/* Verification Tab */}
{activeTab === 5 && (
  <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
    <TabHead title="Verification Status" count={kycStatus ? 1 : 0} />
    <div style={{ padding: '28px' }}>
      {kycStatus ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', 
              background: kycStatus.status === 'approved' ? '#dcfce7' : kycStatus.status === 'pending' ? '#fef3c7' : '#fee2e2', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, 
              border: `2px solid ${kycStatus.status === 'approved' ? GREEN : kycStatus.status === 'pending' ? AMBER : RED}` 
            }}>
              {kycStatus.status === 'approved' ? '✓' : kycStatus.status === 'pending' ? '⏳' : '✗'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>KYC Verification</div>
              <StatusBadge status={kycStatus.status} />
              {kycStatus.status === 'rejected' && kycStatus.rejection_reason && (
                <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>Reason: {kycStatus.rejection_reason}</div>
              )}
            </div>
          </div>
          
          {kycStatus.status === 'approved' && (
            <div style={{ background: '#dcfce7', padding: 16, borderRadius: 12, color: '#166534', fontSize: 14, border: '1px solid #bbf7d0' }}>
              ✅ Your identity has been verified. You can now list properties with a verified badge.
            </div>
          )}
          
          {kycStatus.status === 'pending' && (
            <div style={{ background: '#fef3c7', padding: 16, borderRadius: 12, color: '#92400e', fontSize: 14, border: '1px solid #fde68a' }}>
              ⏳ Your verification is pending review. We'll notify you once it's complete.
            </div>
          )}
          
          {(kycStatus.status === 'rejected' || kycStatus.status === 'requires_update') && (
            <div>
              <div style={{ background: '#fee2e2', padding: 16, borderRadius: 12, marginBottom: 16, color: '#991b1b', fontSize: 14, border: '1px solid #fecaca' }}>
                ❌ Your verification was rejected. Please submit new documents.
              </div>
              <button 
                onClick={() => navigate('/kyc/upload')} 
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(230,57,70,0.25)' }}
              >
                Resubmit Documents →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>Verify Your Identity</div>
          <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Get verified to earn the trusted badge and increase your listing credibility
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button 
              onClick={() => navigate('/kyc/upload')} 
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(230,57,70,0.3)' }}
            >
              Start Verification →
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}
          </div>
        </div>
      </div>

      {/* Modals */}
      {deleteOpen && propToDelete && (<ConfirmModal title={deleteBlocked ? 'Cannot Delete Property' : 'Delete Property?'} desc={deleteBlocked ? `"${propToDelete.title}" has active bookings. Cancel them first before deleting.` : `Are you sure you want to delete "${propToDelete.title}"? This cannot be undone.`} onConfirm={handleDelete} onClose={() => { setDeleteOpen(false); setPropToDelete(null); }} loading={submitLoading} blocked={deleteBlocked} />)}
      <PropertyDetailModal property={detailOpen ? selectedProp : null} onClose={() => { setDetailOpen(false); setSelectedProp(null); }} />
      <BoostModal open={boostOpen} onClose={() => { setBoostOpen(false); setBoostProp(null); }} propertyId={boostProp?.id || ''} propertyTitle={boostProp?.title || ''} onBoostSuccess={() => { fetchAllData(); showToast('Property boosted successfully!'); }} />
      
      {/* Booking History Modal */}
      <BookingHistoryModal booking={historyBooking} history={bookingHistory} loading={historyLoading} onClose={() => { setHistoryBooking(null); setBookingHistory([]); }} />
    </div>
  );
};

// ─── Global keyframes ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('db-styles-v2')) {
  const el = document.createElement('style');
  el.id = 'db-styles-v2';
  el.textContent = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap'); @keyframes dbSpin { to { transform: rotate(360deg); } } @keyframes dbFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } } @keyframes dbFadeDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } } @keyframes dbModalIn { from { opacity:0; transform:translate(-50%,-47%) scale(0.96); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } } tbody tr:hover td { background-color: #fafcff !important; } ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } input:focus, textarea:focus, select:focus { border-color: #e63946 !important; outline: none; }`;
  document.head.appendChild(el);
}

export default Dashboard