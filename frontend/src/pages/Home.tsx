/**
 * Home.tsx — COMPLETE WORKING VERSION
 * Features:
 * - Hero section with background image
 * - Transaction type toggle (Sale/Rent/Shortlet)
 * - Location search with dropdown
 * - Property type filters
 * - Featured services section
 * - All filters properly navigate to Properties page
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Property, Service } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import Chatbot from '../components/Chatbot/Chatbot';
import { useAuth } from '../contexts/AuthContext';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const TEAL = '#25a882';
const NAVY = '#0d1b2e';
const SLATE = '#475569';
const LIGHT_BG = '#f6f8fb';

// ─── Navigation helper ────────────────────────────────────────────────────────
function toPropertiesUrl(params: {
  search?: string;
  property_type?: string;
  transaction_type?: string;
  bedrooms?: string;
  location?: string;
  sort?: string;
}) {
  const p = new URLSearchParams();
  if (params.search) p.set('search', params.search);
  if (params.property_type) p.set('property_type', params.property_type);
  if (params.transaction_type) p.set('transaction_type', params.transaction_type);
  if (params.bedrooms) p.set('bedrooms', params.bedrooms);
  if (params.location) p.set('location', params.location);
  if (params.sort) p.set('ordering', params.sort);
  return `/properties${p.toString() ? `?${p.toString()}` : ''}`;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{
  title: string; subtitle?: string;
  ctaLabel?: string; ctaUrl?: string;
  bg?: string; children: React.ReactNode;
}> = ({ title, subtitle, ctaLabel, ctaUrl, bg = '#fff', children }) => {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: bg, padding: '52px 0' }}>
      <div style={l.container}>
        <div style={l.sectionHead}>
          <div>
            <h2 style={l.sectionTitle}>{title}</h2>
            {subtitle && <p style={l.sectionSub}>{subtitle}</p>}
          </div>
          {ctaLabel && ctaUrl && (
            <button onClick={() => navigate(ctaUrl)} style={l.sectionCta}>{ctaLabel} →</button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── Property type images ─────────────────────────────────────────────────────
const PROP_TYPES = [
  { type: 'house', image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=250&fit=crop', label: 'Houses', emoji: '🏠' },
  { type: 'apartment', image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=250&fit=crop', label: 'Apartments', emoji: '🏢' },
  { type: 'land', image: 'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=400&h=250&fit=crop', label: 'Land', emoji: '🌾' },
  { type: 'commercial', image: 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=400&h=250&fit=crop', label: 'Commercial', emoji: '🏭' },
  { type: 'condo', image: 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=400&h=250&fit=crop', label: 'Condos', emoji: '🏙️' },
];

const PropTypeTile: React.FC<{ item: typeof PROP_TYPES[0]; tx: 'sale' | 'rent' | 'shortlet' }> = ({ item, tx }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  
  const getTxDisplay = () => {
    if (tx === 'sale') return 'For Sale';
    if (tx === 'rent') return 'For Rent';
    return 'Short Stay';
  };
  
  return (
    <button
      style={{
        ...pt.tile,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 8px 20px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(toPropertiesUrl({ property_type: item.type, transaction_type: tx }))}
    >
      <img src={item.image} alt={item.label} style={pt.image} />
      <div style={pt.imageOverlay}>
        <span style={pt.emoji}>{item.emoji}</span>
        <span style={pt.label}>{item.label}</span>
        <span style={pt.sub}>{getTxDisplay()}</span>
      </div>
    </button>
  );
};

const pt: Record<string, React.CSSProperties> = {
  tile: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.25s, box-shadow 0.25s',
    width: '100%',
    aspectRatio: '4/3',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  emoji: { fontSize: 24, marginBottom: 4 },
  label: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    fontFamily: "'Sora', sans-serif",
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: 500,
  },
};

// ─── Service Card Component ───────────────────────────────────────────────────
const ServiceCard: React.FC<{ service: Service; onPress: () => void }> = ({ service, onPress }) => {
  const [hov, setHov] = useState(false);
  
  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      cleaning: '🧹', moving: '🚚', renovation: '🔨',
      electrical: '⚡', plumbing: '🔧', painting: '🖌️',
      security: '🔒', landscaping: '🌿', general: '🏠',
    };
    return emojis[category?.toLowerCase()] || '🔧';
  };

  return (
    <button
      onClick={onPress}
      style={{
        ...serviceStyles.card,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 8px 20px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={serviceStyles.imageWrap}>
        {service.image ? (
          <img src={service.image} alt={service.name} style={serviceStyles.image} />
        ) : (
          <div style={serviceStyles.imagePlaceholder}>
            <span style={serviceStyles.placeholderEmoji}>{getCategoryEmoji(service.category_name)}</span>
          </div>
        )}
        {service.is_featured && (
          <div style={serviceStyles.featuredBadge}>
            <span>⭐ Featured</span>
          </div>
        )}
      </div>
      <div style={serviceStyles.content}>
        <h3 style={serviceStyles.name}>{service.name}</h3>
        <p style={serviceStyles.provider}>by {service.provider || 'Professional'}</p>
        <div style={serviceStyles.rating}>
          <span style={serviceStyles.stars}>★</span>
          <span style={serviceStyles.ratingValue}>{service.rating || 4.5}</span>
          <span style={serviceStyles.reviews}>({service.reviews_count || 0})</span>
        </div>
        <p style={serviceStyles.price}>{formatPrice(service.price || 0)}</p>
      </div>
    </button>
  );
};

const serviceStyles: Record<string, React.CSSProperties> = {
  card: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.25s, box-shadow 0.25s',
    border: '1px solid #eef2f7',
    textAlign: 'left',
  },
  imageWrap: {
    position: 'relative',
    height: 140,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f4f7fb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#f59e0b',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 20,
  },
  content: {
    padding: '12px',
  },
  name: {
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
    margin: '0 0 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  provider: {
    fontSize: 11,
    color: SLATE,
    margin: '0 0 6px',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  stars: {
    color: '#f59e0b',
    fontSize: 12,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: 600,
    color: NAVY,
  },
  reviews: {
    fontSize: 10,
    color: SLATE,
  },
  price: {
    fontSize: 15,
    fontWeight: 800,
    color: RED,
    margin: 0,
  },
};

// ─── Hero Section Component ───────────────────────────────────────────────────
const HeroSection: React.FC<{
  onSearch: (filters: any) => void;
  stats: { total: number; forSale: number; forRent: number; forShortlet: number };
  heroTxType: 'sale' | 'rent' | 'shortlet';
  setHeroTxType: (type: 'sale' | 'rent' | 'shortlet') => void;
}> = ({ onSearch, stats, heroTxType, setHeroTxType }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/properties/', { params: { page_size: 500 } });
        const properties = res.data.results || res.data;
        const locations = new Set<string>();
        properties.forEach((p: Property) => {
          if (p.city) locations.add(p.city);
          if (p.district) locations.add(p.district);
        });
        setAllLocations(Array.from(locations).sort());
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  const handleSearch = () => {
    const filters: any = {};
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (selectedLocation) filters.location = selectedLocation;
    filters.transaction_type = heroTxType;
    onSearch(filters);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  const handleTxTypeChange = (type: 'sale' | 'rent' | 'shortlet') => {
    setHeroTxType(type);
    const filters: any = {};
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (selectedLocation) filters.location = selectedLocation;
    filters.transaction_type = type;
    onSearch(filters);
  };

  return (
    <div style={heroStyles.container}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }} />
      
      {/* Dark Overlay for text readability */}
      <div style={heroStyles.overlay} />
      
      {/* Hidden image preloader */}
      <img 
        src="https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1600"
        style={{ display: 'none' }}
        onLoad={() => setImageLoaded(true)}
      />

      <div style={heroStyles.content}>
        <h1 style={heroStyles.title}>
          {stats.total > 0 ? `${stats.total.toLocaleString()}+` : 'Find Your'}<br />
          Dream Property
        </h1>
        
        <p style={heroStyles.subtitle}>
          {stats.total > 0 
            ? `${stats.total.toLocaleString()} properties in Uganda (${stats.forSale} sale, ${stats.forRent} rent, ${stats.forShortlet} short stay)` 
            : 'Search through thousands of properties across Uganda'}
        </p>

        {/* Transaction Type Toggle */}
        <div style={heroStyles.txToggle}>
          {(['sale', 'rent', 'shortlet'] as const).map((t) => (
            <button
              key={t}
              style={{
                ...heroStyles.txBtn,
                ...(heroTxType === t && heroStyles.txBtnActive),
              }}
              onClick={() => handleTxTypeChange(t)}
            >
              {t === 'sale' ? 'For Sale' : t === 'rent' ? 'For Rent' : 'Short Stay'}
            </button>
          ))}
        </div>

        {/* Location Input */}
        <div style={heroStyles.locationRow}>
          <div style={heroStyles.locationInputContainer}>
            <span style={{ fontSize: 16 }}>📍</span>
            <input
              type="text"
              placeholder="City or district..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              onFocus={() => setShowLocationDropdown(true)}
              style={heroStyles.locationInput}
            />
            {selectedLocation && (
              <button onClick={() => setSelectedLocation('')} style={heroStyles.clearBtn}>✕</button>
            )}
          </div>
          <button style={heroStyles.locationSearchBtn} onClick={() => selectedLocation && handleSearch()}>
            🔍
          </button>
        </div>

        {/* Location Dropdown */}
        {showLocationDropdown && allLocations.length > 0 && (
          <div style={heroStyles.locationDropdown}>
            {allLocations
              .filter(loc => loc.toLowerCase().includes(selectedLocation.toLowerCase()))
              .slice(0, 10)
              .map(loc => (
                <div
                  key={loc}
                  onClick={() => handleLocationSelect(loc)}
                  style={heroStyles.locationItem}
                >
                  {loc}
                </div>
              ))}
          </div>
        )}

        {/* Search Bar */}
        <div style={heroStyles.searchBar}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by keyword, area, or property name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={heroStyles.searchInput}
          />
          <button style={heroStyles.searchBtn} onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

const heroStyles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    padding: '80px 24px',
    marginTop: 64,
    minHeight: 550,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,27,46,0.75)',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 800,
    margin: '0 auto',
    textAlign: 'center',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800,
    color: '#fff',
    fontFamily: "'Sora', sans-serif",
    marginBottom: 16,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
  },
  txToggle: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  txBtn: {
    padding: '8px 24px',
    borderRadius: 30,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontFamily: 'inherit',
  },
  txBtnActive: {
    backgroundColor: '#fff',
    color: NAVY,
  },
  locationRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
  locationInputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '12px 16px',
    position: 'relative',
  },
  locationInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: 14,
  },
  locationSearchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: 'none',
    backgroundColor: RED,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 18,
  },
  locationDropdown: {
    position: 'absolute',
    top: 380,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 48px)',
    maxWidth: 800,
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #eef2f7',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 100,
    maxHeight: 250,
    overflowY: 'auto',
  },
  locationItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 13,
    color: NAVY,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 48,
    padding: '6px 6px 6px 20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  searchBtn: {
    padding: '12px 28px',
    borderRadius: 40,
    border: 'none',
    backgroundColor: RED,
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

// ─── Neighbourhood Card ──────────────────────────────────────────────────────
const NeighbourhoodCard: React.FC<{ district: string; count: number }> = ({ district, count }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  
  const images = [
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=600&h=400&fit=crop',
    'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=600&h=400&fit=crop',
    'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=600&h=400&fit=crop',
    'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=600&h=400&fit=crop',
  ];
  const imageUrl = images[Math.abs(district.length) % images.length];

  return (
    <div
      style={{
        ...nb.card,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.07)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(toPropertiesUrl({ location: district }))}
    >
      <img 
        src={imageUrl} 
        alt={district} 
        style={{ ...nb.img, transform: hov ? 'scale(1.07)' : 'scale(1)' }}
      />
      <div style={nb.overlay}>
        <h3 style={nb.name}>{district}</h3>
        <p style={nb.count}>{count} {count === 1 ? 'property' : 'properties'}</p>
      </div>
    </div>
  );
};

const nb: Record<string, React.CSSProperties> = {
  card: { position: 'relative', borderRadius: 16, overflow: 'hidden', height: 240, cursor: 'pointer', transition: 'transform 0.25s, box-shadow 0.25s' },
  img: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', display: 'block' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' },
  name: { fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  count: { fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 },
};

// ─── Trust badge ──────────────────────────────────────────────────────────────
const TrustBadge: React.FC<{ image: string; title: string; desc: string }> = ({ image, title, desc }) => {
  const [hov, setHov] = useState(false);
  
  return (
    <div 
      style={{
        ...trustStyles.card,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 12px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={trustStyles.imageWrapper}>
        <img src={image} alt={title} style={trustStyles.image} />
        <div style={trustStyles.imageOverlay} />
      </div>
      <h4 style={trustStyles.title}>{title}</h4>
      <p style={trustStyles.desc}>{desc}</p>
    </div>
  );
};

const trustStyles: Record<string, React.CSSProperties> = {
  card: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    transition: 'transform 0.25s, box-shadow 0.25s',
    cursor: 'pointer',
    border: '1px solid #eef2f7',
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: NAVY,
    margin: '16px 16px 8px',
    fontFamily: "'Sora', sans-serif",
  },
  desc: {
    fontSize: 13,
    color: SLATE,
    lineHeight: 1.5,
    margin: '0 16px 20px',
  },
};


// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer style={{ backgroundColor: '#0a1929', marginTop: 0 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '44px 24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={RED} />
                  <polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>Metro Properties</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEAL }}>Uganda's #1 Real Estate</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px' }}>
              Uganda's most trusted real estate platform. Find your dream home, apartment, or land with verified listings from trusted agents.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Buy</div>
              <button onClick={() => navigate(toPropertiesUrl({ property_type: 'house', transaction_type: 'sale' }))} style={footerLink}>Houses for Sale</button>
              <button onClick={() => navigate(toPropertiesUrl({ property_type: 'apartment', transaction_type: 'sale' }))} style={footerLink}>Apartments for Sale</button>
              <button onClick={() => navigate(toPropertiesUrl({ property_type: 'land', transaction_type: 'sale' }))} style={footerLink}>Land for Sale</button>
              <button onClick={() => navigate(toPropertiesUrl({ property_type: 'commercial', transaction_type: 'sale' }))} style={footerLink}>Commercial</button>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Rent</div>
              <button onClick={() => navigate(toPropertiesUrl({ property_type: 'house', transaction_type: 'rent' }))} style={footerLink}>Houses for Rent</button>
              <button onClick={() => navigate(toPropertiesUrl({ property_type: 'apartment', transaction_type: 'rent' }))} style={footerLink}>Apartments for Rent</button>
              <button onClick={() => navigate(toPropertiesUrl({ transaction_type: 'shortlet' }))} style={footerLink}>Shortlet</button>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Explore</div>
              <button onClick={() => navigate('/properties')} style={footerLink}>All Properties</button>
              <button onClick={() => navigate(toPropertiesUrl({ sort: '-created_at' }))} style={footerLink}>Newest Listings</button>
              <button onClick={() => navigate(toPropertiesUrl({ sort: '-views_count' }))} style={footerLink}>Most Viewed</button>
              <button onClick={() => navigate('/services')} style={footerLink}>Services</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>© {currentYear} Metro Properties — All rights reserved.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>🇺🇬 Uganda</span>
        </div>
      </div>
    </footer>
  );
};

const footerLink: React.CSSProperties = {
  display: 'block',
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: 13,
  marginBottom: 12,
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  padding: 0,
  transition: 'color 0.15s',
};

// ─── Main Home Component ─────────────────────────────────────────────────────
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, forSale: 0, forRent: 0, forShortlet: 0 });
  const [heroTxType, setHeroTxType] = useState<'sale' | 'rent' | 'shortlet'>('sale');
  const [propertyTxType, setPropertyTxType] = useState<'sale' | 'rent' | 'shortlet'>('sale');

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/', { params: { page_size: 200 } });
      const data = res.data.results ?? res.data;
      setProperties(data);
      
      const saleProps = data.filter((p: Property) => p.transaction_type === 'sale');
      const rentProps = data.filter((p: Property) => p.transaction_type === 'rent');
      const shortletProps = data.filter((p: Property) => p.transaction_type === 'shortlet');
      
      setStats({
        total: data.length,
        forSale: saleProps.length,
        forRent: rentProps.length,
        forShortlet: shortletProps.length,
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/services/', { params: { page_size: 6, is_featured: true } });
      const data = res.data.results ?? res.data;
      setServices(data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchServices();
  }, [fetchProperties, fetchServices]);

  // Sort with boosted properties first
  const sortWithBoostedFirst = useCallback((items: Property[]) => {
    const boosted = items.filter(p => p.is_boosted === true);
    const normal = items.filter(p => !p.is_boosted);
    return [...boosted, ...normal];
  }, []);

  // Premium properties (boosted)
  const premiumProperties = useMemo(() => {
    return sortWithBoostedFirst(properties.filter(p => p.is_boosted === true)).slice(0, 8);
  }, [properties, sortWithBoostedFirst]);

  // Featured properties (boosted + verified)
  const featuredProperties = useMemo(() => {
    const boosted = properties.filter(p => p.is_boosted === true);
    const verified = properties.filter(p => p.is_verified && !p.is_boosted);
    return sortWithBoostedFirst([...boosted, ...verified]).slice(0, 10);
  }, [properties, sortWithBoostedFirst]);

  // Recent for sale
  const recentSale = useMemo(() => {
    const saleProps = properties.filter(p => p.transaction_type === 'sale');
    return sortWithBoostedFirst(saleProps).slice(0, 6);
  }, [properties, sortWithBoostedFirst]);

  // Recent for rent
  const recentRent = useMemo(() => {
    const rentProps = properties.filter(p => p.transaction_type === 'rent');
    return sortWithBoostedFirst(rentProps).slice(0, 6);
  }, [properties, sortWithBoostedFirst]);

  // Recent shortlet
  const recentShortlet = useMemo(() => {
    const shortletProps = properties.filter(p => p.transaction_type === 'shortlet');
    return sortWithBoostedFirst(shortletProps).slice(0, 6);
  }, [properties, sortWithBoostedFirst]);

  // Popular neighbourhoods
  const neighbourhoods = useMemo(() => {
    const map: Record<string, number> = {};
    properties.forEach(p => {
      if (p.district) map[p.district] = (map[p.district] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([district, count]) => ({ district, count }));
  }, [properties]);

  const handleSearch = (filters: any) => {
    navigate(toPropertiesUrl(filters));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', marginTop: 64 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'homeSpin 0.7s linear infinite' }} />
        <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 13 }}>Loading properties...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 0 }}>
      {/* Hero Section */}
      <HeroSection 
        onSearch={handleSearch} 
        stats={stats} 
        heroTxType={heroTxType}
        setHeroTxType={setHeroTxType}
      />

      {/* Featured Services Section */}
      {services.length > 0 && (
        <Section title="🔧 Featured Services" subtitle="Trusted home service providers" bg="#fff" ctaLabel="View All Services" ctaUrl="/services">
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8 }}>
            {services.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onPress={() => navigate(`/services/${service.id}`)} 
              />
            ))}
          </div>
        </Section>
      )}

      {/* Premium Top Properties */}
      {premiumProperties.length > 0 && (
        <Section title="⚡ Premium Top Properties" subtitle="Highest-rated, boosted listings" bg="#f4f7fb" ctaLabel="View All" ctaUrl="/properties?is_boosted=true">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {premiumProperties.map(p => (
              <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />
            ))}
          </div>
        </Section>
      )}

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <Section title="⭐ Featured Properties" subtitle="Handpicked verified listings" bg="#fff" ctaLabel="See All" ctaUrl="/properties">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {featuredProperties.map(p => (
              <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />
            ))}
          </div>
        </Section>
      )}

      {/* Explore Property Types */}
      <Section title="Explore Property Types" subtitle="Search by type — find exactly what you need" bg="#f4f7fb">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['sale', 'rent', 'shortlet'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => setPropertyTxType(t)}
              style={{
                padding: '7px 22px', 
                borderRadius: 30, 
                border: 'none', 
                fontSize: 13, 
                fontWeight: 600,
                cursor: 'pointer', 
                fontFamily: 'inherit', 
                transition: 'all 0.15s',
                backgroundColor: propertyTxType === t ? RED : '#fff',
                color: propertyTxType === t ? '#fff' : SLATE,
                boxShadow: propertyTxType === t ? `0 3px 10px ${RED_BG}` : '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {t === 'sale' ? '🏠 For Sale' : t === 'rent' ? '🔑 For Rent' : '⏱️ Short Stay'}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {PROP_TYPES.map(item => (
            <PropTypeTile key={item.type} item={item} tx={propertyTxType} />
          ))}
        </div>
      </Section>

      {/* Popular Neighbourhoods */}
      {neighbourhoods.length > 0 && (
        <Section title="Popular Neighbourhoods" subtitle="Most searched areas" bg="#fff" ctaLabel="Explore All" ctaUrl="/properties">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {neighbourhoods.map(({ district, count }) => (
              <NeighbourhoodCard key={district} district={district} count={count} />
            ))}
          </div>
        </Section>
      )}

      {/* Latest Properties for Sale */}
      {recentSale.length > 0 && (
        <Section title="Latest Properties for Sale" subtitle="Fresh listings added recently" bg="#f4f7fb" ctaLabel="View All" ctaUrl="/properties?transaction_type=sale">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {recentSale.map(p => (
              <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />
            ))}
          </div>
        </Section>
      )}

      {/* Latest Properties for Rent */}
      {recentRent.length > 0 && (
        <Section title="Latest Properties for Rent" subtitle="Available now across Uganda" bg="#fff" ctaLabel="View All" ctaUrl="/properties?transaction_type=rent">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {recentRent.map(p => (
              <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />
            ))}
          </div>
        </Section>
      )}

      {/* Latest Properties for Short Stay */}
      {recentShortlet.length > 0 && (
        <Section title="Latest Properties for Short Stay" subtitle="Available for short-term stays" bg="#f4f7fb" ctaLabel="View All" ctaUrl="/properties?transaction_type=shortlet">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {recentShortlet.map(p => (
              <PropertyCard key={p.id} property={p} onLike={fetchProperties} variant="vertical" />
            ))}
          </div>
        </Section>
      )}

    {/* Why Choose Us - With Working Images */}
    <Section title="Why Choose Metro Properties" subtitle="Uganda's most trusted real estate platform" bg="#fff">
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <TrustBadge 
          image="https://images.pexels.com/photos/5668869/pexels-photo-5668869.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
          title="Verified Listings"
          desc="Every listing is checked by our team. No fakes, no duplicates."
        />
        <TrustBadge 
          image="https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
          title="Nationwide Coverage"
          desc="From Kampala to Gulu, Jinja to Mbarara — we cover all districts."
        />
        <TrustBadge 
          image="https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
          title="Safe Transactions"
          desc="Verified agents and secure payment processing for peace of mind."
        />
        <TrustBadge 
          image="https://images.pexels.com/photos/3184459/pexels-photo-3184459.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
          title="Expert Support"
          desc="Local property experts available 7 days a week to assist you."
        />
      </div>
    </Section>

      {/* Agent CTA */}
      <div style={{ background: `linear-gradient(135deg, #c0392b 0%, ${RED} 50%, #e85d04 100%)`, padding: '44px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Are You a Property Agent?</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: 500 }}>List your properties and reach thousands of buyers & renters every day.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/register')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', backgroundColor: '#fff', color: RED, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              List a Property
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '12px 28px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.6)', backgroundColor: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Login
            </button>
          </div>
        </div>
      </div>

      <Footer />
      <Chatbot />
      
      <style>{`
        @keyframes homeSpin { to { transform: rotate(360deg); } }
        .home-card { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        button { font-family: inherit; }
        footer button:hover { color: #fff !important; }
      `}</style>
    </div>
  );
};

// ─── Shared layout ────────────────────────────────────────────────────────────
const l = {
  container: { maxWidth: 1400, margin: '0 auto', padding: '0 24px' } as React.CSSProperties,
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 } as React.CSSProperties,
  sectionTitle: { fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800, color: NAVY, margin: '0 0 6px' } as React.CSSProperties,
  sectionSub: { fontSize: 14, color: SLATE, margin: 0 } as React.CSSProperties,
  sectionCta: { fontSize: 13, fontWeight: 700, color: RED, border: `1.5px solid ${RED}`, backgroundColor: 'transparent', padding: '7px 18px', borderRadius: 30, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' } as React.CSSProperties,
};

export default Home;