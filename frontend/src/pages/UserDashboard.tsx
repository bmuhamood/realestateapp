/**
 * UserDashboard.tsx — Fixed for new BookingSerializer shape
 *
 * New API shape per bookings/serializers.py:
 *   b.property_detail  → nested Property object  (source='property_obj')
 *   b.user_detail      → nested User object       (source='user')
 *   b.property         → UUID string              (added in to_representation)
 *   b.property_obj     → UUID string              (raw FK)
 *   b.user             → integer user ID          (raw FK)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { chatAPI, complaintAPI, dealAPI, kycAPI } from '../services/api';
import { Booking, Favorite, Payment, Review } from '../types';
import { notificationService } from '../services/notificationService';
import ChatModal from '../components/Chat/ChatModal';
import type { Conversation, Message, Complaint, DealRoom, KYCStatus } from '../types';

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const R = '#e63946';
const R_DARK = '#c1121f';
const R_LIGHT = 'rgba(230,57,70,0.08)';
const R_MID = 'rgba(230,57,70,0.15)';
const T = '#25a882';
const T_LIGHT = 'rgba(37,168,130,0.1)';
const NAVY = '#0d1b2e';
const NAVY2 = '#1e2d42';
const SLATE = '#64748b';
const BORDER = '#e8edf5';
const BG = '#f0f4f9';
const WHITE = '#ffffff';
const AMBER = '#f59e0b';
const GREEN = '#16a34a';
const ORANGE = '#ea580c';
const PURPLE = '#7c3aed';
const GRAY_100 = '#f8fafc';
const GRAY_200 = '#eef2f7';
const GRAY_400 = '#94a3b8';

// ─── Local Types ──────────────────────────────────────────────────────────────
interface ServiceBooking {
  id: number;
  service: {
    id: number; name: string; service_type: string;
    price: number; price_unit: string; image: string;
    provider: string; provider_phone: string;
  };
  booking_date: string; address: string;
  special_instructions: string; status: string;
  total_price: number; created_at: string;
}
interface KYCStatusData {
  status: string; rejection_reason?: string;
  admin_notes?: string; submitted_at?: string; reviewed_at?: string;
}

// ─── Cloudinary ───────────────────────────────────────────────────────────────
const CLOUD = 'drcy2xxkg';
const cloudUrl = (img: string | null | undefined): string => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) {
    if (img.includes('cloudinary.com') && !img.includes('f_auto')) {
      const p = img.split('/upload/');
      if (p.length === 2) return `${p[0]}/upload/f_auto,q_auto/${p[1]}`;
    }
    return img;
  }
  let c = img.includes('image/upload/') ? img.replace('image/upload/', '') : img;
  c = c.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/${c}`;
};

// ─── Booking normaliser ───────────────────────────────────────────────────────
/**
 * The new serializer keeps `property_detail` and `user_detail` as proper nested
 * objects. However some edge-cases (old cached responses, list mutations) may
 * still have the old flat shape. This function normalises both into one shape
 * the UI can rely on.
 */
const normaliseBooking = (b: any): Booking => {
  // property_detail is already set correctly by the new serializer
  const propDetail = b.property_detail ?? null;

  // user_detail is already set correctly by the new serializer
  const userDetail = b.user_detail ?? null;

  return {
    ...b,
    // Ensure the UUID string is always available as `property`
    property: b.property ?? b.property_obj ?? (typeof propDetail?.id === 'string' ? propDetail.id : undefined),
    property_detail: propDetail,
    user_detail: userDetail,
  } as Booking;
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('en-UG', {
  style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(n);

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};
const fmtTime = (d: string) => {
  try { return new Date(d).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return ''; }
};
const initials = (u: any) =>
  u?.first_name?.[0]?.toUpperCase() || u?.username?.[0]?.toUpperCase() || '?';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { bg: string; color: string; dot: string }> = {
  pending:         { bg: '#fef9ec', color: '#92400e', dot: AMBER },
  confirmed:       { bg: '#ecfdf5', color: '#065f46', dot: GREEN },
  completed:       { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' },
  cancelled:       { bg: '#fef2f2', color: '#991b1b', dot: R },
  approved:        { bg: '#ecfdf5', color: '#065f46', dot: GREEN },
  rejected:        { bg: '#fef2f2', color: '#991b1b', dot: R },
  requires_update: { bg: '#fef9ec', color: '#92400e', dot: AMBER },
  investigating:   { bg: '#f5f3ff', color: '#5b21b6', dot: PURPLE },
  resolved:        { bg: '#ecfdf5', color: '#065f46', dot: GREEN },
  dismissed:       { bg: GRAY_200,  color: SLATE,    dot: GRAY_400 },
  escalated:       { bg: '#fef2f2', color: '#991b1b', dot: R },
  negotiation:     { bg: '#f5f3ff', color: '#5b21b6', dot: PURPLE },
  deposit:         { bg: '#fef9ec', color: '#92400e', dot: AMBER },
  contract:        { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' },
  closing:         { bg: T_LIGHT,   color: '#065f46', dot: T },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_MAP[status] || { bg: GRAY_200, color: SLATE, dot: GRAY_400 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      backgroundColor: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
      textTransform: 'capitalize', whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Pill Button ──────────────────────────────────────────────────────────────
const Pill: React.FC<{
  label: string; icon?: string; onClick: () => void;
  variant?: 'primary' | 'danger' | 'amber' | 'teal' | 'ghost';
  small?: boolean;
}> = ({ label, icon, onClick, variant = 'ghost', small }) => {
  const variants = {
    primary: { bg: R_LIGHT, color: R, border: R_MID },
    danger:  { bg: '#fef2f2', color: '#b91c1c', border: 'rgba(239,68,68,0.25)' },
    amber:   { bg: '#fef9ec', color: '#92400e', border: 'rgba(245,158,11,0.25)' },
    teal:    { bg: T_LIGHT, color: T, border: 'rgba(37,168,130,0.25)' },
    ghost:   { bg: GRAY_100, color: SLATE, border: BORDER },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '4px 10px' : '6px 13px',
      borderRadius: 8, border: `1.5px solid ${v.border}`,
      backgroundColor: v.bg, color: v.color,
      fontSize: small ? 11 : 12, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit',
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: string; label: string; value: string | number;
  accent: string; sub?: string; delay?: string;
}> = ({ icon, label, value, accent, sub, delay = '0s' }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: WHITE, borderRadius: 18, padding: '18px 20px',
        border: `1.5px solid ${hov ? accent : BORDER}`,
        boxShadow: hov ? `0 8px 28px rgba(0,0,0,0.09)` : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.2s', transform: hov ? 'translateY(-2px)' : 'none',
        animation: `dbUp 0.45s ease-out ${delay} both`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: `${accent}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: GRAY_400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ fontSize: 21, fontWeight: 900, color: accent, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: GRAY_400, marginTop: 1 }}>{sub}</div>}
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
    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
    padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
    textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
    background: active ? R_LIGHT : 'transparent',
    color: active ? R : SLATE,
    fontWeight: active ? 700 : 500, fontSize: 13,
    borderLeft: active ? `3px solid ${R}` : '3px solid transparent',
  }}>
    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {(unread && unread > 0) ? (
      <span style={{ background: R, color: WHITE, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99 }}>
        {unread > 9 ? '9+' : unread}
      </span>
    ) : (count != null && count > 0) ? (
      <span style={{
        background: active ? R : GRAY_200, color: active ? WHITE : GRAY_400,
        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
      }}>{count}</span>
    ) : null}
  </button>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{
  icon: string; title: string; desc: string; btnLabel: string; onClick: () => void;
}> = ({ icon, title, desc, btnLabel, onClick }) => (
  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
    <div style={{
      width: 80, height: 80, borderRadius: '50%', background: GRAY_100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 36, margin: '0 auto 16px',
    }}>{icon}</div>
    <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800 }}>{title}</h3>
    <p style={{ margin: '0 0 24px', color: GRAY_400, fontSize: 13, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>{desc}</p>
    <button onClick={onClick} style={{
      padding: '10px 26px', borderRadius: 10, border: 'none',
      background: R, color: WHITE, fontSize: 13, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: '0 4px 14px rgba(230,57,70,0.3)',
    }}>{btnLabel}</button>
  </div>
);

// ─── Modal Backdrop ───────────────────────────────────────────────────────────
const Backdrop: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.55)',
    backdropFilter: 'blur(6px)', zIndex: 1000,
  }} />
);

const ModalBox: React.FC<{ children: React.ReactNode; maxW?: number }> = ({ children, maxW = 420 }) => (
  <div style={{
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    width: '95%', maxWidth: maxW,
    background: WHITE, borderRadius: 22, zIndex: 1001,
    boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
    animation: 'dbModal 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    overflow: 'hidden',
  }}>{children}</div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
  title: string; desc: string;
  onConfirm: () => void; onClose: () => void; loading?: boolean;
}> = ({ title, desc, onConfirm, onClose, loading }) => (
  <>
    <Backdrop onClose={onClose} />
    <ModalBox>
      <div style={{ padding: '28px 28px 24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800 }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: SLATE, fontSize: 13, lineHeight: 1.7 }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={s.modalSecBtn}>Keep it</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...s.modalPrimBtn, background: '#ef4444', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </ModalBox>
  </>
);

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal: React.FC<{
  title: string; onClose: () => void; onSubmit: () => void;
  rating: number; setRating: (r: number) => void;
  comment: string; setComment: (c: string) => void; loading?: boolean;
}> = ({ title, onClose, onSubmit, rating, setRating, comment, setComment, loading }) => (
  <>
    <Backdrop onClose={onClose} />
    <ModalBox maxW={460}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${GRAY_200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800 }}>{title}</h3>
        <button onClick={onClose} style={s.closeBtn}>✕</button>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={s.fieldLabel}>Your Rating</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setRating(i)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 28, transition: 'transform 0.1s',
                transform: i <= rating ? 'scale(1.15)' : 'scale(1)',
              }}>{i <= rating ? '⭐' : '☆'}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={s.fieldLabel}>Your Review</div>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience…" rows={4} style={s.textarea} />
        </div>
      </div>
      <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={s.modalSecBtn}>Cancel</button>
        <button onClick={onSubmit} disabled={loading} style={{ ...s.modalPrimBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Submitting…' : '✓ Submit Review'}
        </button>
      </div>
    </ModalBox>
  </>
);

// ─── Profile Modal ────────────────────────────────────────────────────────────
const ProfileModal: React.FC<{
  data: any; onChange: (d: any) => void;
  onClose: () => void; onSave: () => void; loading: boolean;
}> = ({ data, onChange, onClose, onSave, loading }) => (
  <>
    <Backdrop onClose={onClose} />
    <ModalBox maxW={500}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${GRAY_200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: WHITE, zIndex: 2 }}>
        <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800 }}>Edit Profile</h3>
        <button onClick={onClose} style={s.closeBtn}>✕</button>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto' }}>
        {[
          { label: 'First Name', key: 'first_name', type: 'text' },
          { label: 'Last Name', key: 'last_name', type: 'text' },
          { label: 'Phone', key: 'phone', type: 'tel' },
          { label: 'Email', key: 'email', type: 'email', disabled: true },
          { label: 'Location', key: 'location', type: 'text' },
        ].map(f => (
          <div key={f.key}>
            <div style={s.fieldLabel}>{f.label}</div>
            <input type={f.type} value={data[f.key] || ''}
              onChange={e => onChange({ ...data, [f.key]: e.target.value })}
              disabled={f.disabled}
              style={{ ...s.input, background: f.disabled ? GRAY_100 : WHITE, color: f.disabled ? GRAY_400 : NAVY }} />
          </div>
        ))}
      </div>
      <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={s.modalSecBtn}>Cancel</button>
        <button onClick={onSave} disabled={loading} style={{ ...s.modalPrimBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving…' : '✓ Save Changes'}
        </button>
      </div>
    </ModalBox>
  </>
);

// ─── Booking History Modal ────────────────────────────────────────────────────
const BookingHistoryModal: React.FC<{
  booking: Booking; history: any[]; loading: boolean; onClose: () => void;
}> = ({ booking, history, loading, onClose }) => {
  const prop = booking.property_detail;
  return (
    <>
      <Backdrop onClose={onClose} />
      <ModalBox maxW={560}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${GRAY_200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800 }}>Booking History</h3>
            {prop?.title && <div style={{ fontSize: 12, color: GRAY_400, marginTop: 3 }}>🏠 {prop.title}</div>}
          </div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Booking summary */}
        <div style={{ padding: '16px 24px', background: GRAY_100, borderBottom: `1px solid ${GRAY_200}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={s.fieldLabel}>Visit Date</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{fmtDate(booking.visit_date)}</div>
              <div style={{ fontSize: 11, color: GRAY_400 }}>{fmtTime(booking.visit_date)}</div>
            </div>
            <div>
              <div style={s.fieldLabel}>Status</div>
              <StatusBadge status={booking.status} />
            </div>
            {/* {booking.booking_reference && (
              <div>
                <div style={s.fieldLabel}>Reference</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', background: WHITE, padding: '3px 8px', borderRadius: 6, border: `1px solid ${BORDER}`, display: 'inline-block' }}>{booking.booking_reference}</div>
              </div>
            )} */}
            {booking.message && (
              <div>
                <div style={s.fieldLabel}>Note</div>
                <div style={{ fontSize: 12, color: SLATE, fontStyle: 'italic' }}>"{booking.message}"</div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ padding: '16px 24px', maxHeight: 320, overflowY: 'auto' }}>
          <div style={s.fieldLabel}>Activity Timeline</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: GRAY_400, fontSize: 13 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${GRAY_200}`, borderTop: `2px solid ${R}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 10px' }} />
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: GRAY_400, fontSize: 13 }}>No history recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
              {history.map((h: any, i: number) => (
                <div key={h.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                  {/* vertical line */}
                  {i < history.length - 1 && (
                    <div style={{ position: 'absolute', left: 15, top: 28, bottom: -4, width: 2, background: GRAY_200 }} />
                  )}
                  {/* dot */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: h.new_status === 'confirmed' ? '#ecfdf5'
                      : h.new_status === 'completed' ? '#eff6ff'
                      : h.new_status === 'cancelled' ? '#fef2f2'
                      : GRAY_100,
                    border: `2px solid ${h.new_status === 'confirmed' ? GREEN
                      : h.new_status === 'completed' ? '#3b82f6'
                      : h.new_status === 'cancelled' ? R
                      : GRAY_200}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  }}>
                    {h.new_status === 'confirmed' ? '✓'
                      : h.new_status === 'completed' ? '🏁'
                      : h.new_status === 'cancelled' ? '✗'
                      : h.action === 'created' ? '📅'
                      : '↻'}
                  </div>
                  <div style={{ paddingBottom: 20, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'capitalize' }}>
                      {h.action_display || h.action}
                      {h.old_status && h.new_status && (
                        <span style={{ fontWeight: 400, color: GRAY_400, fontSize: 11 }}>
                          {' '}— {h.old_status} → {h.new_status}
                        </span>
                      )}
                    </div>
                    {h.notes && <div style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>{h.notes}</div>}
                    <div style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>
                      {h.changed_by_name && <span>by {h.changed_by_name} · </span>}
                      {fmtDate(h.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '0 24px 20px' }}>
          <button onClick={onClose} style={{ ...s.modalSecBtn, width: '100%' }}>Close</button>
        </div>
      </ModalBox>
    </>
  );
};

// ─── Notification Panel ───────────────────────────────────────────────────────
const NotifPanel: React.FC<{
  notifs: any[]; unread: number;
  onRead: (id: number) => void; onReadAll: () => void;
  onClose: () => void; onNavigate: (url: string) => void;
}> = ({ notifs, unread, onRead, onReadAll, onClose, onNavigate }) => (
  <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 800 }} onClick={onClose} />
    <div style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 8,
      width: 380, background: WHITE, borderRadius: 18,
      boxShadow: '0 16px 48px rgba(0,0,0,0.15)', border: `1px solid ${BORDER}`,
      zIndex: 900, overflow: 'hidden', animation: 'dbDown 0.18s ease-out',
    }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${GRAY_200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" }}>Notifications</span>
        {unread > 0 && <button onClick={onReadAll} style={{ background: 'none', border: 'none', color: R, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Mark all read</button>}
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: GRAY_400, fontSize: 13 }}>🔔 No notifications yet</div>
        ) : notifs.map(n => (
          <div key={n.id} onClick={() => { if (!n.read) onRead(n.id); if (n.url) { onNavigate(n.url); onClose(); } }}
            style={{
              padding: '12px 18px', borderBottom: `1px solid ${GRAY_100}`, cursor: 'pointer',
              background: n.read ? WHITE : '#fdf4f4',
              display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.15s',
            }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: n.read ? GRAY_100 : R_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {n.type === 'booking' ? '📅' : n.type === 'payment' ? '💰' : '🔔'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: NAVY, marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>{n.message}</div>
              <div style={{ fontSize: 10, color: GRAY_400, marginTop: 4 }}>{fmtDate(n.created_at)}</div>
            </div>
            {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: R, flexShrink: 0, marginTop: 5 }} />}
          </div>
        ))}
      </div>
    </div>
  </>
);

// ─── Conversation List ────────────────────────────────────────────────────────
const ConversationList: React.FC<{
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  selectedId?: string;
}> = ({ conversations, onSelect, selectedId }) => {
  if (conversations.length === 0) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
        <div style={{ color: GRAY_400, fontSize: 13, fontWeight: 600 }}>No conversations yet</div>
        <div style={{ color: GRAY_400, fontSize: 12, marginTop: 4 }}>When you message agents, they'll appear here</div>
      </div>
    );
  }
  return (
    <div>
      {conversations.map(conv => (
        <div key={conv.id} onClick={() => onSelect(conv)} style={{
          padding: '13px 16px', borderBottom: `1px solid ${GRAY_100}`, cursor: 'pointer',
          background: selectedId === conv.id ? R_LIGHT : conv.unread_count > 0 ? '#fdf9f9' : WHITE,
          transition: 'background 0.15s',
          borderLeft: selectedId === conv.id ? `3px solid ${R}` : '3px solid transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: R_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, overflow: 'hidden', flexShrink: 0,
              border: selectedId === conv.id ? `2px solid ${R}` : '2px solid transparent',
            }}>
              {conv.other_participant?.profile_picture_url
                ? <img src={conv.other_participant.profile_picture_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ fontWeight: 700, color: R, fontSize: 14 }}>
                    {conv.other_participant?.first_name?.[0] || conv.other_participant?.username?.[0] || 'U'}
                  </span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: conv.unread_count > 0 ? 700 : 600, fontSize: 13, color: NAVY }}>
                  {conv.other_participant?.full_name || conv.other_participant?.username}
                </div>
                <div style={{ fontSize: 10, color: GRAY_400, flexShrink: 0, marginLeft: 8 }}>
                  {new Date(conv.last_message_time).toLocaleDateString()}
                </div>
              </div>
              <div style={{ fontSize: 12, color: SLATE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                {conv.last_message_preview}
              </div>
              {conv.property_data && (
                <div style={{ fontSize: 10, color: T, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                  🏠 {conv.property_data.title?.substring(0, 35)}
                </div>
              )}
            </div>
            {conv.unread_count > 0 && (
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: R, flexShrink: 0 }} />
            )}
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (conversation && textareaRef.current) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [conversation?.id]);

  const handleSend = useCallback(() => {
    const t = text.trim();
    if (!t || !conversation) return;
    onSend(t); setText(''); textareaRef.current?.focus();
  }, [text, conversation, onSend]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  if (!conversation) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
      <div style={{ fontSize: 48 }}>💬</div>
      <div style={{ fontWeight: 700, color: NAVY, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>Select a conversation</div>
      <div style={{ color: GRAY_400, fontSize: 13 }}>Choose a chat on the left to start messaging</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${GRAY_200}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: GRAY_100 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: R_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: R, flexShrink: 0 }}>
          {conversation.other_participant?.first_name?.[0] || conversation.other_participant?.username?.[0] || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{conversation.other_participant?.full_name || conversation.other_participant?.username}</div>
          <div style={{ fontSize: 11, color: GRAY_400 }}>{conversation.property_data ? `Re: ${conversation.property_data.title}` : 'Direct Message'}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: GRAY_400, marginTop: 40, fontSize: 13 }}>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: GRAY_400, marginTop: 60, fontSize: 13 }}>No messages yet — say hello! 👋</div>
        ) : messages.map(msg => {
          const mine = typeof msg.is_sender === 'boolean' ? msg.is_sender : (currentUserId != null ? msg.sender === currentUserId : false);
          return (
            <div key={msg.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
              {!mine && <div style={{ fontSize: 10, fontWeight: 700, color: R, marginBottom: 3, marginLeft: 4 }}>{msg.sender_name}</div>}
              <div style={{
                background: mine ? R : GRAY_200, color: mine ? WHITE : NAVY,
                padding: '10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word',
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
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${GRAY_200}`, background: WHITE, flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)" rows={2}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 14, border: `1.5px solid ${BORDER}`, fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', background: GRAY_100, color: NAVY, lineHeight: 1.5, minHeight: 0, maxHeight: 120, overflowY: 'auto' }} />
        <button onClick={handleSend} disabled={!text.trim() || loading}
          style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: !text.trim() || loading ? GRAY_200 : R, color: !text.trim() || loading ? GRAY_400 : WHITE, fontSize: 13, fontWeight: 700, cursor: !text.trim() || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0, boxShadow: !text.trim() ? 'none' : '0 4px 12px rgba(230,57,70,0.3)' }}>
          Send ↑
        </button>
      </div>
    </div>
  );
};

// ─── Table helpers ────────────────────────────────────────────────────────────
const TH: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: GRAY_400, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, background: GRAY_100 }}>{children}</th>
);
const TD: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style: extraStyle }) => (
  <td style={{ padding: '13px 16px', verticalAlign: 'middle', borderBottom: `1px solid ${GRAY_100}`, ...extraStyle }}>{children}</td>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ title: string; count?: string | number; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, count, children, actions }) => (
  <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', animation: 'dbUp 0.35s ease-out both' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${GRAY_200}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: NAVY }}>{title}</h2>
        {count !== undefined && <span style={{ fontSize: 11, fontWeight: 700, color: GRAY_400, background: GRAY_100, padding: '2px 10px', borderRadius: 99 }}>{count}</span>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
    {children}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?.id;

  const [chatModal, setChatModal] = useState<{ isOpen: boolean; recipientId: number; recipientName: string; propertyId?: string; propertyTitle?: string }>({ isOpen: false, recipientId: 0, recipientName: '' });

  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [svcBookings, setSvcBookings] = useState<ServiceBooking[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [deals, setDeals] = useState<DealRoom[]>([]);
  const [kycStatus, setKycStatus] = useState<KYCStatusData | null>(null);

  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Booking history modal
  const [historyBooking, setHistoryBooking] = useState<Booking | null>(null);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Other modals
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelSvc, setCancelSvc] = useState<ServiceBooking | null>(null);
  const [reviewProp, setReviewProp] = useState<any>(null);
  const [reviewSvc, setReviewSvc] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '', last_name: user?.last_name || '',
    phone: user?.phone || '', email: user?.email || '', location: user?.location || '',
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    fetchAllData();
    fetchNotifs();
    notificationService.onConnectionStatus(c => setWsConnected(c));
    notificationService.subscribe(n => {
      setNotifications(prev => [n, ...prev]);
      setUnread(u => u + 1);
      showToast(`🔔 ${n.title}: ${n.message}`);
    });
    return () => { notificationService.disconnect(); };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [bRes, sbRes, fRes, pRes, rRes, convRes, cRes, dRes, kRes] = await Promise.allSettled([
        api.get('/bookings/my/'),
        api.get('/services/bookings/'),
        api.get('/properties/favorites/'),
        api.get('/payments/'),
        api.get('/reviews/'),
        chatAPI.getConversations(),
        complaintAPI.getMyComplaints(),
        dealAPI.getDeals(),
        kycAPI.getStatus(),
      ]);

      const g = (r: any) => r.status === 'fulfilled' ? (r.value.data?.results ?? r.value.data ?? []) : [];

      // ── Bookings: normalise to ensure property_detail / user_detail are populated ──
      const rawBookings: any[] = g(bRes);
      setBookings(rawBookings.map(normaliseBooking));

      setSvcBookings(g(sbRes));

      const favRaw = g(fRes);
      setFavorites(favRaw.map((p: any) => ({
        ...p,
        images: p.images?.map((img: any) => ({ ...img, image_url: cloudUrl(img.image || img.image_url) })) || [],
      })));

      setPayments(g(pRes));
      setReviews(g(rRes));

      const convData = g(convRes);
      setConversations(convData);

      setComplaints((() => {
        if (cRes.status !== 'fulfilled') return [];
        const d = cRes.value.data as any;
        return (Array.isArray(d) ? d : (d?.results ?? [])) as Complaint[];
      })());

      setDeals(g(dRes));
setKycStatus(kRes.status === 'fulfilled' && kRes.value?.data ? kRes.value.data as KYCStatusData : null);
console.log('KYC Status data:', kRes.status === 'fulfilled' ? kRes.value?.data : 'No data');
console.log('KYC Status null check:', kRes.status === 'fulfilled' && kRes.value?.data ? 'Has data' : 'Null or no data');      setUnread(convData.reduce((a: number, c: Conversation) => a + (c.unread_count || 0), 0));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchNotifs = async () => {
    try {
      const ns = await notificationService.getNotifications({ limit: 20 });
      setNotifications(ns);
      const cnt = await notificationService.getUnreadCount();
      setUnread(cnt);
    } catch { /* silent */ }
  };

  // ── Booking history ────────────────────────────────────────────────────────
  const openBookingHistory = async (b: Booking) => {
    setHistoryBooking(b);
    setBookingHistory([]);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/bookings/${b.id}/history/`);
      const data = res.data?.results ?? res.data ?? [];
      setBookingHistory(Array.isArray(data) ? data : []);
    } catch {
      setBookingHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setMsgLoading(true);
    try {
      const res = await chatAPI.getMessages(convId);
      let data: Message[] = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.results) data = res.data.results;
      setMessages(data);
      await chatAPI.markMessagesRead(convId);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
    } catch (e) { console.error(e); }
    finally { setMsgLoading(false); }
  };

  const handleSelectConv = (conv: Conversation) => { setSelectedConv(conv); fetchMessages(conv.id); };

  const handleSendMessage = async (content: string) => {
    if (!selectedConv) return;
    try {
      await chatAPI.sendMessage(selectedConv.id, content);
      fetchMessages(selectedConv.id);
      const r = await chatAPI.getConversations();
      setConversations(r.data?.results ?? r.data ?? []);
    } catch { showToast('Failed to send message'); }
  };

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;
    setCancelLoading(true);
    try {
      await api.post(`/bookings/${cancelBooking.id}/cancel/`);
      await fetchAllData(); showToast('✅ Booking cancelled.'); setCancelBooking(null);
    } catch { showToast('❌ Failed to cancel.'); }
    finally { setCancelLoading(false); }
  };

  const handleCancelSvc = async () => {
    if (!cancelSvc) return;
    setCancelLoading(true);
    try {
      await api.patch(`/services/bookings/${cancelSvc.id}/status/`, { status: 'cancelled' });
      await fetchAllData(); showToast('✅ Service booking cancelled.'); setCancelSvc(null);
    } catch { showToast('❌ Failed to cancel.'); }
    finally { setCancelLoading(false); }
  };

  const handleRemoveFav = async (propertyId: string) => {
    try {
      await api.post(`/properties/${propertyId}/like/`);
      await fetchAllData(); showToast('✅ Removed from favorites.');
    } catch { showToast('❌ Failed to remove.'); }
  };

  const handleReview = async () => {
    if (!reviewProp) return;
    setReviewLoading(true);
    try {
      await api.post('/reviews/', { agent: reviewProp.owner?.id, property: reviewProp.id, rating: reviewRating, comment: reviewComment });
      await fetchAllData(); showToast('✅ Review submitted!');
      setReviewProp(null); setReviewRating(5); setReviewComment('');
    } catch { showToast('❌ Failed to submit review.'); }
    finally { setReviewLoading(false); }
  };

  const handleSvcReview = async () => {
    if (!reviewSvc) return;
    setReviewLoading(true);
    try {
      await api.post('/services/reviews/', { service: reviewSvc.id, rating: reviewRating, comment: reviewComment });
      await fetchAllData(); showToast('✅ Service review submitted!');
      setReviewSvc(null); setReviewRating(5); setReviewComment('');
    } catch { showToast('❌ Failed to submit.'); }
    finally { setReviewLoading(false); }
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await api.patch('/users/me/', profileData);
      showToast('✅ Profile updated!'); setProfileOpen(false);
      setTimeout(() => window.location.reload(), 800);
    } catch { showToast('❌ Failed to update profile.'); }
    finally { setProfileLoading(false); }
  };

  const handleMsgAgent = (agentId?: number, agentName?: string, propertyId?: string, propertyTitle?: string) => {
    if (!agentId) { showToast('Opening messages…'); setActiveTab(3); return; }
    setChatModal({ isOpen: true, recipientId: agentId, recipientName: agentName || 'Agent', propertyId, propertyTitle });
  };

  const stats = {
    bookings: bookings.length, svcBooks: svcBookings.length,
    favorites: favorites.length, spent: payments.reduce((s, p) => s + p.amount, 0),
    deals: deals.length, complaints: complaints.length,
  };

  const TABS = [
    { icon: '🏠', label: 'Property Bookings', count: stats.bookings },
    { icon: '🔧', label: 'Service Bookings', count: stats.svcBooks },
    { icon: '❤️', label: 'Saved Properties', count: stats.favorites },
    { icon: '💬', label: 'Messages', unread },
    { icon: '🤝', label: 'My Deals', count: stats.deals },
    { icon: '⚖️', label: 'Complaints', count: stats.complaints },
    { icon: '💳', label: 'Payments', count: payments.length },
    { icon: '⭐', label: 'My Reviews', count: reviews.length },
    { icon: '✅', label: 'Verification' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, marginTop: 64 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 42, height: 42, border: `3px solid ${GRAY_200}`, borderTop: `3px solid ${R}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: GRAY_400, fontSize: 13 }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 64 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: NAVY2, color: WHITE, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 28px rgba(0,0,0,0.22)', animation: 'dbDown 0.25s ease-out', whiteSpace: 'nowrap', borderLeft: `3px solid ${R}` }}>
          {toast}
          <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, marginLeft: 6 }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 20px 72px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24, background: WHITE, borderRadius: 20, padding: '20px 24px', border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: 'dbUp 0.4s ease-out both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: R_LIGHT, border: `2.5px solid ${R}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: R, fontSize: 22, fontWeight: 800, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              {user?.profile_picture
                ? <img src={user.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span style={{ fontFamily: "'Sora', sans-serif" }}>{initials(user)}</span>
              }
              {wsConnected && <span style={{ position: 'absolute', bottom: 2, right: 2, width: 11, height: 11, borderRadius: '50%', background: T, border: '2px solid #fff' }} />}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 21, fontWeight: 900, color: NAVY, margin: '0 0 3px', letterSpacing: '-0.02em' }}>{user?.first_name || user?.username || 'User'}</h1>
              <p style={{ fontSize: 12, color: GRAY_400, margin: 0 }}>{user?.email}</p>
              {kycStatus?.status && <div style={{ marginTop: 5 }}><StatusBadge status={kycStatus.status} /></div>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotif(v => !v)} style={{ background: R_LIGHT, border: `1.5px solid ${R_MID}`, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, position: 'relative', transition: 'all 0.15s' }}>
                🔔
                {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 17, height: 17, borderRadius: '50%', background: R, color: WHITE, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotif && (
                <NotifPanel notifs={notifications} unread={unread}
                  onRead={async id => { await notificationService.markAsRead(id); setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)); setUnread(u => Math.max(0, u - 1)); }}
                  onReadAll={async () => { await notificationService.markAllAsRead(); setNotifications(p => p.map(n => ({ ...n, read: true }))); setUnread(0); }}
                  onClose={() => setShowNotif(false)}
                  onNavigate={url => navigate(url)}
                />
              )}
            </div>
            <button onClick={() => setProfileOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: WHITE, color: NAVY, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit Profile</button>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${R_MID}`, background: R_LIGHT, color: R, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Logout</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="🏠" label="Bookings" value={stats.bookings} accent={R} delay="0s" />
          <StatCard icon="🔧" label="Services" value={stats.svcBooks} accent={AMBER} delay="0.06s" />
          <StatCard icon="❤️" label="Favorites" value={stats.favorites} accent={T} delay="0.12s" />
          <StatCard icon="💳" label="Total Spent" value={fmt(stats.spent)} accent={GREEN} delay="0.18s" sub="All payments" />
          <StatCard icon="💬" label="Unread" value={unread} accent={PURPLE} delay="0.24s" />
          <StatCard icon="🤝" label="Active Deals" value={stats.deals} accent={ORANGE} delay="0.3s" />
        </div>

        {/* Main Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '214px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Sidebar */}
          <nav style={{ background: WHITE, borderRadius: 18, padding: '16px 12px', border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 88, animation: 'dbUp 0.4s ease-out 0.1s both' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: GRAY_400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, padding: '0 4px' }}>Navigation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${GRAY_200}` }}>
              {TABS.map((tab, i) => (
                <NavTab key={i} icon={tab.icon} label={tab.label}
                  count={(tab as any).count} unread={(tab as any).unread}
                  active={activeTab === i} onClick={() => setActiveTab(i)} />
              ))}
            </div>
            <button onClick={() => navigate('/properties')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: R, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(230,57,70,0.28)' }}>🔍 Browse Properties</button>
          </nav>

          {/* Content */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* ── Property Bookings ── */}
            {activeTab === 0 && (
              <SectionCard title="Property Bookings" count={`${bookings.length} total`}>
                {bookings.length === 0 ? (
                  <EmptyState icon="🏚️" title="No bookings yet" desc="Schedule viewings of properties you're interested in." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><TH>Property</TH><TH>Agent</TH><TH>Visit Date</TH><TH>Status</TH><TH>Note</TH><TH>Actions</TH></tr></thead>
                      <tbody>
                        {bookings.map(b => {
                          const prop = b.property_detail;
                          const owner = prop?.owner;
                          const agentName = owner?.full_name
                            || ((owner?.first_name || '') + ' ' + (owner?.last_name || '')).trim()
                            || owner?.username || '—';
                          const agentPhone = owner?.phone || '—';
                          const agentId = owner?.id;

                          // Property image thumbnail
                          const imgRaw = prop?.images?.find((i: any) => i.is_main) || prop?.images?.[0];
                          const imgUrl = imgRaw ? cloudUrl(imgRaw.image_url || imgRaw.image) : '';

                          return (
                            <tr key={b.id}>
                              <TD>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {imgUrl
                                    ? <img src={imgUrl} alt="" style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    : <div style={{ width: 44, height: 36, borderRadius: 8, background: GRAY_100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏠</div>
                                  }
                                  <div>
                                    <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>
                                      {prop?.title || <span style={{ color: GRAY_400, fontStyle: 'italic' }}>Loading…</span>}
                                    </div>
                                    {prop?.district && <div style={{ fontSize: 11, color: GRAY_400 }}>📍 {prop.district}{prop.city ? `, ${prop.city}` : ''}</div>}
                                  </div>
                                </div>
                              </TD>
                              <TD>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: R_LIGHT, border: `1.5px solid ${R}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: R, flexShrink: 0 }}>
                                    {agentName !== '—' ? agentName[0].toUpperCase() : '?'}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{agentName}</div>
                                    {agentPhone !== '—' && <div style={{ fontSize: 11, color: GRAY_400 }}>📞 {agentPhone}</div>}
                                  </div>
                                </div>
                              </TD>
                              <TD>
                                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(b.visit_date)}</div>
                                <div style={{ fontSize: 11, color: GRAY_400 }}>{fmtTime(b.visit_date)}</div>
                              </TD>
                              <TD><StatusBadge status={b.status} /></TD>
                              <TD><span style={{ fontSize: 12, color: SLATE }}>{b.message || '—'}</span></TD>
                              <TD>
                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                  {b.status === 'pending' && <Pill label="Cancel" variant="danger" onClick={() => setCancelBooking(b)} small />}
                                  {(b.status === 'confirmed' || b.status === 'completed') && (
                                    <Pill label="⭐ Review" variant="amber" onClick={() => { setReviewProp(prop); setReviewRating(5); setReviewComment(''); }} small />
                                  )}
                                  <Pill label="💬 Chat" variant="teal" onClick={() => handleMsgAgent(agentId, agentName !== '—' ? agentName : undefined, prop?.id, prop?.title)} small />
                                  <Pill label="📋 History" variant="ghost" onClick={() => openBookingHistory(b)} small />
                                  {prop?.id && <Pill label="View →" variant="primary" onClick={() => navigate(`/property/${prop.id}`)} small />}
                                </div>
                              </TD>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Service Bookings ── */}
            {activeTab === 1 && (
              <SectionCard title="Service Bookings" count={`${svcBookings.length} total`}>
                {svcBookings.length === 0 ? (
                  <EmptyState icon="🔧" title="No service bookings" desc="Book cleaning, moving, renovation and more." btnLabel="Browse Services" onClick={() => navigate('/services')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><TH>Service</TH><TH>Provider</TH><TH>Date</TH><TH>Status</TH><TH>Price</TH><TH>Actions</TH></tr></thead>
                      <tbody>
                        {svcBookings.map(sb => (
                          <tr key={sb.id}>
                            <TD>
                              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{sb.service.name}</div>
                              <div style={{ fontSize: 11, color: GRAY_400, marginTop: 2 }}>{sb.address}</div>
                            </TD>
                            <TD><span style={{ fontSize: 13, color: SLATE }}>{sb.service.provider}</span></TD>
                            <TD>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(sb.booking_date)}</div>
                              <div style={{ fontSize: 11, color: GRAY_400 }}>{fmtTime(sb.booking_date)}</div>
                            </TD>
                            <TD><StatusBadge status={sb.status} /></TD>
                            <TD><span style={{ fontSize: 13, fontWeight: 800, color: R }}>{fmt(sb.total_price)}</span></TD>
                            <TD>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {sb.status === 'pending' && <Pill label="Cancel" variant="danger" onClick={() => setCancelSvc(sb)} small />}
                                {sb.status === 'completed' && <Pill label="⭐ Review" variant="amber" onClick={() => { setReviewSvc(sb.service); setReviewRating(5); setReviewComment(''); }} small />}
                              </div>
                            </TD>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Favorites ── */}
            {activeTab === 2 && (
              <SectionCard title="Saved Properties" count={`${favorites.length} saved`}>
                {favorites.length === 0 ? (
                  <EmptyState icon="❤️" title="No saved properties" desc="Save properties you love for quick access." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, padding: '18px' }}>
                    {favorites.map(prop => {
                      const imgRaw = prop.images?.[0];
                      const imgUrl = imgRaw ? cloudUrl(imgRaw.image_url || imgRaw.image || imgRaw.url) : '';
                      return (
                        <div key={prop.id} style={{ borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden', background: WHITE, transition: 'box-shadow 0.2s, transform 0.2s' }}
                          onMouseEnter={e => { (e.currentTarget as any).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; (e.currentTarget as any).style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={e => { (e.currentTarget as any).style.boxShadow = 'none'; (e.currentTarget as any).style.transform = 'none'; }}>
                          {imgUrl
                            ? <div style={{ height: 148, overflow: 'hidden' }}><img src={imgUrl} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                            : <div style={{ height: 148, background: GRAY_100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏠</div>
                          }
                          <div style={{ padding: '14px' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: R, fontFamily: "'Sora', sans-serif" }}>{fmt(prop.price)}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, marginTop: 2 }}>{prop.title}</div>
                            <div style={{ fontSize: 11, color: GRAY_400, marginBottom: 12 }}>📍 {prop.district}, {prop.city}</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => navigate(`/property/${prop.id}`)} style={{ ...s.smallBtn, flex: 1, background: R_LIGHT, color: R, borderColor: R_MID }}>View</button>
                              <button onClick={() => handleRemoveFav(prop.id)} style={{ ...s.smallBtn, flex: 1, background: '#fef2f2', color: '#b91c1c', borderColor: 'rgba(239,68,68,0.25)' }}>Remove</button>
                              <button onClick={() => handleMsgAgent(prop.owner?.id, prop.owner?.full_name || prop.owner?.username, prop.id, prop.title)} style={{ ...s.smallBtn, background: T_LIGHT, color: T, borderColor: 'rgba(37,168,130,0.25)', padding: '6px 10px' }}>💬</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Messages ── */}
            {activeTab === 3 && (
              <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: '300px 1fr', height: 580, overflow: 'hidden' }}>
                <div style={{ borderRight: `1px solid ${GRAY_200}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${GRAY_200}`, background: GRAY_100, flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: NAVY, fontFamily: "'Sora', sans-serif" }}>Messages</div>
                    <div style={{ fontSize: 11, color: GRAY_400, marginTop: 2 }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <ConversationList conversations={conversations} onSelect={handleSelectConv} selectedId={selectedConv?.id} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                  <MessageView conversation={selectedConv} messages={messages} onSend={handleSendMessage} loading={msgLoading} currentUserId={currentUserId} />
                </div>
              </div>
            )}

            {/* ── My Deals ── */}
            {activeTab === 4 && (
              <SectionCard title="My Deals" count={`${deals.length} active`}>
                {deals.length === 0 ? (
                  <EmptyState icon="🤝" title="No active deals" desc="When you make offers on properties, deals will appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {deals.map(deal => (
                      <div key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)}
                        style={{ padding: '16px', borderRadius: 14, border: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'all 0.15s', background: GRAY_100 }}
                        onMouseEnter={e => { (e.currentTarget as any).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as any).style.background = WHITE; }}
                        onMouseLeave={e => { (e.currentTarget as any).style.boxShadow = 'none'; (e.currentTarget as any).style.background = GRAY_100; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{deal.property_data?.title || 'Property Deal'}</div>
                            <div style={{ fontSize: 11, color: GRAY_400, marginTop: 2 }}>Deal #{deal.deal_number}</div>
                          </div>
                          <StatusBadge status={deal.status} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {deal.agreed_price && <span style={{ fontWeight: 900, color: R, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>{fmt(deal.agreed_price)}</span>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                            <div style={{ width: 120, height: 6, background: GRAY_200, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${deal.progress_percentage}%`, height: '100%', background: T, transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ fontSize: 11, color: SLATE, fontWeight: 700 }}>{deal.progress_percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Complaints ── */}
            {activeTab === 5 && (
              <SectionCard title="My Complaints" count={`${complaints.length} total`}
                actions={<button onClick={() => navigate('/legal/complaints/new')} style={{ fontSize: 12, color: R, background: R_LIGHT, border: `1px solid ${R_MID}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>+ New</button>}>
                {complaints.length === 0 ? (
                  <EmptyState icon="⚖️" title="No complaints filed" desc="File a complaint if you have an issue with a property, agent, or service." btnLabel="File Complaint" onClick={() => navigate('/legal/complaints/new')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><TH>#</TH><TH>Title</TH><TH>Category</TH><TH>Status</TH><TH>Date</TH></tr></thead>
                      <tbody>
                        {complaints.map(c => (
                          <tr key={c.id} onClick={() => navigate(`/legal/complaints/${c.id}`)} style={{ cursor: 'pointer' }}>
                            <TD><span style={{ fontFamily: 'monospace', fontSize: 11, background: GRAY_100, padding: '2px 8px', borderRadius: 6 }}>{c.complaint_number}</span></TD>
                            <TD><span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{c.title}</span></TD>
                            <TD><span style={{ fontSize: 12, color: SLATE }}>{c.category_display}</span></TD>
                            <TD><StatusBadge status={c.status} /></TD>
                            <TD><span style={{ fontSize: 12, color: GRAY_400 }}>{fmtDate(c.created_at)}</span></TD>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Payments ── */}
            {activeTab === 6 && (
              <SectionCard title="Payment History" count={`${payments.length} transactions`}>
                {payments.length === 0 ? (
                  <EmptyState icon="💳" title="No payments yet" desc="Your payment history will appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><TH>Reference</TH><TH>Amount</TH><TH>Method</TH><TH>Status</TH><TH>Date</TH></tr></thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id}>
                            <TD><span style={{ fontFamily: 'monospace', fontSize: 12, background: GRAY_100, padding: '3px 9px', borderRadius: 6, border: `1px solid ${BORDER}` }}>{p.reference}</span></TD>
                            <TD><span style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>{fmt(p.amount)}</span></TD>
                            <TD><span style={{ fontSize: 12, background: GRAY_100, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>{p.payment_method}</span></TD>
                            <TD><StatusBadge status={p.status} /></TD>
                            <TD><span style={{ fontSize: 12, color: SLATE }}>{fmtDate(p.created_at)}</span></TD>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── Reviews ── */}
            {activeTab === 7 && (
              <SectionCard title="My Reviews" count={`${reviews.length} reviews`}>
                {reviews.length === 0 ? (
                  <EmptyState icon="⭐" title="No reviews yet" desc="Reviews you write will appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ background: GRAY_100, borderRadius: 14, padding: '16px', border: `1px solid ${BORDER}`, display: 'flex', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: R_LIGHT, border: `2px solid ${R}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: R, flexShrink: 0, fontSize: 15 }}>
                          {r.agent?.first_name?.[0]?.toUpperCase() || r.agent?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{r.agent?.first_name} {r.agent?.last_name || r.agent?.username}</div>
                              <div style={{ display: 'inline-flex', gap: 2, marginTop: 4 }}>
                                {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 13, color: i <= r.rating ? AMBER : GRAY_200 }}>★</span>)}
                              </div>
                            </div>
                            <span style={{ fontSize: 11, color: GRAY_400 }}>{fmtDate(r.created_at)}</span>
                          </div>
                          <p style={{ margin: '8px 0 0', fontSize: 13, color: SLATE, lineHeight: 1.6 }}>{r.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

        {/* ── Verification ── */}
{activeTab === 8 && (
  <SectionCard title="Identity Verification">
    <div style={{ padding: '28px' }}>
      {/* Check if KYC has been submitted (pending, approved, rejected, requires_update) */}
      {kycStatus && kycStatus.status && 
       (kycStatus.status === 'pending' || 
        kycStatus.status === 'approved' || 
        kycStatus.status === 'rejected' || 
        kycStatus.status === 'requires_update') ? (
        // Has KYC submission - show status
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ 
              width: 72, height: 72, borderRadius: '50%', 
              background: kycStatus.status === 'approved' ? '#ecfdf5' : kycStatus.status === 'pending' ? '#fef9ec' : '#fef2f2', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, 
              border: `2px solid ${kycStatus.status === 'approved' ? GREEN : kycStatus.status === 'pending' ? AMBER : R}` 
            }}>
              {kycStatus.status === 'approved' ? '✓' : kycStatus.status === 'pending' ? '⏳' : '✗'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>KYC Verification</div>
              <StatusBadge status={kycStatus.status} />
              {kycStatus.status === 'rejected' && kycStatus.rejection_reason && (
                <div style={{ color: R, fontSize: 13, marginTop: 8, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>
                  <strong>Rejection Reason:</strong> {kycStatus.rejection_reason}
                </div>
              )}
              {kycStatus.status === 'requires_update' && kycStatus.admin_notes && (
                <div style={{ color: AMBER, fontSize: 13, marginTop: 8, backgroundColor: '#fef9ec', padding: '8px 12px', borderRadius: 8 }}>
                  <strong>Note from admin:</strong> {kycStatus.admin_notes}
                </div>
              )}
            </div>
          </div>
          
          {kycStatus.status === 'approved' && (
            <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 12, color: '#065f46', fontSize: 14, border: '1px solid #bbf7d0' }}>
              ✅ Your identity has been verified. You now have a verified badge on your profile.
            </div>
          )}
          
          {kycStatus.status === 'pending' && (
            <div style={{ background: '#fef9ec', padding: 16, borderRadius: 12, color: '#92400e', fontSize: 14, border: '1px solid #fde68a' }}>
              ⏳ Your verification is pending review. Our team will review within 48 hours.
            </div>
          )}
          
          {(kycStatus.status === 'rejected' || kycStatus.status === 'requires_update') && (
            <div>
              <div style={{ background: '#fef2f2', padding: 16, borderRadius: 12, marginBottom: 16, color: '#991b1b', fontSize: 14, border: '1px solid #fecaca' }}>
                ❌ Your verification was rejected. Please submit new documents.
              </div>
              <button 
                onClick={() => navigate('/kyc/upload')} 
                style={{
                  padding: '12px 24px',
                  backgroundColor: R,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 14px rgba(230,57,70,0.3)',
                }}
              >
                Resubmit Documents →
              </button>
            </div>
          )}
        </div>
      ) : (
        // No KYC submission - Show Start Verification button
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', 
            background: GRAY_100, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            fontSize: 36, margin: '0 auto 16px' 
          }}>
            🔒
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>
            Verify Your Identity
          </div>
          <div style={{ fontSize: 14, color: SLATE, maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Get verified to earn the trusted badge and increase trust with agents and other users.
          </div>
          <button 
            onClick={() => navigate('/kyc/upload')} 
            style={{
              padding: '12px 28px',
              backgroundColor: R,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(230,57,70,0.3)',
            }}
          >
            Start Verification →
          </button>
        </div>
      )}
    </div>
  </SectionCard>
)}
          </div>
        </div>
      </div>

      {/* Modals */}
      {cancelBooking && <ConfirmModal title="Cancel Booking?" desc={`Cancel viewing of "${cancelBooking.property_detail?.title || 'this property'}"?`} onConfirm={handleCancelBooking} onClose={() => setCancelBooking(null)} loading={cancelLoading} />}
      {cancelSvc && <ConfirmModal title="Cancel Service Booking?" desc={`Cancel booking for "${cancelSvc.service.name}"?`} onConfirm={handleCancelSvc} onClose={() => setCancelSvc(null)} loading={cancelLoading} />}
      {reviewProp && <ReviewModal title="Review Property & Agent" onClose={() => setReviewProp(null)} onSubmit={handleReview} rating={reviewRating} setRating={setReviewRating} comment={reviewComment} setComment={setReviewComment} loading={reviewLoading} />}
      {reviewSvc && <ReviewModal title="Review Service" onClose={() => setReviewSvc(null)} onSubmit={handleSvcReview} rating={reviewRating} setRating={setReviewRating} comment={reviewComment} setComment={setReviewComment} loading={reviewLoading} />}
      {profileOpen && <ProfileModal data={profileData} onChange={setProfileData} onClose={() => setProfileOpen(false)} onSave={handleProfileSave} loading={profileLoading} />}
      {historyBooking && <BookingHistoryModal booking={historyBooking} history={bookingHistory} loading={historyLoading} onClose={() => { setHistoryBooking(null); setBookingHistory([]); }} />}
      <ChatModal isOpen={chatModal.isOpen} onClose={() => setChatModal(prev => ({ ...prev, isOpen: false }))} recipientId={chatModal.recipientId} recipientName={chatModal.recipientName} propertyId={chatModal.propertyId} propertyTitle={chatModal.propertyTitle} />
    </div>
  );
};

// ─── Shared Micro Styles ──────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  fieldLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 },
  input: { width: '100%', padding: '11px 13px', borderRadius: 10, border: `1.5px solid ${BORDER}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: NAVY },
  textarea: { width: '100%', padding: '11px 13px', borderRadius: 10, border: `1.5px solid ${BORDER}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.55 },
  modalSecBtn: { flex: 1, padding: '11px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: WHITE, color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  modalPrimBtn: { flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: R, color: WHITE, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(230,57,70,0.28)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: GRAY_400, padding: 4, borderRadius: 6, lineHeight: 1 },
  primaryBtn: { padding: '13px 32px', borderRadius: 12, border: 'none', background: R, color: WHITE, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(230,57,70,0.3)', transition: 'transform 0.15s' },
  smallBtn: { padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
};

if (typeof document !== 'undefined') {
  const id = 'ud-styles-v4';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
      @keyframes dbSpin  { to { transform: rotate(360deg); } }
      @keyframes dbUp    { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      @keyframes dbDown  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      @keyframes dbModal { from { opacity:0; transform:translate(-50%,-47%) scale(0.96); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      tbody tr:hover td { background: #f8faff !important; }
      input:focus, textarea:focus { border-color: ${R} !important; box-shadow: 0 0 0 3px rgba(230,57,70,0.08) !important; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #dde3ed; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #c8d0dc; }
    `;
    document.head.appendChild(el);
  }
}

export default UserDashboard;