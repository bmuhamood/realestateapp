/**
 * PropertyHero — Reusable hero/search banner inspired by PropertyFinder.ae
 *
 * Design language:
 *  - Clean white search card, bold teal CTA, no busy backgrounds
 *  - Prominent Buy/Rent/Shortlet tab row above the search bar
 *  - Inline location + type + bedrooms + price filters in one bar
 *  - Stats bar below with key metrics
 *
 * Props:
 *  title        – Main headline (JSX)
 *  subtitle     – Subtitle string
 *  bgImage      – Hero background URL (can be local media URL)
 *  totalCount   – Used in stats
 *  filters      – FilterState
 *  onChange     – Partial updater
 *  onReset      – Full reset
 *  hasActive    – Whether filters differ from default
 *  stats        – Override stat badges
 *  showTabs     – Show Buy/Rent/Shortlet tabs
 *  showQuick    – Show popular area chips
 *  quickAreas   – Area chip labels
 *  compact      – Reduced-height variant
 */

import React from 'react';

export interface FilterState {
  search: string;
  propertyType: string;
  transactionType: string;
  bedrooms: string;
  minPrice: number;
  maxPrice: number;
  sortBy: string;
  viewMode?: 'grid' | 'list' | 'map';
}

export const PRICE_MAX = 10_000_000;
export const DEFAULT_FILTERS: FilterState = {
  search: '',
  propertyType: '',
  transactionType: '',
  bedrooms: '',
  minPrice: 0,
  maxPrice: PRICE_MAX,
  sortBy: 'newest',
  viewMode: 'grid',
};

export const formatPriceShort = (price: number) => {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
  return `${price}`;
};

// Brand teal matching PF.ae
const TEAL = '#25a882';
const TEAL_DARK = '#1d8f6e';
const TEAL_LIGHT = 'rgba(37,168,130,0.08)';

interface StatItem { icon: string; value: string; label: string; }

interface PropertyHeroProps {
  title?: React.ReactNode;
  subtitle?: string;
  bgImage?: string;
  totalCount?: number;
  filters: FilterState;
  onChange: (p: Partial<FilterState>) => void;
  onReset: () => void;
  hasActive: boolean;
  stats?: StatItem[];
  showTabs?: boolean;
  showQuick?: boolean;
  quickAreas?: string[];
  compact?: boolean;
}

const DEFAULT_BG = 'http://127.0.0.1:8000/media/properties/2026/04/slide-1_JkUEu4E.jpg';

const DEFAULT_STATS = (count: number): StatItem[] => [
  { icon: '🏘️', value: `${count.toLocaleString()}+`, label: 'Properties Listed' },
  { icon: '✅', value: '2,800+', label: 'Verified Listings' },
  { icon: '👥', value: '18,000+', label: 'Happy Clients' },
  { icon: '📍', value: '15+', label: 'Districts Covered' },
];

const DEFAULT_AREAS = ['Kololo', 'Naguru', 'Bugolobi', 'Muyenga', 'Ntinda', 'Entebbe'];

const PropertyHero: React.FC<PropertyHeroProps> = ({
  title,
  subtitle,
  bgImage = DEFAULT_BG,
  totalCount = 0,
  filters,
  onChange,
  onReset,
  hasActive,
  stats,
  showTabs = true,
  showQuick = true,
  quickAreas = DEFAULT_AREAS,
  compact = false,
}) => {
  const resolvedStats = stats ?? DEFAULT_STATS(totalCount);

  return (
    <div style={{ ...h.root, ...(compact ? h.rootCompact : {}) }}>
      {/* ── Background image layer ── */}
      <div style={{ ...h.bgImg, backgroundImage: `url('${bgImage}')` }} />
      {/* Dark overlay — heavier than before for PF.ae crispness */}
      <div style={h.bgOverlay} />

      {/* ── Content ── */}
      <div style={{ ...h.inner, ...(compact ? h.innerCompact : {}) }}>

        {/* Trust badge */}
        {!compact && (
          <div style={h.trustBadge}>
            <span style={h.trustDot} />
            Uganda's #1 Verified Property Platform
          </div>
        )}

        {/* Headline */}
        <h1 style={{ ...h.headline, ...(compact ? h.headlineCompact : {}) }}>
          {title ?? (
            <>Find Your Perfect <span style={h.headlineAccent}>Home in Uganda</span></>
          )}
        </h1>

        {/* Sub */}
        {!compact && (
          <p style={h.sub}>
            {subtitle ?? 'Search verified houses, apartments & land across Kampala, Wakiso, Entebbe & beyond.'}
          </p>
        )}

        {/* ══ SEARCH PANEL (PF.ae style) ═════════════════════════════════════ */}
        <div style={h.searchPanel}>

          {/* Tab row */}
          {showTabs && (
            <div style={h.tabRow}>
              {[
                { key: 'sale',     label: 'Buy' },
                { key: 'rent',     label: 'Rent' },
                { key: 'shortlet', label: 'Short Term' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onChange({ transactionType: filters.transactionType === key ? '' : key })}
                  style={{
                    ...h.tab,
                    ...(filters.transactionType === key ? h.tabActive : {}),
                  }}
                >
                  {label}
                  {filters.transactionType === key && <span style={h.tabUnderline} />}
                </button>
              ))}
            </div>
          )}

          {/* Main search bar — PF.ae style single-line with segments */}
          <div style={h.searchBar}>

            {/* Location search */}
            <div style={h.searchSeg}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="City, community or building…"
                value={filters.search}
                onChange={e => onChange({ search: e.target.value })}
                style={h.searchInput}
              />
              {filters.search && (
                <button onClick={() => onChange({ search: '' })} style={h.clearX}>✕</button>
              )}
            </div>

            <div style={h.segDivider} />

            {/* Property type */}
            <div style={h.searchSeg}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <select
                value={filters.propertyType}
                onChange={e => onChange({ propertyType: e.target.value })}
                style={h.segSelect}
              >
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
                <option value="condo">Condo</option>
              </select>
            </div>

            <div style={h.segDivider} />

            {/* Bedrooms */}
            <div style={h.searchSeg}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M2 4v16M22 4v16M2 8h20M2 16h20" />
              </svg>
              <select
                value={filters.bedrooms}
                onChange={e => onChange({ bedrooms: e.target.value })}
                style={h.segSelect}
              >
                <option value="">Beds</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            <div style={h.segDivider} />

            {/* Price */}
            <div style={{ ...h.searchSeg, minWidth: 140 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <select
                value={filters.maxPrice}
                onChange={e => onChange({ maxPrice: Number(e.target.value) })}
                style={h.segSelect}
              >
                <option value={PRICE_MAX}>Max Price</option>
                <option value={500_000}>UGX 500K</option>
                <option value={1_000_000}>UGX 1M</option>
                <option value={2_000_000}>UGX 2M</option>
                <option value={5_000_000}>UGX 5M</option>
                <option value={10_000_000}>UGX 10M</option>
              </select>
            </div>

            {/* CTA */}
            <button style={h.searchCTA}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              Search
            </button>
          </div>

          {/* Popular areas */}
          {showQuick && (
            <div style={h.quickRow}>
              <span style={h.quickLabel}>Popular:</span>
              {quickAreas.map(area => (
                <button
                  key={area}
                  onClick={() => onChange({ search: area })}
                  style={{
                    ...h.quickChip,
                    ...(filters.search === area ? h.quickChipActive : {}),
                  }}
                >
                  {area}
                </button>
              ))}
              {hasActive && (
                <button onClick={onReset} style={h.resetLink}>↺ Clear filters</button>
              )}
            </div>
          )}
        </div>

        {/* Active filter tags — only when compact or tabs hidden */}
        {hasActive && !showTabs && (
          <div style={h.tagRow}>
            {filters.propertyType && (
              <span style={h.tag}>{filters.propertyType}
                <button onClick={() => onChange({ propertyType: '' })} style={h.tagX}>✕</button>
              </span>
            )}
            {filters.transactionType && (
              <span style={h.tag}>
                {filters.transactionType === 'sale' ? 'For Sale' : filters.transactionType === 'rent' ? 'For Rent' : 'Shortlet'}
                <button onClick={() => onChange({ transactionType: '' })} style={h.tagX}>✕</button>
              </span>
            )}
            {filters.bedrooms && (
              <span style={h.tag}>{filters.bedrooms}+ beds
                <button onClick={() => onChange({ bedrooms: '' })} style={h.tagX}>✕</button>
              </span>
            )}
          </div>
        )}

        {/* Stats bar */}
        {!compact && (
          <div style={h.statsBar}>
            {resolvedStats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <div style={h.statsDivider} />}
                <div style={h.statItem}>
                  <div style={h.statValue}>{stat.value}</div>
                  <div style={h.statLabel}>{stat.icon} {stat.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const h: Record<string, React.CSSProperties> = {
  root: {
    position: 'relative',
    minHeight: 580,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 0,
  },
  rootCompact: { minHeight: 300 },

  bgImg: {
    position: 'absolute', inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center 45%',
    zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute', inset: 0,
    // PF.ae-style: strong dark overlay, clean top section
    background: 'linear-gradient(160deg, rgba(5,20,40,0.82) 0%, rgba(5,20,40,0.72) 50%, rgba(5,20,40,0.88) 100%)',
    zIndex: 1,
  },

  inner: {
    position: 'relative', zIndex: 2,
    maxWidth: 960,
    margin: '0 auto',
    padding: '60px 24px 48px',
    width: '100%',
    textAlign: 'center',
  },
  innerCompact: { padding: '36px 24px 30px' },

  // Trust badge
  trustBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(37,168,130,0.15)',
    border: '1px solid rgba(37,168,130,0.4)',
    color: '#6ee7c7',
    fontSize: 11, fontWeight: 700,
    padding: '5px 14px', borderRadius: 40,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 22,
    animation: 'pfFadeUp 0.5s ease-out both',
  },
  trustDot: {
    width: 7, height: 7, borderRadius: '50%',
    backgroundColor: TEAL,
    display: 'inline-block',
    animation: 'pfPulse 2s ease-in-out infinite',
    boxShadow: `0 0 0 3px rgba(37,168,130,0.3)`,
  },

  // Headline
  headline: {
    fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif",
    fontSize: 'clamp(1.9rem, 4.5vw, 3.4rem)',
    fontWeight: 800,
    color: '#fff',
    margin: '0 0 16px',
    lineHeight: 1.15,
    letterSpacing: '-0.025em',
    animation: 'pfFadeUp 0.55s ease-out 0.08s both',
  },
  headlineCompact: { fontSize: 'clamp(1.4rem, 3vw, 2rem)', margin: '0 0 14px' },
  headlineAccent: { color: '#34d9a5' },

  sub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 'clamp(0.88rem, 1.8vw, 1rem)',
    lineHeight: 1.7,
    margin: '0 0 32px',
    animation: 'pfFadeUp 0.55s ease-out 0.15s both',
  },

  // ── Search panel ──
  searchPanel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    animation: 'pfFadeUp 0.6s ease-out 0.22s both',
  },

  // Tabs — PF.ae style: sit ON TOP of the white card
  tabRow: {
    display: 'flex',
    borderBottom: '1.5px solid #f0f4f8',
    padding: '0 24px',
    backgroundColor: '#fff',
  },
  tab: {
    position: 'relative',
    padding: '16px 22px 14px',
    border: 'none', background: 'none',
    fontSize: 14, fontWeight: 600,
    color: '#64748b', cursor: 'pointer',
    transition: 'color 0.18s',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  },
  tabActive: { color: TEAL },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 2,
    backgroundColor: TEAL,
    borderRadius: '2px 2px 0 0',
    display: 'block',
  },

  // Search bar — single wide row with segment dividers
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 16px 16px 20px',
    gap: 0,
    flexWrap: 'wrap',
    rowGap: 12,
  },
  searchSeg: {
    display: 'flex', alignItems: 'center', gap: 10,
    flex: 1, minWidth: 140,
    padding: '0 16px',
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 14, color: '#1e293b',
    backgroundColor: 'transparent', fontFamily: 'inherit',
    minWidth: 0,
  },
  clearX: {
    background: 'none', border: 'none',
    color: '#94a3b8', cursor: 'pointer', fontSize: 13,
    padding: '0 2px', lineHeight: 1, flexShrink: 0,
  },
  segDivider: {
    width: 1, height: 32,
    backgroundColor: '#e8eef4',
    flexShrink: 0,
  },
  segSelect: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 14, color: '#475569',
    backgroundColor: 'transparent', cursor: 'pointer',
    fontFamily: 'inherit', minWidth: 0,
    appearance: 'none' as const,
  },
  searchCTA: {
    display: 'flex', alignItems: 'center', gap: 8,
    height: 48, padding: '0 28px',
    borderRadius: 10, border: 'none',
    backgroundColor: TEAL, color: '#fff',
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: `0 4px 16px rgba(37,168,130,0.35)`,
    transition: 'background-color 0.18s',
    fontFamily: 'inherit', flexShrink: 0,
    marginLeft: 8,
  },

  // Quick areas
  quickRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 20px 16px',
    flexWrap: 'wrap',
    borderTop: '1px solid #f8fafc',
  },
  quickLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 600 },
  quickChip: {
    padding: '4px 12px', borderRadius: 20,
    border: `1px solid #e2e8f0`, background: '#f8fafc',
    color: '#475569', fontSize: 12, cursor: 'pointer',
    fontWeight: 500, transition: 'all 0.15s', fontFamily: 'inherit',
  },
  quickChipActive: {
    backgroundColor: TEAL_LIGHT,
    borderColor: TEAL,
    color: TEAL_DARK,
    fontWeight: 700,
  },
  resetLink: {
    background: 'none', border: 'none',
    color: '#94a3b8', fontSize: 12, cursor: 'pointer',
    textDecoration: 'underline', fontFamily: 'inherit',
    padding: '4px 4px', marginLeft: 4,
  },

  // Active tags
  tagRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8,
    justifyContent: 'center', marginTop: 16,
  },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px 5px 14px',
    backgroundColor: 'rgba(37,168,130,0.15)',
    border: '1px solid rgba(37,168,130,0.35)',
    color: '#6ee7c7', borderRadius: 20,
    fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
  },
  tagX: {
    background: 'none', border: 'none', color: '#34d9a5',
    cursor: 'pointer', fontSize: 11, padding: '0 2px', lineHeight: 1,
  },

  // Stats bar — PF.ae style: clean numbers, horizontal pill
  statsBar: {
    display: 'inline-flex', alignItems: 'center',
    marginTop: 28,
    backgroundColor: 'rgba(255,255,255,0.09)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 14, padding: '14px 0',
    flexWrap: 'wrap', justifyContent: 'center',
    width: '100%',
    animation: 'pfFadeUp 0.6s ease-out 0.4s both',
  },
  statItem: {
    textAlign: 'center', padding: '0 28px',
  },
  statValue: {
    color: '#fff', fontSize: 22, fontWeight: 800,
    lineHeight: 1, letterSpacing: '-0.02em',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.55)', fontSize: 11,
    fontWeight: 500, marginTop: 4, letterSpacing: '0.03em',
  },
  statsDivider: {
    width: 1, height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexShrink: 0,
  },
};

// ─── Font + keyframes injection ───────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'pf-hero-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

      @keyframes pfFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pfPulse {
        0%,100% { box-shadow: 0 0 0 3px rgba(37,168,130,0.35); }
        50%      { box-shadow: 0 0 0 7px rgba(37,168,130,0.08); }
      }
    `;
    document.head.appendChild(el);
  }
}

export default PropertyHero;