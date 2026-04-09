/**
 * UserDashboard.tsx — Bayut-inspired user dashboard
 *
 * Design: Clean white, Bayut red (#e63946) accents,
 * Sora display font, sidebar navigation, card-based stats,
 * modern tables, smooth transitions. Zero MUI dependency.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Booking, Favorite, Payment, Review } from '../types';
import { notificationService } from '../services/notificationService';

// ─── Brand ────────────────────────────────────────────────────────────────────
const RED      = '#e63946';
const RED_BG   = 'rgba(230,57,70,0.07)';
const RED_DARK = '#c1121f';
const TEAL     = '#25a882';
const NAVY     = '#0d1b2e';
const SLATE    = '#475569';
const AMBER    = '#f59e0b';
const GREEN    = '#16a34a';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceBooking {
  id: number;
  service: { 
    id: number; 
    name: string; 
    service_type: string; 
    price: number; 
    price_unit: string; 
    image: string; 
    provider: string; 
    provider_phone: string; 
  };
  booking_date: string;
  address: string;
  special_instructions: string;
  status: string;
  total_price: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (price: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const fmtTime = (d: string) => {
  try { return new Date(d).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return ''; }
};

const getInitials = (user: any) =>
  user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#fef3c7', color: '#92400e' },
    confirmed: { bg: '#dcfce7', color: '#166534' },
    completed: { bg: '#dbeafe', color: '#1e40af' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
  };
  const style = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ backgroundColor: style.bg, color: style.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string; delay?: string }> = ({ icon, label, value, color, delay = '0s' }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: '#fff', borderRadius: 16, padding: '20px 18px',
        border: `1.5px solid ${hov ? color : '#eef2f7'}`,
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.2s', animation: `dbFadeUp 0.4s ease-out ${delay} both`,
        transform: hov ? 'translateY(-3px)' : 'none',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "'Sora', sans-serif", marginTop: 2, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
};

// ─── Nav Tab ──────────────────────────────────────────────────────────────────
const NavTab: React.FC<{ icon: string; label: string; count?: number; active: boolean; onClick: () => void }> = ({ icon, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', padding: '11px 14px', borderRadius: 10,
      border: 'none', cursor: 'pointer', textAlign: 'left',
      fontFamily: 'inherit', transition: 'all 0.15s',
      backgroundColor: active ? RED_BG : 'transparent',
      color: active ? RED : SLATE,
      fontWeight: active ? 700 : 500,
      fontSize: 13,
    }}
  >
    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {count != null && count > 0 && (
      <span style={{ backgroundColor: active ? RED : '#e2e8f0', color: active ? '#fff' : '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>
        {count}
      </span>
    )}
  </button>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ icon: string; title: string; desc: string; btnLabel: string; onClick: () => void }> = ({ icon, title, desc, btnLabel, onClick }) => (
  <div style={{ textAlign: 'center', padding: '56px 24px' }}>
    <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
    <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 17 }}>{title}</h3>
    <p style={{ margin: '0 0 22px', color: '#94a3b8', fontSize: 14 }}>{desc}</p>
    <button onClick={onClick} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
      {btnLabel}
    </button>
  </div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{ title: string; desc: string; onConfirm: () => void; onClose: () => void; loading?: boolean }> = ({ title, desc, onConfirm, onClose, loading }) => (
  <React.Fragment>
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={onClose} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 18, padding: '28px 26px', zIndex: 1001, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'dbModalIn 0.2s ease-out' }}>
      <h3 style={{ margin: '0 0 10px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18 }}>{title}</h3>
      <p style={{ margin: '0 0 24px', color: SLATE, fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Keep it
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Cancelling…' : 'Yes, Cancel'}
        </button>
      </div>
    </div>
  </React.Fragment>
);

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal: React.FC<{ title: string; onClose: () => void; onSubmit: () => void; rating: number; setRating: (r: number) => void; comment: string; setComment: (c: string) => void; loading?: boolean }> = ({ title, onClose, onSubmit, rating, setRating, comment, setComment, loading }) => (
  <React.Fragment>
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={onClose} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 18, zIndex: 1001, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'dbModalIn 0.2s ease-out', overflow: 'hidden' }}>
      <div style={{ padding: '22px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', padding: 4 }}>✕</button>
      </div>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: SLATE, marginBottom: 10 }}>Your Rating</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i} onClick={() => setRating(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 30, transition: 'transform 0.1s', transform: i <= rating ? 'scale(1.1)' : 'scale(1)' }}>
                {i <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: SLATE, marginBottom: 8 }}>Your Review</div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience…"
            rows={4}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #eef2f7', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>
      <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={onSubmit} disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(230,57,70,0.28)' }}>
          {loading ? 'Submitting…' : '✓ Submit Review'}
        </button>
      </div>
    </div>
  </React.Fragment>
);

// ─── Profile Modal ────────────────────────────────────────────────────────────
const ProfileModal: React.FC<{ data: any; onChange: (d: any) => void; onClose: () => void; onSave: () => void; loading: boolean }> = ({ data, onChange, onClose, onSave, loading }) => (
  <React.Fragment>
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={onClose} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 18, zIndex: 1001, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'dbModalIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ padding: '22px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
        <h3 style={{ margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18 }}>Edit Profile</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', padding: 4 }}>✕</button>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'First Name', key: 'first_name', type: 'text' },
          { label: 'Last Name',  key: 'last_name',  type: 'text' },
          { label: 'Phone',      key: 'phone',       type: 'tel' },
          { label: 'Email',      key: 'email',       type: 'email', disabled: true },
          { label: 'Location',   key: 'location',    type: 'text' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input
              type={f.type}
              value={data[f.key] || ''}
              onChange={e => onChange({ ...data, [f.key]: e.target.value })}
              disabled={f.disabled}
              style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #eef2f7', fontSize: 14, fontFamily: 'inherit', outline: 'none', backgroundColor: f.disabled ? '#f8faff' : '#fff', color: f.disabled ? '#94a3b8' : NAVY, boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>
      <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={onSave} disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving…' : '✓ Save Changes'}
        </button>
      </div>
      </div>
    </React.Fragment>
);

// ─── Notification Panel ───────────────────────────────────────────────────────
const NotifPanel: React.FC<{ notifs: any[]; unread: number; onRead: (id: number) => void; onReadAll: () => void; onClose: () => void; onNavigate: (url: string) => void }> = ({ notifs, unread, onRead, onReadAll, onClose, onNavigate }) => (
  <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 800 }} onClick={onClose} />
    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 360, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.16)', border: '1px solid #eef2f7', zIndex: 900, overflow: 'hidden', animation: 'dbFadeDown 0.18s ease-out' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" }}>Notifications</span>
        {unread > 0 && <button onClick={onReadAll} style={{ background: 'none', border: 'none', color: RED, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Mark all read</button>}
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>🔔 No notifications yet</div>
        ) : notifs.map(n => (
          <div
            key={n.id}
            onClick={() => { if (!n.read) onRead(n.id); if (n.url) { onNavigate(n.url); onClose(); } }}
            style={{ padding: '12px 16px', borderBottom: '1px solid #f8faff', cursor: 'pointer', backgroundColor: n.read ? '#fff' : '#fef7f7', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background-color 0.15s' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: n.read ? '#f1f5f9' : RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {n.type === 'booking' ? '📅' : n.type === 'payment' ? '💰' : '🔔'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: NAVY, marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{n.message}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{fmtDate(n.created_at)}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: RED, flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  </>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState(0);
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [svcBookings, setSvcBookings]     = useState<ServiceBooking[]>([]);
  const [favorites, setFavorites]         = useState<Favorite[]>([]);
  const [payments, setPayments]           = useState<Payment[]>([]);
  const [reviews, setReviews]             = useState<Review[]>([]);
  const [loading, setLoading]             = useState(true);
  const [toast, setToast]                 = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread]               = useState(0);
  const [showNotif, setShowNotif]         = useState(false);
  const [wsConnected, setWsConnected]     = useState(false);

  // Modals
  const [cancelBooking, setCancelBooking]       = useState<Booking | null>(null);
  const [cancelSvc, setCancelSvc]               = useState<ServiceBooking | null>(null);
  const [reviewProp, setReviewProp]             = useState<any>(null);
  const [reviewSvc, setReviewSvc]               = useState<any>(null);
  const [profileOpen, setProfileOpen]           = useState(false);
  const [cancelLoading, setCancelLoading]       = useState(false);
  const [reviewLoading, setReviewLoading]       = useState(false);
  const [profileLoading, setProfileLoading]     = useState(false);
  const [reviewRating, setReviewRating]         = useState(5);
  const [reviewComment, setReviewComment]       = useState('');
  const [profileData, setProfileData]           = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    location: user?.location || '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    fetchAll();
    fetchNotifs();

    notificationService.onConnectionStatus(c => setWsConnected(c));
    notificationService.subscribe(n => {
      setNotifications(prev => [n, ...prev]);
      setUnread(u => u + 1);
      showToast(`🔔 ${n.title}: ${n.message}`);
    });

    return () => { notificationService.disconnect(); };
  }, []);

  const fetchAll = async () => {
    try {
      const [bRes, sbRes, fRes, pRes, rRes] = await Promise.all([
        api.get('/bookings/my/'),
        api.get('/services/bookings/'),
        api.get('/favorites/'),
        api.get('/payments/'),
        api.get('/reviews/'),
      ]);
      setBookings(bRes.data.results ?? bRes.data);
      setSvcBookings(sbRes.data.results ?? sbRes.data);
      setFavorites(fRes.data.results ?? fRes.data);
      setPayments(pRes.data.results ?? pRes.data);
      setReviews(rRes.data.results ?? rRes.data);
    } catch { /* silent */ }
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

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;
    setCancelLoading(true);
    try {
      await api.post(`/bookings/${cancelBooking.id}/cancel/`);
      await fetchAll();
      showToast('✅ Booking cancelled successfully.');
      setCancelBooking(null);
    } catch { showToast('❌ Failed to cancel. Please try again.'); }
    finally { setCancelLoading(false); }
  };

  const handleCancelSvc = async () => {
    if (!cancelSvc) return;
    setCancelLoading(true);
    try {
      await api.patch(`/services/bookings/${cancelSvc.id}/status/`, { status: 'cancelled' });
      await fetchAll();
      showToast('✅ Service booking cancelled.');
      setCancelSvc(null);
    } catch { showToast('❌ Failed to cancel.'); }
    finally { setCancelLoading(false); }
  };

  const handleRemoveFav = async (propId: number) => {
    try {
      await api.delete(`/favorites/${propId}/`);
      await fetchAll();
      showToast('✅ Removed from favorites.');
    } catch { showToast('❌ Failed to remove.'); }
  };

  const handleReview = async () => {
    if (!reviewProp) return;
    setReviewLoading(true);
    try {
      await api.post('/reviews/', { agent: reviewProp.owner?.id, property: reviewProp.id, rating: reviewRating, comment: reviewComment });
      await fetchAll();
      showToast('✅ Review submitted!');
      setReviewProp(null); setReviewRating(5); setReviewComment('');
    } catch { showToast('❌ Failed to submit review.'); }
    finally { setReviewLoading(false); }
  };

  const handleSvcReview = async () => {
    if (!reviewSvc) return;
    setReviewLoading(true);
    try {
      await api.post('/services/reviews/', { service: reviewSvc.id, rating: reviewRating, comment: reviewComment });
      await fetchAll();
      showToast('✅ Service review submitted!');
      setReviewSvc(null); setReviewRating(5); setReviewComment('');
    } catch { showToast('❌ Failed to submit.'); }
    finally { setReviewLoading(false); }
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await api.patch('/users/me/', profileData);
      showToast('✅ Profile updated!');
      setProfileOpen(false);
      setTimeout(() => window.location.reload(), 800);
    } catch { showToast('❌ Failed to update profile.'); }
    finally { setProfileLoading(false); }
  };

  const stats = {
    bookings:  bookings.length,
    svcBooks:  svcBookings.length,
    pending:   svcBookings.filter(s => s.status === 'pending').length,
    favorites: favorites.length,
    spent:     payments.reduce((s, p) => s + p.amount, 0),
  };

  const TABS = [
    { icon: '📅', label: 'Property Bookings', count: bookings.length },
    { icon: '🔧', label: 'Service Bookings',  count: svcBookings.length },
    { icon: '❤️', label: 'Saved Properties',   count: favorites.length },
    { icon: '💰', label: 'Payments',           count: payments.length },
    { icon: '⭐', label: 'My Reviews',          count: reviews.length },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
      <div>
        <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', fontFamily: 'inherit' }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={pg.page}>

      {/* ══ TOAST ══════════════════════════════════════════════════════════ */}
      {toast && (
        <div style={pg.toast}>
          {toast}
          <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 10, fontSize: 14 }}>✕</button>
        </div>
      )}

      <div style={pg.inner}>

        {/* ══ HEADER ═════════════════════════════════════════════════════════ */}
        <div style={pg.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={pg.avatarWrap}>
              {user?.profile_picture
                ? <img src={user.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800 }}>{getInitials(user)}</span>
              }
              {wsConnected && <span style={pg.wsDot} title="Live updates active" />}
            </div>
            <div>
              <h1 style={pg.headerName}>{user?.first_name || user?.username || 'User'}</h1>
              <p style={pg.headerSub}>Welcome back · {user?.email}</p>
              {wsConnected && (
                <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, backgroundColor: 'rgba(37,168,130,0.08)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 4 }}>
                  ● Live updates active
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotif(v => !v)} style={pg.headerBtn}>
                🔔
                {unread > 0 && (
                  <span style={pg.notifBadge}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>
              {showNotif && (
                <NotifPanel
                  notifs={notifications}
                  unread={unread}
                  onRead={async id => {
                    await notificationService.markAsRead(id);
                    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
                    setUnread(u => Math.max(0, u - 1));
                  }}
                  onReadAll={async () => {
                    await notificationService.markAllAsRead();
                    setNotifications(p => p.map(n => ({ ...n, read: true })));
                    setUnread(0);
                  }}
                  onClose={() => setShowNotif(false)}
                  onNavigate={url => navigate(url)}
                />
              )}
            </div>

            <button onClick={() => setProfileOpen(true)} style={pg.editBtn}>
              ✏️ Edit Profile
            </button>
            <button onClick={logout} style={pg.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        {/* ══ STATS ══════════════════════════════════════════════════════════ */}
        <div style={pg.statsGrid}>
          <StatCard icon="📅" label="Property Bookings"  value={stats.bookings}  color={RED}   delay="0s" />
          <StatCard icon="🔧" label="Service Bookings"   value={stats.svcBooks}  color={AMBER}  delay="0.07s" />
          <StatCard icon="⏳" label="Pending Services"   value={stats.pending}   color="#f97316" delay="0.14s" />
          <StatCard icon="❤️" label="Saved Properties"   value={stats.favorites} color={TEAL}   delay="0.21s" />
          <StatCard icon="💰" label="Total Spent"        value={fmt(stats.spent)} color={GREEN}  delay="0.28s" />
        </div>

        {/* ══ MAIN PANEL ═════════════════════════════════════════════════════ */}
        <div style={pg.mainPanel}>

          <nav style={pg.sidebar}>
            <div style={{ padding: '0 0 16px', borderBottom: '1px solid #f1f5f9', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, padding: '0 4px' }}>Navigation</div>
              {TABS.map((t, i) => (
                <NavTab key={i} icon={t.icon} label={t.label} count={t.count} active={activeTab === i} onClick={() => setActiveTab(i)} />
              ))}
            </div>
            <button onClick={() => navigate('/properties')} style={pg.browseBtn}>
              🔍 Browse Properties
            </button>
          </nav>

          <div style={pg.content}>

            {/* ── 0: Property Bookings ── */}
            {activeTab === 0 && (
              <div style={pg.tabPane}>
                <div style={pg.tabHead}>
                  <h2 style={pg.tabTitle}>Property Bookings</h2>
                  <span style={pg.tabCount}>{bookings.length} total</span>
                </div>
                {bookings.length === 0 ? (
                  <EmptyState icon="🏚️" title="No bookings yet" desc="Schedule viewings of properties you're interested in." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={pg.tableWrap}>
                    <table style={pg.table}>
                      <thead>
                        <tr>
                          <th style={pg.th}>Property</th>
                          <th style={pg.th}>Visit Date</th>
                          <th style={pg.th}>Status</th>
                          <th style={pg.th}>Message</th>
                          <th style={pg.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id}>
                            <td style={pg.td}>
                              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 2 }}>{b.property?.title || 'Property'}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.property?.address}</div>
                            </td>
                            <td style={pg.td}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(b.visit_date)}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtTime(b.visit_date)}</div>
                            </td>
                            <td style={pg.td}><StatusBadge status={b.status} /></td>
                            <td style={pg.td}><span style={{ fontSize: 12, color: SLATE }}>{b.message || '—'}</span></td>
                            <td style={pg.td}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {b.status === 'pending' && (
                                  <button onClick={() => setCancelBooking(b)} style={pg.dangerBtn}>Cancel</button>
                                )}
                                {b.status === 'confirmed' && (
                                  <button onClick={() => { setReviewProp(b.property); setReviewRating(5); setReviewComment(''); }} style={pg.actionBtn}>⭐ Review</button>
                                )}
                                <button onClick={() => navigate(`/property/${b.property?.id}`)} style={pg.viewBtn}>View →</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── 1: Service Bookings ── */}
            {activeTab === 1 && (
              <div style={pg.tabPane}>
                <div style={pg.tabHead}>
                  <h2 style={pg.tabTitle}>Service Bookings</h2>
                  <span style={pg.tabCount}>{svcBookings.length} total</span>
                </div>
                {svcBookings.length === 0 ? (
                  <EmptyState icon="🔧" title="No service bookings" desc="Book cleaning, moving, renovation and more." btnLabel="Browse Services" onClick={() => navigate('/services')} />
                ) : (
                  <div style={pg.tableWrap}>
                    <table style={pg.table}>
                      <thead>
                        <tr>
                          <th style={pg.th}>Service</th>
                          <th style={pg.th}>Provider</th>
                          <th style={pg.th}>Date</th>
                          <th style={pg.th}>Status</th>
                          <th style={pg.th}>Price</th>
                          <th style={pg.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {svcBookings.map(sb => (
                          <tr key={sb.id}>
                            <td style={pg.td}>
                              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{sb.service.name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sb.address}</div>
                            </td>
                            <td style={pg.td}><span style={{ fontSize: 13, color: SLATE }}>{sb.service.provider}</span></td>
                            <td style={pg.td}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(sb.booking_date)}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtTime(sb.booking_date)}</div>
                            </td>
                            <td style={pg.td}><StatusBadge status={sb.status} /></td>
                            <td style={pg.td}><span style={{ fontSize: 13, fontWeight: 800, color: RED }}>{fmt(sb.total_price)}</span></td>
                            <td style={pg.td}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {sb.status === 'pending' && (
                                  <button onClick={() => setCancelSvc(sb)} style={pg.dangerBtn}>Cancel</button>
                                )}
                                {sb.status === 'completed' && (
                                  <button onClick={() => { setReviewSvc(sb.service); setReviewRating(5); setReviewComment(''); }} style={pg.actionBtn}>⭐ Review</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── 2: Favorites ── */}
            {activeTab === 2 && (
              <div style={pg.tabPane}>
                <div style={pg.tabHead}>
                  <h2 style={pg.tabTitle}>Saved Properties</h2>
                  <span style={pg.tabCount}>{favorites.length} saved</span>
                </div>
                {favorites.length === 0 ? (
                  <EmptyState icon="❤️" title="No saved properties" desc="Save properties you love for quick access." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={pg.favGrid}>
                    {favorites.map(fav => (
                      <div key={fav.id} style={pg.favCard}>
                        {fav.property.images?.[0]?.image && (
                          <div style={{ height: 140, overflow: 'hidden', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
                            <img src={fav.property.images[0].image} alt={fav.property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ padding: '14px' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif", marginBottom: 4 }}>
                            {fmt(fav.property.price)}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6, lineHeight: 1.35 }}>
                            {fav.property.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                            📍 {fav.property.district}, {fav.property.city}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => navigate(`/property/${fav.property.id}`)} style={{ ...pg.viewBtn, flex: 1 }}>
                              View →
                            </button>
                            <button onClick={() => handleRemoveFav(fav.property.id)} style={{ ...pg.dangerBtn, flex: 1 }}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 3: Payments ── */}
            {activeTab === 3 && (
              <div style={pg.tabPane}>
                <div style={pg.tabHead}>
                  <h2 style={pg.tabTitle}>Payment History</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={pg.tabCount}>{payments.length} transactions</span>
                    {stats.spent > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: RED }}>Total: {fmt(stats.spent)}</span>}
                  </div>
                </div>
                {payments.length === 0 ? (
                  <EmptyState icon="💰" title="No payments yet" desc="Your payment history will appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={pg.tableWrap}>
                    <table style={pg.table}>
                      <thead>
                        <tr>
                          <th style={pg.th}>Reference</th>
                          <th style={pg.th}>Amount</th>
                          <th style={pg.th}>Method</th>
                          <th style={pg.th}>Status</th>
                          <th style={pg.th}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id}>
                            <td style={pg.td}><span style={{ fontFamily: 'monospace', fontSize: 12, color: NAVY, backgroundColor: '#f4f7fb', padding: '3px 8px', borderRadius: 6 }}>{p.reference}</span></td>
                            <td style={pg.td}><span style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>{fmt(p.amount)}</span></td>
                            <td style={pg.td}><span style={{ fontSize: 12, backgroundColor: '#f4f7fb', color: SLATE, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{p.payment_method}</span></td>
                            <td style={pg.td}><StatusBadge status={p.status} /></td>
                            <td style={pg.td}><span style={{ fontSize: 13, color: SLATE }}>{fmtDate(p.created_at)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── 4: Reviews ── */}
            {activeTab === 4 && (
              <div style={pg.tabPane}>
                <div style={pg.tabHead}>
                  <h2 style={pg.tabTitle}>My Reviews</h2>
                  <span style={pg.tabCount}>{reviews.length} reviews</span>
                </div>
                {reviews.length === 0 ? (
                  <EmptyState icon="⭐" title="No reviews yet" desc="Reviews you write will appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '18px', border: '1px solid #eef2f7', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: RED_BG, border: `2px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                          {r.agent?.first_name?.[0]?.toUpperCase() || r.agent?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{r.agent?.first_name} {r.agent?.last_name || r.agent?.username}</div>
                              <div style={{ display: 'inline-flex', gap: 2, marginTop: 4 }}>
                                {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 14, color: i <= r.rating ? '#f59e0b' : '#d1d5db' }}>★</span>)}
                              </div>
                            </div>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(r.created_at)}</span>
                          </div>
                          <p style={{ margin: '8px 0 0', fontSize: 13, color: SLATE, lineHeight: 1.6 }}>{r.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}
      {cancelBooking && (
        <ConfirmModal
          title="Cancel Booking?"
          desc={`Are you sure you want to cancel your viewing of "${cancelBooking.property?.title}"? This action cannot be undone.`}
          onConfirm={handleCancelBooking}
          onClose={() => setCancelBooking(null)}
          loading={cancelLoading}
        />
      )}
      {cancelSvc && (
        <ConfirmModal
          title="Cancel Service Booking?"
          desc={`Are you sure you want to cancel your booking for "${cancelSvc.service.name}"?`}
          onConfirm={handleCancelSvc}
          onClose={() => setCancelSvc(null)}
          loading={cancelLoading}
        />
      )}
      {reviewProp && (
        <ReviewModal
          title="Review Property & Agent"
          onClose={() => setReviewProp(null)}
          onSubmit={handleReview}
          rating={reviewRating}
          setRating={setReviewRating}
          comment={reviewComment}
          setComment={setReviewComment}
          loading={reviewLoading}
        />
      )}
      {reviewSvc && (
        <ReviewModal
          title="Review Service"
          onClose={() => setReviewSvc(null)}
          onSubmit={handleSvcReview}
          rating={reviewRating}
          setRating={setReviewRating}
          comment={reviewComment}
          setComment={setReviewComment}
          loading={reviewLoading}
        />
      )}
      {profileOpen && (
        <ProfileModal
          data={profileData}
          onChange={setProfileData}
          onClose={() => setProfileOpen(false)}
          onSave={handleProfileSave}
          loading={profileLoading}
        />
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const pg: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 },
  inner:     { maxWidth: 1400, margin: '0 auto', padding: '28px 20px 60px' },
  toast:     { position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, backgroundColor: NAVY, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'dbFadeDown 0.3s ease-out', whiteSpace: 'nowrap' },

  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28, backgroundColor: '#fff', borderRadius: 18, padding: '20px 22px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: 'dbFadeUp 0.4s ease-out both' },
  avatarWrap:{ width: 64, height: 64, borderRadius: '50%', backgroundColor: RED_BG, border: `2.5px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontSize: 24, fontWeight: 800, flexShrink: 0, position: 'relative', overflow: 'hidden' },
  wsDot:     { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', backgroundColor: TEAL, border: '2px solid #fff' },
  headerName:{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 4px', letterSpacing: '-0.02em' },
  headerSub: { fontSize: 13, color: '#94a3b8', margin: 0 },
  headerBtn: { background: 'rgba(230,57,70,0.07)', border: `1.5px solid rgba(230,57,70,0.15)`, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, position: 'relative', transition: 'all 0.15s' },
  notifBadge:{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', backgroundColor: RED, color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' },
  editBtn:   { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1.5px solid #eef2f7`, backgroundColor: '#fff', color: NAVY, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1.5px solid rgba(230,57,70,0.2)`, backgroundColor: RED_BG, color: RED, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 },

  mainPanel: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' },
  sidebar:   { backgroundColor: '#fff', borderRadius: 16, padding: '16px 12px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 88, animation: 'dbFadeUp 0.4s ease-out 0.1s both' },
  browseBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  content:   { minWidth: 0 },

  tabPane:   { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', animation: 'dbFadeUp 0.35s ease-out both' },
  tabHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' },
  tabTitle:  { fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 },
  tabCount:  { fontSize: 12, fontWeight: 700, color: '#94a3b8', backgroundColor: '#f4f7fb', padding: '3px 10px', borderRadius: 20 },

  tableWrap: { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: 600 },
  th:        { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid #eef2f7' },
  td:        { padding: '14px 16px', verticalAlign: 'top' },

  dangerBtn: { padding: '5px 12px', borderRadius: 8, border: `1.5px solid rgba(239,68,68,0.3)`, backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  actionBtn: { padding: '5px 12px', borderRadius: 8, border: `1.5px solid rgba(245,158,11,0.3)`, backgroundColor: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  viewBtn:   { padding: '5px 12px', borderRadius: 8, border: `1.5px solid rgba(230,57,70,0.2)`, backgroundColor: RED_BG, color: RED, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },

  favGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, padding: '18px' },
  favCard:   { borderRadius: 14, border: '1px solid #eef2f7', overflow: 'hidden', backgroundColor: '#fff', transition: 'box-shadow 0.2s, transform 0.2s' },
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'user-dashboard-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes dbSpin    { to { transform: rotate(360deg); } }
      @keyframes dbFadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes dbFadeDown{ from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes dbModalIn { from { opacity:0; transform:translate(-50%,-46%); } to { opacity:1; transform:translate(-50%,-50%); } }

      tr:hover { background-color: #fafcff !important; }
      [style*="favCard"]:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; transform: translateY(-3px) !important; }
      button[style*="editBtn"]:hover { border-color: ${RED} !important; color: ${RED} !important; }
      button[style*="transparent"]:hover { background-color: ${RED_BG} !important; }
      button[style*="browseBtn"]:hover { background-color: ${RED_DARK} !important; }
      button[style*="fee2e2"]:hover { background-color: #fca5a5 !important; }
      input:focus, textarea:focus, select:focus { border-color: ${RED} !important; outline: none; }
      div[style*="cursor: pointer"]:hover { background-color: #f8faff !important; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    `;
    document.head.appendChild(el);
  }
}

export default UserDashboard;