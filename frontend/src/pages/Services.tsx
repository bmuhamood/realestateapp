import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ─── Brand ────────────────────────────────────────────────────────────────────
const TEAL      = '#25a882';
const TEAL_DARK = '#1d8f6e';
const TEAL_BG   = 'rgba(37,168,130,0.08)';
const NAVY      = '#0d1b2e';
const PRICE_MAX = 1_000_000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image: string;
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
    style: 'currency', currency: 'UGX',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);

const formatPriceShort = (price: number) => {
  if (price >= 1_000_000) return `UGX ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `UGX ${(price / 1_000).toFixed(0)}K`;
  return `UGX ${price}`;
};

// Category emoji map
const CAT_EMOJI: Record<string, string> = {
  cleaning:    '🧹',
  moving:      '🚚',
  renovation:  '🔨',
  electrical:  '⚡',
  plumbing:    '🔧',
  painting:    '🖌️',
  security:    '🔒',
  decoration:  '🛋️',
  gardening:   '🌿',
  pest:        '🐛',
};
const getCatEmoji = (name: string) =>
  CAT_EMOJI[name.toLowerCase().split(' ')[0]] ?? '🔧';

// ─── Star Rating ──────────────────────────────────────────────────────────────
const Stars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <span style={{ display: 'inline-flex', gap: 1 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24"
        fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
        stroke={i <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}
        strokeWidth="1.5"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
      </svg>
    ))}
  </span>
);

// ─── Service Card - Entire card is clickable ─────────────────────────────────
const ServiceCard: React.FC<{
  service: Service;
  onBook: (s: Service) => void;
  onViewDetails: (s: Service) => void;
  index: number;
}> = ({ service, onBook, onViewDetails, index }) => {
  const [hovered, setHovered] = useState(false);

  const handleCardClick = () => {
    onViewDetails(service);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents card click from firing
    onBook(service);
  };

  return (
    <div
      className="svc-card"
      style={{
        ...c.card,
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 40px rgba(0,0,0,0.12)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        animationDelay: `${index * 0.04}s`,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div style={c.cardImgWrap}>
        <img
          src={service.image || `https://via.placeholder.com/400x220/f4f7fb/94a3b8?text=${encodeURIComponent(service.name)}`}
          alt={service.name}
          style={{
            ...c.cardImg,
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        {/* Featured badge */}
        {service.is_featured && (
          <div style={c.featuredBadge}>⭐ Featured</div>
        )}
        {/* Category pill */}
        <div style={c.categoryPill}>
          {service.category_icon || getCatEmoji(service.category_name)} {service.category_name}
        </div>
      </div>

      {/* Content */}
      <div style={c.cardBody}>
        {/* Name + rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={c.cardTitle}>{service.name}</h3>
            <p style={c.cardProvider}>by {service.provider}</p>
          </div>
          <div style={c.ratingBox}>
            <Stars rating={service.rating} />
            <span style={c.ratingCount}>{service.rating.toFixed(1)} ({service.reviews_count})</span>
          </div>
        </div>

        {/* Description */}
        <p style={c.cardDesc}>
          {service.description.length > 90
            ? service.description.slice(0, 90) + '…'
            : service.description}
        </p>

        {/* Divider */}
        <div style={c.cardDivider} />

        {/* Footer */}
        <div style={c.cardFooter}>
          <div>
            <div style={c.cardPrice}>From {formatPrice(service.price)}</div>
            {service.price_unit && (
              <div style={c.cardPriceUnit}>per {service.price_unit}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {service.duration && (
              <div style={c.durationChip}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                {service.duration}
              </div>
            )}
            <button
              style={c.bookBtn}
              onClick={handleBookClick}
              onMouseEnter={(e) => {
                const btn = e.currentTarget;
                btn.style.backgroundColor = '#1d8f6e';
                btn.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget;
                btn.style.backgroundColor = TEAL;
                btn.style.transform = 'scale(1)';
              }}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Booking Modal ────────────────────────────────────────────────────────────
const BookingModal: React.FC<{
  service: Service | null;
  onClose: () => void;
  onConfirm: (date: string, address: string, instructions: string) => Promise<void>;
  loading: boolean;
  success: boolean;
}> = ({ service, onClose, onConfirm, loading, success }) => {
  const [date, setDate]         = useState('');
  const [address, setAddress]   = useState('');
  const [notes, setNotes]       = useState('');

  if (!service) return null;

  return (
    <>
      {/* Backdrop */}
      <div style={m.backdrop} onClick={onClose} />

      {/* Modal */}
      <div style={m.modal}>
        {/* Header */}
        <div style={m.header}>
          <div>
            <h2 style={m.headerTitle}>Book Service</h2>
            <p style={m.headerSub}>{service.name}</p>
          </div>
          <button onClick={onClose} style={m.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={m.body}>
          {success ? (
            /* Success state */
            <div style={m.successBox}>
              <div style={m.successIcon}>✅</div>
              <h3 style={m.successTitle}>Booking Confirmed!</h3>
              <p style={m.successText}>
                Your booking for <strong>{service.name}</strong> has been received.
                <br />The service provider will contact you shortly.
              </p>
            </div>
          ) : (
            <>
              {/* Service summary card */}
              <div style={m.summaryCard}>
                <img
                  src={service.image || 'https://via.placeholder.com/60x60'}
                  alt={service.name}
                  style={m.summaryImg}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={m.summaryName}>{service.name}</div>
                  <div style={m.summaryProvider}>by {service.provider}</div>
                  <div style={m.summaryPrice}>
                    From {formatPrice(service.price)}
                    {service.price_unit && <span style={{ fontWeight: 400, color: '#94a3b8' }}> / {service.price_unit}</span>}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <Stars rating={service.rating} size={12} />
                </div>
              </div>

              {/* Provider contact */}
              {(service.provider_phone || service.provider_email) && (
                <div style={m.contactRow}>
                  {service.provider_phone && (
                    <a href={`tel:${service.provider_phone}`} style={m.contactLink}>
                      📞 {service.provider_phone}
                    </a>
                  )}
                  {service.provider_email && (
                    <a href={`mailto:${service.provider_email}`} style={m.contactLink}>
                      ✉️ {service.provider_email}
                    </a>
                  )}
                </div>
              )}

              {/* Form */}
              <div style={m.formGrid}>
                <div style={m.formGroup}>
                  <label style={m.formLabel}>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={m.formInput}
                    required
                  />
                </div>

                <div style={m.formGroup}>
                  <label style={m.formLabel}>Service Address *</label>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter full address where service is needed…"
                    rows={2}
                    style={{ ...m.formInput, resize: 'vertical' as const }}
                    required
                  />
                </div>

                <div style={m.formGroup}>
                  <label style={m.formLabel}>Special Instructions</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any specific requirements or notes for the provider…"
                    rows={3}
                    style={{ ...m.formInput, resize: 'vertical' as const }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div style={m.footer}>
            <button onClick={onClose} style={m.cancelBtn}>Cancel</button>
            <button
              onClick={() => onConfirm(date, address, notes)}
              style={{ ...m.confirmBtn, ...(loading ? m.confirmBtnLoading : {}) }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={m.spinner} /> Confirming…
                </span>
              ) : (
                <>Confirm Booking · From {formatPrice(service.price)}</>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices]           = useState<Service[]>([]);
  const [categories, setCategories]       = useState<ServiceCategory[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedCategory, setCategory]   = useState('');
  const [search, setSearch]               = useState('');
  const [sortBy, setSortBy]               = useState('featured');
  const [minPrice, setMinPrice]           = useState(0);
  const [maxPrice, setMaxPrice]           = useState(PRICE_MAX);
  const [selectedService, setService]     = useState<Service | null>(null);
  const [bookingLoading, setBookingLoad]  = useState(false);
  const [bookingSuccess, setBookingOk]    = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const [sr, cr] = await Promise.all([
          api.get('/services/'),
          api.get('/services/categories/'),
        ]);
        setServices(sr.data.results ?? sr.data);
        setCategories(cr.data.results ?? cr.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
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
      setTimeout(() => {
        setService(null);
        setBookingOk(false);
      }, 2200);
    } catch {
      alert('Failed to book. Please try again.');
    } finally {
      setBookingLoad(false);
    }
  }, [user, selectedService]);

  const handleViewDetails = useCallback((service: Service) => {
    navigate(`/services/${service.id}`);
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = services.filter(s => {
      const mCat   = !selectedCategory || s.category_name === selectedCategory;
      const mSearch = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q);
      const mPrice  = s.price >= minPrice && s.price <= maxPrice;
      return mCat && mSearch && mPrice;
    });
    if (sortBy === 'price_low')  list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')     list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'featured')   list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    return list;
  }, [services, selectedCategory, search, minPrice, maxPrice, sortBy]);

  const featured = useMemo(() => services.filter(s => s.is_featured).slice(0, 4), [services]);

  // Get actual min and max prices from services for slider ranges
  const actualMinPrice = useMemo(() => {
    if (services.length === 0) return 0;
    return Math.min(...services.map(s => s.price));
  }, [services]);
  
  const actualMaxPrice = useMemo(() => {
    if (services.length === 0) return PRICE_MAX;
    return Math.max(...services.map(s => s.price));
  }, [services]);

  const handleResetFilters = () => {
    setCategory('');
    setSearch('');
    setMinPrice(actualMinPrice);
    setMaxPrice(actualMaxPrice);
  };

  if (loading) return (
    <div style={{ ...p.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={p.spinner} />
      <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 13 }}>Loading services…</p>
    </div>
  );

  return (
    <div style={p.page}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div style={p.hero}>
        <div style={p.heroBg} />
        <div style={p.heroOverlay} />
        <div style={p.heroInner}>
          <div style={p.heroBadge}>
            <span style={p.heroBadgeDot} /> Property Services
          </div>
          <h1 style={p.heroTitle}>
            Professional Services<br />
            <span style={p.heroAccent}>for Your Property</span>
          </h1>
          <p style={p.heroSub}>
            Verified providers for cleaning, renovation, electrical, plumbing & more across Uganda
          </p>

          <div style={p.heroSearch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search services, providers or categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={p.heroSearchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={p.heroSearchClear}>✕</button>
            )}
            <button style={p.heroSearchBtn}>Search</button>
          </div>

          <div style={p.heroStats}>
            <div style={p.heroStat}><strong>{services.length}+</strong><span>Services</span></div>
            <div style={p.heroStatDivider} />
            <div style={p.heroStat}><strong>{categories.length}+</strong><span>Categories</span></div>
            <div style={p.heroStatDivider} />
            <div style={p.heroStat}><strong>✓</strong><span>Verified Providers</span></div>
            <div style={p.heroStatDivider} />
            <div style={p.heroStat}><strong>24/7</strong><span>Support</span></div>
          </div>
        </div>
      </div>

      {/* ══ FEATURED STRIP ═══════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <div style={p.featuredStrip}>
          <div style={p.featuredInner}>
            <div style={p.featuredLabel}>
              <span style={{ color: TEAL }}>★</span> Featured Services
            </div>
            <div style={p.featuredScroll}>
              {featured.map(s => (
                <button
                  key={s.id}
                  style={p.featuredChip}
                  onClick={() => handleViewDetails(s)}
                >
                  <span style={{ fontSize: 18 }}>{s.category_icon || getCatEmoji(s.category_name)}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={p.featuredChipName}>{s.name}</div>
                    <div style={p.featuredChipPrice}>From {formatPrice(s.price)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <div style={p.body}>

        <aside style={p.sidebar}>
          <div style={p.filterSection}>
            <div style={p.filterSectionLabel}>Category</div>
            <div style={p.filterChips}>
              <button
                onClick={() => setCategory('')}
                style={{ ...p.filterChip, ...(!selectedCategory ? p.filterChipActive : {}) }}
              >
                🏠 All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  style={{ ...p.filterChip, ...(selectedCategory === cat.name ? p.filterChipActive : {}) }}
                >
                  {cat.icon || getCatEmoji(cat.name)} {cat.name}
                  <span style={p.filterCount}>{cat.service_count}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={p.filterSection}>
            <div style={p.filterSectionLabel}>Price Range</div>
            <div style={p.priceRangeLabels}>
              <span style={p.priceLabel}>Min: {formatPriceShort(minPrice)}</span>
              <span style={p.priceLabel}>Max: {formatPriceShort(maxPrice)}</span>
            </div>
            
            <div style={p.sliderLabel}>Minimum Price</div>
            <input
              type="range"
              min={actualMinPrice}
              max={actualMaxPrice}
              step={Math.max(1, Math.floor(actualMaxPrice / 100))}
              value={minPrice}
              onChange={e => setMinPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: TEAL, cursor: 'pointer', marginTop: 4 }}
            />
            
            <div style={{ ...p.sliderLabel, marginTop: 12 }}>Maximum Price</div>
            <input
              type="range"
              min={actualMinPrice}
              max={actualMaxPrice}
              step={Math.max(1, Math.floor(actualMaxPrice / 100))}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: TEAL, cursor: 'pointer', marginTop: 4 }}
            />
            
            <div style={p.priceMinMax}>
              <span>{formatPriceShort(actualMinPrice)}</span>
              <span>{formatPriceShort(actualMaxPrice)}</span>
            </div>
          </div>

          {(selectedCategory || search || minPrice > actualMinPrice || maxPrice < actualMaxPrice) && (
            <button onClick={handleResetFilters} style={p.resetBtn}>
              ↺ Reset all filters
            </button>
          )}
        </aside>

        <main style={p.main}>
          <div style={p.resultsBar}>
            <div style={p.resultsCount}>
              <span style={p.resultsNum}>{filtered.length}</span>
              <span style={p.resultsSub}> {filtered.length === 1 ? 'service' : 'services'} found</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={p.sortSelect}
              >
                <option value="featured">Featured first</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div style={p.grid}>
              {filtered.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onBook={setService}
                  onViewDetails={handleViewDetails}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div style={p.empty}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
              <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
                No services found
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px' }}>
                Try adjusting your search or filters
              </p>
              <button onClick={handleResetFilters} style={p.emptyBtn}>
                Clear all filters
              </button>
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

// ─── Card styles ──────────────────────────────────────────────────────────────
const c: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', cursor: 'pointer',
    border: '1px solid #eef2f7',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    display: 'flex', flexDirection: 'column',
    animation: 'svcCardIn 0.38s ease-out both',
  },
  cardImgWrap: { position: 'relative', paddingTop: '58%', overflow: 'hidden', flexShrink: 0 },
  cardImg: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  featuredBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#f59e0b', color: '#fff',
    fontSize: 11, fontWeight: 700,
    padding: '4px 10px', borderRadius: 20,
    boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
    zIndex: 2,
  },
  categoryPill: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(13,27,46,0.75)',
    backdropFilter: 'blur(6px)',
    color: '#fff', fontSize: 11, fontWeight: 600,
    padding: '4px 10px', borderRadius: 20,
    zIndex: 2,
  },
  cardBody: { padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, gap: 0 },
  cardTitle: {
    margin: '0 0 3px',
    fontSize: 15, fontWeight: 700, color: NAVY,
    lineHeight: 1.3,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardProvider: { margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  ratingBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  ratingCount: { fontSize: 10, color: '#94a3b8' },
  cardDesc: { margin: '10px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.55, flex: 1 },
  cardDivider: { height: 1, backgroundColor: '#f1f5f9', margin: '14px 0' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardPrice: { fontSize: 17, fontWeight: 800, color: TEAL },
  cardPriceUnit: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  durationChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 9px', borderRadius: 20,
    border: '1px solid #e2e8f0', backgroundColor: '#f8faff',
    color: '#64748b', fontSize: 11, fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  bookBtn: {
    padding: '7px 16px', borderRadius: 9,
    border: 'none', backgroundColor: TEAL, color: '#fff',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    boxShadow: `0 3px 10px rgba(37,168,130,0.28)`,
    whiteSpace: 'nowrap', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
};

// ─── Modal styles ─────────────────────────────────────────────────────────────
const m: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(13,27,46,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
  },
  modal: {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%', maxWidth: 520,
    maxHeight: '90vh', overflowY: 'auto',
    backgroundColor: '#fff', borderRadius: 20,
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    zIndex: 1001,
    animation: 'modalIn 0.22s ease-out',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '24px 24px 0',
  },
  headerTitle: {
    margin: 0, fontSize: 20, fontWeight: 800, color: NAVY,
    fontFamily: "'Sora', sans-serif",
  },
  headerSub: { margin: '3px 0 0', fontSize: 13, color: '#94a3b8' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', padding: 4, display: 'flex',
    borderRadius: 8, transition: 'color 0.15s',
  },
  body: { padding: '20px 24px' },
  summaryCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 12,
    backgroundColor: TEAL_BG,
    border: `1px solid rgba(37,168,130,0.2)`,
    marginBottom: 16,
  },
  summaryImg: { width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 },
  summaryName: { fontSize: 14, fontWeight: 700, color: NAVY },
  summaryProvider: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  summaryPrice: { fontSize: 15, fontWeight: 800, color: TEAL, marginTop: 4 },
  contactRow: {
    display: 'flex', gap: 12, flexWrap: 'wrap',
    marginBottom: 16,
  },
  contactLink: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 8,
    backgroundColor: '#f8faff', border: '1px solid #e2e8f0',
    color: '#475569', fontSize: 12, fontWeight: 500,
    textDecoration: 'none',
  },
  formGrid: { display: 'flex', flexDirection: 'column', gap: 14 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  formLabel: { fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' },
  formInput: {
    padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    fontSize: 14, color: NAVY,
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.15s',
  },
  footer: {
    display: 'flex', gap: 10, padding: '0 24px 24px',
  },
  cancelBtn: {
    flex: 1, padding: '12px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    color: '#64748b', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  confirmBtn: {
    flex: 2, padding: '12px', borderRadius: 10,
    border: 'none', backgroundColor: TEAL, color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: `0 4px 14px rgba(37,168,130,0.35)`,
    transition: 'background-color 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnLoading: { backgroundColor: TEAL_DARK, cursor: 'wait' },
  spinner: {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.35)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  successBox: {
    textAlign: 'center', padding: '20px 0',
  },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: NAVY },
  successText: { margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 },
};

// ─── Page styles ──────────────────────────────────────────────────────────────
const p: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', backgroundColor: '#f4f7fb',
    fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
    marginTop: 64,
  },
  spinner: {
    width: 40, height: 40,
    border: '3px solid #e2e8f0', borderTop: `3px solid ${TEAL}`,
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  hero: {
    position: 'relative', minHeight: 480,
    display: 'flex', alignItems: 'center', overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', inset: 0,
    backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')`,
    backgroundSize: 'cover', backgroundPosition: 'center 50%',
    filter: 'brightness(0.35) saturate(1.1)',
    zIndex: 0,
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: `linear-gradient(160deg, rgba(13,27,46,0.7) 0%, rgba(13,27,46,0.85) 100%)`,
    zIndex: 1,
  },
  heroInner: {
    position: 'relative', zIndex: 2,
    maxWidth: 820, margin: '0 auto',
    padding: '60px 24px 48px',
    textAlign: 'center', width: '100%',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(37,168,130,0.18)',
    border: '1px solid rgba(37,168,130,0.4)',
    color: '#6ee7c7',
    fontSize: 11, fontWeight: 700,
    padding: '5px 14px', borderRadius: 40,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 22, animation: 'pfFadeUp 0.5s ease-out both',
  },
  heroBadgeDot: {
    width: 7, height: 7, borderRadius: '50%',
    backgroundColor: TEAL, display: 'inline-block',
    animation: 'pfPulse 2s ease-in-out infinite',
    boxShadow: `0 0 0 3px rgba(37,168,130,0.3)`,
  },
  heroTitle: {
    fontFamily: "'Sora', Georgia, serif",
    fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
    fontWeight: 800, color: '#fff',
    margin: '0 0 14px', lineHeight: 1.15,
    letterSpacing: '-0.025em',
    animation: 'pfFadeUp 0.55s ease-out 0.08s both',
  },
  heroAccent: { color: '#34d9a5' },
  heroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    lineHeight: 1.7, margin: '0 0 28px',
    animation: 'pfFadeUp 0.55s ease-out 0.14s both',
  },
  heroSearch: {
    display: 'flex', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    padding: '10px 14px', maxWidth: 680, margin: '0 auto 28px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
    animation: 'pfFadeUp 0.55s ease-out 0.2s both',
  },
  heroSearchInput: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 14, color: NAVY,
    backgroundColor: 'transparent', fontFamily: 'inherit',
  },
  heroSearchClear: {
    background: 'none', border: 'none', color: '#94a3b8',
    cursor: 'pointer', fontSize: 13, padding: 2,
  },
  heroSearchBtn: {
    padding: '9px 22px', borderRadius: 10,
    border: 'none', backgroundColor: TEAL, color: '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    boxShadow: `0 3px 10px rgba(37,168,130,0.3)`,
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  heroStats: {
    display: 'inline-flex', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14, padding: '12px 0',
    animation: 'pfFadeUp 0.55s ease-out 0.28s both',
  },
  heroStat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 2, padding: '0 24px',
    color: '#fff',
  },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  featuredStrip: {
    backgroundColor: '#fff', borderBottom: '1px solid #eef2f7',
    padding: '14px 0',
  },
  featuredInner: {
    maxWidth: 1400, margin: '0 auto',
    padding: '0 20px',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  featuredLabel: {
    fontSize: 12, fontWeight: 700, color: NAVY,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    whiteSpace: 'nowrap', flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  featuredScroll: {
    display: 'flex', gap: 10, overflowX: 'auto',
    paddingBottom: 2,
  },
  featuredChip: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', borderRadius: 12,
    border: '1.5px solid #eef2f7', backgroundColor: '#fafcff',
    cursor: 'pointer', flexShrink: 0, textAlign: 'left',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  featuredChipName: { fontSize: 12, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap' },
  featuredChipPrice: { fontSize: 11, color: TEAL, fontWeight: 600, marginTop: 1 },
  body: {
    maxWidth: 1400, margin: '0 auto',
    padding: '20px 16px', display: 'flex', gap: 16,
    minHeight: 'calc(100vh - 540px)',
  },
  sidebar: {
    width: 260, flexShrink: 0,
    position: 'sticky', top: 80,
    height: 'fit-content',
    backgroundColor: '#fff', borderRadius: 14,
    border: '1px solid #eef2f7',
    padding: '18px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  filterSection: { marginBottom: 22 },
  filterSectionLabel: {
    fontSize: 10, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
  },
  filterChips: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px', borderRadius: 9,
    border: '1.5px solid transparent', backgroundColor: 'transparent',
    color: '#475569', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  filterChipActive: {
    backgroundColor: TEAL_BG, borderColor: TEAL,
    color: TEAL_DARK, fontWeight: 700,
  },
  filterCount: {
    marginLeft: 'auto', fontSize: 10, fontWeight: 700,
    color: '#94a3b8', backgroundColor: '#f1f5f9',
    padding: '1px 6px', borderRadius: 10,
  },
  priceRangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  priceLabel: {
    color: TEAL,
    backgroundColor: TEAL_BG,
    padding: '2px 8px',
    borderRadius: 12,
  },
  sliderLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  priceMinMax: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 10, color: '#94a3b8', marginTop: 8,
  },
  resetBtn: {
    width: '100%', padding: '10px', borderRadius: 10,
    border: '1.5px solid #eef2f7', backgroundColor: '#fafcff',
    color: '#64748b', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
  },
  main: { flex: 1, minWidth: 0 },
  resultsBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, padding: '12px 16px',
    backgroundColor: '#fff', borderRadius: 12,
    border: '1px solid #eef2f7',
  },
  resultsCount: { display: 'flex', alignItems: 'baseline', gap: 3 },
  resultsNum: { fontSize: 20, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" },
  resultsSub: { fontSize: 13, color: '#94a3b8', fontWeight: 500 },
  sortSelect: {
    padding: '6px 10px', borderRadius: 8,
    border: '1.5px solid #eef2f7', fontSize: 12,
    color: NAVY, backgroundColor: '#fff',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 18,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
    backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7',
  },
  emptyBtn: {
    padding: '10px 28px', borderRadius: 10, border: 'none',
    backgroundColor: TEAL, color: '#fff', fontSize: 13,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
};

// ─── Global keyframes ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'services-pf-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

      @keyframes spin       { to { transform: rotate(360deg); } }
      @keyframes pfFadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      @keyframes pfPulse    { 0%,100% { box-shadow:0 0 0 3px rgba(37,168,130,.35); } 50% { box-shadow:0 0 0 7px rgba(37,168,130,.08); } }
      @keyframes svcCardIn  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes modalIn    { from { opacity:0; transform:translate(-50%,-48%); } to { opacity:1; transform:translate(-50%,-50%); } }

      .heroStat strong { font-size: 18px; font-weight: 800; }
      .heroStat span { font-size: 11px; color: rgba(255, 255, 255, 0.55); }

      ::-webkit-scrollbar       { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

      input[type="datetime-local"]:focus,
      textarea:focus,
      select:focus { border-color: ${TEAL} !important; outline: none; }

      @media (max-width: 960px) {
        aside { display: none !important; }
      }
    `;
    document.head.appendChild(el);
  }
}

export default Services;