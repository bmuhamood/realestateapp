/**
 * PropertyDetail.tsx — Bayut-inspired property detail page
 *
 * Design language: Clean white, Bayut red (#e63946) accents,
 * Sora display font, editorial layout with sticky agent card,
 * immersive image gallery with lightbox, smooth animations.
 *
 * Sections:
 *  1. Sticky breadcrumb + action bar
 *  2. Image gallery (main + thumbnails + lightbox)
 *  3. Two-column: left = details, right = sticky agent card
 *     Left: price/title/location, features grid, description,
 *           property details table, map placeholder, reviews
 *  4. Similar properties (PropertyRecommendations)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Property, Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PropertyRecommendations from '../components/Recommendations/PropertyRecommendations';

// ─── Brand ────────────────────────────────────────────────────────────────────
const RED      = '#e63946';
const RED_DARK = '#c1121f';
const RED_BG   = 'rgba(230,57,70,0.07)';
const NAVY     = '#0d1b2e';
const TEAL     = '#25a882';
const SLATE    = '#475569';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
};

const getInitials = (first?: string, last?: string, username?: string) => {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (username) return username[0].toUpperCase();
  return 'A';
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
const Stars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24"
        fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
        stroke={i <= Math.round(rating) ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
      </svg>
    ))}
  </span>
);

// ─── Feature Box ──────────────────────────────────────────────────────────────
const FeatureBox: React.FC<{ icon: string; value: string | number; label: string }> = ({ icon, value, label }) => (
  <div style={feat.box}>
    <div style={feat.icon}>{icon}</div>
    <div style={feat.value}>{value}</div>
    <div style={feat.label}>{label}</div>
  </div>
);
const feat: Record<string, React.CSSProperties> = {
  box:   { textAlign: 'center', padding: '18px 12px', borderRadius: 14, backgroundColor: '#f8faff', border: '1px solid #eef2f7', flex: 1, minWidth: 80 },
  icon:  { fontSize: 28, marginBottom: 8 },
  value: { fontSize: 22, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif", lineHeight: 1 },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
};

// ─── Detail Row ───────────────────────────────────────────────────────────────
const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={dr.row}>
    <span style={dr.label}>{label}</span>
    <span style={dr.value}>{value}</span>
  </div>
);
const dr: Record<string, React.CSSProperties> = {
  row:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  label: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  value: { fontSize: 13, color: NAVY, fontWeight: 700, textAlign: 'right' },
};

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <div style={rv.card}>
    <div style={rv.top}>
      <div style={rv.avatar}>
        {getInitials(review.user?.first_name, review.user?.last_name, review.user?.username)}
      </div>
      <div>
        <div style={rv.name}>{review.user?.first_name || review.user?.username || 'Anonymous'}</div>
        <Stars rating={review.rating} size={12} />
      </div>
      <span style={rv.date}>{fmtDate(review.created_at)}</span>
    </div>
    <p style={rv.comment}>{review.comment}</p>
  </div>
);
const rv: Record<string, React.CSSProperties> = {
  card:    { padding: '16px', borderRadius: 14, backgroundColor: '#f8faff', border: '1px solid #eef2f7', marginBottom: 12 },
  top:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:  { width: 38, height: 38, borderRadius: '50%', backgroundColor: RED_BG, border: `2px solid ${RED}`, color: RED, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:    { fontSize: 13, fontWeight: 700, color: NAVY },
  date:    { marginLeft: 'auto', fontSize: 11, color: '#94a3b8' },
  comment: { margin: 0, fontSize: 13, color: SLATE, lineHeight: 1.6 },
};

// ─── Booking Modal ────────────────────────────────────────────────────────────
const BookingModal: React.FC<{
  property: Property;
  onClose: () => void;
  onConfirm: (date: string, time: string, msg: string) => Promise<void>;
  loading: boolean;
  success: boolean;
}> = ({ property, onClose, onConfirm, loading, success }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [msg, setMsg]   = useState('');

  return (
    <>
      <div style={bm.backdrop} onClick={onClose} />
      <div style={bm.modal}>
        <div style={bm.header}>
          <div>
            <h3 style={bm.title}>Schedule a Viewing</h3>
            <p style={bm.subtitle}>{property.title}</p>
          </div>
          <button onClick={onClose} style={bm.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={bm.body}>
          {success ? (
            <div style={bm.successBox}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
              <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif" }}>Booking Confirmed!</h3>
              <p style={{ margin: 0, color: SLATE, fontSize: 14 }}>The agent will contact you shortly to confirm the viewing.</p>
            </div>
          ) : (
            <>
              {/* Fee notice */}
              <div style={bm.feeNotice}>
                <span style={{ fontSize: 18 }}>ℹ️</span>
                <span>Viewing fee: <strong>UGX 10,000</strong> payable at the property</span>
              </div>

              <div style={bm.formGrid}>
                <div style={bm.formGroup}>
                  <label style={bm.formLabel}>Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={bm.input} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div style={bm.formGroup}>
                  <label style={bm.formLabel}>Preferred Time *</label>
                  <select value={time} onChange={e => setTime(e.target.value)} style={bm.input}>
                    <option value="">Select time</option>
                    {['09:00','10:00','11:00','14:00','15:00','16:00','17:00'].map(t => (
                      <option key={t} value={t}>
                        {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={bm.formGroup}>
                <label style={bm.formLabel}>Message (optional)</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)}
                  rows={3} placeholder="Any specific questions or requirements?"
                  style={{ ...bm.input, resize: 'vertical' as const }} />
              </div>
            </>
          )}
        </div>

        {!success && (
          <div style={bm.footer}>
            <button onClick={onClose} style={bm.cancelBtn}>Cancel</button>
            <button
              onClick={() => onConfirm(date, time, msg)}
              disabled={loading}
              style={{ ...bm.confirmBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
            >
              {loading
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'pdSpin 0.7s linear infinite' }} /> Confirming…</>
                : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const bm: Record<string, React.CSSProperties> = {
  backdrop:   { position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  modal:      { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', zIndex: 1001, animation: 'pdModalIn 0.22s ease-out' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 0', gap: 12 },
  title:      { margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" },
  subtitle:   { margin: 0, fontSize: 13, color: SLATE },
  closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', borderRadius: 8 },
  body:       { padding: '18px 24px' },
  successBox: { textAlign: 'center', padding: '24px 0' },
  feeNotice:  { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(37,168,130,0.08)', border: '1px solid rgba(37,168,130,0.2)', fontSize: 13, color: '#1d8f6e', marginBottom: 18 },
  formGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  formGroup:  { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 },
  formLabel:  { fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input:      { padding: '10px 13px', borderRadius: 10, border: '1.5px solid #eef2f7', fontSize: 14, color: NAVY, fontFamily: 'inherit', outline: 'none' },
  footer:     { display: 'flex', gap: 10, padding: '0 24px 24px' },
  cancelBtn:  { flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  confirmBtn: { flex: 2, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(230,57,70,0.32)' },
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox: React.FC<{
  images: { id: number; image: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ images, index, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div style={lb.root} onClick={onClose}>
      <button style={lb.closeBtn} onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <button
        style={{ ...lb.navBtn, left: 20 }}
        onClick={e => { e.stopPropagation(); onPrev(); }}
        disabled={index === 0}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <img
        src={images[index]?.image}
        alt={`Image ${index + 1}`}
        style={lb.img}
        onClick={e => e.stopPropagation()}
      />

      <button
        style={{ ...lb.navBtn, right: 20 }}
        onClick={e => { e.stopPropagation(); onNext(); }}
        disabled={index === images.length - 1}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div style={lb.counter}>{index + 1} / {images.length}</div>

      {/* Thumbnail strip */}
      <div style={lb.thumbStrip}>
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.image}
            alt=""
            onClick={e => { e.stopPropagation(); }}
            style={{
              ...lb.thumb,
              outline: i === index ? `2.5px solid ${RED}` : '2px solid transparent',
              opacity: i === index ? 1 : 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const lb: Record<string, React.CSSProperties> = {
  root:      { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.96)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', animation: 'pdFadeIn 0.2s ease-out' },
  closeBtn:  { position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 },
  navBtn:    { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10, transition: 'background-color 0.15s' },
  img:       { maxWidth: 'calc(100vw - 140px)', maxHeight: 'calc(100vh - 160px)', objectFit: 'contain', borderRadius: 8, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' },
  counter:   { position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 13, fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px 14px', borderRadius: 30 },
  thumbStrip:{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, padding: '0 20px' },
  thumb:     { width: 52, height: 40, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PropertyDetail: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty]         = useState<Property | null>(null);
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [loading, setLoading]           = useState(true);
  const [liked, setLiked]               = useState(false);
  const [copied, setCopied]             = useState(false);
  const [currentImg, setCurrentImg]     = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [bookingOpen, setBookingOpen]   = useState(false);
  const [bookingLoading, setBookingLoad]= useState(false);
  const [bookingSuccess, setBookingOk]  = useState(false);
  const [showAllReviews, setShowAll]    = useState(false);
  const [scrolled, setScrolled]         = useState(false);

  // Sticky header on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/properties/${id}/`);
        setProperty(res.data);
        setLiked(res.data.is_liked || false);
        if (res.data.owner?.id) {
          const rRes = await api.get(`/reviews/?agent=${res.data.owner.id}`);
          setReviews(rRes.data.results || rRes.data);
        }
      } catch { /* show not-found */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    try { await api.post(`/properties/${id}/like/`); setLiked(l => !l); }
    catch { /* silent */ }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleBooking = useCallback(async (date: string, time: string, msg: string) => {
    if (!user) { navigate('/login'); return; }
    if (!date || !time) { alert('Please select a date and time.'); return; }
    setBookingLoad(true);
    try {
      await api.post('/bookings/', {
        property: property?.id,
        visit_date: new Date(`${date}T${time}`).toISOString(),
        message: msg,
      });
      setBookingOk(true);
      setTimeout(() => { setBookingOpen(false); setBookingOk(false); }, 2500);
    } catch { alert('Failed to create booking. Please try again.'); }
    finally { setBookingLoad(false); }
  }, [user, property, navigate]);

  const images = (property?.images?.length ?? 0) > 0
    ? property!.images
    : [{ id: 0, image: 'https://via.placeholder.com/1200x700?text=No+Image', is_main: true, order: 0 }];

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ownerName = property?.owner
    ? `${property.owner.first_name || ''} ${property.owner.last_name || ''}`.trim() || property.owner.username || 'Agent'
    : 'Agent';

  // ── Loading ──
  if (loading) return (
    <div style={{ marginTop: 64, minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {/* Skeleton shimmer */}
        <div style={{ height: 500, backgroundColor: '#e2e8f0', borderRadius: 18, marginBottom: 24, animation: 'pdShimmer 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div style={{ height: 400, backgroundColor: '#e2e8f0', borderRadius: 18, animation: 'pdShimmer 1.5s ease-in-out infinite 0.15s' }} />
          <div style={{ height: 400, backgroundColor: '#e2e8f0', borderRadius: 18, animation: 'pdShimmer 1.5s ease-in-out infinite 0.3s' }} />
        </div>
      </div>
    </div>
  );

  // ── Not found ──
  if (!property) return (
    <div style={{ marginTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb' }}>
      <div style={{ textAlign: 'center', padding: 48, backgroundColor: '#fff', borderRadius: 20, border: '1px solid #eef2f7', maxWidth: 420 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏚️</div>
        <h2 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif" }}>Property Not Found</h2>
        <p style={{ color: SLATE, fontSize: 14, margin: '0 0 24px' }}>This property doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/properties')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Browse Properties
        </button>
      </div>
    </div>
  );

  return (
    <div style={pg.page}>

      {/* ══ STICKY ACTION BAR ══════════════════════════════════════════════ */}
      <div style={{ ...pg.stickyBar, opacity: scrolled ? 1 : 0, pointerEvents: scrolled ? 'all' : 'none', transform: scrolled ? 'translateY(0)' : 'translateY(-100%)' }}>
        <div style={pg.stickyInner}>
          <div>
            <div style={pg.stickyPrice}>{formatPrice(property.price)}</div>
            <div style={pg.stickyTitle}>{property.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleLike} style={{ ...pg.iconBtn, color: liked ? '#ef4444' : SLATE }}>
              {liked ? '❤️' : '🤍'}
            </button>
            <button onClick={handleCopy} style={pg.iconBtn}>
              {copied ? '✅' : '🔗'}
            </button>
            <button onClick={() => setBookingOpen(true)} style={pg.stickyBookBtn}>
              📅 Schedule Viewing
            </button>
          </div>
        </div>
      </div>

      <div style={pg.container}>

        {/* ── Breadcrumb ── */}
        <div style={pg.breadcrumb}>
          <button onClick={() => navigate('/')} style={pg.bcBtn}>Home</button>
          <span style={pg.bcSep}>›</span>
          <button onClick={() => navigate('/properties')} style={pg.bcBtn}>Properties</button>
          <span style={pg.bcSep}>›</span>
          <span style={pg.bcCurrent}>{property.title}</span>
        </div>

        {/* ══ IMAGE GALLERY ══════════════════════════════════════════════════ */}
        <div style={pg.gallery}>
          {/* Main image */}
          <div style={pg.mainImgWrap} onClick={() => setLightboxOpen(true)}>
            <img
              src={images[currentImg]?.image}
              alt={property.title}
              style={pg.mainImg}
            />
            {/* Overlay actions */}
            <div style={pg.imgActions}>
              <button
                onClick={e => { e.stopPropagation(); handleLike(); }}
                style={{ ...pg.imgBtn, color: liked ? '#ef4444' : '#fff' }}
                title={liked ? 'Remove from favorites' : 'Save'}
              >
                {liked ? '❤️' : '🤍'}
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleCopy(); }}
                style={pg.imgBtn}
                title="Copy link"
              >
                {copied ? '✅' : '🔗'}
              </button>
            </div>

            {/* Badges */}
            <div style={pg.imgBadges}>
              {!property.is_available && <span style={pg.badgeSold}>Sold</span>}
              {property.is_verified && <span style={pg.badgeVerified}>✓ Verified</span>}
              <span style={pg.badgeTx}>
                {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'}
              </span>
            </div>

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  style={{ ...pg.galleryArrow, left: 14 }}
                  onClick={e => { e.stopPropagation(); if (currentImg > 0) setCurrentImg(i => i - 1); }}
                  disabled={currentImg === 0}
                >
                  ‹
                </button>
                <button
                  style={{ ...pg.galleryArrow, right: 14 }}
                  onClick={e => { e.stopPropagation(); if (currentImg < images.length - 1) setCurrentImg(i => i + 1); }}
                  disabled={currentImg === images.length - 1}
                >
                  ›
                </button>
              </>
            )}

            {/* Counter + expand */}
            <div style={pg.imgCounter}>
              <span>📷 {currentImg + 1} / {images.length}</span>
              <span style={{ marginLeft: 8, opacity: 0.8, fontSize: 11 }}>Click to expand</span>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={pg.thumbStrip}>
              {images.map((img, i) => (
                <div
                  key={img.id}
                  onClick={() => setCurrentImg(i)}
                  style={{
                    ...pg.thumb,
                    outline: i === currentImg ? `2.5px solid ${RED}` : '2px solid transparent',
                    opacity: i === currentImg ? 1 : 0.65,
                    transform: i === currentImg ? 'scale(1)' : 'scale(0.97)',
                  }}
                >
                  <img src={img.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ TWO-COLUMN CONTENT ═════════════════════════════════════════════ */}
        <div style={pg.twoCol}>

          {/* ── LEFT: Details ── */}
          <div style={pg.leftCol}>

            {/* Price + Title + Location */}
            <div style={pg.priceCard}>
              <div style={pg.priceRow}>
                <div style={pg.price}>
                  {formatPrice(property.price)}
                  {property.transaction_type === 'rent' && <span style={pg.perMonth}>/month</span>}
                </div>
                <div style={pg.txBadge}>
                  {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'}
                </div>
              </div>
              <h1 style={pg.title}>{property.title}</h1>
              <div style={pg.location}>
                <span style={{ fontSize: 16 }}>📍</span>
                <span>{property.address}, {property.district}, {property.city}</span>
              </div>
              {property.is_verified && (
                <div style={pg.verifiedBanner}>
                  <span>✓</span>
                  <span>Verified listing — checked by our team</span>
                </div>
              )}
            </div>

            {/* Feature stats */}
            <div style={pg.section}>
              <h2 style={pg.sectionTitle}>Property Overview</h2>
              <div style={pg.featGrid}>
                {property.property_type !== 'land' && (
                  <>
                    <FeatureBox icon="🛏" value={property.bedrooms} label="Bedrooms" />
                    <FeatureBox icon="🚿" value={property.bathrooms} label="Bathrooms" />
                  </>
                )}
                <FeatureBox icon="📐" value={`${property.square_meters}m²`} label="Area" />
                <FeatureBox icon="🏠" value={property.property_type} label="Type" />
                <FeatureBox icon="👁" value={property.views_count.toLocaleString()} label="Views" />
                <FeatureBox icon="❤️" value={property.likes_count} label="Saves" />
              </div>
            </div>

            {/* Description */}
            <div style={pg.section}>
              <h2 style={pg.sectionTitle}>About This Property</h2>
              <p style={pg.description}>{property.description || 'No description provided.'}</p>
            </div>

            {/* Details table */}
            <div style={pg.section}>
              <h2 style={pg.sectionTitle}>Property Details</h2>
              <div style={pg.detailsTable}>
                <DetailRow label="Property Type"    value={<span style={{ textTransform: 'capitalize' }}>{property.property_type}</span>} />
                <DetailRow label="Transaction"      value={property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'} />
                <DetailRow label="Location"         value={`${property.district}, ${property.city}`} />
                {property.property_type !== 'land' && (
                  <>
                    <DetailRow label="Bedrooms"  value={property.bedrooms} />
                    <DetailRow label="Bathrooms" value={property.bathrooms} />
                  </>
                )}
                <DetailRow label="Area"          value={`${property.square_meters} m²`} />
                <DetailRow label="Status"        value={
                  <span style={{ color: property.is_available ? TEAL : '#ef4444', fontWeight: 700 }}>
                    {property.is_available ? 'Available' : 'Not Available'}
                  </span>
                } />
                <DetailRow label="Listed"        value={fmtDate(property.created_at)} />
                <DetailRow label="Reference ID"  value={`#${property.id}`} />
              </div>
            </div>

            {/* Map placeholder */}
            <div style={pg.section}>
              <h2 style={pg.sectionTitle}>Location</h2>
              <div style={pg.mapPlaceholder}>
                <div style={pg.mapInner}>
                  <span style={{ fontSize: 40 }}>🗺️</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginTop: 10 }}>
                    {property.district}, {property.city}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{property.address}</div>
                  <a
                    href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={pg.mapLink}
                    onClick={e => e.stopPropagation()}
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div style={pg.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ ...pg.sectionTitle, margin: 0 }}>Agent Reviews</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stars rating={avgRating} size={16} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{avgRating.toFixed(1)}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>({reviews.length})</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                  <p style={{ margin: 0, fontSize: 14 }}>No reviews yet for this agent.</p>
                </div>
              ) : (
                <>
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map(r => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                  {reviews.length > 3 && (
                    <button onClick={() => setShowAll(a => !a)} style={pg.showMoreBtn}>
                      {showAllReviews ? 'Show less ↑' : `Show all ${reviews.length} reviews ↓`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Agent sticky card ── */}
          <div style={pg.rightCol}>
            <div style={pg.agentCard}>
              {/* Agent header */}
              <div style={pg.agentHeader}>
                <div style={pg.agentAvatar}>
                  {property.owner?.profile_picture
                    ? <img src={property.owner.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : getInitials(property.owner?.first_name, property.owner?.last_name, property.owner?.username)
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={pg.agentName}>{ownerName}</div>
                  <div style={pg.agentMeta}>
                    {property.owner?.is_verified && (
                      <span style={pg.agentVerified}>✓ Verified Agent</span>
                    )}
                  </div>
                  {reviews.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <Stars rating={avgRating} size={11} />
                      <span style={{ fontSize: 11, color: '#64748b' }}>{avgRating.toFixed(1)} ({reviews.length})</span>
                    </div>
                  )}
                </div>
              </div>

              {property.owner?.bio && (
                <p style={pg.agentBio}>{property.owner.bio}</p>
              )}

              {/* Price highlight */}
              <div style={pg.agentPriceBox}>
                <div style={pg.agentPrice}>{formatPrice(property.price)}</div>
                {property.transaction_type === 'rent' && <span style={{ fontSize: 12, color: '#64748b' }}>/month</span>}
              </div>

              {/* CTA buttons */}
              <div style={pg.agentBtns}>
                {property.owner?.phone && (
                  <>
                    <a href={`tel:${property.owner.phone}`} style={pg.callBtn}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.37a16 16 0 0 0 6.72 6.72l.62-.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Call Agent
                    </a>
                    <a
                      href={`https://wa.me/${property.owner.phone.replace(/\D/g, '')}?text=Hi, I'm interested in: ${encodeURIComponent(property.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={pg.whatsappBtn}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </>
                )}

                <button onClick={() => setBookingOpen(true)} style={pg.bookingBtn}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Schedule Viewing
                </button>
              </div>

              {/* Share row */}
              <div style={pg.shareRow}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Share:</span>
                <button onClick={handleCopy} style={pg.shareBtn} title="Copy link">
                  {copied ? '✅' : '🔗'} {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(property.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={pg.shareBtn}
                >🐦 Tweet</a>
              </div>

              {/* Property quick stats */}
              <div style={pg.quickStats}>
                <div style={pg.quickStat}>
                  <span style={{ fontSize: 18 }}>👁</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{property.views_count.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Views</div>
                  </div>
                </div>
                <div style={pg.quickStat}>
                  <span style={{ fontSize: 18 }}>❤️</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{property.likes_count}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Saves</div>
                  </div>
                </div>
                <div style={pg.quickStat}>
                  <span style={{ fontSize: 18 }}>📅</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{fmtDate(property.created_at)}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Listed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RECOMMENDATIONS ════════════════════════════════════════════════ */}
        <div style={{ marginTop: 48 }}>
          <PropertyRecommendations propertyId={property.id} limit={3} />
        </div>
      </div>

      {/* ══ LIGHTBOX ══ */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          index={currentImg}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setCurrentImg(i => Math.max(0, i - 1))}
          onNext={() => setCurrentImg(i => Math.min(images.length - 1, i + 1))}
        />
      )}

      {/* ══ BOOKING MODAL ══ */}
      {bookingOpen && (
        <BookingModal
          property={property}
          onClose={() => { setBookingOpen(false); setBookingOk(false); }}
          onConfirm={handleBooking}
          loading={bookingLoading}
          success={bookingSuccess}
        />
      )}
    </div>
  );
};

// ─── Page styles ──────────────────────────────────────────────────────────────
const pg: Record<string, React.CSSProperties> = {
  page:        { minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64, paddingBottom: 60 },
  container:   { maxWidth: 1200, margin: '0 auto', padding: '0 20px' },

  // Sticky bar
  stickyBar:   { position: 'fixed', top: 64, left: 0, right: 0, zIndex: 900, backgroundColor: '#fff', borderBottom: '1px solid #eef2f7', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transition: 'all 0.3s ease' },
  stickyInner: { maxWidth: 1200, margin: '0 auto', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stickyPrice: { fontSize: 18, fontWeight: 800, color: RED, fontFamily: "'Sora', sans-serif" },
  stickyTitle: { fontSize: 13, color: SLATE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 },
  iconBtn:     { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  stickyBookBtn: { padding: '9px 18px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },

  // Breadcrumb
  breadcrumb:  { display: 'flex', alignItems: 'center', gap: 6, padding: '20px 0 16px', fontSize: 13 },
  bcBtn:       { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0, transition: 'color 0.15s' },
  bcSep:       { color: '#cbd5e1', fontSize: 16 },
  bcCurrent:   { color: NAVY, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 },

  // Gallery
  gallery:     { marginBottom: 28 },
  mainImgWrap: {
    position: 'relative', borderRadius: 18, overflow: 'hidden',
    height: 500, cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    backgroundColor: '#1e293b',
  },
  mainImg:     { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' },
  imgActions:  { position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 5 },
  imgBtn:      { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s' },
  imgBadges:   { position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 5 },
  badgeSold:   { backgroundColor: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  badgeVerified:{ backgroundColor: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  badgeTx:     { backgroundColor: 'rgba(13,27,46,0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  galleryArrow:{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, transition: 'background-color 0.15s', lineHeight: 1 },
  imgCounter:  { position: 'absolute', bottom: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 4, zIndex: 5 },
  thumbStrip:  { display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' },
  thumb:       { width: 88, height: 64, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' },

  // Two-column
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' },
  leftCol:     { minWidth: 0 },
  rightCol:    { position: 'sticky', top: 100 },

  // Sections
  section:     { backgroundColor: '#fff', borderRadius: 18, padding: '24px 22px', marginBottom: 18, border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: 'pdFadeUp 0.4s ease-out both' },
  sectionTitle:{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: NAVY, margin: '0 0 18px', letterSpacing: '-0.02em' },

  // Price card
  priceCard:   { backgroundColor: '#fff', borderRadius: 18, padding: '24px 22px', marginBottom: 18, border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: 'pdFadeUp 0.4s ease-out both' },
  priceRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  price:       { fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif", lineHeight: 1 },
  perMonth:    { fontSize: 14, color: '#64748b', fontWeight: 400, marginLeft: 4 },
  txBadge:     { backgroundColor: RED_BG, color: RED, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, border: `1px solid rgba(230,57,70,0.2)` },
  title:       { fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: NAVY, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.25 },
  location:    { display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: SLATE, marginBottom: 12 },
  verifiedBanner: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(37,168,130,0.08)', border: '1px solid rgba(37,168,130,0.2)', color: '#1d8f6e', fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 10 },

  // Feature grid
  featGrid:    { display: 'flex', gap: 10, flexWrap: 'wrap' },

  // Details table
  detailsTable:{ borderRadius: 12, overflow: 'hidden' },

  // Map
  mapPlaceholder: { borderRadius: 14, backgroundColor: '#f4f7fb', border: '1px solid #eef2f7', overflow: 'hidden', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mapInner:    { textAlign: 'center' },
  mapLink:     { display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, color: RED, fontSize: 13, fontWeight: 700, textDecoration: 'none', padding: '6px 14px', borderRadius: 20, backgroundColor: RED_BG, border: `1px solid rgba(230,57,70,0.2)` },

  // Show more
  showMoreBtn: { width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fafcff', color: RED, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },

  // Description
  description: { fontSize: 14, color: SLATE, lineHeight: 1.8, margin: 0 },

  // Agent card
  agentCard:   { backgroundColor: '#fff', borderRadius: 18, padding: '22px', border: '1px solid #eef2f7', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', animation: 'pdFadeUp 0.4s ease-out 0.15s both' },
  agentHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' },
  agentAvatar: { width: 52, height: 52, borderRadius: '50%', backgroundColor: RED_BG, border: `2px solid ${RED}`, color: RED, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  agentName:   { fontSize: 15, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" },
  agentMeta:   { marginTop: 3 },
  agentVerified:{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: TEAL, backgroundColor: 'rgba(37,168,130,0.08)', padding: '2px 8px', borderRadius: 20 },
  agentBio:    { fontSize: 12, color: SLATE, lineHeight: 1.6, margin: '0 0 14px', paddingBottom: 14, borderBottom: '1px solid #f1f5f9' },
  agentPriceBox: { textAlign: 'center', padding: '14px', backgroundColor: '#f8faff', borderRadius: 12, marginBottom: 16 },
  agentPrice:  { fontSize: 22, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif" },
  agentBtns:   { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  callBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px', borderRadius: 12, textDecoration: 'none',
    backgroundColor: '#25D366', color: '#fff',
    fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
    boxShadow: '0 3px 10px rgba(37,211,102,0.3)',
  },
  whatsappBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px', borderRadius: 12, textDecoration: 'none',
    backgroundColor: '#128C7E', color: '#fff',
    fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
    boxShadow: '0 3px 10px rgba(18,140,126,0.3)',
  },
  bookingBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px', borderRadius: 12, border: 'none',
    backgroundColor: RED, color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
    boxShadow: '0 3px 10px rgba(230,57,70,0.3)',
  },
  shareRow:    { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid #f1f5f9', marginBottom: 14 },
  shareBtn:    { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1px solid #eef2f7', backgroundColor: '#f8faff', color: NAVY, fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', transition: 'all 0.15s' },
  quickStats:  { display: 'flex', gap: 0, borderTop: '1px solid #f1f5f9', paddingTop: 14 },
  quickStat:   { flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', textAlign: 'center' },
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'property-detail-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

      @keyframes pdFadeIn  { from { opacity:0; } to { opacity:1; } }
      @keyframes pdFadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      @keyframes pdSpin    { to { transform:rotate(360deg); } }
      @keyframes pdModalIn { from { opacity:0; transform:translate(-50%,-46%); } to { opacity:1; transform:translate(-50%,-50%); } }
      @keyframes pdShimmer {
        0%   { background-color: #e2e8f0; }
        50%  { background-color: #f1f5f9; }
        100% { background-color: #e2e8f0; }
      }

      /* Main image zoom on hover */
      [style*="height: 500px"]:hover img { transform: scale(1.03); }

      /* Thumb hover */
      div[style*="88px"]:hover { opacity: 1 !important; transform: scale(1) !important; }

      /* Gallery arrow hover */
      button[style*="rgba(0,0,0,0.5)"]:hover { background-color: rgba(0,0,0,0.75) !important; }

      /* Lightbox nav hover */
      button[style*="rgba(255,255,255,0.12)"]:not(:disabled):hover { background-color: rgba(255,255,255,0.2) !important; }

      /* Agent buttons hover */
      a[style*="#25D366"]:hover  { background-color: #20b858 !important; }
      a[style*="#128C7E"]:hover  { background-color: #0e7368 !important; }
      button[style*="bookingBtn"]:hover { background-color: ${RED_DARK} !important; }
      button[style*="showMoreBtn"]:hover { background-color: ${RED_BG} !important; }

      /* Scrollbar */
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

      /* Thumb strip hide scrollbar */
      div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }

      /* Booking input focus */
      input:focus, textarea:focus, select:focus { border-color: ${RED} !important; outline: none; }

      /* Breadcrumb btn hover */
      button[style*="color: rgb(100, 116, 139)"]:hover { color: ${RED} !important; }

      @media (max-width: 900px) {
        /* Stack to single column */
      }
    `;
    document.head.appendChild(el);
  }
}

export default PropertyDetail;