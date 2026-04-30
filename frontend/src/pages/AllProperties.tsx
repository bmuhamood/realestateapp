/**
 * AllProperties.tsx — Metro Properties search results page
 * FULLY FIXED: all filters work, fast UI, proper home page search integration,
 * debounced inputs, dropdown race condition fixed, URL sync correct
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { Property } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import PropertyRecommendations from '../components/Recommendations/PropertyRecommendations';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  red:     '#e63946',
  redDark: '#c1121f',
  redBg:   'rgba(230,57,70,0.08)',
  navy:    '#0d1b2e',
  teal:    '#25a882',
  slate:   '#475569',
  muted:   '#94a3b8',
  border:  '#eef2f7',
  bg:      '#f4f7fb',
  white:   '#ffffff',
} as const;

const PRICE_MAX = 5_000_000_000;
const FONT = "'DM Sans', 'Sora', system-ui, sans-serif";

// ─── Leaflet setup ────────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const makeMarkerIcon = (type: string) => L.divIcon({
  html: `<div style="
    background:${type==='house'?C.red:type==='land'?'#10b981':type==='commercial'?'#8b5cf6':type==='condo'?'#f59e0b':'#3b82f6'};
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
// Reads ALL possible param names that HomeScreen might send
function urlToFilters(params: URLSearchParams): Partial<Filters> {
  const out: Partial<Filters> = {};

  // search / keyword
  const search = params.get('search') || params.get('q') || params.get('keyword') || '';
  if (search) out.search = decodeURIComponent(search);

  // location — HomeScreen sends 'location', 'district', or 'city'
  const location = params.get('location') || params.get('district') || params.get('city') || '';
  if (location) out.location = decodeURIComponent(location);

  // property type — HomeScreen sends 'property_type' OR 'type'
  const type = params.get('type') || params.get('propertyType') || params.get('property_type') || '';
  if (type) out.propertyType = type;

  // transaction type — HomeScreen sends 'transaction_type' OR 'tx'
  const tx = params.get('tx') || params.get('transactionType') || params.get('transaction_type') || '';
  if (tx) out.transactionType = tx;

  const beds = params.get('bedrooms') || '';
  if (beds) out.bedrooms = beds;

  const min = params.get('minPrice') || params.get('min_price') || '';
  if (min) out.minPrice = Number(min);

  const max = params.get('maxPrice') || params.get('max_price') || '';
  if (max) out.maxPrice = Number(max);

  const sort = params.get('sort') || params.get('ordering') || '';
  // Map Django ordering values to our sortBy values
  if (sort) {
    if (sort === '-created_at') out.sortBy = 'newest';
    else if (sort === 'price')  out.sortBy = 'price_low';
    else if (sort === '-price') out.sortBy = 'price_high';
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

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ mode: 'list'|'grid' }> = ({ mode }) => {
  const isGrid = mode === 'grid';
  return (
    <div style={{ display: 'flex', flexDirection: isGrid ? 'column' : 'row', backgroundColor: C.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      <div style={{ width: isGrid ? '100%' : 240, height: isGrid ? 180 : '100%', minHeight: isGrid ? 0 : 160, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 20, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: '60%' }} />
        <div style={{ height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: '85%' }} />
        <div style={{ height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: '45%' }} />
      </div>
    </div>
  );
};

// ─── Horizontal list card ─────────────────────────────────────────────────────
const ListCard: React.FC<{ property: Property; onLike: () => void }> = ({ property, onLike }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const getCloudinaryUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.includes('/')) {
      const cloudName = 'drcy2xxkg';
      return `https://res.cloudinary.com/${cloudName}/${url}`;
    }
    return url;
  };

  const img = (() => {
    const mainImg = property.images?.find(i => i.is_main);
    const firstImg = property.images?.[0];
    const rawUrl = mainImg?.image_url || mainImg?.image || firstImg?.image_url || firstImg?.image;
    return getCloudinaryUrl(rawUrl);
  })();

  const isBoosted = (property as any).is_boosted;

  return (
    <div
      onClick={() => navigate(`/property/${property.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
        cursor: 'pointer', transition: 'all 0.2s ease',
        border: `1.5px solid ${hov ? C.red + '40' : C.border}`,
        boxShadow: hov ? '0 12px 36px rgba(13,27,46,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Image panel */}
      <div style={{ position: 'relative', width: 260, minWidth: 260, flexShrink: 0, overflow: 'hidden' }}>
        <img
          src={img || 'https://via.placeholder.com/300x220?text=No+Image'}
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s', transform: hov ? 'scale(1.06)' : 'scale(1)' }}
        />
        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 2 }}>
          {isBoosted && <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }}>⭐ Featured</span>}
          {property.is_verified && <span style={{ background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>✓ VerifiedUG™</span>}
        </div>
        {!property.is_available && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <span style={{ background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 14, padding: '6px 16px', borderRadius: 20 }}>SOLD</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2 }}>
          <span style={{ background: 'rgba(13,27,46,0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
            {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'}
          </span>
        </div>
        {(property.images?.length ?? 0) > 1 && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 12, zIndex: 2 }}>
            📷 {property.images.length}
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onLike(); }}
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
          {property.is_liked ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Content panel */}
      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.red, fontFamily: "'Sora', sans-serif", lineHeight: 1.1 }}>
              {fmtPrice(property.price)}
              {property.transaction_type === 'rent' && <span style={{ fontSize: 13, color: C.muted, fontWeight: 400, marginLeft: 4 }}>/mo</span>}
            </div>
          </div>
          <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>👁 {(property.views_count ?? 0).toLocaleString()}</span>
        </div>

        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {property.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.muted }}>
          📍 {[property.district, property.city].filter(Boolean).join(', ')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {property.property_type !== 'land' && (
            <>
              <span style={{ fontSize: 12, color: C.slate, fontWeight: 500 }}>🛏 {property.bedrooms ?? '—'} Beds</span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span style={{ fontSize: 12, color: C.slate, fontWeight: 500 }}>🚿 {property.bathrooms ?? '—'} Baths</span>
              <span style={{ color: '#d1d5db' }}>·</span>
            </>
          )}
          <span style={{ fontSize: 12, color: C.slate, fontWeight: 500 }}>📐 {property.square_meters} m²</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ fontSize: 12, color: C.slate, fontWeight: 500, textTransform: 'capitalize' }}>🏠 {property.property_type}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.redBg, border: `1.5px solid ${C.red}`, color: C.red, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {property.owner?.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.navy, fontWeight: 600 }}>
                {property.owner?.first_name || property.owner?.username || 'Agent'}
                {property.owner?.is_verified && <span style={{ color: C.teal }}> ✓</span>}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>Listed by</div>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/property/${property.id}`); }}
            onMouseEnter={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.color = C.red; }}
            style={{ padding: '8px 18px', borderRadius: 9, border: `1.5px solid ${C.red}`, background: C.redBg, color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Filters drawer ───────────────────────────────────────────────────────────
const FiltersDrawer: React.FC<{
  filters: Filters;
  onChange: (p: Partial<Filters>) => void;
  onReset: () => void;
  onClose: () => void;
  count: number;
}> = ({ filters, onChange, onReset, onClose, count }) => {
  // Local price state so slider doesn't cause lag
  const [localMax, setLocalMax] = useState(filters.maxPrice);
  const priceTimer = useRef<any>(null);

  const handlePriceSlider = (val: number) => {
    setLocalMax(val);
    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => onChange({ maxPrice: val }), 150);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.45)', backdropFilter: 'blur(3px)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, background: C.white, zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', animation: 'slideInRight 0.25s ease-out' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: C.navy }}>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: C.white }}>Filter Properties</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{count} matching</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: C.white, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          <DrawerSection label="Purpose">
            <ChipRow
              options={[{ v: '', l: 'All' }, { v: 'sale', l: 'For Sale' }, { v: 'rent', l: 'For Rent' }, { v: 'shortlet', l: 'Shortlet' }]}
              value={filters.transactionType}
              onChange={v => onChange({ transactionType: v })}
            />
          </DrawerSection>

          <DrawerSection label="Property Type">
            <ChipRow
              options={[
                { v: '', l: 'All Types' }, { v: 'house', l: '🏡 House' }, { v: 'apartment', l: '🏢 Apartment' },
                { v: 'land', l: '🌾 Land' }, { v: 'commercial', l: '🏭 Commercial' },
                { v: 'condo', l: '🏙 Condo' }, { v: 'villa', l: '🏰 Villa' },
              ]}
              value={filters.propertyType}
              onChange={v => onChange({ propertyType: v })}
            />
          </DrawerSection>

          <DrawerSection label="Bedrooms">
            <ChipRow
              options={[{ v: '', l: 'Any' }, { v: '1', l: '1+' }, { v: '2', l: '2+' }, { v: '3', l: '3+' }, { v: '4', l: '4+' }, { v: '5', l: '5+' }]}
              value={filters.bedrooms}
              onChange={v => onChange({ bedrooms: v })}
            />
          </DrawerSection>

          <DrawerSection label="Price Range">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: C.red, fontFamily: "'Sora',sans-serif" }}>
                {localMax >= PRICE_MAX ? '∞' : `UGX ${fmtShort(localMax)}`}
              </span>
              <span style={{ fontSize: 12, color: C.muted, alignSelf: 'flex-end' }}>max price</span>
            </div>
            <input type="range" min={0} max={PRICE_MAX} step={5_000_000} value={localMax} onChange={e => handlePriceSlider(Number(e.target.value))} style={{ width: '100%', accentColor: C.red, height: 4, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginTop: 6 }}>
              <span>UGX 0</span><span>UGX 5B</span>
            </div>
            {/* Quick picks */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {[50e6, 100e6, 200e6, 500e6, 1e9, PRICE_MAX].map(v => {
                const isActive = v === PRICE_MAX ? localMax >= PRICE_MAX : Math.abs(localMax - v) < 1000;
                return (
                  <button
                    key={v}
                    onClick={() => { setLocalMax(v); onChange({ maxPrice: v }); }}
                    style={{ padding: '5px 10px', borderRadius: 16, border: `1.5px solid ${isActive ? C.red : C.border}`, background: isActive ? C.redBg : C.white, color: isActive ? C.red : C.slate, fontSize: 11, fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
                  >
                    {v >= PRICE_MAX ? 'No limit' : `≤ ${fmtShort(v)}`}
                  </button>
                );
              })}
            </div>
          </DrawerSection>

          <DrawerSection label="Min Price">
            <input
              type="number"
              placeholder="Minimum price (UGX)"
              value={filters.minPrice || ''}
              onChange={e => onChange({ minPrice: Number(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: C.navy }}
            />
          </DrawerSection>

          <DrawerSection label="Sort By">
            <ChipRow
              options={[{ v: 'newest', l: '🕐 Newest' }, { v: 'price_low', l: '💰 Price ↑' }, { v: 'price_high', l: '💰 Price ↓' }, { v: 'views', l: '🔥 Popular' }]}
              value={filters.sortBy}
              onChange={v => onChange({ sortBy: v })}
            />
          </DrawerSection>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onReset} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Reset
          </button>
          <button onClick={onClose} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: C.red, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(230,57,70,0.3)' }}>
            Show {count} Results
          </button>
        </div>
      </div>
    </>
  );
};

const DrawerSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{label}</div>
    {children}
  </div>
);

const ChipRow: React.FC<{ options: { v: string; l: string }[]; value: string; onChange: (v: string) => void }> = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {options.map(o => (
      <button
        key={o.v}
        onClick={() => onChange(o.v)}
        style={{
          padding: '8px 16px', borderRadius: 22,
          border: `1.5px solid ${value === o.v ? C.red : C.border}`,
          background: value === o.v ? C.redBg : C.white,
          color: value === o.v ? C.red : C.slate,
          fontSize: 13, fontWeight: value === o.v ? 700 : 500,
          cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit',
        }}
      >
        {o.l}
      </button>
    ))}
  </div>
);

// ─── Active filter pills row ──────────────────────────────────────────────────
const ActivePills: React.FC<{ filters: Filters; onChange: (p: Partial<Filters>) => void; onReset: () => void }> = ({ filters, onChange, onReset }) => {
  const tags: { label: string; clear: () => void }[] = [];
  if (filters.transactionType) tags.push({ label: filters.transactionType === 'sale' ? 'For Sale' : filters.transactionType === 'rent' ? 'For Rent' : 'Shortlet', clear: () => onChange({ transactionType: '' }) });
  if (filters.propertyType)    tags.push({ label: filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1), clear: () => onChange({ propertyType: '' }) });
  if (filters.bedrooms)        tags.push({ label: `${filters.bedrooms}+ Beds`, clear: () => onChange({ bedrooms: '' }) });
  if (filters.location)        tags.push({ label: `📍 ${filters.location}`, clear: () => onChange({ location: '' }) });
  if (filters.search)          tags.push({ label: `"${filters.search}"`, clear: () => onChange({ search: '' }) });
  if (filters.maxPrice < PRICE_MAX) tags.push({ label: `≤ UGX ${fmtShort(filters.maxPrice)}`, clear: () => onChange({ maxPrice: PRICE_MAX }) });
  if (filters.minPrice > 0)    tags.push({ label: `≥ UGX ${fmtShort(filters.minPrice)}`, clear: () => onChange({ minPrice: 0 }) });

  if (!tags.length) return null;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '10px 20px', background: '#fafbfd', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Active:</span>
      {tags.map(t => (
        <span key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 12px', borderRadius: 18, background: C.redBg, border: `1px solid rgba(230,57,70,0.2)`, color: C.red, fontSize: 12, fontWeight: 600 }}>
          {t.label}
          <button onClick={t.clear} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', fontWeight: 700 }}>×</button>
        </span>
      ))}
      <button onClick={onReset} style={{ padding: '4px 12px', borderRadius: 18, border: `1px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        Clear all ×
      </button>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AllProperties: React.FC = () => {
  const urlLocation = useLocation();
  const navigate    = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filters, setFilters]       = useState<Filters>(DEFAULTS);
  const [showDrawer, setShowDrawer] = useState(false);

  // Local controlled inputs (don't update filters on every keystroke — use debounce)
  const [searchVal,   setSearchVal]   = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [showLocDrop, setShowLocDrop] = useState(false);

  const [mapCenter, setMapCenter]  = useState<[number,number]>([0.3136, 32.5811]);
  const [mapZoom, setMapZoom]      = useState(12);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  const locRef         = useRef<HTMLDivElement>(null);
  const searchTimer    = useRef<any>(null);
  const locTimer       = useRef<any>(null);
  const urlSyncTimer   = useRef<any>(null);
  const prevUrlSearch  = useRef('');
  const didMount       = useRef(false);

  // ── Derived location list from loaded properties ────────────────────────────
  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    properties.forEach(p => { if (p.city) set.add(p.city); if (p.district) set.add(p.district); });
    return Array.from(set).sort();
  }, [properties]);

  const filteredLocOpts = useMemo(() =>
    locationOptions.filter(l => l.toLowerCase().includes(locationVal.toLowerCase())).slice(0, 10),
    [locationOptions, locationVal]
  );

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setShowLocDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Read URL params → filters (on mount + external URL change) ─────────────
  useEffect(() => {
    const params  = new URLSearchParams(urlLocation.search);
    const fromUrl = urlToFilters(params);
    const merged  = { ...DEFAULTS, ...fromUrl };
    setFilters(merged);
    setSearchVal(merged.search || '');
    setLocationVal(merged.location || '');
    prevUrlSearch.current = urlLocation.search;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLocation.search]);

  // ── Filters → URL sync (debounced, skip on mount) ─────────────────────────
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    urlSyncTimer.current = setTimeout(() => {
      const params    = filtersToUrl(filters);
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      if (prevUrlSearch.current !== newSearch) {
        prevUrlSearch.current = newSearch;
        navigate(`/properties${newSearch}`, { replace: true });
      }
    }, 300);
    return () => clearTimeout(urlSyncTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ── Fetch all properties ───────────────────────────────────────────────────
  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/properties/', { params: { page_size: 200 } });
      setProperties(res.data.results ?? res.data);
    } catch {
      setError('Could not load properties. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  // ── Filter updater ─────────────────────────────────────────────────────────
  const applyFilter = useCallback((partial: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  }, []);

  const resetAll = useCallback(() => {
    setFilters(prev => ({ ...DEFAULTS, viewMode: prev.viewMode }));
    setSearchVal('');
    setLocationVal('');
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────────
  const onSearchChange = useCallback((val: string) => {
    setSearchVal(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilter({ search: val }), 300);
  }, [applyFilter]);

  // ── Debounced location ─────────────────────────────────────────────────────
  const onLocationChange = useCallback((val: string) => {
    setLocationVal(val);
    setShowLocDrop(true);
    if (locTimer.current) clearTimeout(locTimer.current);
    locTimer.current = setTimeout(() => applyFilter({ location: val }), 300);
  }, [applyFilter]);

  const pickLocation = useCallback((loc: string) => {
    setLocationVal(loc);
    setShowLocDrop(false);
    applyFilter({ location: loc });
  }, [applyFilter]);

  // ── Memoised filtered + sorted list ───────────────────────────────────────
  const filtered = useMemo(() => {
    const q   = filters.search.trim().toLowerCase();
    const loc = filters.location.trim().toLowerCase();

    const list = properties.filter(p => {
      const title   = p.title?.toLowerCase()       ?? '';
      const addr    = p.address?.toLowerCase()     ?? '';
      const dist    = p.district?.toLowerCase()    ?? '';
      const city    = p.city?.toLowerCase()        ?? '';
      const desc    = p.description?.toLowerCase() ?? '';

      const mSearch   = !q   || title.includes(q) || addr.includes(q) || dist.includes(q) || city.includes(q) || desc.includes(q);
      const mLocation = !loc || city.includes(loc) || dist.includes(loc) || addr.includes(loc);
      const mType  = !filters.propertyType    || p.property_type    === filters.propertyType;
      const mTx    = !filters.transactionType || p.transaction_type === filters.transactionType;
      const mBeds  = !filters.bedrooms        || (p.bedrooms ?? 0) >= parseInt(filters.bedrooms);
      const mPrice = (p.price ?? 0) >= filters.minPrice && (p.price ?? 0) <= filters.maxPrice;

      return mSearch && mLocation && mType && mTx && mBeds && mPrice;
    });

    const sortFns: Record<string, (a: Property, b: Property) => number> = {
      price_low:  (a, b) => a.price - b.price,
      price_high: (a, b) => b.price - a.price,
      views:      (a, b) => (b.views_count ?? 0) - (a.views_count ?? 0),
      newest:     (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    };
    const fn = sortFns[filters.sortBy] ?? sortFns.newest;
    const boosted = list.filter(p => (p as any).is_boosted).sort(fn);
    const normal  = list.filter(p => !(p as any).is_boosted).sort(fn);
    return [...boosted, ...normal];
  }, [properties, filters]);

  const hasActive = useMemo(() =>
    !!(filters.search || filters.location || filters.propertyType || filters.transactionType || filters.bedrooms || filters.minPrice > 0 || filters.maxPrice < PRICE_MAX),
    [filters]
  );

  // ─── LOADING UI ────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, marginTop: 64 }}>
      {/* Skeleton filter bar */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center', position: 'sticky', top: 0, zIndex: 200 }}>
        {[200, 280, 100, 100, 100, 100].map((w, i) => (
          <div key={i} style={{ height: 40, width: w, borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        ))}
      </div>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} mode="grid" />)}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, fontFamily: FONT }}>
      <div style={{ fontSize: 56 }}>😕</div>
      <p style={{ color: '#ef4444', fontSize: 15, margin: 0, fontWeight: 600 }}>{error}</p>
      <button onClick={loadProperties} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: C.red, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        Try again
      </button>
    </div>
  );

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, marginTop: 64 }}>

      {/* ══ STICKY FILTER BAR ═════════════════════════════════════════════════ */}
      <div style={{ position: 'sticky', top: 0, zIndex: 300, background: C.white, boxShadow: '0 2px 20px rgba(0,0,0,0.07)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* ── Location input ─────────────────────────────────────────────── */}
          <div ref={locRef} style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${filters.location ? C.red : C.border}`, borderRadius: 10, padding: '0 8px 0 12px', height: 44, background: filters.location ? C.redBg : '#fafcff', minWidth: 185, transition: 'all 0.15s' }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>📍</span>
              <input
                type="text"
                placeholder="Location"
                value={locationVal}
                onChange={e => onLocationChange(e.target.value)}
                onFocus={() => { if (filteredLocOpts.length) setShowLocDrop(true); }}
                onKeyDown={e => { if (e.key === 'Enter') { applyFilter({ location: locationVal }); setShowLocDrop(false); } if (e.key === 'Escape') setShowLocDrop(false); }}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.navy, background: 'transparent', fontFamily: 'inherit', minWidth: 0 }}
              />
              {locationVal && (
                <button onMouseDown={e => { e.preventDefault(); setLocationVal(''); applyFilter({ location: '' }); }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, padding: 0, flexShrink: 0, lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* Location dropdown — uses onMouseDown to beat the blur event */}
            {showLocDrop && filteredLocOpts.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: '100%', background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 400, overflow: 'hidden' }}>
                {filteredLocOpts.map(loc => (
                  <div
                    key={loc}
                    onMouseDown={e => { e.preventDefault(); pickLocation(loc); }}
                    style={{ padding: '11px 16px', cursor: 'pointer', fontSize: 13, color: C.navy, display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: C.red }}>📍</span>
                    <span>{loc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Keyword search ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${filters.search ? C.red : C.border}`, borderRadius: 10, padding: '0 6px 0 12px', height: 44, background: filters.search ? C.redBg : '#fafcff', flex: 1, minWidth: 180, maxWidth: 360, transition: 'all 0.15s' }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🔍</span>
            <input
              type="text"
              placeholder="Search properties…"
              value={searchVal}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyFilter({ search: searchVal }); }}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.navy, background: 'transparent', fontFamily: 'inherit', minWidth: 0 }}
            />
            {searchVal && (
              <button onClick={() => { setSearchVal(''); applyFilter({ search: '' }); }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, padding: 0, flexShrink: 0, lineHeight: 1 }}>×</button>
            )}
          </div>

          {/* ── Quick filter buttons ────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>

            {/* Purpose — inline cycle: All → Sale → Rent → Shortlet */}
            <QuickBtn
              label={filters.transactionType ? (filters.transactionType === 'sale' ? '🏷 For Sale' : filters.transactionType === 'rent' ? '🔑 For Rent' : '🌙 Shortlet') : 'Purpose'}
              active={!!filters.transactionType}
              onClick={() => {
                const cycle: string[] = ['', 'sale', 'rent', 'shortlet'];
                const next = cycle[(cycle.indexOf(filters.transactionType) + 1) % cycle.length];
                applyFilter({ transactionType: next });
              }}
            />

            {/* Type — opens drawer */}
            <QuickBtn
              label={filters.propertyType ? filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1) : 'Type'}
              active={!!filters.propertyType}
              onClick={() => setShowDrawer(true)}
              chevron
            />

            {/* Beds — opens drawer */}
            <QuickBtn
              label={filters.bedrooms ? `${filters.bedrooms}+ Beds` : 'Beds'}
              active={!!filters.bedrooms}
              onClick={() => setShowDrawer(true)}
              chevron
            />

            {/* Price */}
            <QuickBtn
              label={filters.maxPrice < PRICE_MAX ? `≤ ${fmtShort(filters.maxPrice)}` : 'Price'}
              active={filters.maxPrice < PRICE_MAX || filters.minPrice > 0}
              onClick={() => setShowDrawer(true)}
              chevron
            />

            {/* All Filters */}
            <button
              onClick={() => setShowDrawer(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 40, borderRadius: 10, border: `1.5px solid ${hasActive ? C.red : C.border}`, background: hasActive ? C.redBg : C.white, color: hasActive ? C.red : C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', position: 'relative', transition: 'all 0.15s' }}
            >
              ⚙️ Filters
              {hasActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, display: 'inline-block', marginLeft: 2, boxShadow: '0 0 0 2px rgba(230,57,70,0.25)' }} />}
            </button>

            {hasActive && (
              <button onClick={resetAll} style={{ padding: '0 12px', height: 40, borderRadius: 10, border: `1.5px solid #fca5a5`, background: '#fff7f7', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* ── Right controls ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>
              <strong style={{ color: C.navy }}>{filtered.length.toLocaleString()}</strong> results
            </span>

            <select
              value={filters.sortBy}
              onChange={e => applyFilter({ sortBy: e.target.value })}
              style={{ padding: '7px 10px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 12, color: C.navy, background: C.white, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }}
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price ↑</option>
              <option value="price_high">Price ↓</option>
              <option value="views">Popular</option>
            </select>

            <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
              {([['grid','⊞'],['list','≡'],['split','⊟']] as const).map(([m, ic]) => (
                <button
                  key={m}
                  title={`${m} view`}
                  onClick={() => applyFilter({ viewMode: m })}
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', background: filters.viewMode === m ? C.red : 'transparent', color: filters.viewMode === m ? C.white : C.slate }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Active pills row */}
        <ActivePills filters={filters} onChange={applyFilter} onReset={resetAll} />
      </div>

      {/* ══ CONTENT ═══════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: filters.viewMode === 'split' ? '1fr 460px' : '1fr', maxWidth: 1600, margin: '0 auto', padding: '20px 16px 0', gap: 16, alignItems: 'start' }}>

        {/* List / Grid panel */}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1rem,2vw,1.3rem)', fontWeight: 800, color: C.navy, margin: '0 0 4px' }}>
              {filtered.length.toLocaleString()}{' '}
              {filters.propertyType ? filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1) + 's' : 'Properties'}
              {filters.transactionType ? ` for ${filters.transactionType === 'sale' ? 'Sale' : filters.transactionType === 'rent' ? 'Rent' : 'Shortlet'}` : ''}
              {filters.location ? ` in ${filters.location}` : filters.search ? ` · "${filters.search}"` : ' in Uganda'}
            </h1>
            {hasActive && (
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                Showing filtered results ·{' '}
                <button onClick={resetAll} style={{ color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 700 }}>clear all filters</button>
              </p>
            )}
          </div>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: C.white, borderRadius: 18, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🏚️</div>
              <h3 style={{ margin: '0 0 8px', color: C.navy, fontFamily: "'Sora', sans-serif", fontSize: 20 }}>No properties found</h3>
              <p style={{ color: C.muted, fontSize: 14, margin: '0 0 24px', maxWidth: 320, marginInline: 'auto' }}>
                {hasActive ? 'Try adjusting your filters — maybe broaden the location or price range.' : 'No listings available yet. Check back soon!'}
              </p>
              {hasActive && (
                <button onClick={resetAll} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: C.red, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : filters.viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {filtered.map((p, i) => (
                <div key={p.id} style={{ animation: 'fadeUp 0.35s ease-out both', animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}>
                  <PropertyCard property={p} onLike={loadProperties} variant="vertical" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map((p, i) => (
                <div key={p.id} style={{ animation: 'fadeUp 0.32s ease-out both', animationDelay: `${Math.min(i * 0.03, 0.4)}s` }}>
                  <ListCard property={p} onLike={loadProperties} />
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {filtered.length > 0 && (
            <div style={{ padding: '48px 0 60px' }}>
              <PropertyRecommendations limit={4} />
            </div>
          )}
        </div>

        {/* Split map */}
        {filters.viewMode === 'split' && (
          <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 90px)', borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <MapContainer center={[0.3136, 32.5811]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              <FlyTo center={mapCenter} zoom={mapZoom} />
              {filtered.map(p => p.latitude && p.longitude ? (
                <Marker key={p.id} position={[p.latitude, p.longitude]} icon={makeMarkerIcon(p.property_type)}
                  eventHandlers={{ click: () => { setMapCenter([p.latitude, p.longitude]); setMapZoom(15); setSelectedProp(p); } }}>
                  <Popup>
                    <div style={{ padding: 8, minWidth: 160, fontFamily: FONT }}>
                      {/* Add image thumbnail to popup */}
                      {(() => {
                        const imgUrl = (() => {
                          const mainImg = p.images?.find(i => i.is_main);
                          const firstImg = p.images?.[0];
                          const rawUrl = mainImg?.image_url || mainImg?.image || firstImg?.image_url || firstImg?.image;
                          if (!rawUrl) return null;
                          if (rawUrl.startsWith('http')) return rawUrl;
                          return `https://res.cloudinary.com/drcy2xxkg/${rawUrl}`;
                        })();
                        return imgUrl ? (
                          <img src={imgUrl} alt={p.title} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                        ) : null;
                      })()}
                      <div style={{ fontWeight: 900, color: C.red, fontSize: 15 }}>{fmtPrice(p.price)}</div>
                      <div style={{ fontSize: 12, color: C.navy, fontWeight: 700, margin: '3px 0' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{p.district}</div>
                      <button onClick={() => navigate(`/property/${p.id}`)} style={{ marginTop: 8, padding: '6px 0', background: C.red, color: C.white, border: 'none', borderRadius: 7, fontSize: 11, cursor: 'pointer', width: '100%', fontWeight: 700 }}>
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ) : null)}
            </MapContainer>
            <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 900, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 30, fontSize: 12, fontWeight: 700, color: C.navy, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              <span style={{ color: C.teal }}>●</span> Live Map · {filtered.length}
            </div>
            {selectedProp && (
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: C.white, borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.16)', zIndex: 1000, overflow: 'hidden' }}>
                <button onClick={() => setSelectedProp(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', zIndex: 10, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                <PropertyCard property={selectedProp} variant="horizontal" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters drawer */}
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

// ─── Quick button ─────────────────────────────────────────────────────────────
const QuickBtn: React.FC<{ label: string; active: boolean; onClick: () => void; chevron?: boolean }> = ({ label, active, onClick, chevron }) => (
  <button
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: 40, borderRadius: 10, border: `1.5px solid ${active ? C.red : '#e2e8f0'}`, background: active ? C.redBg : C.white, color: active ? C.red : C.slate, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.12s' }}
  >
    {label}
    {chevron && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.6, flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>}
  </button>
);

// ─── Global CSS ───────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'ap-styles-v4';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes spin        { to { transform: rotate(360deg); } }
      @keyframes fadeUp      { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideInRight{ from { transform:translateX(100%); } to { transform:translateX(0); } }
      @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      input:focus, select:focus { outline: none !important; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      @media (max-width: 900px) {
        div[style*="1fr 460px"] { grid-template-columns: 1fr !important; }
        div[style*="width: 260px"], div[style*="width:260px"] { width: 120px !important; min-width: 120px !important; }
      }
    `;
    document.head.appendChild(el);
  }
}

export default AllProperties;
