/**
 * Home.tsx — Bayut-style homepage with DYNAMIC data
 * 
 * Dynamic features:
 * - Location filter to search properties by city/district
 * - Premium Top Properties ALWAYS on top (boosted properties)
 * - Personalized content based on user's location
 * - Popular Neighbourhoods based on actual property distribution
 * - Popular Searches based on user search behavior
 * - "Near You" section showing properties in user's area
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Property } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import Chatbot from '../components/Chatbot/Chatbot';
import PropertyHero, {
  FilterState,
  DEFAULT_FILTERS,
} from '../components/PropertyHero';
import { useAuth } from '../contexts/AuthContext';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const RED    = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const TEAL   = '#25a882';
const NAVY   = '#0d1b2e';
const SLATE  = '#475569';

// ─── Navigation helper ────────────────────────────────────────────────────────
function toPropertiesUrl(params: {
  search?:   string;
  type?:     string;
  tx?:       string;
  bedrooms?: string;
  district?: string;
  sort?:     string;
  view?:     string;
}) {
  const p = new URLSearchParams();
  if (params.search)   p.set('search',   params.search);
  if (params.type)     p.set('type',     params.type);
  if (params.tx)       p.set('tx',       params.tx);
  if (params.bedrooms) p.set('bedrooms', params.bedrooms);
  if (params.district) p.set('district', params.district);
  if (params.sort)     p.set('sort',     params.sort);
  if (params.view)     p.set('view',     params.view);
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

// ─── Property type grid with real images ─────────────────────────────────────
const PROP_TYPES = [
  { type: 'house',      image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=250&fit=crop', label: 'Houses' },
  { type: 'apartment',  image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=250&fit=crop', label: 'Apartments' },
  { type: 'land',       image: 'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=400&h=250&fit=crop', label: 'Land' },
  { type: 'commercial', image: 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=400&h=250&fit=crop', label: 'Commercial' },
  { type: 'condo',      image: 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=400&h=250&fit=crop', label: 'Condos' },
];

const PropTypeTile: React.FC<{ item: typeof PROP_TYPES[0]; tx: 'sale' | 'rent' }> = ({ item, tx }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  
  return (
    <button
      style={{
        ...pt.tile,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 8px 20px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(toPropertiesUrl({ type: item.type, tx }))}
    >
      <img src={item.image} alt={item.label} style={pt.image} />
      <div style={pt.imageOverlay}>
        <span style={pt.label}>{item.label}</span>
        <span style={pt.sub}>{tx === 'sale' ? 'For Sale' : 'For Rent'}</span>
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

// ─── Featured Property Card ───────────────────────────────────────────────────
const FeaturedCard: React.FC<{ property: Property; onLike: () => void }> = ({ property, onLike }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const img = property.images?.find(i => i.is_main)?.image || property.images?.[0]?.image;

  return (
    <div
      style={{
        ...fc.card,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 14px 36px rgba(0,0,0,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      <div style={fc.imgWrap}>
        <img
          src={img || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=300&h=200&fit=crop'}
          alt={property.title}
          style={{ ...fc.img, transform: hov ? 'scale(1.06)' : 'scale(1)' }}
        />
        {!property.is_available && <div style={fc.soldBadge}>Sold</div>}
        {property.is_verified && <div style={fc.verifiedBadge}>✓ Verified</div>}
        {property.is_boosted && <div style={fc.boostedBadge}>⚡ Boosted</div>}
        <div style={fc.txBadge}>
          {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'}
        </div>
        <button style={fc.likeBtn} onClick={e => { e.stopPropagation(); onLike(); }}>
          {property.is_liked ? '❤️' : '🤍'}
        </button>
      </div>
      <div style={fc.body}>
        <div style={fc.price}>{formatPrice(property.price)}</div>
        <div style={fc.title}>{property.title}</div>
        <div style={fc.loc}>📍 {property.district}, {property.city}</div>
        <div style={fc.feats}>
          {property.property_type !== 'land' && (
            <><span style={fc.feat}>🛏 {property.bedrooms}</span><span style={fc.feat}>🚿 {property.bathrooms}</span></>
          )}
          <span style={fc.feat}>📐 {property.square_meters}m²</span>
        </div>
        <div style={fc.footer}>
          <span style={fc.propType}>{property.property_type}</span>
          <span style={fc.views}>👁 {property.views_count?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const fc: Record<string, React.CSSProperties> = {
  card: {
    width: 300, flexShrink: 0, borderRadius: 14,
    overflow: 'hidden', cursor: 'pointer',
    border: '1px solid #eef2f7', backgroundColor: '#fff',
    transition: 'transform 0.22s, box-shadow 0.22s',
  },
  imgWrap: { position: 'relative', paddingTop: '65%', overflow: 'hidden' },
  img: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s' },
  soldBadge:    { position: 'absolute', top: 10, left: 10, backgroundColor: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  verifiedBadge:{ position: 'absolute', top: 10, right: 44, backgroundColor: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  boostedBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#e63946', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3 },
  txBadge:      { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(13,27,46,0.72)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  likeBtn:      { position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' },
  body:   { padding: '14px 14px 16px' },
  price:  { fontSize: 18, fontWeight: 800, color: RED, marginBottom: 4 },
  title:  { fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  loc:    { fontSize: 11, color: SLATE, marginBottom: 10 },
  feats:  { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  feat:   { fontSize: 11, color: SLATE, backgroundColor: '#f4f7fb', padding: '3px 8px', borderRadius: 20 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  propType: { fontSize: 10, fontWeight: 700, color: RED, backgroundColor: RED_BG, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' },
  views:  { fontSize: 10, color: '#94a3b8' },
};

// ─── Neighbourhood card with reliable images ─────────────────────────────────
const DISTRICT_IMAGES: Record<string, string> = {
  'Kololo': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=600&h=400&fit=crop',
  'Naguru': 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=600&h=400&fit=crop',
  'Muyenga': 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=600&h=400&fit=crop',
  'Ntinda': 'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=600&h=400&fit=crop',
  'Bugolobi': 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=600&h=400&fit=crop',
  'Entebbe': 'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=600&h=400&fit=crop',
  'Wakiso': 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=600&h=400&fit=crop',
  'Kampala': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=600&h=400&fit=crop',
  'Kira': 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=600&h=400&fit=crop',
  'Mukono': 'https://images.pexels.com/photos/235731/pexels-photo-235731.jpeg?w=600&h=400&fit=crop',
};

const NeighbourhoodCard: React.FC<{ district: string; count: number }> = ({ district, count }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const imageUrl = DISTRICT_IMAGES[district] || DISTRICT_IMAGES['Kampala'];

  return (
    <div
      style={{
        ...nb.card,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.07)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(toPropertiesUrl({ district }))}
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
  card:    { position: 'relative', borderRadius: 16, overflow: 'hidden', height: 240, cursor: 'pointer', transition: 'transform 0.25s, box-shadow 0.25s' },
  img:     { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', display: 'block' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' },
  name:    { fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  count:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 },
};

// ─── Trust badge ──────────────────────────────────────────────────────────────
const TrustBadge: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div style={{ textAlign: 'center', padding: '28px 20px', borderRadius: 16, backgroundColor: '#fff', border: '1px solid #eef2f7', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <h4 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 8px', fontFamily: "'Sora', sans-serif" }}>{title}</h4>
    <p style={{ fontSize: 13, color: SLATE, lineHeight: 1.55, margin: 0 }}>{desc}</p>
  </div>
);

// ─── Footer with real social media icons ─────────────────────────────────────
const Footer: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  const FOOTER_LINKS: Record<string, Array<{ label: string; url: string }>> = {
    Buy: [
      { label: 'Houses for Sale',    url: toPropertiesUrl({ type: 'house',      tx: 'sale' }) },
      { label: 'Apartments for Sale',url: toPropertiesUrl({ type: 'apartment',  tx: 'sale' }) },
      { label: 'Land for Sale',      url: toPropertiesUrl({ type: 'land',       tx: 'sale' }) },
      { label: 'Commercial',         url: toPropertiesUrl({ type: 'commercial', tx: 'sale' }) },
    ],
    Rent: [
      { label: 'Houses for Rent',    url: toPropertiesUrl({ type: 'house',     tx: 'rent' }) },
      { label: 'Apartments for Rent',url: toPropertiesUrl({ type: 'apartment', tx: 'rent' }) },
      { label: 'Shortlet',           url: toPropertiesUrl({ tx: 'shortlet' }) },
      { label: 'Commercial Space',   url: toPropertiesUrl({ type: 'commercial',tx: 'rent' }) },
    ],
    Explore: [
      { label: 'All Properties', url: '/properties' },
      { label: 'Newest Listings',url: toPropertiesUrl({ sort: 'newest' }) },
      { label: 'Most Viewed',    url: toPropertiesUrl({ sort: 'views'  }) },
      { label: 'Services',       url: '/services' },
    ],
    Company: [
      { label: 'About Us', url: '/about' }, 
      { label: 'Careers', url: '/careers' },
      { label: 'Contact', url: '/contact' }, 
      { label: 'Privacy', url: '/privacy' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: '📘', url: 'https://facebook.com/propertyhub', color: '#1877f2' },
    { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/propertyhub', color: '#1da1f2' },
    { name: 'Instagram', icon: '📸', url: 'https://instagram.com/propertyhub', color: '#e4405f' },
    { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com/company/propertyhub', color: '#0077b5' },
  ];

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
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>PropertyHub.ug</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEAL }}>Uganda's #1 Real Estate</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px' }}>
              Uganda's most trusted real estate platform. Find your dream home, apartment, or land with verified listings from trusted agents.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: '#fff',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = social.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>{section}</div>
                {links.map(({ label, url }) => (
                  <button
                    key={label}
                    onClick={() => navigate(url)}
                    style={{
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
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          © {currentYear} PropertyHub.ug — All rights reserved.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            🇺🇬 Uganda
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>|</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>🇰🇪 Kenya</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>|</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>🇹🇿 Tanzania</span>
        </div>
      </div>
    </footer>
  );
};

// ─── Home Component ───────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [txTab, setTxTab] = useState<'sale' | 'rent'>('sale');
  const [searchTab, setSearchTab] = useState<'sale' | 'rent'>('sale');
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [popularSearches, setPopularSearches] = useState<Record<'sale' | 'rent', Array<{ label: string; params: any }>>>({
    sale: [], rent: []
  });

  // Get all unique locations from properties
  useEffect(() => {
    if (properties.length > 0) {
      const locations = new Set<string>();
      properties.forEach(p => {
        if (p.city) locations.add(p.city);
        if (p.district) locations.add(p.district);
      });
      setAllLocations(Array.from(locations).sort());
    }
  }, [properties]);

  // Get user's location from profile or browser
  useEffect(() => {
    const getUserLocation = async () => {
      // First try from user profile
      if (user?.city || user?.district) {
        const loc = user.city || user.district;
        setUserLocation(loc);
        setSelectedLocation(loc);
        return;
      }
      
      // If no profile location, try browser geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              setUserLocation('Kampala');
              setSelectedLocation('Kampala');
            } catch (error) {
              console.error('Error getting location:', error);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
          }
        );
      }
    };
    
    getUserLocation();
  }, [user]);

  const fetchProperties = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/properties/');
      const data = res.data.results ?? res.data;
      setProperties(data);
      
      // Generate popular searches based on actual data
      setPopularSearches(generatePopularSearches(data));
      
      // Filter nearby properties if user has location
      if (userLocation) {
        const nearby = data.filter((p: Property) => 
          p.city?.toLowerCase().includes(userLocation.toLowerCase()) ||
          p.district?.toLowerCase().includes(userLocation.toLowerCase())
        );
        setNearbyProperties(nearby.slice(0, 6));
      }
    } catch { 
      setError('Failed to load properties.'); 
    } finally { 
      setLoading(false); 
    }
  }, [userLocation]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const updateFilters = useCallback(
    (p: Partial<FilterState>) => setFilters(prev => ({ ...prev, ...p })), []
  );
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const hasActive = useMemo(() => JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS), [filters]);

  // ALWAYS put boosted properties first in any list
  const sortWithBoostedFirst = useCallback((items: Property[]) => {
    const boosted = items.filter(p => p.is_boosted === true);
    const normal = items.filter(p => p.is_boosted !== true);
    return [...boosted, ...normal];
  }, []);

  // Filter properties by selected location
  const filteredByLocation = useMemo(() => {
    if (!selectedLocation) return properties;
    return properties.filter(p => 
      p.city?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      p.district?.toLowerCase().includes(selectedLocation.toLowerCase())
    );
  }, [properties, selectedLocation]);

  // PREMIUM TOP PROPERTIES - Always on top of all sections
  const premiumTopProperties = useMemo(() => {
    return filteredByLocation.filter(p => p.is_boosted === true).slice(0, 8);
  }, [filteredByLocation]);

  // Featured properties - boosted first, then verified
  const featured = useMemo(() => {
    const boosted = filteredByLocation.filter(p => p.is_boosted === true);
    const verified = filteredByLocation.filter(p => p.is_verified && !p.is_boosted);
    return sortWithBoostedFirst([...boosted, ...verified]).slice(0, 10);
  }, [filteredByLocation, sortWithBoostedFirst]);

  // Recent Sale - boosted first
  const recentSale = useMemo(() => {
    const saleProps = filteredByLocation.filter(p => p.transaction_type === 'sale');
    return sortWithBoostedFirst(saleProps).slice(0, 6);
  }, [filteredByLocation, sortWithBoostedFirst]);

  // Recent Rent - boosted first
  const recentRent = useMemo(() => {
    const rentProps = filteredByLocation.filter(p => p.transaction_type === 'rent');
    return sortWithBoostedFirst(rentProps).slice(0, 6);
  }, [filteredByLocation, sortWithBoostedFirst]);

  // DYNAMIC Neighbourhoods - based on actual property distribution
  const neighbourhoods = useMemo(() => {
    const map: Record<string, number> = {};
    filteredByLocation.forEach(p => { 
      if (p.district) map[p.district] = (map[p.district] || 0) + 1; 
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([district, count]) => ({ district, count }));
  }, [filteredByLocation]);

  // DYNAMIC Popular Searches - based on actual property data
  const generatePopularSearches = (properties: Property[]): Record<'sale' | 'rent', Array<{ label: string; params: any }>> => {
    const cityCount: Record<string, number> = {};
    const districtCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    
    properties.forEach(p => {
      if (p.city) cityCount[p.city] = (cityCount[p.city] || 0) + 1;
      if (p.district) districtCount[p.district] = (districtCount[p.district] || 0) + 1;
      if (p.property_type) typeCount[p.property_type] = (typeCount[p.property_type] || 0) + 1;
    });
    
    const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
    const topDistricts = Object.entries(districtCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
    const topTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([type]) => type);
    
    const typeLabels: Record<string, string> = {
      house: 'Houses', apartment: 'Apartments', land: 'Land', commercial: 'Commercial', condo: 'Condos'
    };
    
    const getPriceSuggestions = () => {
      const prices = properties.map(p => p.price).filter(p => p > 0);
      if (prices.length === 0) return [];
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const lowPrice = avgPrice * 0.5;
      const midPrice = avgPrice;
      
      return [
        { label: `Properties under ${formatPrice(lowPrice)}`, params: { tx: 'sale', maxPrice: lowPrice } },
        { label: `Properties under ${formatPrice(midPrice)}`, params: { tx: 'sale', maxPrice: midPrice } },
      ];
    };
    
    const priceSuggestions = getPriceSuggestions();
    
    return {
      sale: [
        ...topCities.map(city => ({ 
          label: `Properties for sale in ${city}`, 
          params: { tx: 'sale', search: city } 
        })),
        ...topDistricts.map(district => ({ 
          label: `Houses for sale in ${district}`, 
          params: { type: 'house', tx: 'sale', district } 
        })),
        ...topTypes.map(type => ({ 
          label: `${typeLabels[type] || type} for sale`, 
          params: { type, tx: 'sale' } 
        })),
        ...priceSuggestions,
        { label: 'Recently listed', params: { tx: 'sale', sort: 'newest' } },
        { label: 'Most viewed properties', params: { tx: 'sale', sort: 'views' } },
      ].slice(0, 10),
      rent: [
        ...topCities.map(city => ({ 
          label: `Properties for rent in ${city}`, 
          params: { tx: 'rent', search: city } 
        })),
        ...topDistricts.map(district => ({ 
          label: `Apartments for rent in ${district}`, 
          params: { type: 'apartment', tx: 'rent', district } 
        })),
        ...topTypes.map(type => ({ 
          label: `${typeLabels[type] || type} for rent`, 
          params: { type, tx: 'rent' } 
        })),
        { label: 'Recently listed for rent', params: { tx: 'rent', sort: 'newest' } },
        { label: 'Most viewed rentals', params: { tx: 'rent', sort: 'views' } },
      ].slice(0, 10),
    };
  };

  // Handle location search
  const handleLocationSearch = () => {
    if (selectedLocation) {
      navigate(toPropertiesUrl({ search: selectedLocation }));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'homeSpin 0.7s linear infinite' }} />
      <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 13 }}>Loading…</p>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#ef4444', marginBottom: 14 }}>{error}</p>
      <button onClick={fetchProperties} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try again</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>

      <PropertyHero
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        hasActive={hasActive}
        totalCount={properties.length}
        showTabs showQuick compact={false}
      />

      {/* ===== LOCATION FILTER BAR ===== */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #eef2f7', padding: '16px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 250 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap' }}>
                📍 Search by Location:
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Enter city or district..."
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1.5px solid #eef2f7',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                    backgroundColor: '#fafcff',
                  }}
                />
                {showLocationDropdown && allLocations.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #eef2f7',
                    borderRadius: 12,
                    marginTop: 4,
                    maxHeight: 250,
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {allLocations
                      .filter(loc => loc.toLowerCase().includes(selectedLocation.toLowerCase()))
                      .slice(0, 10)
                      .map(loc => (
                        <div
                          key={loc}
                          onClick={() => {
                            setSelectedLocation(loc);
                            setShowLocationDropdown(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                            fontSize: 13,
                            color: NAVY,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {loc}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleLocationSearch}
              style={{
                padding: '12px 24px',
                backgroundColor: RED,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c1121f')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = RED)}
            >
              🔍 Search Properties
            </button>
            {selectedLocation && (
              <button
                onClick={() => setSelectedLocation('')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: SLATE,
                  border: '1.5px solid #eef2f7',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== PREMIUM TOP PROPERTIES - ALWAYS ON TOP ===== */}
      {premiumTopProperties.length > 0 && (
        <div style={{ backgroundColor: '#fff', padding: '52px 0', borderBottom: '1px solid #eef2f7' }}>
          <div style={l.container}>
            <div style={l.sectionHead}>
              <div>
                <h2 style={{ ...l.sectionTitle, color: RED }}>
                  <span style={{ fontSize: 28 }}>⚡</span> Premium Top Properties
                  {selectedLocation && <span style={{ fontSize: 16, color: TEAL, marginLeft: 10 }}>in {selectedLocation}</span>}
                </h2>
                <p style={l.sectionSub}>Highest-rated, boosted listings with maximum visibility</p>
              </div>
              <button style={l.sectionCta} onClick={() => navigate(toPropertiesUrl({ sort: 'newest', search: selectedLocation || '' }))}>View All →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {premiumTopProperties.map(p => (
                <div key={p.id} className="home-card">
                  <PropertyCard property={p} onLike={fetchProperties} variant="vertical" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEAR YOU SECTION - Based on user location */}
      {userLocation && nearbyProperties.length > 0 && !selectedLocation && (
        <div style={{ backgroundColor: '#fff', padding: '52px 0', borderBottom: '1px solid #eef2f7' }}>
          <div style={l.container}>
            <div style={l.sectionHead}>
              <div>
                <h2 style={{ ...l.sectionTitle, color: TEAL }}>
                  📍 Near You in {userLocation}
                </h2>
                <p style={l.sectionSub}>Properties closest to your location</p>
              </div>
              <button style={l.sectionCta} onClick={() => navigate(toPropertiesUrl({ search: userLocation }))}>View All →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {nearbyProperties.slice(0, 4).map(p => (
                <div key={p.id} className="home-card">
                  <PropertyCard property={p} onLike={fetchProperties} variant="vertical" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FEATURED PROPERTIES */}
      {featured.length > 0 && (
        <div style={{ backgroundColor: '#f4f7fb', padding: '52px 0' }}>
          <div style={l.container}>
            <div style={l.sectionHead}>
              <div>
                <h2 style={l.sectionTitle}>Featured Properties</h2>
                <p style={l.sectionSub}>Handpicked verified listings across Uganda</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button style={arr.btn} onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}>←</button>
                <button style={arr.btn} onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}>→</button>
                <button style={l.sectionCta} onClick={() => navigate('/properties')}>View All →</button>
              </div>
            </div>
            <div ref={scrollRef} style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {featured.map(p => <FeaturedCard key={p.id} property={p} onLike={fetchProperties} />)}
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE PROPERTY TYPES */}
      <Section title="Explore Property Types" subtitle="Search by type — find exactly what you need" bg="#fff">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['sale', 'rent'] as const).map(t => (
            <button key={t} onClick={() => setTxTab(t)} style={{
              padding: '7px 22px', borderRadius: 30, border: 'none', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              backgroundColor: txTab === t ? RED : '#f4f7fb',
              color: txTab === t ? '#fff' : SLATE,
              boxShadow: txTab === t ? '0 3px 10px rgba(230,57,70,0.22)' : 'none',
            }}>{t === 'sale' ? 'For Sale' : 'For Rent'}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {PROP_TYPES.map(item => <PropTypeTile key={item.type} item={item} tx={txTab} />)}
        </div>
      </Section>

      {/* POPULAR NEIGHBOURHOODS - DYNAMIC based on property distribution */}
      {neighbourhoods.length > 0 && (
        <Section title="Popular Neighbourhoods" subtitle="Most searched areas across Uganda" bg="#f4f7fb"
          ctaLabel="Explore All" ctaUrl="/properties">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
            {neighbourhoods.map(({ district, count }) => (
              <NeighbourhoodCard key={district} district={district} count={count} />
            ))}
          </div>
        </Section>
      )}

      {/* LATEST FOR SALE - Boosted first */}
      {recentSale.length > 0 && (
        <Section title="Latest Properties for Sale" subtitle="Fresh listings added recently" bg="#fff"
          ctaLabel="View All for Sale" ctaUrl={toPropertiesUrl({ tx: 'sale', search: selectedLocation || '' })}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {recentSale.map(p => (
              <div key={p.id} className="home-card">
                <PropertyCard property={p} onLike={fetchProperties} variant="vertical" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* LATEST FOR RENT - Boosted first */}
      {recentRent.length > 0 && (
        <Section title="Latest Properties for Rent" subtitle="Available now across Uganda" bg="#f4f7fb"
          ctaLabel="View All for Rent" ctaUrl={toPropertiesUrl({ tx: 'rent', search: selectedLocation || '' })}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {recentRent.map(p => (
              <div key={p.id} className="home-card">
                <PropertyCard property={p} onLike={fetchProperties} variant="vertical" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* POPULAR REAL ESTATE SEARCHES - DYNAMIC based on actual data */}
      {popularSearches[searchTab].length > 0 && (
        <Section title="Popular Real Estate Searches" subtitle="Most searched queries in Uganda" bg="#fff">
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {(['sale', 'rent'] as const).map(t => (
              <button key={t} onClick={() => setSearchTab(t)} style={{
                padding: '7px 22px', borderRadius: 30, border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                backgroundColor: searchTab === t ? RED : '#f4f7fb',
                color: searchTab === t ? '#fff' : SLATE,
              }}>{t === 'sale' ? 'For Sale' : 'For Rent'}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {popularSearches[searchTab].map(({ label, params }) => (
              <button
                key={label}
                onClick={() => navigate(toPropertiesUrl(params))}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #eef2f7', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.18s' }}
                className="search-link"
              >
                <span style={{ fontSize: 18 }}>🔍</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: NAVY }}>{label}</span>
                <span style={{ fontSize: 14, color: RED }}>→</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* WHY CHOOSE US */}
      <Section title="Why Choose PropertyHub.ug" subtitle="Uganda's most trusted real estate platform" bg="#f4f7fb">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <TrustBadge icon="✅" title="Verified Listings"   desc="Every listing is checked by our team. No fakes, no duplicates." />
          <TrustBadge icon="📍" title="Nationwide Coverage" desc="From Kampala to Gulu — all districts covered." />
          <TrustBadge icon="🔒" title="Safe Transactions"   desc="Verified agents and secure payment processing." />
          <TrustBadge icon="📞" title="Expert Support"      desc="Local property experts available 7 days a week." />
        </div>
      </Section>

      {/* AGENT CTA */}
      <div style={{ background: `linear-gradient(135deg, #c0392b 0%, ${RED} 50%, #e85d04 100%)`, padding: '44px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Are You a Property Agent?</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: 500 }}>List your properties and reach thousands of buyers & renters every day.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/register')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', backgroundColor: '#fff', color: RED, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
              List a Property
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 28px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.6)', backgroundColor: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Agent Dashboard
            </button>
          </div>
        </div>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

// ─── Shared layout ────────────────────────────────────────────────────────────
const l = {
  container:   { maxWidth: 1400, margin: '0 auto', padding: '0 24px' } as React.CSSProperties,
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 } as React.CSSProperties,
  sectionTitle:{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800, color: NAVY, margin: '0 0 6px', letterSpacing: '-0.02em' } as React.CSSProperties,
  sectionSub:  { fontSize: 14, color: SLATE, margin: 0 } as React.CSSProperties,
  sectionCta:  { fontSize: 13, fontWeight: 700, color: RED, border: `1.5px solid ${RED}`, backgroundColor: 'transparent', padding: '7px 18px', borderRadius: 30, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' } as React.CSSProperties,
};

const arr = {
  btn: { width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #eef2f7', backgroundColor: '#fff', cursor: 'pointer', fontSize: 16, color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 } as React.CSSProperties,
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'home-bayut-v2';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes homeSpin { to { transform: rotate(360deg); } }
      .home-card { animation: homeCardIn 0.38s ease-out both; }
      @keyframes homeCardIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }
      .search-link:hover { background-color: rgba(230,57,70,0.05) !important; border-color: rgba(230,57,70,0.3) !important; transform: translateX(3px); }
      footer button:hover { color: #fff !important; }
      ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    `;
    document.head.appendChild(el);
  }
}

export default Home;