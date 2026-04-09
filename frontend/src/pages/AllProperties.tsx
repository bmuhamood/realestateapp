/**
 * AllProperties.tsx — Bayut-inspired property search results page
 *
 * Key Bayut design patterns implemented:
 *  • Sticky top filter bar with horizontal pill filters
 *    (Location · Type · Price · Beds · More Filters)
 *  • Results count + sort + view toggle in same bar
 *  • Full-width list of property cards (horizontal list view = default like Bayut)
 *  • Gold "Boosted" badge on promoted listings
 *  • "VerifiedUG™" badge (Uganda's TruCheck equivalent)
 *  • Split-screen map toggle (map right, list left)
 *  • Collapsible "More Filters" drawer
 *  • URL-param synced filters
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

// ─── Brand ────────────────────────────────────────────────────────────────────
const RED      = '#e63946';
const RED_BG   = 'rgba(230,57,70,0.07)';
const NAVY     = '#0d1b2e';
const TEAL     = '#25a882';
const PRICE_MAX = 5_000_000_000;

// ─── Leaflet ──────────────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const getMarkerIcon = (type: string) => L.divIcon({
  html: `<div style="background:${type === 'house' ? RED : type === 'land' ? '#10b981' : type === 'commercial' ? '#8b5cf6' : type === 'condo' ? '#f59e0b' : '#3b82f6'};width:13px;height:13px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>`,
  className: 'custom-marker', iconSize: [13, 13], popupAnchor: [0, -7],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);

const fmtShort = (p: number) => {
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)}B`;
  if (p >= 1_000_000)     return `${(p / 1_000_000).toFixed(0)}M`;
  if (p >= 1_000)         return `${(p / 1_000).toFixed(0)}K`;
  return `${p}`;
};

// ─── Filter state ─────────────────────────────────────────────────────────────
interface FilterState {
  search: string; propertyType: string; transactionType: string;
  bedrooms: string; minPrice: number; maxPrice: number;
  sortBy: string; viewMode: 'list' | 'grid' | 'split';
  location?: string;
}

const DEFAULT_FILTERS: FilterState = {
  search: '', propertyType: '', transactionType: '',
  bedrooms: '', minPrice: 0, maxPrice: PRICE_MAX,
  sortBy: 'newest', viewMode: 'grid',
  location: '',
};

function paramsToFilters(params: URLSearchParams): Partial<FilterState> {
  const out: Partial<FilterState> = {};
  const search = params.get('search') || params.get('q') || '';
  const district = params.get('district') || '';
  const location = params.get('location') || '';
  if (search)   out.search = decodeURIComponent(search);
  if (district) out.search = decodeURIComponent(district);
  if (location) out.location = decodeURIComponent(location);
  const type = params.get('type') || params.get('propertyType') || '';
  if (type)  out.propertyType = type;
  const tx = params.get('tx') || params.get('transactionType') || '';
  if (tx)    out.transactionType = tx;
  const beds = params.get('bedrooms') || '';
  if (beds)  out.bedrooms = beds;
  const min = params.get('minPrice');
  if (min)   out.minPrice = Number(min);
  const max = params.get('maxPrice');
  if (max)   out.maxPrice = Number(max);
  const sort = params.get('sort');
  if (sort)  out.sortBy = sort;
  const view = params.get('view');
  if (view === 'list' || view === 'grid' || view === 'split') out.viewMode = view;
  return out;
}

function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search)          p.set('search',   f.search);
  if (f.location)        p.set('location', f.location);
  if (f.propertyType)    p.set('type',     f.propertyType);
  if (f.transactionType) p.set('tx',       f.transactionType);
  if (f.bedrooms)        p.set('bedrooms', f.bedrooms);
  if (f.minPrice > 0)    p.set('minPrice', String(f.minPrice));
  if (f.maxPrice < PRICE_MAX) p.set('maxPrice', String(f.maxPrice));
  if (f.sortBy !== 'newest') p.set('sort', f.sortBy);
  if (f.viewMode !== 'grid') p.set('view', f.viewMode);
  return p;
}

// ─── Map controller ───────────────────────────────────────────────────────────
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
};

// ─── Bayut-style horizontal property card ─────────────────────────────────────
const BayutCard: React.FC<{ property: Property; onLike: () => void }> = ({ property, onLike }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const img = property.images?.find(i => i.is_main)?.image || property.images?.[0]?.image;
  const isBoosted = (property as any).is_boosted;

  return (
    <div
      style={{
        ...bc.card,
        boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      {/* Image */}
      <div style={bc.imgWrap}>
        <img
          src={img || 'https://via.placeholder.com/300x220?text=No+Image'}
          alt={property.title}
          style={{ ...bc.img, transform: hov ? 'scale(1.04)' : 'scale(1)' }}
        />

        {/* Top badges */}
        <div style={bc.topLeft}>
          {isBoosted && (
            <span style={bc.boostedBadge}>⭐ Featured</span>
          )}
          {property.is_verified && (
            <span style={bc.verifiedBadge}>✓ VerifiedUG™</span>
          )}
        </div>

        <div style={bc.topRight}>
          {!property.is_available && <span style={bc.soldBadge}>Sold</span>}
        </div>

        {/* Bottom: tx type */}
        <div style={bc.bottomLeft}>
          <span style={bc.txBadge}>
            {property.transaction_type === 'sale' ? 'For Sale' : property.transaction_type === 'rent' ? 'For Rent' : 'Shortlet'}
          </span>
        </div>

        {/* Bottom right: img count */}
        {property.images?.length > 1 && (
          <div style={bc.imgCount}>📷 {property.images.length}</div>
        )}

        {/* Like */}
        <button
          style={bc.likeBtn}
          onClick={e => { e.stopPropagation(); onLike(); }}
        >
          {property.is_liked ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Content */}
      <div style={bc.body}>
        <div style={bc.priceRow}>
          <div style={bc.price}>
            {fmtPrice(property.price)}
            {property.transaction_type === 'rent' && <span style={bc.perMonth}>/mo</span>}
          </div>
          <div style={bc.viewsChip}>👁 {property.views_count?.toLocaleString()}</div>
        </div>

        <h3 style={bc.title}>{property.title}</h3>

        <div style={bc.location}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10.5" r="3" />
          </svg>
          {property.district}, {property.city}
        </div>

        {/* Features */}
        <div style={bc.features}>
          {property.property_type !== 'land' && (
            <>
              <div style={bc.feat}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M2 4v16M22 4v16M2 8h20M2 16h20" /></svg>
                {property.bedrooms} Beds
              </div>
              <span style={bc.featDot} />
              <div style={bc.feat}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M9 6 L4 6 L4 19 L20 19 L20 14" /><path d="M12 14c0-2.21-1.79-4-4-4" /></svg>
                {property.bathrooms} Baths
              </div>
              <span style={bc.featDot} />
            </>
          )}
          <div style={bc.feat}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
            {property.square_meters} m²
          </div>
          <span style={bc.featDot} />
          <div style={bc.feat}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <span style={{ textTransform: 'capitalize' }}>{property.property_type}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={bc.footer}>
          <div style={bc.agentRow}>
            <div style={bc.agentAvatar}>
              {property.owner?.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span style={bc.agentName}>
              {property.owner?.first_name || property.owner?.username || 'Agent'}
              {property.owner?.is_verified && <span style={bc.agentVerified}> ✓</span>}
            </span>
          </div>
          <button
            style={bc.contactBtn}
            onClick={e => { e.stopPropagation(); navigate(`/property/${property.id}`); }}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

const bc: Record<string, React.CSSProperties> = {
  card:       { display: 'flex', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid #eef2f7', transition: 'all 0.22s', animation: 'apFadeUp 0.38s ease-out both' },
  imgWrap:    { position: 'relative', width: 280, minWidth: 280, flexShrink: 0, overflow: 'hidden' },
  img:        { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s', display: 'block' },
  topLeft:    { position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 2 },
  topRight:   { position: 'absolute', top: 10, right: 44, zIndex: 2 },
  bottomLeft: { position: 'absolute', bottom: 10, left: 10, zIndex: 2 },
  boostedBadge:  { backgroundColor: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, boxShadow: '0 2px 6px rgba(245,158,11,0.4)', display: 'block' },
  verifiedBadge: { backgroundColor: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, display: 'block' },
  soldBadge:     { backgroundColor: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, display: 'block' },
  txBadge:    { backgroundColor: 'rgba(13,27,46,0.72)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  imgCount:   { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 12, zIndex: 2 },
  likeBtn:    { position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' },
  body:       { flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 },
  priceRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  price:      { fontSize: 20, fontWeight: 900, color: RED, fontFamily: "'Sora', sans-serif", lineHeight: 1 },
  perMonth:   { fontSize: 13, color: '#94a3b8', fontWeight: 400, marginLeft: 3 },
  viewsChip:  { fontSize: 11, color: '#94a3b8', flexShrink: 0 },
  title:      { margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  location:   { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' },
  features:   { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid #f1f5f9' },
  feat:       { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 500 },
  featDot:    { width: 3, height: 3, borderRadius: '50%', backgroundColor: '#d1d5db' },
  footer:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f1f5f9' },
  agentRow:   { display: 'flex', alignItems: 'center', gap: 7 },
  agentAvatar:{ width: 28, height: 28, borderRadius: '50%', backgroundColor: RED_BG, border: `1.5px solid ${RED}`, color: RED, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  agentName:  { fontSize: 12, color: '#64748b', fontWeight: 500 },
  agentVerified: { color: TEAL },
  contactBtn: { padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${RED}`, backgroundColor: RED_BG, color: RED, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
};

// ─── More Filters drawer ──────────────────────────────────────────────────────
const MoreFilters: React.FC<{
  filters: FilterState;
  onChange: (p: Partial<FilterState>) => void;
  onReset: () => void;
  onClose: () => void;
}> = ({ filters, onChange, onReset, onClose }) => (
  <>
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={onClose} />
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, backgroundColor: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', animation: 'apSlideRight 0.25s ease-out' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY }}>More Filters</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', padding: 4 }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Location Filter */}
        <div style={{ marginBottom: 24 }}>
          <div style={mf.sectionLabel}>Location</div>
          <input
            type="text"
            placeholder="City or district..."
            value={filters.location || ''}
            onChange={(e) => onChange({ location: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #eef2f7',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>

        {/* Property Type */}
        <div style={{ marginBottom: 24 }}>
          <div style={mf.sectionLabel}>Property Type</div>
          <div style={mf.chipGrid}>
            {[
              { value: '', label: 'All', icon: '🏠' },
              { value: 'house', label: 'House', icon: '🏡' },
              { value: 'apartment', label: 'Apartment', icon: '🏢' },
              { value: 'land', label: 'Land', icon: '🌾' },
              { value: 'commercial', label: 'Commercial', icon: '🏭' },
              { value: 'condo', label: 'Condo', icon: '🏙️' },
            ].map(o => (
              <button key={o.value} onClick={() => onChange({ propertyType: o.value })}
                style={{ ...mf.chip, ...(filters.propertyType === o.value ? mf.chipActive : {}) }}>
                {o.icon} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listing Type */}
        <div style={{ marginBottom: 24 }}>
          <div style={mf.sectionLabel}>Listing Type</div>
          <div style={mf.chipGrid}>
            {[
              { value: '', label: 'All' },
              { value: 'sale', label: 'For Sale' },
              { value: 'rent', label: 'For Rent' },
              { value: 'shortlet', label: 'Shortlet' },
            ].map(o => (
              <button key={o.value} onClick={() => onChange({ transactionType: o.value })}
                style={{ ...mf.chip, ...(filters.transactionType === o.value ? mf.chipActive : {}) }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bedrooms */}
        <div style={{ marginBottom: 24 }}>
          <div style={mf.sectionLabel}>Bedrooms</div>
          <div style={mf.chipGrid}>
            {[
              { value: '', label: 'Any' },
              { value: '1', label: '1+' }, { value: '2', label: '2+' },
              { value: '3', label: '3+' }, { value: '4', label: '4+' }, { value: '5', label: '5+' },
            ].map(o => (
              <button key={o.value} onClick={() => onChange({ bedrooms: o.value })}
                style={{ ...mf.chip, ...(filters.bedrooms === o.value ? mf.chipActive : {}) }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 24 }}>
          <div style={mf.sectionLabel}>Max Price</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: RED, marginBottom: 10 }}>
            {filters.maxPrice >= PRICE_MAX ? 'No limit' : `UGX ${fmtShort(filters.maxPrice)}`}
          </div>
          <input type="range" min={0} max={PRICE_MAX} step={100_000} value={filters.maxPrice}
            onChange={e => onChange({ maxPrice: Number(e.target.value) })}
            style={{ width: '100%', accentColor: RED }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
            <span>UGX 0</span><span>UGX 5B</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={onReset} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Reset All
        </button>
        <button onClick={onClose} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(230,57,70,0.28)' }}>
          Show Results
        </button>
      </div>
    </div>
  </>
);

const mf: Record<string, React.CSSProperties> = {
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  chipGrid:     { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip:         { padding: '8px 14px', borderRadius: 20, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' },
  chipActive:   { backgroundColor: RED_BG, borderColor: RED, color: RED, fontWeight: 700 },
};

// ─── Pill filter button ───────────────────────────────────────────────────────
const PillFilter: React.FC<{
  label: string;
  active?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ label, active, onClick, children }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 30,
    border: `1.5px solid ${active ? RED : '#e2e8f0'}`,
    backgroundColor: active ? RED_BG : '#fff',
    color: active ? RED : '#475569',
    fontSize: 13, fontWeight: active ? 700 : 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit', transition: 'all 0.15s',
    boxShadow: active ? '0 2px 8px rgba(230,57,70,0.15)' : 'none',
  }}>
    {children || label}
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.6 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AllProperties: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [properties, setProperties]         = useState<Property[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [filters, setFilters]               = useState<FilterState>(DEFAULT_FILTERS);
  const [showMoreFilters, setShowMore]      = useState(false);
  const [searchInput, setSearchInput]       = useState('');
  const [locationInput, setLocationInput]   = useState('');
  const [allLocations, setAllLocations]     = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [mapCenter, setMapCenter]           = useState<[number, number]>([0.3136, 32.5811]);
  const [mapZoom, setMapZoom]               = useState(12);
  const [selectedProp, setSelectedProp]     = useState<Property | null>(null);
  const isFirstMount = useRef(true);
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── URL → filters on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = paramsToFilters(params);
    setFilters(prev => ({ ...prev, ...fromUrl }));
    setSearchInput(fromUrl.search || '');
    setLocationInput(fromUrl.location || '');
  }, []);

  // ── URL changes externally ──────────────────────────────────────────────────
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    const params = new URLSearchParams(location.search);
    const fromUrl = paramsToFilters(params);
    setFilters(prev => ({ ...prev, ...DEFAULT_FILTERS, ...fromUrl }));
    setSearchInput(fromUrl.search || '');
    setLocationInput(fromUrl.location || '');
  }, [location.search]);

  // ── Filters → URL (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => {
      const params = filtersToParams(filters);
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      if (location.search !== newSearch) navigate(`/properties${newSearch}`, { replace: true });
    }, 300);
    return () => { if (syncRef.current) clearTimeout(syncRef.current); };
  }, [filters, navigate, location.search]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProperties = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/properties/');
      setProperties(res.data.results ?? res.data);
    } catch {
      setError('Failed to load properties. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const updateFilters = useCallback(
    (partial: Partial<FilterState>) => setFilters(prev => ({ ...prev, ...partial })), []
  );
  const resetFilters = useCallback(() => {
    setFilters(prev => ({ ...DEFAULT_FILTERS, viewMode: prev.viewMode }));
    setSearchInput('');
    setLocationInput('');
  }, []);

  // ── Filtered list with boosted first and location filter ──────────────────
  const filteredProperties = useMemo(() => {
    const q = filters.search.toLowerCase();
    const loc = filters.location?.toLowerCase() || '';
    
    let list = properties.filter(p => {
      const mSearch = !q || p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.district?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      const mLocation = !loc || p.city?.toLowerCase().includes(loc) || p.district?.toLowerCase().includes(loc);
      const mT = !filters.propertyType    || p.property_type    === filters.propertyType;
      const mX = !filters.transactionType || p.transaction_type === filters.transactionType;
      const mB = !filters.bedrooms        || p.bedrooms >= parseInt(filters.bedrooms);
      const mP = p.price >= filters.minPrice && p.price <= filters.maxPrice;
      return mSearch && mLocation && mT && mX && mB && mP;
    });
    
    const sorts: Record<string, (a: Property, b: Property) => number> = {
      price_low:  (a, b) => a.price - b.price,
      price_high: (a, b) => b.price - a.price,
      views:      (a, b) => b.views_count - a.views_count,
      newest:     (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    };
    const fn = sorts[filters.sortBy] ?? sorts.newest;
    const boosted = list.filter(p => (p as any).is_boosted).sort(fn);
    const normal  = list.filter(p => !(p as any).is_boosted).sort(fn);
    return [...boosted, ...normal];
  }, [properties, filters]);

  const hasActive = useMemo(() => {
    const { viewMode: _v, sortBy: _s, ...f }  = filters;
    const { viewMode: _v2, sortBy: _s2, ...d } = DEFAULT_FILTERS;
    return JSON.stringify(f) !== JSON.stringify(d);
  }, [filters]);

  const activeTxLabel = filters.transactionType === 'sale' ? 'Buy' : filters.transactionType === 'rent' ? 'Rent' : filters.transactionType === 'shortlet' ? 'Shortlet' : '';

  const handleLocationSelect = (loc: string) => {
    setLocationInput(loc);
    updateFilters({ location: loc });
    setShowLocationDropdown(false);
  };

  if (loading) return (
    <div style={s.fullCenter}>
      <div style={s.spinner} />
      <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Discovering properties…</p>
    </div>
  );

  if (error) return (
    <div style={s.fullCenter}>
      <p style={{ color: '#ef4444', marginBottom: 14 }}>{error}</p>
      <button onClick={fetchProperties} style={s.retryBtn}>Try again</button>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ══ BAYUT-STYLE STICKY FILTER BAR ════════════════════════════════════ */}
      <div style={s.filterBar}>
        <div style={s.filterBarInner}>

          {/* Location Search Pill - NEW */}
          <div style={{ ...s.searchPill, minWidth: 200, position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10.5" r="3" />
            </svg>
            <input
              type="text"
              placeholder="Location (City/District)"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => setShowLocationDropdown(true)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  updateFilters({ location: locationInput });
                  setShowLocationDropdown(false);
                }
              }}
              style={s.searchPillInput}
            />
            {locationInput && (
              <button onClick={() => { setLocationInput(''); updateFilters({ location: '' }); }} style={s.pillClear}>✕</button>
            )}
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
                  .filter(loc => loc.toLowerCase().includes(locationInput.toLowerCase()))
                  .slice(0, 10)
                  .map(loc => (
                    <div
                      key={loc}
                      onClick={() => handleLocationSelect(loc)}
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
                      📍 {loc}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Search input */}
          <div style={s.searchPill}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Area, community, property name…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') updateFilters({ search: searchInput }); }}
              style={s.searchPillInput}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); updateFilters({ search: '' }); }} style={s.pillClear}>✕</button>
            )}
            <button onClick={() => updateFilters({ search: searchInput })} style={s.pillSearchBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>

          {/* Pill filters */}
          <div style={s.pillRow}>
            {/* Purpose */}
            <PillFilter
              label="Purpose"
              active={!!filters.transactionType}
              onClick={() => {
                const next = filters.transactionType === '' ? 'sale' : filters.transactionType === 'sale' ? 'rent' : filters.transactionType === 'rent' ? 'shortlet' : '';
                updateFilters({ transactionType: next });
              }}
            >
              {activeTxLabel || 'Purpose'} <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </PillFilter>

            {/* Property Type */}
            <PillFilter
              label="Type"
              active={!!filters.propertyType}
              onClick={() => setShowMore(true)}
            >
              {filters.propertyType
                ? <span style={{ textTransform: 'capitalize' }}>{filters.propertyType}</span>
                : 'Property Type'
              }
              {' '}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </PillFilter>

            {/* Beds */}
            <PillFilter label="Beds" active={!!filters.bedrooms} onClick={() => setShowMore(true)}>
              {filters.bedrooms ? `${filters.bedrooms}+ Beds` : 'Beds'}
              {' '}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </PillFilter>

            {/* Price */}
            <PillFilter label="Price" active={filters.maxPrice < PRICE_MAX} onClick={() => setShowMore(true)}>
              {filters.maxPrice < PRICE_MAX ? `≤ UGX ${fmtShort(filters.maxPrice)}` : 'Price'}
              {' '}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </PillFilter>

            {/* More Filters */}
            <button onClick={() => setShowMore(true)} style={s.moreFiltersBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
              </svg>
              More Filters
              {hasActive && <span style={s.activeFilterDot} />}
            </button>

            {/* Clear all */}
            {hasActive && (
              <button onClick={resetFilters} style={s.clearAllPill}>
                ✕ Clear all
              </button>
            )}
          </div>

          {/* Right: count + sort + view */}
          <div style={s.rightControls}>
            <span style={s.resultCount}>
              <strong style={{ color: NAVY }}>{filteredProperties.length.toLocaleString()}</strong>
              <span style={{ color: '#94a3b8' }}> results</span>
            </span>

            <select value={filters.sortBy} onChange={e => updateFilters({ sortBy: e.target.value })} style={s.sortSelect}>
              <option value="newest">Newest</option>
              <option value="price_low">Price ↑</option>
              <option value="price_high">Price ↓</option>
              <option value="views">Popular</option>
            </select>

            {/* View toggle */}
            <div style={s.viewToggle}>
              {(['grid', 'list', 'split'] as const).map((mode) => (
                <button
                  key={mode}
                  title={`${mode} view`}
                  onClick={() => updateFilters({ viewMode: mode })}
                  style={{
                    ...s.viewBtn,
                    backgroundColor: filters.viewMode === mode ? RED : 'transparent',
                    color: filters.viewMode === mode ? '#fff' : '#64748b',
                  }}
                >
                  {mode === 'grid' ? '⊞' : mode === 'list' ? '≡' : '⊟'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <div style={{
        ...s.contentWrap,
        gridTemplateColumns: filters.viewMode === 'split' ? '1fr 480px' : '1fr',
      }}>

        {/* Property list / grid */}
        <div style={s.listArea}>
          {/* Context header */}
          <div style={s.contextHeader}>
            <div>
              <h1 style={s.contextTitle}>
                {filteredProperties.length.toLocaleString()} {' '}
                {filters.propertyType ? `${filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1)}s` : 'Properties'}
                {filters.transactionType ? ` for ${filters.transactionType === 'sale' ? 'Sale' : filters.transactionType === 'rent' ? 'Rent' : 'Shortlet'}` : ''}
                {filters.location ? ` in ${filters.location}` : filters.search ? ` in ${filters.search}` : ' in Uganda'}
              </h1>
              {hasActive && (
                <p style={s.contextSub}>
                  {[
                    filters.location && `📍 ${filters.location}`,
                    filters.propertyType && `Type: ${filters.propertyType}`,
                    filters.bedrooms && `${filters.bedrooms}+ bedrooms`,
                    filters.maxPrice < PRICE_MAX && `≤ UGX ${fmtShort(filters.maxPrice)}`,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🏚️</div>
              <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif" }}>No properties found</h3>
              <p style={{ margin: '0 0 22px', color: '#94a3b8', fontSize: 14 }}>
                {hasActive ? 'Try broadening your search criteria' : 'No listings available yet'}
              </p>
              {hasActive && (
                <button onClick={resetFilters} style={s.emptyBtn}>Clear all filters</button>
              )}
            </div>
          ) : filters.viewMode === 'grid' ? (
            <div style={s.gridWrap}>
              {filteredProperties.map((p, i) => (
                <div key={p.id} className="prop-entry" style={{ animationDelay: `${i * 0.03}s` }}>
                  <PropertyCard property={p} onLike={fetchProperties} variant="vertical" />
                </div>
              ))}
            </div>
          ) : (
            <div style={s.listWrap}>
              {filteredProperties.map((p, i) => (
                <div key={p.id} className="prop-entry" style={{ animationDelay: `${i * 0.025}s` }}>
                  <BayutCard property={p} onLike={fetchProperties} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Split map panel */}
        {filters.viewMode === 'split' && (
          <div style={s.splitMap}>
            <MapContainer center={[0.3136, 32.5811]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <MapController center={mapCenter} zoom={mapZoom} />
              {filteredProperties.map(p => (
                <Marker key={p.id} position={[p.latitude, p.longitude]} icon={getMarkerIcon(p.property_type)}
                  eventHandlers={{ click: () => { setMapCenter([p.latitude, p.longitude]); setMapZoom(15); setSelectedProp(p); } }}>
                  <Popup>
                    <div style={{ padding: 6 }}>
                      <div style={{ fontWeight: 800, color: RED, fontSize: 14 }}>{fmtPrice(p.price)}</div>
                      <div style={{ fontSize: 12, color: NAVY, fontWeight: 600, marginTop: 2 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.district}</div>
                      <button onClick={() => navigate(`/property/${p.id}`)} style={{ marginTop: 8, padding: '4px 12px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', width: '100%' }}>
                        View →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div style={s.mapPill}>
              <span style={{ color: TEAL }}>●</span> Live Map · {filteredProperties.length}
            </div>
            {selectedProp && (
              <div style={s.mapSelectedCard}>
                <button onClick={() => setSelectedProp(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', zIndex: 10, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                <PropertyCard property={selectedProp} variant="horizontal" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {filteredProperties.length > 0 && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px 60px' }}>
          <PropertyRecommendations limit={4} />
        </div>
      )}

      {/* More Filters drawer */}
      {showMoreFilters && (
        <MoreFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          onClose={() => setShowMore(false)}
        />
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 },
  fullCenter:{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinner:   { width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'apSpin 0.7s linear infinite' },
  retryBtn:  { padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  filterBar: {
    position: 'sticky', top: 0, zIndex: 200,
    backgroundColor: '#fff',
    borderBottom: '1px solid #eef2f7',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  filterBarInner: {
    maxWidth: 1640, margin: '0 auto',
    padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
  },
  searchPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    border: '1.5px solid #eef2f7', borderRadius: 30,
    padding: '0 8px 0 14px', height: 40,
    backgroundColor: '#fafcff', minWidth: 240, flexShrink: 0,
  },
  searchPillInput: { flex: 1, border: 'none', outline: 'none', fontSize: 13, color: NAVY, backgroundColor: 'transparent', fontFamily: 'inherit' },
  pillClear: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, padding: '0 2px' },
  pillSearchBtn: { width: 30, height: 30, borderRadius: '50%', border: 'none', backgroundColor: RED, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  pillRow: { display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 },
  moreFiltersBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 30,
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    color: '#475569', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit', position: 'relative',
  },
  activeFilterDot: { width: 7, height: 7, borderRadius: '50%', backgroundColor: RED, display: 'inline-block', marginLeft: 2 },
  clearAllPill: {
    padding: '8px 14px', borderRadius: 30,
    border: `1.5px solid rgba(230,57,70,0.3)`,
    backgroundColor: RED_BG, color: RED,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  rightControls: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 },
  resultCount: { fontSize: 13, whiteSpace: 'nowrap' },
  sortSelect: { padding: '6px 12px', borderRadius: 20, border: '1.5px solid #eef2f7', fontSize: 12, color: NAVY, backgroundColor: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 },
  viewToggle: { display: 'flex', gap: 2, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 },
  viewBtn:    { width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', fontFamily: 'inherit' },

  contentWrap: { display: 'grid', maxWidth: 1640, margin: '0 auto', padding: '20px 20px 0', gap: 16, alignItems: 'start' },
  listArea:    { minWidth: 0 },

  contextHeader: { marginBottom: 18 },
  contextTitle:  { fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1rem, 2vw, 1.35rem)', fontWeight: 800, color: NAVY, margin: '0 0 4px' },
  contextSub:    { fontSize: 13, color: '#94a3b8', margin: 0 },

  listWrap:  { display: 'flex', flexDirection: 'column', gap: 14 },
  gridWrap:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },

  empty:    { textAlign: 'center', padding: '80px 24px', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7' },
  emptyBtn: { padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },

  splitMap: { position: 'sticky', top: 80, height: 'calc(100vh - 90px)', borderRadius: 16, overflow: 'hidden', border: '1px solid #eef2f7', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  mapPill:  { position: 'absolute', top: 14, left: 14, zIndex: 900, backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 30, fontSize: 12, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' },
  mapSelectedCard: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.16)', zIndex: 1000 },
};

// ─── Global styles ────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'all-props-v2';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes apSpin     { to { transform: rotate(360deg); } }
      @keyframes apSlideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      .prop-entry { animation: apFadeUp 0.38s ease-out both; }
      @keyframes apFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

      button[style*="contactBtn"]:hover { background-color: ${RED} !important; color: #fff !important; }
      button[style*="pillSearchBtn"]:hover { background-color: #c1121f !important; }
      button:not([style*="backgroundColor: rgb(230, 57, 70)"]):hover { opacity: 0.88; }
      div[style*="imgWrap"]:hover img { transform: scale(1.06) !important; }

      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

      input:focus, select:focus { outline: none !important; }

      @media (max-width: 900px) {
        div[style*="gridTemplateColumns: 1fr 480px"] { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(el);
  }
}

export default AllProperties;