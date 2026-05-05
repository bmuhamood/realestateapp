/**
 * AllProperties.tsx — Bayut-inspired design with full functionality
 * Features: Grid/List/Split views, Filters, Map, Deal buttons
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Property } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import PropertyRecommendations from '../components/Recommendations/PropertyRecommendations';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  red:      '#e84035',
  redDark:  '#c0392b',
  redBg:    'rgba(232,64,53,0.08)',
  navy:     '#1a1f2e',
  teal:     '#0d9948',
  slate:    '#6b7280',
  muted:    '#9ca3af',
  border:   '#e2e5ea',
  bg:       '#f7f8fa',
  white:    '#ffffff',
  deal:     '#8b5cf6',
  dealBg:   'rgba(139,92,246,0.10)',
  dealGlow: 'rgba(139,92,246,0.35)',
} as const;

const PRICE_MAX = 5_000_000_000;
const FONT = "'DM Sans', -apple-system, sans-serif";

// ─── Leaflet setup ────────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const makeMarkerIcon = (type: string) => L.divIcon({
  html: `<div style="
    background:${type==='house'?C.red:type==='land'?'#0d9948':type==='commercial'?'#8b5cf6':type==='condo'?'#f59e0b':'#3b82f6'};
    width:14px;height:14px;border-radius:50%;border:2.5px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: '', iconSize: [14, 14], popupAnchor: [0, -8],
});

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(p);

const fmtShort = (p: number) => {
  if (p >= 1e9) return `${(p/1e9).toFixed(1)}B`;
  if (p >= 1e6) return `${(p/1e6).toFixed(0)}M`;
  if (p >= 1e3) return `${(p/1e3).toFixed(0)}K`;
  return `${p}`;
};

// ─── Filter types ─────────────────────────────────────────────────────────────
interface Filters {
  search:          string;
  location:        string;
  propertyType:    string;
  transactionType: string;
  bedrooms:        string;
  minPrice:        number;
  maxPrice:        number;
  sortBy:          string;
  viewMode:        'list' | 'grid' | 'split';
}

const DEFAULTS: Filters = {
  search: '', location: '', propertyType: '',
  transactionType: '', bedrooms: '',
  minPrice: 0, maxPrice: PRICE_MAX,
  sortBy: 'newest', viewMode: 'grid',
};

// ─── URL ↔ Filters helpers ────────────────────────────────────────────────────
function urlToFilters(params: URLSearchParams): Partial<Filters> {
  const out: Partial<Filters> = {};

  const search = params.get('search') || params.get('q') || params.get('keyword') || '';
  if (search) out.search = decodeURIComponent(search);

  const location = params.get('location') || params.get('district') || params.get('city') || '';
  if (location) out.location = decodeURIComponent(location);

  const type = params.get('type') || params.get('propertyType') || params.get('property_type') || '';
  if (type) out.propertyType = type;

  const tx = params.get('tx') || params.get('transactionType') || params.get('transaction_type') || '';
  if (tx) out.transactionType = tx;

  const beds = params.get('bedrooms') || '';
  if (beds) out.bedrooms = beds;

  const min = params.get('minPrice') || params.get('min_price') || '';
  if (min) out.minPrice = Number(min);

  const max = params.get('maxPrice') || params.get('max_price') || '';
  if (max) out.maxPrice = Number(max);

  const sort = params.get('sort') || params.get('ordering') || '';
  if (sort) {
    if (sort === '-created_at')   out.sortBy = 'newest';
    else if (sort === 'price')    out.sortBy = 'price_low';
    else if (sort === '-price')   out.sortBy = 'price_high';
    else if (sort === '-views_count') out.sortBy = 'views';
    else out.sortBy = sort;
  }

  const view = params.get('view');
  if (view === 'list' || view === 'grid' || view === 'split') out.viewMode = view;

  return out;
}

function filtersToUrl(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search)          p.set('search',   f.search);
  if (f.location)        p.set('location', f.location);
  if (f.propertyType)    p.set('type',     f.propertyType);
  if (f.transactionType) p.set('tx',       f.transactionType);
  if (f.bedrooms)        p.set('bedrooms', f.bedrooms);
  if (f.minPrice > 0)    p.set('minPrice', String(f.minPrice));
  if (f.maxPrice < PRICE_MAX) p.set('maxPrice', String(f.maxPrice));
  if (f.sortBy !== 'newest')  p.set('sort', f.sortBy);
  if (f.viewMode !== 'grid')  p.set('view', f.viewMode);
  return p;
}

// ─── Map fly-to controller ────────────────────────────────────────────────────
const FlyTo: React.FC<{ center: [number,number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 0.8 }); }, [center, zoom]);
  return null;
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div style={{ 
    background: C.white, 
    borderRadius: 12, 
    overflow: 'hidden', 
    border: `1px solid ${C.border}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  }}>
    <div style={{ paddingTop: '62%', background: '#f0f0f0' }} />
    <div style={{ padding: 14 }}>
      <div style={{ height: 20, width: '60%', background: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 14, width: '85%', background: '#e0e0e0', borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 12, width: '45%', background: '#e0e0e0', borderRadius: 4 }} />
    </div>
  </div>
);

// ─── Futuristic Deal Button ───────────────────────────────────────────────────
const DealButton: React.FC<{ onClick: (e: React.MouseEvent) => void; compact?: boolean }> = ({ onClick, compact }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 4 : 7,
        padding: compact ? '6px 12px' : '9px 18px',
        background: hov ? `linear-gradient(135deg, #7c3aed, #4f46e5)` : `linear-gradient(135deg, #8b5cf6, #6d28d9)`,
        color: '#fff',
        border: '1px solid rgba(167,139,250,0.4)',
        borderRadius: compact ? 8 : 10,
        fontSize: compact ? 11 : 12,
        fontWeight: 800,
        cursor: 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '0.03em',
        boxShadow: hov ? `0 0 18px ${C.dealGlow}, 0 4px 16px rgba(139,92,246,0.4)` : `0 0 8px rgba(139,92,246,0.2)`,
        transition: 'all 0.18s ease',
        transform: hov ? 'translateY(-1px)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: compact ? 12 : 14 }}>💎</span>
      {compact ? 'Deal' : 'Make a Deal'}
    </button>
  );
};

// ─── Stat Row Component ───────────────────────────────────────────────────────
const StatRow: React.FC<{ beds: number; baths: number; sqm: number }> = ({ beds, baths, sqm }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    {beds > 0 && <span style={{ fontSize: 12, color: C.slate }}>🛏 {beds} bed{beds > 1 ? 's' : ''}</span>}
    {baths > 0 && <span style={{ fontSize: 12, color: C.slate }}>🚿 {baths} bath{baths > 1 ? 's' : ''}</span>}
    {sqm > 0 && <span style={{ fontSize: 12, color: C.slate }}>📐 {sqm} m²</span>}
  </div>
);

// ─── Horizontal List Card ─────────────────────────────────────────────────────
const ListCard: React.FC<{ property: Property; onLike: () => void }> = ({ property, onLike }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hov, setHov] = useState(false);

  const canMakeDeal = !!(user && property.owner && user.id !== property.owner.id && property.is_available);
  const mainImage = property.images?.[0];
  const imageUrl = mainImage?.image_url || mainImage?.image || '/placeholder-property.svg';

  return (
    <div
      onClick={() => navigate(`/property/${property.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        background: C.white,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: `1px solid ${hov ? C.red + '40' : C.border}`,
        boxShadow: hov ? '0 12px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Image Section */}
      <div style={{ position: 'relative', width: 260, minWidth: 260, flexShrink: 0 }}>
        <img
          src={imageUrl}
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
        />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
            {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Short Stay'}
          </span>
          {property.is_verified && <span style={{ background: C.teal, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>✓ Verified</span>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onLike(); }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            borderRadius: '50%',
            width: 34,
            height: 34,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {property.is_liked ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Content Section */}
      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.red, fontFamily: "'DM Mono', monospace" }}>
            UGX {fmtShort(property.price)}
            {property.transaction_type === 'rent' && <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>/mo</span>}
          </div>
          <span style={{ fontSize: 12, color: C.muted }}>👁 {property.views_count?.toLocaleString() || 0}</span>
        </div>

        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.navy, lineHeight: 1.3 }}>{property.title}</h3>
        <div style={{ fontSize: 13, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>📍</span> {property.district}, {property.city}
        </div>

        <StatRow beds={property.bedrooms} baths={property.bathrooms} sqm={property.square_meters} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: C.redBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: C.red
            }}>
              {property.owner?.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
                {property.owner?.first_name || property.owner?.username || 'Agent'}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>Listed by</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canMakeDeal && <DealButton onClick={e => { e.stopPropagation(); navigate(`/make-deal/${property.id}`); }} compact />}
            <button
              onClick={e => { e.stopPropagation(); navigate(`/property/${property.id}`); }}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: `1.5px solid ${C.red}`,
                background: C.redBg,
                color: C.red,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.color = C.red; }}
            >
              View →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Grid Card with Deal Button Overlay ───────────────────────────────────────
const GridCardWithDeal: React.FC<{ property: Property; onLike: () => void }> = ({ property, onLike }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hov, setHov] = useState(false);
  const canMakeDeal = !!(user && property.owner && user.id !== property.owner.id && property.is_available);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <PropertyCard property={property} onLike={onLike} variant="vertical" showDealButton={false} />
      {canMakeDeal && (
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          opacity: hov ? 1 : 0,
          transform: hov ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: hov ? 'auto' : 'none',
          zIndex: 10,
        }}>
          <DealButton onClick={e => { e.stopPropagation(); navigate(`/make-deal/${property.id}`); }} />
        </div>
      )}
    </div>
  );
};

// ─── Filters Drawer Component ────────────────────────────────────────────────
const FiltersDrawer: React.FC<{
  filters: Filters;
  onChange: (p: Partial<Filters>) => void;
  onReset: () => void;
  onClose: () => void;
  count: number;
}> = ({ filters, onChange, onReset, onClose, count }) => {
  const [localMax, setLocalMax] = useState(filters.maxPrice);
  const priceTimer = useRef<any>(null);

  const handlePriceSlider = (val: number) => {
    setLocalMax(val);
    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => onChange({ maxPrice: val }), 150);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, background: C.white, zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', animation: 'slideInRight 0.25s ease-out' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: C.navy }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: C.white }}>Filter Properties</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{count} matching</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Filter sections */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Purpose</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: '', l: 'All' },
                { v: 'sale', l: 'For Sale' },
                { v: 'rent', l: 'For Rent' },
                { v: 'shortlet', l: 'Short Stay' }
              ].map(o => (
                <button
                  key={o.v}
                  onClick={() => onChange({ transactionType: o.v })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 24,
                    border: `1.5px solid ${filters.transactionType === o.v ? C.red : C.border}`,
                    background: filters.transactionType === o.v ? C.redBg : C.white,
                    color: filters.transactionType === o.v ? C.red : C.slate,
                    fontSize: 13,
                    fontWeight: filters.transactionType === o.v ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Property Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: '', l: 'All' },
                { v: 'house', l: '🏠 House' },
                { v: 'apartment', l: '🏢 Apartment' },
                { v: 'land', l: '🌾 Land' },
                { v: 'commercial', l: '🏭 Commercial' }
              ].map(o => (
                <button
                  key={o.v}
                  onClick={() => onChange({ propertyType: o.v })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 24,
                    border: `1.5px solid ${filters.propertyType === o.v ? C.red : C.border}`,
                    background: filters.propertyType === o.v ? C.redBg : C.white,
                    color: filters.propertyType === o.v ? C.red : C.slate,
                    fontSize: 13,
                    fontWeight: filters.propertyType === o.v ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Bedrooms</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: '', l: 'Any' },
                { v: '1', l: '1+' },
                { v: '2', l: '2+' },
                { v: '3', l: '3+' },
                { v: '4', l: '4+' }
              ].map(o => (
                <button
                  key={o.v}
                  onClick={() => onChange({ bedrooms: o.v })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 24,
                    border: `1.5px solid ${filters.bedrooms === o.v ? C.red : C.border}`,
                    background: filters.bedrooms === o.v ? C.redBg : C.white,
                    color: filters.bedrooms === o.v ? C.red : C.slate,
                    fontSize: 13,
                    fontWeight: filters.bedrooms === o.v ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Price Range</div>
            <input
              type="range"
              min={0}
              max={PRICE_MAX}
              step={10_000_000}
              value={localMax}
              onChange={e => handlePriceSlider(Number(e.target.value))}
              style={{ width: '100%', accentColor: C.red, height: 4 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: C.slate }}>UGX 0</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>≤ UGX {fmtShort(localMax)}</span>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Sort By</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: 'newest', l: 'Newest' },
                { v: 'price_low', l: 'Price (Low to High)' },
                { v: 'price_high', l: 'Price (High to Low)' },
                { v: 'views', l: 'Most Viewed' }
              ].map(o => (
                <button
                  key={o.v}
                  onClick={() => onChange({ sortBy: o.v })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 24,
                    border: `1.5px solid ${filters.sortBy === o.v ? C.red : C.border}`,
                    background: filters.sortBy === o.v ? C.redBg : C.white,
                    color: filters.sortBy === o.v ? C.red : C.slate,
                    fontSize: 13,
                    fontWeight: filters.sortBy === o.v ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12 }}>
          <button onClick={onReset} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
          <button onClick={onClose} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: C.red, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Show {count} Results</button>
        </div>
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AllProperties: React.FC = () => {
  const urlLocation = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [showLocDrop, setShowLocDrop] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0.3136, 32.5811]);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  const locRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<any>(null);
  const urlSyncTimer = useRef<any>(null);
  const prevUrlSearch = useRef('');
  const didMount = useRef(false);

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const res = await api.get('/properties/', { params: { page_size: 200 } });
        setProperties(res.data.results ?? res.data);
      } catch {
        setError('Could not load properties');
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, []);

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams(urlLocation.search);
    const fromUrl = urlToFilters(params);
    setFilters({ ...DEFAULTS, ...fromUrl });
    setSearchVal(fromUrl.search || '');
    setLocationVal(fromUrl.location || '');
    prevUrlSearch.current = urlLocation.search;
  }, [urlLocation.search]);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    urlSyncTimer.current = setTimeout(() => {
      const params = filtersToUrl(filters);
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      if (prevUrlSearch.current !== newSearch) {
        prevUrlSearch.current = newSearch;
        navigate(`/properties${newSearch}`, { replace: true });
      }
    }, 300);
  }, [filters, navigate]);

  const applyFilter = useCallback((partial: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  }, []);

  const resetAll = useCallback(() => {
    setFilters({ ...DEFAULTS, viewMode: filters.viewMode });
    setSearchVal('');
    setLocationVal('');
  }, [filters.viewMode]);

  const onSearchChange = useCallback((val: string) => {
    setSearchVal(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilter({ search: val }), 300);
  }, [applyFilter]);

  const onLocationChange = useCallback((val: string) => {
    setLocationVal(val);
    setShowLocDrop(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilter({ location: val }), 300);
  }, [applyFilter]);

  const filtered = useMemo(() => {
    let list = properties.filter(p => {
      const matchSearch = !filters.search || p.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.district?.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.city?.toLowerCase().includes(filters.search.toLowerCase());
      const matchLocation = !filters.location || p.district?.toLowerCase().includes(filters.location.toLowerCase()) ||
        p.city?.toLowerCase().includes(filters.location.toLowerCase());
      const matchType = !filters.propertyType || p.property_type === filters.propertyType;
      const matchTx = !filters.transactionType || p.transaction_type === filters.transactionType;
      const matchBeds = !filters.bedrooms || (p.bedrooms ?? 0) >= parseInt(filters.bedrooms);
      const matchPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
      return matchSearch && matchLocation && matchType && matchTx && matchBeds && matchPrice;
    });

    const sortFns: Record<string, (a: Property, b: Property) => number> = {
      price_low: (a, b) => a.price - b.price,
      price_high: (a, b) => b.price - a.price,
      views: (a, b) => (b.views_count ?? 0) - (a.views_count ?? 0),
      newest: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    };
    const fn = sortFns[filters.sortBy] ?? sortFns.newest;
    const boosted = list.filter(p => p.is_boosted).sort(fn);
    const normal = list.filter(p => !p.is_boosted).sort(fn);
    return [...boosted, ...normal];
  }, [properties, filters]);

  const hasActive = useMemo(() => 
    !!(filters.search || filters.location || filters.propertyType || filters.transactionType || 
       filters.bedrooms || filters.minPrice > 0 || filters.maxPrice < PRICE_MAX),
    [filters]
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, marginTop: 64 }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <p style={{ color: C.red }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 24px', background: C.red, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, marginTop: 64 }}>
      {/* Sticky Filter Bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 200, background: C.white, borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by title, location..."
              value={searchVal}
              onChange={e => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 10,
                border: `1.5px solid ${filters.search ? C.red : C.border}`,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                background: filters.search ? C.redBg : C.white,
              }}
            />
          </div>

          {/* Location Input */}
          <div ref={locRef} style={{ position: 'relative', minWidth: 180 }}>
            <input
              type="text"
              placeholder="Location"
              value={locationVal}
              onChange={e => onLocationChange(e.target.value)}
              onFocus={() => setShowLocDrop(true)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 10,
                border: `1.5px solid ${filters.location ? C.red : C.border}`,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                background: filters.location ? C.redBg : C.white,
              }}
            />
{showLocDrop && (
  <div style={{ 
    position: 'absolute', 
    top: '100%', 
    left: 0, 
    right: 0, 
    background: C.white, 
    border: `1px solid ${C.border}`, 
    borderRadius: 10, 
    marginTop: 4, 
    maxHeight: 200, 
    overflowY: 'auto', 
    zIndex: 300 
  }}>
    {Array.from(new Set(properties.map(p => p.district).filter(Boolean))).slice(0, 8).map(loc => (
      <div 
        key={loc} 
        onClick={() => { setLocationVal(loc); applyFilter({ location: loc }); setShowLocDrop(false); }} 
        style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13 }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.bg}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {loc}
      </div>
    ))}
  </div>
)}
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setShowDrawer(true)} style={{ padding: '8px 16px', borderRadius: 24, border: `1.5px solid ${hasActive ? C.red : C.border}`, background: hasActive ? C.redBg : C.white, color: hasActive ? C.red : C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ⚙️ Filters {hasActive && `(${Object.values(filters).filter(v => v && v !== '' && v !== PRICE_MAX && v !== 0).length})`}
            </button>
            {hasActive && <button onClick={resetAll} style={{ padding: '8px 16px', borderRadius: 24, border: `1.5px solid ${C.red}`, background: '#fff', color: C.red, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear All ✕</button>}
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: 4, background: C.bg, borderRadius: 10, padding: 4 }}>
            {(['grid', 'list', 'split'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => applyFilter({ viewMode: mode })}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: filters.viewMode === mode ? C.red : 'transparent',
                  color: filters.viewMode === mode ? '#fff' : C.slate,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {mode === 'grid' ? '⊞ Grid' : mode === 'list' ? '≡ List' : '⊟ Map'}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div style={{ fontSize: 13, color: C.muted }}>
            <strong style={{ color: C.navy }}>{filtered.length}</strong> properties
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: filters.viewMode === 'split' ? '1fr 460px' : '1fr', maxWidth: 1600, margin: '0 auto', padding: '24px 20px', gap: 24 }}>
        {/* Results Panel */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🏠</div>
              <h3 style={{ color: C.navy, marginBottom: 8 }}>No properties found</h3>
              <p style={{ color: C.muted }}>Try adjusting your search or filters</p>
              <button onClick={resetAll} style={{ marginTop: 20, padding: '10px 24px', background: C.red, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Clear all filters</button>
            </div>
          ) : filters.viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filtered.map(property => (
                <GridCardWithDeal key={property.id} property={property} onLike={() => {}} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map(property => (
                <ListCard key={property.id} property={property} onLike={() => {}} />
              ))}
            </div>
          )}

          {/* Recommendations */}
          {filtered.length > 0 && <PropertyRecommendations limit={4} />}
        </div>

        {/* Map Panel (Split View) */}
        {filters.viewMode === 'split' && (
          <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 100px)', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <MapContainer center={[0.3136, 32.5811]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              <FlyTo center={mapCenter} zoom={mapZoom} />
              {filtered.map(p => p.latitude && p.longitude && (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={makeMarkerIcon(p.property_type)}
                  eventHandlers={{ click: () => { setMapCenter([p.latitude, p.longitude]); setMapZoom(15); setSelectedProp(p); } }}
                >
                  <Popup>
                    <div style={{ padding: 8, minWidth: 180 }}>
                      <img src={p.images?.[0]?.image_url || '/placeholder-property.svg'} alt={p.title} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                      <div style={{ fontWeight: 700, color: C.red, fontSize: 16 }}>UGX {fmtShort(p.price)}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{p.district}</div>
                      <button onClick={() => navigate(`/property/${p.id}`)} style={{ width: '100%', padding: '6px', background: C.red, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>View Details →</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {selectedProp && (
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: C.white, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <button onClick={() => setSelectedProp(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', cursor: 'pointer', zIndex: 10 }}>×</button>
                <PropertyCard property={selectedProp} variant="horizontal" showDealButton={false} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Drawer */}
      {showDrawer && (
        <FiltersDrawer
          filters={filters}
          onChange={applyFilter}
          onReset={resetAll}
          onClose={() => setShowDrawer(false)}
          count={filtered.length}
        />
      )}
    </div>
  );
};

export default AllProperties;