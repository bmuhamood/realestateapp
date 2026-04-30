// components/Hero/HeroSection.tsx — MODERN REDESIGN
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Property } from '../../types';

const RED   = '#e63946';
const NAVY  = '#0d1b2e';
const TEAL  = '#25a882';

interface HeroSectionProps {
  onSearch: (filters: any) => void;
  stats: { total: number; forSale: number; forRent: number; forShortlet: number };
  heroTxType: 'sale' | 'rent' | 'shortlet';
  setHeroTxType: (type: 'sale' | 'rent' | 'shortlet') => void;
}

// ─── App Download Banner ──────────────────────────────────────────────────────
export const AppDownloadBanner: React.FC = () => {
  const [hoverPlay, setHoverPlay]   = useState(false);
  const [hoverApple, setHoverApple] = useState(false);

  return (
    <div style={app.wrapper}>
      {/* decorative circles */}
      <div style={{ position: 'absolute', top: -80, right: '30%', width: 280, height: 280, borderRadius: '50%', backgroundColor: 'rgba(37,168,130,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: '20%',  width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(230,57,70,0.05)',  pointerEvents: 'none' }} />

      {/* ── Left ── */}
      <div style={app.left}>
        <div style={app.eyebrow}>📱 Mobile App</div>

        <h2 style={app.heading}>
          Property Search,<br />
          <span style={{ color: RED }}>On the Go</span>
        </h2>

        <p style={app.desc}>
          Browse listings, save favourites, chat with agents, and book viewings — all from your phone. Uganda's #1 real estate app.
        </p>

        {/* Store badges */}
        <div style={app.badges}>
          {[
            {
              href: 'https://play.google.com/store',
              hov: hoverPlay,
              setHov: setHoverPlay,
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3.18 23.82A2 2 0 0 1 2 22.09V1.91A2 2 0 0 1 3.18.18L13.94 12 3.18 23.82Z" fill="#34A853"/>
                  <path d="M17.8 15.7l-3.33-3.7 3.33-3.7 3.7 2.13a1.6 1.6 0 0 1 0 3.14L17.8 15.7Z" fill="#FBBC04"/>
                  <path d="M3.18.18l10.76 11.82L8.55 17 3.18.18Z" fill="#4285F4"/>
                  <path d="M8.55 7L3.18 23.82 13.94 12 8.55 7Z" fill="#EA4335"/>
                </svg>
              ),
              top: 'GET IT ON', big: 'Google Play',
            },
            {
              href: 'https://apps.apple.com',
              hov: hoverApple,
              setHov: setHoverApple,
              icon: (
                <svg width="20" height="24" viewBox="0 0 22 26" fill="white">
                  <path d="M18.05 13.75c-.03-3.07 2.5-4.56 2.62-4.63-1.43-2.09-3.65-2.37-4.44-2.4-1.89-.19-3.7 1.12-4.66 1.12-.96 0-2.44-1.09-4.01-1.06-2.06.03-3.97 1.2-5.03 3.04-2.15 3.73-.55 9.24 1.54 12.26 1.03 1.48 2.24 3.14 3.84 3.08 1.54-.06 2.12-.99 3.98-.99 1.86 0 2.39.99 4.01.96 1.66-.03 2.71-1.5 3.72-2.99a14.1 14.1 0 0 0 1.7-3.46c-3.04-1.17-3.27-5.93-.27-6.93ZM14.96 4.3C15.82 3.27 16.4 1.84 16.24.4c-1.23.05-2.72.82-3.6 1.83-.79.89-1.49 2.35-1.3 3.73 1.38.11 2.78-.68 3.62-1.66Z"/>
                </svg>
              ),
              top: 'DOWNLOAD ON THE', big: 'App Store',
            },
          ].map(b => (
            <a
              key={b.href}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => b.setHov(true)}
              onMouseLeave={() => b.setHov(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                backgroundColor: b.hov ? '#1a1a1a' : '#111',
                border: `1.5px solid ${b.hov ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.13)'}`,
                borderRadius: 14,
                padding: '11px 20px',
                color: '#fff', textDecoration: 'none',
                transform: b.hov ? 'translateY(-2px)' : 'none',
                boxShadow: b.hov ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
                transition: 'all 0.2s',
                minWidth: 155,
              }}
            >
              {b.icon}
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', lineHeight: 1, marginBottom: 3 }}>{b.top}</div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{b.big}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Mini stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {[
            { num: '10K+', label: 'Downloads' },
            { num: '4.8★',  label: 'App Rating' },
            { num: 'Free',  label: 'Always'     },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>{s.num}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.03em' }}>{s.label}</span>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.12)' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Right: phone mockup ── */}
      <div style={app.right}>
        {/* Outer glow ring */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 340, height: 340, borderRadius: '50%', background: `radial-gradient(circle, ${TEAL}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={app.phone}>
          {/* Notch */}
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 64, height: 20, backgroundColor: '#0a0a0a', borderRadius: 12, zIndex: 10 }} />

          {/* Screen */}
          <div style={{ width: '100%', height: '100%', backgroundColor: '#f5f7fa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* App bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 14px 10px', backgroundColor: '#fff', borderBottom: '1px solid #eef2f7' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" }}>Metro Care</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: TEAL, backgroundColor: 'rgba(37,168,130,0.1)', padding: '2px 8px', borderRadius: 10 }}>🟢 Live</span>
            </div>

            {/* Property image */}
            <img
              src="https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=300&h=180&fit=crop"
              alt="Property"
              style={{ width: '100%', height: 126, objectFit: 'cover', display: 'block' }}
            />

            {/* Card */}
            <div style={{ backgroundColor: '#fff', margin: '8px', borderRadius: 12, padding: '10px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: NAVY, marginBottom: 2 }}>3BR House, Kololo</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: RED, marginBottom: 8 }}>UGX 450M</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {['🛏 3', '🚿 2', '📐 180m²'].map(c => (
                  <span key={c} style={{ fontSize: 9, backgroundColor: '#f4f7fb', color: '#475569', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>{c}</span>
                ))}
              </div>
              {/* Mini like button */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 28, backgroundColor: RED, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>View Property</span>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>❤️</div>
              </div>
            </div>

            {/* Nav bar */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', padding: '8px 0 14px', borderTop: '1px solid #eef2f7' }}>
              {['🏠', '🔍', '❤️', '👤'].map((ic, i) => (
                <span key={ic} style={{ fontSize: 18, opacity: i === 1 ? 1 : 0.45 }}>{ic}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const app: Record<string, React.CSSProperties> = {
  wrapper: {
    background: `linear-gradient(135deg, ${NAVY} 0%, #132436 55%, #0a1929 100%)`,
    padding: '64px 0',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    maxWidth: 500,
    padding: '0 28px 0 max(28px, calc((100vw - 1200px) / 2))',
    flex: '0 0 auto',
    zIndex: 2,
  },
  eyebrow: {
    display: 'inline-block',
    backgroundColor: 'rgba(230,57,70,0.14)',
    color: RED,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '5px 14px',
    borderRadius: 20,
    marginBottom: 18,
    border: '1px solid rgba(230,57,70,0.28)',
  },
  heading: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 'clamp(1.8rem, 3.2vw, 2.7rem)',
    fontWeight: 800,
    color: '#fff',
    margin: '0 0 16px',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  desc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 1.75,
    margin: '0 0 28px',
    maxWidth: 420,
  },
  badges: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  right: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 max(28px, calc((100vw - 1200px) / 2)) 0 64px',
    position: 'relative',
    zIndex: 2,
  },
  phone: {
    width: 210,
    height: 440,
    backgroundColor: '#0a0a0a',
    borderRadius: 38,
    border: '6px solid #1a1a1a',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.03)',
  },
};

// ─── Main Hero ────────────────────────────────────────────────────────────────
const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, stats, heroTxType, setHeroTxType }) => {
  const [searchQuery,          setSearchQuery]          = useState('');
  const [selectedLocation,     setSelectedLocation]     = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [allLocations,         setAllLocations]         = useState<string[]>([]);
  const [imageLoaded,          setImageLoaded]          = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/properties/', { params: { page_size: 500 } });
        const props: Property[] = res.data.results || res.data;
        const locs = new Set<string>();
        props.forEach(p => { if (p.city) locs.add(p.city); if (p.district) locs.add(p.district); });
        setAllLocations(Array.from(locs).sort());
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowLocationDropdown(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const doSearch = () => {
    const f: any = { transaction_type: heroTxType };
    if (searchQuery.trim())  f.search   = searchQuery.trim();
    if (selectedLocation)    f.location = selectedLocation;
    onSearch(f);
  };

  const changeTx = (type: 'sale' | 'rent' | 'shortlet') => {
    setHeroTxType(type);
    const f: any = { transaction_type: type };
    if (searchQuery.trim())  f.search   = searchQuery.trim();
    if (selectedLocation)    f.location = selectedLocation;
    onSearch(f);
  };

  const filtered = allLocations.filter(l => l.toLowerCase().includes(selectedLocation.toLowerCase())).slice(0, 10);

  const txCfg = {
    sale:     { label: 'For Sale',   count: stats.forSale,     accent: RED },
    rent:     { label: 'For Rent',   count: stats.forRent,     accent: TEAL },
    shortlet: { label: 'Short Stay', count: stats.forShortlet, accent: '#f59e0b' },
  };

  return (
    <>
      {/* ── Hero ── */}
      <div style={h.container}>
        {/* BG */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1920')`, backgroundSize: 'cover', backgroundPosition: 'center 40%', opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.7s ease' }} />
        <img src="https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1920" style={{ display: 'none' }} onLoad={() => setImageLoaded(true)} alt="" />
        {/* Overlay layers */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, rgba(13,27,46,0.5) 0%, rgba(13,27,46,0.8) 65%, rgba(13,27,46,0.96) 100%)' }} />
        {/* Bottom page-blend */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to bottom, transparent, #f5f7fa)' }} />

        <div style={h.content}>
          {/* Eyebrow pill */}
          <div style={h.eyebrow}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: TEAL, display: 'inline-block', boxShadow: `0 0 8px ${TEAL}` }} />
            Uganda's #1 Real Estate Platform
          </div>

          {/* Headline */}
          <h1 style={h.title}>
            {stats.total > 0
              ? <><span style={{ color: RED }}>{stats.total.toLocaleString()}+</span> Properties<br />Across Uganda</>
              : <>Find Your<br /><span style={{ color: RED }}>Dream</span> Property</>
            }
          </h1>

          <p style={h.subtitle}>Verified listings · Trusted agents · Seamless search</p>

          {/* TX toggle pills */}
          <div style={h.txRow}>
            {(Object.entries(txCfg) as [typeof heroTxType, typeof txCfg['sale']][]).map(([key, cfg]) => {
              const active = heroTxType === key;
              return (
                <button
                  key={key}
                  onClick={() => changeTx(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 22px', borderRadius: 30, border: 'none',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                    backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.13)',
                    backdropFilter: 'blur(10px)',
                    color: active ? NAVY : '#fff',
                    boxShadow: active ? '0 4px 16px rgba(0,0,0,0.18)' : 'none',
                  }}
                >
                  {cfg.label}
                  {cfg.count > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, transition: 'all 0.2s',
                      backgroundColor: active ? cfg.accent : 'rgba(255,255,255,0.18)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.85)',
                    }}>
                      {cfg.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Search card ── */}
          <div style={h.searchCard}>
            {/* Location */}
            <div style={h.field} ref={dropdownRef}>
              <div style={h.fieldLabel}>📍 Location</div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="City or district..."
                  value={selectedLocation}
                  onChange={e => { setSelectedLocation(e.target.value); setShowLocationDropdown(true); }}
                  onFocus={() => setShowLocationDropdown(true)}
                  style={h.fieldInput}
                />
                {selectedLocation && (
                  <button onClick={() => { setSelectedLocation(''); setShowLocationDropdown(false); }} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13, padding: 4 }}>✕</button>
                )}
              </div>
              {showLocationDropdown && filtered.length > 0 && (
                <div style={h.dropdown}>
                  {filtered.map(loc => (
                    <div
                      key={loc}
                      onClick={() => { setSelectedLocation(loc); setShowLocationDropdown(false); }}
                      style={h.dropItem}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f4f7fb')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ color: '#94a3b8', marginRight: 8, fontSize: 13 }}>📍</span>{loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={h.divider} />

            {/* Keyword */}
            <div style={{ ...h.field, flex: 1.6 }}>
              <div style={h.fieldLabel}>🔍 Keyword</div>
              <input
                type="text"
                placeholder="Type, bedrooms, area..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && doSearch()}
                style={h.fieldInput}
              />
            </div>

            {/* Search btn */}
            <button onClick={doSearch} style={h.searchBtn} className="hero-search-btn">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search
            </button>
          </div>

          {/* Quick chips */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Popular:</span>
            {['Kampala', 'Kololo', 'Ntinda', 'Kira', 'Muyenga', 'Nansana'].map(loc => (
              <button
                key={loc}
                onClick={() => { setSelectedLocation(loc); setShowLocationDropdown(false); }}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 0.15s' }}
                className="quick-chip"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── App Download Banner ── */}
      <AppDownloadBanner />

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-search-btn:hover { background-color: #c1121f !important; transform: none; }
        .quick-chip:hover { background-color: rgba(255,255,255,0.22) !important; }
      `}</style>
    </>
  );
};

const h: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    minHeight: 640,
    marginTop: 68,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '88px 28px 148px',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 880,
    width: '100%',
    margin: '0 auto',
    textAlign: 'center',
    animation: 'heroFadeUp 0.75s cubic-bezier(0.22,1,0.36,1) both',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.05em',
    padding: '7px 18px',
    borderRadius: 30,
    marginBottom: 26,
  },
  title: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 'clamp(2.5rem, 5.8vw, 4.2rem)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.12,
    margin: '0 0 18px',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    margin: '0 0 34px',
    letterSpacing: '0.02em',
  },
  txRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    display: 'flex',
    alignItems: 'stretch',
    boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
    overflow: 'visible',
    padding: '6px 6px 6px 0',
    marginBottom: 22,
  },
  field: {
    flex: 1,
    padding: '13px 22px',
    position: 'relative' as const,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 5,
  },
  fieldInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: NAVY,
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  divider: {
    width: 1,
    backgroundColor: '#eef2f7',
    margin: '10px 0',
    flexShrink: 0,
  },
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 10px)',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 10px 40px rgba(0,0,0,0.14)',
    border: '1px solid #eef2f7',
    zIndex: 300,
    maxHeight: 240,
    overflowY: 'auto' as const,
  },
  dropItem: {
    padding: '11px 16px',
    fontSize: 13,
    color: NAVY,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.1s',
  },
  searchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '0 30px',
    borderRadius: 16,
    border: 'none',
    backgroundColor: RED,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    margin: '5px',
    whiteSpace: 'nowrap' as const,
    transition: 'background-color 0.15s',
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(230,57,70,0.35)',
  },
};

export default HeroSection;