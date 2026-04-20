/**
 * AllProperties.tsx — Optimized property search results page
 * IMPROVEMENTS:
 * - Performance optimizations (memoization, debouncing, useCallback)
 * - Proper filter handling from Home page navigation
 * - Improved UI with better visual hierarchy
 * - Reduced re-renders with memoized components
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Property } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import PropertyRecommendations from '../components/Recommendations/PropertyRecommendations';

// Lazy load map components for better initial load performance
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));

// ─── Brand Colors ────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_DARK = '#c1121f';
const RED_BG = 'rgba(230,57,70,0.08)';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const SLATE = '#475569';
const LIGHT_BG = '#f6f8fb';
const PRICE_MAX = 5_000_000_000;

// ─── Leaflet Configuration ───────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getMarkerIcon = (type: string) => L.divIcon({
  html: `<div style="background:${
    type === 'house' ? RED : type === 'land' ? '#10b981' :
    type === 'commercial' ? '#8b5cf6' : type === 'condo' ? '#f59e0b' : '#3b82f6'
  };width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker', iconSize: [14, 14], popupAnchor: [0, -8],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);

const fmtShort = (p: number) => {
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)}B`;
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(0)}M`;
  if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K`;
  return `${p}`;
};

// ─── Filter State ────────────────────────────────────────────────────────────
interface FilterState {
  search: string;
  location: string;
  propertyType: string;
  transactionType: string;
  bedrooms: string;
  minPrice: number;
  maxPrice: number;
  sortBy: string;
  viewMode: 'list' | 'grid' | 'split';
}

const DEFAULT_FILTERS: FilterState = {
  search: '', location: '', propertyType: '',
  transactionType: '', bedrooms: '',
  minPrice: 0, maxPrice: PRICE_MAX,
  sortBy: 'newest', viewMode: 'grid',
};

// Parse URL params - supports both Home page and direct URL formats
function paramsToFilters(params: URLSearchParams): Partial<FilterState> {
  const out: Partial<FilterState> = {};
  
  // Support multiple param name variations from Home page
  const search = params.get('search') || params.get('q') || params.get('district') || '';
  if (search) out.search = decodeURIComponent(search);
  
  const location = params.get('location') || '';
  if (location) out.location = decodeURIComponent(location);
  
  const propertyType = params.get('property_type') || params.get('type') || params.get('propertyType') || '';
  if (propertyType) out.propertyType = propertyType;
  
  const transactionType = params.get('transaction_type') || params.get('tx') || params.get('transactionType') || '';
  if (transactionType) out.transactionType = transactionType;
  
  const bedrooms = params.get('bedrooms') || '';
  if (bedrooms) out.bedrooms = bedrooms;
  
  const minPrice = params.get('min_price') || params.get('minPrice');
  if (minPrice) out.minPrice = Number(minPrice);
  
  const maxPrice = params.get('max_price') || params.get('maxPrice');
  if (maxPrice) out.maxPrice = Number(maxPrice);
  
  const sort = params.get('ordering') || params.get('sort');
  if (sort) out.sortBy = sort;
  
  const view = params.get('view');
  if (view === 'list' || view === 'grid' || view === 'split') out.viewMode = view;
  
  return out;
}

function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search) p.set('search', f.search);
  if (f.location) p.set('location', f.location);
  if (f.propertyType) p.set('property_type', f.propertyType);
  if (f.transactionType) p.set('transaction_type', f.transactionType);
  if (f.bedrooms) p.set('bedrooms', f.bedrooms);
  if (f.minPrice > 0) p.set('min_price', String(f.minPrice));
  if (f.maxPrice < PRICE_MAX) p.set('max_price', String(f.maxPrice));
  if (f.sortBy !== 'newest') p.set('ordering', f.sortBy);
  if (f.viewMode !== 'grid') p.set('view', f.viewMode);
  return p;
}

// ─── List Card Component (memoized for performance) ──────────────────────────
const ListCard = React.memo<{ property: Property; onLike: () => void }>(({ property, onLike }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const img = property.images?.find(i => i.is_main)?.image || property.images?.[0]?.image;
  const isBoosted = (property as any).is_boosted;

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1.5px solid ${hov ? 'rgba(230,57,70,0.25)' : '#eef2f7'}`,
        boxShadow: hov ? '0 8px 32px rgba(13,27,46,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.22s ease',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      <div style={{ position: 'relative', width: 260, minWidth: 260, flexShrink: 0, overflow: 'hidden' }}>
        <img
          src={img || 'https://via.placeholder.com/300x220?text=No+Image'}
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
        />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 2 }}>
          {isBoosted && <span style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>⭐ Featured</span>}
          {property.is_verified && <span style={{ backgroundColor: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>✓ Verified</span>}
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2 }}>
          <span style={{ backgroundColor: 'rgba(13,27,46,0.72)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
            {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'}
          </span>
        </div>
        {property.images?.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 12, zIndex: 2 }}>
            📷 {property.images.length}
          </div>
        )}
        <button
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, zIndex: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onClick={e => { e.stopPropagation(); onLike(); }}
        >
          {property.is_liked ? '❤️' : '🤍'}
        </button>
      </div>

      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
            {fmtPrice(property.price)}
            {property.transaction_type === 'rent' && <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>/mo</span>}
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>👁 {property.views_count?.toLocaleString()}</span>
        </div>

        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: NAVY, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {property.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10.5" r="3" />
          </svg>
          {property.district}{property.district && property.city ? ', ' : ''}{property.city}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          {property.property_type !== 'land' && (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: SLATE, fontWeight: 500 }}>🛏 {property.bedrooms} Beds</span>
              <span style={{ color: '#d1d5db', fontSize: 10 }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: SLATE, fontWeight: 500 }}>🚿 {property.bathrooms} Baths</span>
              <span style={{ color: '#d1d5db', fontSize: 10 }}>•</span>
            </>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: SLATE, fontWeight: 500 }}>📐 {property.square_meters} m²</span>
          <span style={{ color: '#d1d5db', fontSize: 10 }}>•</span>
          <span style={{ fontSize: 12, color: SLATE, fontWeight: 500, textTransform: 'capitalize' }}>🏠 {property.property_type}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: RED_BG, border: `1.5px solid ${RED}`, color: RED, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {property.owner?.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 12, color: NAVY, fontWeight: 600 }}>
                {property.owner?.first_name || property.owner?.username || 'Agent'}
                {property.owner?.is_verified && <span style={{ color: TEAL }}> ✓</span>}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Property Owner</div>
            </div>
          </div>
          <button
            style={{ padding: '8px 18px', borderRadius: 9, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
            onClick={e => { e.stopPropagation(); navigate(`/property/${property.id}`); }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = RED_DARK)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = RED)}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Filter Section Component ────────────────────────────────────────────────
const FilterSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{label}</div>
    {children}
  </div>
);

const ChipGroup: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {options.map(o => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        style={{
          padding: '7px 14px', borderRadius: 20,
          border: `1.5px solid ${value === o.value ? RED : '#eef2f7'}`,
          backgroundColor: value === o.value ? RED_BG : '#fff',
          color: value === o.value ? RED : SLATE,
          fontSize: 13, fontWeight: value === o.value ? 700 : 500,
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ─── Quick Pill Button ───────────────────────────────────────────────────────
const QuickPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '8px 14px', borderRadius: 10,
      border: `1.5px solid ${active ? RED : '#e2e8f0'}`,
      backgroundColor: active ? RED_BG : '#fff',
      color: active ? RED : SLATE,
      fontSize: 13, fontWeight: active ? 700 : 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
      fontFamily: 'inherit', transition: 'all 0.15s',
    }}
  >
    {label}
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.6, flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
);

// ─── Active Filter Tags ──────────────────────────────────────────────────────
const ActiveFilterTags: React.FC<{ filters: FilterState; onChange: (p: Partial<FilterState>) => void; onReset: () => void }> = ({ filters, onChange, onReset }) => {
  const tags: { label: string; key: keyof FilterState; resetVal: any }[] = [];
  if (filters.transactionType) tags.push({ label: filters.transactionType === 'sale' ? 'For Sale' : filters.transactionType === 'rent' ? 'For Rent' : 'Shortlet', key: 'transactionType', resetVal: '' });
  if (filters.propertyType) tags.push({ label: filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1), key: 'propertyType', resetVal: '' });
  if (filters.bedrooms) tags.push({ label: `${filters.bedrooms}+ Beds`, key: 'bedrooms', resetVal: '' });
  if (filters.maxPrice < PRICE_MAX) tags.push({ label: `≤ UGX ${fmtShort(filters.maxPrice)}`, key: 'maxPrice', resetVal: PRICE_MAX });
  if (filters.minPrice > 0) tags.push({ label: `≥ UGX ${fmtShort(filters.minPrice)}`, key: 'minPrice', resetVal: 0 });

  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '10px 20px', backgroundColor: '#fff', borderBottom: '1px solid #eef2f7' }}>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active:</span>
      {tags.map(tag => (
        <span key={tag.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 16, backgroundColor: RED_BG, border: `1px solid rgba(230,57,70,0.2)`, color: RED, fontSize: 12, fontWeight: 600 }}>
          {tag.label}
          <button onClick={() => onChange({ [tag.key]: tag.resetVal })} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}>✕</button>
        </span>
      ))}
      <button onClick={onReset} style={{ padding: '4px 10px', borderRadius: 16, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: SLATE, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Clear all</button>
    </div>
  );
};

// ─── More Filters Drawer ─────────────────────────────────────────────────────
const MoreFiltersDrawer: React.FC<{
  filters: FilterState;
  onChange: (p: Partial<FilterState>) => void;
  onReset: () => void;
  onClose: () => void;
  resultCount: number;
}> = ({ filters, onChange, onReset, onClose, resultCount }) => (
  <>
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.4)', backdropFilter: 'blur(3px)', zIndex: 1000 }} onClick={onClose} />
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, backgroundColor: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: NAVY }}>Filters</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{resultCount} properties match</div>
        </div>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <FilterSection label="Purpose">
          <ChipGroup
            options={[
              { value: '', label: 'All' },
              { value: 'sale', label: 'For Sale' },
              { value: 'rent', label: 'For Rent' },
              { value: 'shortlet', label: 'Shortlet' },
            ]}
            value={filters.transactionType}
            onChange={v => onChange({ transactionType: v })}
          />
        </FilterSection>

        <FilterSection label="Property Type">
          <ChipGroup
            options={[
              { value: '', label: 'All Types' },
              { value: 'house', label: 'House' },
              { value: 'apartment', label: 'Apartment' },
              { value: 'land', label: 'Land' },
              { value: 'commercial', label: 'Commercial' },
              { value: 'condo', label: 'Condo' },
            ]}
            value={filters.propertyType}
            onChange={v => onChange({ propertyType: v })}
          />
        </FilterSection>

        <FilterSection label="Bedrooms">
          <ChipGroup
            options={[
              { value: '', label: 'Any' },
              { value: '1', label: '1+' },
              { value: '2', label: '2+' },
              { value: '3', label: '3+' },
              { value: '4', label: '4+' },
              { value: '5', label: '5+' },
            ]}
            value={filters.bedrooms}
            onChange={v => onChange({ bedrooms: v })}
          />
        </FilterSection>

        <FilterSection label="Price Range">
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Min: {filters.minPrice > 0 ? `UGX ${fmtShort(filters.minPrice)}` : 'Any'}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Max: {filters.maxPrice >= PRICE_MAX ? 'No limit' : `UGX ${fmtShort(filters.maxPrice)}`}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <input type="number" placeholder="0" value={filters.minPrice || ''} onChange={e => onChange({ minPrice: Number(e.target.value) || 0 })} style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #eef2f7', fontSize: 12 }} />
              <input type="number" placeholder="No limit" value={filters.maxPrice >= PRICE_MAX ? '' : filters.maxPrice} onChange={e => onChange({ maxPrice: Number(e.target.value) || PRICE_MAX })} style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #eef2f7', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[50_000_000, 100_000_000, 250_000_000, 500_000_000, 1_000_000_000].map(v => (
                <button key={v} onClick={() => onChange({ maxPrice: v })} style={{ padding: '5px 10px', borderRadius: 16, border: `1.5px solid ${filters.maxPrice === v ? RED : '#eef2f7'}`, backgroundColor: filters.maxPrice === v ? RED_BG : '#fff', color: filters.maxPrice === v ? RED : SLATE, fontSize: 11, cursor: 'pointer' }}>≤{fmtShort(v)}</button>
              ))}
              <button onClick={() => onChange({ maxPrice: PRICE_MAX })} style={{ padding: '5px 10px', borderRadius: 16, border: `1.5px solid ${filters.maxPrice >= PRICE_MAX ? RED : '#eef2f7'}`, backgroundColor: filters.maxPrice >= PRICE_MAX ? RED_BG : '#fff', color: filters.maxPrice >= PRICE_MAX ? RED : SLATE, fontSize: 11, cursor: 'pointer' }}>No limit</button>
            </div>
          </div>
        </FilterSection>

        <FilterSection label="Sort By">
          <ChipGroup
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price_low', label: 'Price ↑' },
              { value: 'price_high', label: 'Price ↓' },
              { value: 'views', label: 'Popular' },
            ]}
            value={filters.sortBy}
            onChange={v => onChange({ sortBy: v })}
          />
        </FilterSection>
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={onReset} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reset All</button>
        <button onClick={onClose} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Show {resultCount} Results</button>
      </div>
    </div>
  </>
);

// ─── Map Controller Component (simplified, no lazy loading for hooks) ────────
// Note: useMap hook must be used within a MapContainer, but we'll handle map updates differently
const MapControllerComponent: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const mapRef = useRef<L.Map | null>(null);
  
  useEffect(() => {
    // Get map instance from the window or context
    // This is a simplified version - in production, use useMap from react-leaflet
    const map = (window as any).__leafletMap;
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom]);
  
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AllProperties: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showMoreFilters, setShowMore] = useState(false);
  const [mapCenter] = useState<[number, number]>([0.3136, 32.5811]);
  const [mapZoom] = useState(12);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  // Local input states with debouncing
  const [searchInput, setSearchInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [showLocDrop, setShowLocDrop] = useState(false);
  
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);
  const locDebounce = useRef<NodeJS.Timeout | null>(null);
  const urlSyncDebounce = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);
  const locRef = useRef<HTMLDivElement>(null);

  // Derived locations list
  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    properties.forEach(p => { if (p.city) locs.add(p.city); if (p.district) locs.add(p.district); });
    return Array.from(locs).sort();
  }, [properties]);

  // Close location dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setShowLocDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // URL to filters (on mount and URL changes)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = paramsToFilters(params);
    const merged = { ...DEFAULT_FILTERS, ...fromUrl };
    setFilters(merged);
    setSearchInput(merged.search || '');
    setLocationInput(merged.location || '');
  }, [location.search]);

  // Filters to URL (debounced)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (urlSyncDebounce.current) clearTimeout(urlSyncDebounce.current);
    urlSyncDebounce.current = setTimeout(() => {
      const params = filtersToParams(filters);
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      if (location.search !== newSearch) {
        navigate(`/properties${newSearch}`, { replace: true });
      }
    }, 300);
    return () => { if (urlSyncDebounce.current) clearTimeout(urlSyncDebounce.current); };
  }, [filters, location.search, navigate]);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/properties/');
      setProperties(res.data.results ?? res.data);
    } catch {
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // Filter updater
  const updateFilters = useCallback((partial: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(prev => ({ ...DEFAULT_FILTERS, viewMode: prev.viewMode }));
    setSearchInput('');
    setLocationInput('');
  }, []);

  // Debounced handlers
  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => updateFilters({ search: val }), 350);
  }, [updateFilters]);

  const handleLocationChange = useCallback((val: string) => {
    setLocationInput(val);
    setShowLocDrop(true);
    if (locDebounce.current) clearTimeout(locDebounce.current);
    locDebounce.current = setTimeout(() => updateFilters({ location: val }), 350);
  }, [updateFilters]);

  const handleLocationSelect = useCallback((loc: string) => {
    setLocationInput(loc);
    setShowLocDrop(false);
    updateFilters({ location: loc });
  }, [updateFilters]);

  // Filtered and sorted properties (memoized for performance)
  const filteredProperties = useMemo(() => {
    let list = [...properties];

    // Apply filters efficiently
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(searchLower) ||
        p.address?.toLowerCase().includes(searchLower) ||
        p.district?.toLowerCase().includes(searchLower) ||
        p.city?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.location) {
      const locLower = filters.location.toLowerCase();
      list = list.filter(p =>
        p.city?.toLowerCase().includes(locLower) ||
        p.district?.toLowerCase().includes(locLower)
      );
    }

    if (filters.propertyType) {
      list = list.filter(p => p.property_type === filters.propertyType);
    }

    if (filters.transactionType) {
      list = list.filter(p => p.transaction_type === filters.transactionType);
    }

    if (filters.bedrooms) {
      const beds = parseInt(filters.bedrooms);
      list = list.filter(p => (p.bedrooms ?? 0) >= beds);
    }

    list = list.filter(p =>
      (p.price ?? 0) >= filters.minPrice &&
      (p.price ?? 0) <= filters.maxPrice
    );

    // Sort
    const sortFunctions: Record<string, (a: Property, b: Property) => number> = {
      price_low: (a, b) => a.price - b.price,
      price_high: (a, b) => b.price - a.price,
      views: (a, b) => (b.views_count ?? 0) - (a.views_count ?? 0),
      newest: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    };
    const sortFn = sortFunctions[filters.sortBy] || sortFunctions.newest;
    
    // Boosted properties first
    const boosted = list.filter(p => (p as any).is_boosted).sort(sortFn);
    const normal = list.filter(p => !(p as any).is_boosted).sort(sortFn);
    
    return [...boosted, ...normal];
  }, [properties, filters]);

  const hasActive = useMemo(() => {
    return !!(filters.search || filters.location || filters.propertyType || filters.transactionType ||
              filters.bedrooms || filters.minPrice > 0 || filters.maxPrice < PRICE_MAX);
  }, [filters]);

  const filteredLocations = useMemo(() =>
    allLocations.filter(l => l.toLowerCase().includes(locationInput.toLowerCase())).slice(0, 8),
    [allLocations, locationInput]
  );

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: LIGHT_BG, marginTop: 64 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #e2e8f0', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'apSpin 0.7s linear infinite' }} />
        <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Loading properties...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, marginTop: 64 }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <p style={{ color: '#ef4444', fontSize: 15, margin: 0 }}>{error}</p>
        <button onClick={fetchProperties} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try again</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: LIGHT_BG, fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>

      {/* Sticky Filter Bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 200, backgroundColor: '#fff', borderBottom: '1px solid #eef2f7', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          {/* Location Input */}
          <div ref={locRef} style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1.5px solid #eef2f7', borderRadius: 10, padding: '0 10px 0 12px', height: 42, backgroundColor: '#fafcff', minWidth: 190 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10.5" r="3" /></svg>
              <input type="text" placeholder="City or district" value={locationInput} onChange={e => handleLocationChange(e.target.value)} onFocus={() => setShowLocDrop(true)} onKeyDown={e => { if (e.key === 'Enter') { updateFilters({ location: locationInput }); setShowLocDrop(false); } }} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: NAVY, backgroundColor: 'transparent' }} />
              {locationInput && <button onClick={() => { setLocationInput(''); updateFilters({ location: '' }); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>✕</button>}
            </div>
            {showLocDrop && filteredLocations.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 200, backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 300, overflow: 'hidden' }}>
                {filteredLocations.map(loc => (
                  <div key={loc} onMouseDown={() => handleLocationSelect(loc)} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <span>📍</span> {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1.5px solid #eef2f7', borderRadius: 10, padding: '0 6px 0 12px', height: 42, backgroundColor: '#fafcff', flex: 1, minWidth: 200, maxWidth: 380 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" placeholder="Search properties..." value={searchInput} onChange={e => handleSearchChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') updateFilters({ search: searchInput }); }} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: NAVY, backgroundColor: 'transparent' }} />
            {searchInput && <button onClick={() => { setSearchInput(''); updateFilters({ search: '' }); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>✕</button>}
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <QuickPill label={filters.transactionType ? (filters.transactionType === 'sale' ? 'For Sale' : filters.transactionType === 'rent' ? 'For Rent' : 'Shortlet') : 'Purpose'} active={!!filters.transactionType} onClick={() => setShowMore(true)} />
            <QuickPill label={filters.propertyType ? filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1) : 'Type'} active={!!filters.propertyType} onClick={() => setShowMore(true)} />
            <QuickPill label={filters.bedrooms ? `${filters.bedrooms}+ Beds` : 'Beds'} active={!!filters.bedrooms} onClick={() => setShowMore(true)} />
            <QuickPill label={filters.maxPrice < PRICE_MAX ? `≤ ${fmtShort(filters.maxPrice)}` : 'Price'} active={filters.maxPrice < PRICE_MAX || filters.minPrice > 0} onClick={() => setShowMore(true)} />

            <button onClick={() => setShowMore(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${hasActive ? RED : '#e2e8f0'}`, backgroundColor: hasActive ? RED_BG : '#fff', color: hasActive ? RED : SLATE, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54z" /></svg>
              Filters {hasActive && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: RED, display: 'inline-block', marginLeft: 1 }} />}
            </button>

            {hasActive && (
              <button onClick={resetFilters} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #fecaca', backgroundColor: '#fff7f7', color: RED, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>✕ Clear</button>
            )}
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              <strong style={{ color: NAVY }}>{filteredProperties.length.toLocaleString()}</strong> results
            </span>

            <select value={filters.sortBy} onChange={e => updateFilters({ sortBy: e.target.value })} style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #eef2f7', fontSize: 12, color: NAVY, backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              <option value="newest">Newest</option>
              <option value="price_low">Price ↑</option>
              <option value="price_high">Price ↓</option>
              <option value="views">Popular</option>
            </select>

            {/* View Toggle */}
            <div style={{ display: 'flex', gap: 2, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 }}>
              {(['grid', 'list', 'split'] as const).map(mode => (
                <button key={mode} onClick={() => updateFilters({ viewMode: mode })} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', backgroundColor: filters.viewMode === mode ? RED : 'transparent', color: filters.viewMode === mode ? '#fff' : '#64748b' }}>
                  {mode === 'grid' ? '⊞' : mode === 'list' ? '≡' : '⊟'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ActiveFilterTags filters={filters} onChange={updateFilters} onReset={resetFilters} />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: filters.viewMode === 'split' ? '1fr 460px' : '1fr', maxWidth: 1600, margin: '0 auto', padding: '20px 20px 0', gap: 16, alignItems: 'start' }}>
        
        {/* Results Panel */}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1rem, 2vw, 1.3rem)', fontWeight: 800, color: NAVY, margin: '0 0 4px' }}>
              {filteredProperties.length.toLocaleString()} {filters.propertyType ? `${filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1)}s` : 'Properties'}
              {filters.transactionType ? ` for ${filters.transactionType === 'sale' ? 'Sale' : filters.transactionType === 'rent' ? 'Rent' : 'Shortlet'}` : ''}
              {filters.location ? ` in ${filters.location}` : filters.search ? ` matching "${filters.search}"` : ' in Uganda'}
            </h1>
            {hasActive && (
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Filtered results · <button onClick={resetFilters} style={{ color: RED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 600 }}>clear filters</button>
              </p>
            )}
          </div>

          {filteredProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7' }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🏚️</div>
              <h3 style={{ margin: '0 0 8px', color: NAVY }}>No properties found</h3>
              <p style={{ margin: '0 0 22px', color: '#94a3b8', fontSize: 14 }}>{hasActive ? 'Try broadening your search or clearing some filters' : 'No listings available yet'}</p>
              {hasActive && <button onClick={resetFilters} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Clear all filters</button>}
            </div>
          ) : filters.viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredProperties.map((p, i) => (
                <div key={p.id} style={{ animation: `apFadeUp 0.38s ease-out both`, animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}>
                  <PropertyCard property={p} onLike={fetchProperties} variant="vertical" />
                </div>
              ))}
            </div>
          ) : filters.viewMode === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredProperties.map((p, i) => (
                <div key={p.id} style={{ animation: `apFadeUp 0.35s ease-out both`, animationDelay: `${Math.min(i * 0.03, 0.4)}s` }}>
                  <ListCard property={p} onLike={fetchProperties} />
                </div>
              ))}
            </div>
          ) : null}

          {/* Recommendations */}
          {filteredProperties.length > 0 && (
            <div style={{ padding: '40px 0 60px' }}>
              <PropertyRecommendations limit={4} />
            </div>
          )}
        </div>

        {/* Split Map Panel - Simplified for now */}
        {filters.viewMode === 'split' && (
          <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 90px)', borderRadius: 16, overflow: 'hidden', border: '1px solid #eef2f7', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
              <p style={{ color: SLATE, fontSize: 13 }}>Map view coming soon</p>
              <p style={{ color: '#94a3b8', fontSize: 11 }}>{filteredProperties.length} properties available</p>
            </div>
          </div>
        )}
      </div>

      {/* More Filters Drawer */}
      {showMoreFilters && (
        <MoreFiltersDrawer filters={filters} onChange={updateFilters} onReset={resetFilters} onClose={() => setShowMore(false)} resultCount={filteredProperties.length} />
      )}

      <style>{`
        @keyframes apSpin { to { transform: rotate(360deg); } }
        @keyframes apFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        input:focus, select:focus { outline: none !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 460px"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          div[style*="width: 260px"] { width: 120px !important; min-width: 120px !important; }
        }
      `}</style>
    </div>
  );
};

export default AllProperties;