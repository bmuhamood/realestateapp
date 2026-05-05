import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ─── Brand Colors (Bayut-inspired) ────────────────────────────────────────────
const C = {
  primary: '#e84035',
  primaryDark: '#c0392b',
  primaryBg: 'rgba(232,64,53,0.08)',
  teal: '#25a882',
  tealDark: '#1d8f6e',
  tealBg: 'rgba(37,168,130,0.08)',
  navy: '#1a1f2e',
  slate: '#6b7280',
  muted: '#9ca3af',
  border: '#e2e5ea',
  bg: '#f7f8fa',
  white: '#ffffff',
  gold: '#f59e0b',
  purple: '#8b5cf6',
  purpleDark: '#7c3aed',
};

const PRICE_MAX = 1_000_000;

// ─── Cloudinary URL helper ────────────────────────────────────────────────────
const getCloudinaryUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.includes('/')) {
    const cloudName = 'drcy2xxkg';
    return `https://res.cloudinary.com/${cloudName}/${url}`;
  }
  return url;
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image: string;
  image_url?: string;
  gallery: string[];
  duration: string;
  provider: string;
  provider_phone: string;
  provider_email: string;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  category_name: string;
  category_icon: string;
}

interface ServiceCategory {
  id: number;
  name: string;
  icon: string;
  service_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

const formatPriceShort = (price: number) => {
  if (price >= 1_000_000) return `UGX ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `UGX ${(price / 1_000).toFixed(0)}K`;
  return `UGX ${price}`;
};

const CAT_EMOJI: Record<string, string> = {
  cleaning: '🧹',
  moving: '🚚',
  renovation: '🔨',
  electrical: '⚡',
  plumbing: '🔧',
  painting: '🖌️',
  security: '🔒',
  decoration: '🛋️',
  gardening: '🌿',
  pest: '🐛',
};
const getCatEmoji = (name: string) =>
  CAT_EMOJI[name.toLowerCase().split(' ')[0]] ?? '🔧';

// ─── Stars ────────────────────────────────────────────────────────────────────
const Stars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={i <= Math.round(rating) ? C.gold : 'none'}
        stroke={i <= Math.round(rating) ? C.gold : '#d1d5db'}
        strokeWidth="1.5"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
      </svg>
    ))}
  </span>
);

// ─── Service Card (Bayut Style) ───────────────────────────────────────────────
const ServiceCard: React.FC<{
  service: Service;
  onBook: (s: Service) => void;
  onViewDetails: (s: Service) => void;
  index: number;
}> = ({ service, onBook, onViewDetails, index }) => {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = useMemo(() => {
    if (imgError) return '';
    return getCloudinaryUrl(service.image_url || service.image);
  }, [service.image_url, service.image, imgError]);

  return (
    <div
      style={{
        ...cardStyles.container,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        animationDelay: `${index * 0.05}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onViewDetails(service)}
    >
      <div style={cardStyles.imageWrapper}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.name}
            style={{
              ...cardStyles.image,
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={cardStyles.imagePlaceholder}>🔧</div>
        )}
        {service.is_featured && <span style={cardStyles.featuredBadge}>⭐ Featured</span>}
        <span style={cardStyles.categoryBadge}>
          {service.category_icon || getCatEmoji(service.category_name)} {service.category_name}
        </span>
      </div>

      <div style={cardStyles.content}>
        <div style={cardStyles.header}>
          <div style={cardStyles.titleSection}>
            <h3 style={cardStyles.title}>{service.name}</h3>
            <p style={cardStyles.provider}>by {service.provider}</p>
          </div>
          <div style={cardStyles.ratingSection}>
            <Stars rating={service.rating} size={12} />
            <span style={cardStyles.ratingCount}>{service.rating.toFixed(1)} ({service.reviews_count})</span>
          </div>
        </div>

        <p style={cardStyles.description}>
          {service.description.length > 85 ? service.description.slice(0, 85) + '…' : service.description}
        </p>

        <div style={cardStyles.divider} />

        <div style={cardStyles.footer}>
          <div>
            <div style={cardStyles.price}>From {formatPrice(service.price)}</div>
            {service.price_unit && <div style={cardStyles.priceUnit}>per {service.price_unit}</div>}
          </div>
          <div style={cardStyles.actions}>
            {service.duration && (
              <span style={cardStyles.durationChip}>
                ⏱ {service.duration}
              </span>
            )}
            <button
              style={cardStyles.bookButton}
              onClick={e => { e.stopPropagation(); onBook(service); }}
              onMouseEnter={e => { e.currentTarget.style.background = C.tealDark; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Book Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyles = {
  container: {
    backgroundColor: C.white,
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    border: `1px solid ${C.border}`,
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'cardIn 0.4s ease-out both',
  },
  imageWrapper: {
    position: 'relative' as const,
    paddingTop: '62%',
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  image: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transition: 'transform 0.4s ease',
  },
  imagePlaceholder: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    backgroundColor: C.bg,
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    background: C.gold,
    color: C.white,
    fontSize: 10,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
    boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
    zIndex: 2,
  },
  categoryBadge: {
    position: 'absolute' as const,
    bottom: 12,
    left: 12,
    background: 'rgba(26,31,46,0.75)',
    backdropFilter: 'blur(6px)',
    color: C.white,
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 20,
    zIndex: 2,
  },
  content: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    gap: 8,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleSection: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: C.navy,
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  provider: {
    margin: '4px 0 0',
    fontSize: 11,
    color: C.muted,
    fontWeight: 500,
  },
  ratingSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  ratingCount: {
    fontSize: 9,
    color: C.muted,
  },
  description: {
    margin: 0,
    fontSize: 12,
    color: C.slate,
    lineHeight: 1.55,
  },
  divider: {
    height: 1,
    background: C.border,
    margin: '6px 0',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 800,
    color: C.teal,
  },
  priceUnit: {
    fontSize: 10,
    color: C.muted,
    marginTop: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  durationChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    backgroundColor: C.bg,
    color: C.slate,
    fontSize: 10,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
  bookButton: {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.teal,
    color: C.white,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  },
};

// ─── Booking Modal (keep as is) ───────────────────────────────────────────────
interface BookingModalProps {
  service: Service | null;
  onClose: () => void;
  onConfirm: (date: string, address: string, instructions: string) => Promise<void>;
  loading: boolean;
  success: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ service, onClose, onConfirm, loading, success }) => {
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [imgError, setImgError] = useState(false);

  const imageUrl = useMemo(() => {
    if (imgError || !service) return '';
    return getCloudinaryUrl(service.image_url || service.image);
  }, [service?.image_url, service?.image, imgError]);

  if (!service) return null;

  return (
    <>
      <div style={modalStyles.backdrop} onClick={onClose} />
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Book Service</h2>
            <p style={modalStyles.subtitle}>{service.name}</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>

        <div style={modalStyles.body}>
          {success ? (
            <div style={modalStyles.successBox}>
              <div style={modalStyles.successIcon}>✅</div>
              <h3 style={modalStyles.successTitle}>Booking Confirmed!</h3>
              <p style={modalStyles.successText}>
                Your booking for <strong>{service.name}</strong> has been received.<br />
                The service provider will contact you shortly.
              </p>
            </div>
          ) : (
            <>
              <div style={modalStyles.summary}>
                {imageUrl ? (
                  <img src={imageUrl} alt={service.name} style={modalStyles.summaryImg} onError={() => setImgError(true)} />
                ) : (
                  <div style={modalStyles.summaryPlaceholder}>🔧</div>
                )}
                <div style={modalStyles.summaryInfo}>
                  <div style={modalStyles.summaryName}>{service.name}</div>
                  <div style={modalStyles.summaryProvider}>by {service.provider}</div>
                  <div style={modalStyles.summaryPrice}>
                    From {formatPrice(service.price)}
                    {service.price_unit && <span style={{ fontWeight: 400, color: C.muted }}> / {service.price_unit}</span>}
                  </div>
                </div>
                <Stars rating={service.rating} size={12} />
              </div>

              <div style={modalStyles.contactRow}>
                {service.provider_phone && (
                  <a href={`tel:${service.provider_phone}`} style={modalStyles.contactLink}>📞 {service.provider_phone}</a>
                )}
                {service.provider_email && (
                  <a href={`mailto:${service.provider_email}`} style={modalStyles.contactLink}>✉️ {service.provider_email}</a>
                )}
              </div>

              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Date & Time *</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={modalStyles.input} required />
              </div>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Service Address *</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address..." rows={2} style={modalStyles.textarea} required />
              </div>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Special Instructions</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any specific requirements..." rows={2} style={modalStyles.textarea} />
              </div>
            </>
          )}
        </div>

        {!success && (
          <div style={modalStyles.footer}>
            <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button onClick={() => onConfirm(date, address, notes)} style={{ ...modalStyles.confirmBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Confirming...' : `Confirm Booking · ${formatPrice(service.price)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const modalStyles = {
  backdrop: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  modal: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    background: C.white,
    borderRadius: 16,
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    zIndex: 1001,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 0' },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: C.navy },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: C.muted },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.muted },
  body: { padding: '20px 24px' },
  summary: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: C.tealBg, marginBottom: 16 },
  summaryImg: { width: 48, height: 48, borderRadius: 10, objectFit: 'cover' as const },
  summaryPlaceholder: { width: 48, height: 48, borderRadius: 10, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: 14, fontWeight: 700, color: C.navy },
  summaryProvider: { fontSize: 11, color: C.muted, marginTop: 2 },
  summaryPrice: { fontSize: 14, fontWeight: 800, color: C.teal, marginTop: 4 },
  contactRow: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 16 },
  contactLink: { padding: '6px 12px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.slate, fontSize: 11, textDecoration: 'none' },
  formGroup: { marginBottom: 16, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase' as const, letterSpacing: '0.07em' },
  input: { padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  textarea: { padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' as const },
  footer: { display: 'flex', gap: 10, padding: '0 24px 24px' },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  confirmBtn: { flex: 2, padding: 12, borderRadius: 10, border: 'none', background: C.teal, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  successBox: { textAlign: 'center' as const, padding: '24px 0' },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: C.navy },
  successText: { margin: 0, fontSize: 13, color: C.slate, lineHeight: 1.6 },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Services: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [selectedService, setService] = useState<Service | null>(null);
  const [bookingLoading, setBookingLoad] = useState(false);
  const [bookingSuccess, setBookingOk] = useState(false);

  const actualMinPrice = useMemo(() => {
    if (services.length === 0) return 0;
    return Math.min(...services.map(s => s.price));
  }, [services]);

  const actualMaxPrice = useMemo(() => {
    if (services.length === 0) return PRICE_MAX;
    return Math.max(...services.map(s => s.price));
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = services.filter(s => {
      const matchCat = !selectedCategory || s.category_name === selectedCategory;
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q);
      const matchPrice = s.price >= minPrice && s.price <= maxPrice;
      return matchCat && matchSearch && matchPrice;
    });
    if (sortBy === 'price_low') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'featured') list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    return list;
  }, [services, selectedCategory, search, minPrice, maxPrice, sortBy]);

  const featured = useMemo(() => services.filter(s => s.is_featured).slice(0, 4), [services]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sr, cr] = await Promise.all([api.get('/services/'), api.get('/services/categories/')]);
        const servicesData = (sr.data.results ?? sr.data).map((s: Service) => ({
          ...s,
          image_url: getCloudinaryUrl(s.image_url || s.image),
        }));
        setServices(servicesData);
        setCategories(cr.data.results ?? cr.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBook = useCallback(async (date: string, address: string, notes: string) => {
    if (!user) { alert('Please log in to book a service.'); return; }
    if (!date || !address) { alert('Please fill in the required fields.'); return; }
    setBookingLoad(true);
    try {
      await api.post('/services/bookings/', {
        service: selectedService?.id,
        booking_date: new Date(date).toISOString(),
        address,
        special_instructions: notes,
      });
      setBookingOk(true);
      setTimeout(() => { setService(null); setBookingOk(false); }, 2200);
    } catch {
      alert('Failed to book. Please try again.');
    } finally {
      setBookingLoad(false);
    }
  }, [user, selectedService]);

  const handleViewDetails = useCallback((service: Service) => {
    navigate(`/services/${service.id}`);
  }, [navigate]);

  const handleResetFilters = () => {
    setCategory('');
    setSearch('');
    setMinPrice(actualMinPrice);
    setMaxPrice(actualMaxPrice);
  };

  if (loading) {
    return (
      <div style={pageStyles.loadingContainer}>
        <div style={pageStyles.spinner} />
        <p style={{ color: C.muted, marginTop: 14 }}>Loading services…</p>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Hero Section */}
      <div style={heroStyles.wrapper}>
        <div style={heroStyles.background} />
        <div style={heroStyles.overlay} />
        <div style={heroStyles.content}>
          <div style={heroStyles.badge}>
            <span style={heroStyles.badgeDot} /> Property Services
          </div>
          <h1 style={heroStyles.title}>
            Professional Services<br />
            <span style={heroStyles.accent}>for Your Property</span>
          </h1>
          <p style={heroStyles.subtitle}>
            Verified providers for cleaning, renovation, electrical, plumbing & more across Uganda
          </p>

          <div style={heroStyles.searchBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search services, providers or categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={heroStyles.searchInput}
            />
            {search && <button onClick={() => setSearch('')} style={heroStyles.clearBtn}>✕</button>}
          </div>

          <div style={heroStyles.stats}>
            <div><strong>{services.length}+</strong><span>Services</span></div>
            <div style={heroStyles.statDivider} />
            <div><strong>{categories.length}+</strong><span>Categories</span></div>
            <div style={heroStyles.statDivider} />
            <div><strong>✓</strong><span>Verified</span></div>
            <div style={heroStyles.statDivider} />
            <div><strong>24/7</strong><span>Support</span></div>
          </div>
        </div>
      </div>

      {/* Featured Strip */}
      {featured.length > 0 && (
        <div style={featuredStyles.strip}>
          <div style={featuredStyles.inner}>
            <div style={featuredStyles.label}>
              <span style={{ color: C.gold }}>★</span> Featured Services
            </div>
            <div style={featuredStyles.scroll}>
              {featured.map(s => (
                <button key={s.id} style={featuredStyles.chip} onClick={() => handleViewDetails(s)}>
                  <span style={{ fontSize: 20 }}>{s.category_icon || getCatEmoji(s.category_name)}</span>
                  <div>
                    <div style={featuredStyles.chipName}>{s.name}</div>
                    <div style={featuredStyles.chipPrice}>From {formatPrice(s.price)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={pageStyles.main}>
        {/* Sidebar */}
        <aside style={sidebarStyles.container}>
          <div style={sidebarStyles.section}>
            <div style={sidebarStyles.sectionLabel}>Categories</div>
            <div style={sidebarStyles.categoryList}>
              <button onClick={() => setCategory('')} style={{ ...sidebarStyles.categoryBtn, ...(!selectedCategory ? sidebarStyles.categoryActive : {}) }}>
                🏠 All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  style={{ ...sidebarStyles.categoryBtn, ...(selectedCategory === cat.name ? sidebarStyles.categoryActive : {}) }}
                >
                  {cat.icon || getCatEmoji(cat.name)} {cat.name}
                  <span style={sidebarStyles.count}>{cat.service_count}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={sidebarStyles.section}>
            <div style={sidebarStyles.sectionLabel}>Price Range</div>
            <div style={sidebarStyles.priceLabels}>
              <span>Min: {formatPriceShort(minPrice)}</span>
              <span>Max: {formatPriceShort(maxPrice)}</span>
            </div>
            <input type="range" min={actualMinPrice} max={actualMaxPrice} step={Math.max(1, Math.floor(actualMaxPrice / 100))} value={minPrice}
              onChange={e => setMinPrice(Number(e.target.value))} style={sidebarStyles.slider} />
            <input type="range" min={actualMinPrice} max={actualMaxPrice} step={Math.max(1, Math.floor(actualMaxPrice / 100))} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))} style={{ ...sidebarStyles.slider, marginTop: 12 }} />
            <div style={sidebarStyles.priceMinMax}>
              <span>{formatPriceShort(actualMinPrice)}</span>
              <span>{formatPriceShort(actualMaxPrice)}</span>
            </div>
          </div>

          {(selectedCategory || search || minPrice > actualMinPrice || maxPrice < actualMaxPrice) && (
            <button onClick={handleResetFilters} style={sidebarStyles.resetBtn}>Reset Filters</button>
          )}
        </aside>

        {/* Results */}
        <main style={mainStyles.container}>
          <div style={mainStyles.bar}>
            <div style={mainStyles.count}>
              <span style={mainStyles.countNum}>{filtered.length}</span>
              <span> {filtered.length === 1 ? 'service' : 'services'} found</span>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={mainStyles.sortSelect}>
              <option value="featured">Featured first</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {filtered.length > 0 ? (
            <div style={mainStyles.grid}>
              {filtered.map((s, i) => (
                <ServiceCard key={s.id} service={s} onBook={setService} onViewDetails={handleViewDetails} index={i} />
              ))}
            </div>
          ) : (
            <div style={mainStyles.empty}>
              <div style={{ fontSize: 52 }}>🔍</div>
              <h3>No services found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={handleResetFilters} style={mainStyles.emptyBtn}>Clear all filters</button>
            </div>
          )}
        </main>
      </div>

      {selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => { setService(null); setBookingOk(false); }}
          onConfirm={handleBook}
          loading={bookingLoading}
          success={bookingSuccess}
        />
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const pageStyles = {
  container: { minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 64 },
  loadingContainer: { minHeight: '80vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.teal}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  main: { maxWidth: 1400, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 24 },
};

const heroStyles = {
  wrapper: { position: 'relative' as const, minHeight: 460, display: 'flex', alignItems: 'center', overflow: 'hidden' },
  background: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center 50%',
    filter: 'brightness(0.35) saturate(1.1)',
    zIndex: 0,
  },
  overlay: { position: 'absolute' as const, inset: 0, background: 'linear-gradient(160deg, rgba(26,31,46,0.8) 0%, rgba(26,31,46,0.9) 100%)', zIndex: 1 },
  content: { position: 'relative' as const, zIndex: 2, maxWidth: 800, margin: '0 auto', padding: '60px 24px', textAlign: 'center' as const, width: '100%' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,168,130,0.18)', border: `1px solid rgba(37,168,130,0.4)`, color: '#6ee7c7', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 40, marginBottom: 24 },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block' },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', fontWeight: 800, color: C.white, margin: '0 0 14px', lineHeight: 1.15 },
  accent: { color: '#34d9a5' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.9rem, 2vw, 1rem)', lineHeight: 1.7, margin: '0 0 28px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, background: C.white, borderRadius: 12, padding: '8px 14px', maxWidth: 600, margin: '0 auto 28px', boxShadow: '0 16px 48px rgba(0,0,0,0.28)' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C.navy, background: 'transparent', fontFamily: 'inherit' },
  clearBtn: { background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 },
  stats: { display: 'inline-flex', alignItems: 'center', gap: 28, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 14, padding: '12px 28px' },
  statDivider: { width: 1, height: 32, background: 'rgba(255,255,255,0.12)' },
};

const featuredStyles = {
  strip: { background: C.white, borderBottom: `1px solid ${C.border}` },
  inner: { maxWidth: 1400, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, overflowX: 'auto' as const },
  label: { fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: 5 },
  scroll: { display: 'flex', gap: 10, overflowX: 'auto' as const },
  chip: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' },
  chipName: { fontSize: 12, fontWeight: 700, color: C.navy, whiteSpace: 'nowrap' as const },
  chipPrice: { fontSize: 10, color: C.teal, fontWeight: 600 },
};

const sidebarStyles = {
  container: { width: 260, flexShrink: 0, position: 'sticky' as const, top: 80, height: 'fit-content', background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 },
  categoryList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  categoryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: C.slate, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' as const, fontFamily: 'inherit', transition: 'all 0.15s' },
  categoryActive: { background: C.tealBg, color: C.teal, fontWeight: 700 },
  count: { marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: C.muted, background: C.bg, padding: '1px 6px', borderRadius: 10 },
  priceLabels: { display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12, fontWeight: 600, color: C.teal },
  slider: { width: '100%', accentColor: C.teal, cursor: 'pointer', marginTop: 4 },
  priceMinMax: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 8 },
  resetBtn: { width: '100%', padding: 10, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
};

const mainStyles = {
  container: { flex: 1, minWidth: 0 },
  bar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '12px 16px', background: C.white, borderRadius: 10, border: `1px solid ${C.border}` },
  count: { fontSize: 13, color: C.slate },
  countNum: { fontSize: 20, fontWeight: 800, color: C.navy, marginRight: 4 },
  sortSelect: { padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12, color: C.navy, background: C.white, cursor: 'pointer', fontFamily: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  empty: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12, padding: '60px 24px', textAlign: 'center' as const, background: C.white, borderRadius: 12, border: `1px solid ${C.border}` },
  emptyBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: C.teal, color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

// ─── Global keyframes ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const styleId = 'services-bayut-styles';
  if (!document.getElementById(styleId)) {
    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes cardIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      input:focus, textarea:focus, select:focus { border-color: ${C.teal} !important; outline: none; }
      @media (max-width: 960px) {
        .sidebar { display: none; }
      }
    `;
    document.head.appendChild(el);
  }
}

export default Services;