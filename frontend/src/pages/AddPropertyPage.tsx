// src/pages/AddPropertyPage.tsx - COMPLETE WITH PROPER ERROR HANDLING

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UploadImage } from '../types';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PropertyFormData {
  title: string;
  description: string;
  property_type: string;
  transaction_type: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  square_meters: string;
  address: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
  video_url: string;
  virtual_tour_url: string;
  video_file: File | null;
  neighborhood_name: string;
  neighborhood_description: string;
  distance_to_city_center: string;
  distance_to_airport: string;
  distance_to_highway: string;
  nearby_schools: string;
  distance_to_nearest_school: string;
  school_rating: string;
  nearby_roads: string;
  nearest_road: string;
  public_transport: boolean;
  nearest_bus_stop: string;
  nearest_taxi_stage: string;
  amenities: string[];
  nearest_mall: string;
  distance_to_mall: string;
  nearest_supermarket: string;
  nearest_market: string;
  nearest_pharmacy: string;
  nearest_hospital: string;
  distance_to_hospital: string;
  nearest_restaurant: string;
  nearest_cafe: string;
  nearest_gym: string;
  nearest_park: string;
  year_built: string;
  furnishing_status: string;
  parking_type: string;
  parking_spaces: string;
  rental_frequency: string;
  tenure_type: string;
  property_condition: string;
  ownership_type: string;
  number_of_floors: string;
  floor_number: string;
  year_renovated: string;
  energy_rating: string;
  has_security: boolean;
  has_cctv: boolean;
  has_electric_fence: boolean;
  has_security_lights: boolean;
  has_security_guards: boolean;
  has_gated_community: boolean;
  has_solar: boolean;
  has_backup_generator: boolean;
  has_water_tank: boolean;
  has_borehole: boolean;
  has_internet: boolean;
  has_cable_tv: boolean;
  has_garden: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_swimming_pool: boolean;
  has_playground: boolean;
  has_bbq_area: boolean;
  has_air_conditioning: boolean;
  has_heating: boolean;
  has_fireplace: boolean;
  has_modern_kitchen: boolean;
  has_walk_in_closet: boolean;
  has_study_room: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  has_title_deed: boolean;
  title_deed_number: string;
  land_registration_number: string;
  agent_phone: string;
  agent_email: string;
  viewing_instructions: string;
}

// Add error interface
interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  address?: string;
  city?: string;
  district?: string;
  video_file?: string;
  images?: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const EMPTY_FORM = (user: any): PropertyFormData => ({
  title: '', description: '', property_type: 'house', transaction_type: 'sale',
  price: '', bedrooms: '3', bathrooms: '2', square_meters: '',
  address: '', city: 'Kampala', district: '', latitude: '', longitude: '',
  video_url: '', virtual_tour_url: '', video_file: null,
  neighborhood_name: '', neighborhood_description: '',
  distance_to_city_center: '', distance_to_airport: '', distance_to_highway: '',
  nearby_schools: '', distance_to_nearest_school: '', school_rating: '',
  nearby_roads: '', nearest_road: '', public_transport: false,
  nearest_bus_stop: '', nearest_taxi_stage: '',
  amenities: [], nearest_mall: '', distance_to_mall: '',
  nearest_supermarket: '', nearest_market: '', nearest_pharmacy: '',
  nearest_hospital: '', distance_to_hospital: '',
  nearest_restaurant: '', nearest_cafe: '', nearest_gym: '', nearest_park: '',
  year_built: '', furnishing_status: 'unfurnished', parking_type: 'none', parking_spaces: '1',
  rental_frequency: 'monthly', tenure_type: 'freehold',
  property_condition: 'good', ownership_type: 'freehold',
  number_of_floors: '', floor_number: '', year_renovated: '', energy_rating: '',
  has_security: false, has_cctv: false, has_electric_fence: false,
  has_security_lights: false, has_security_guards: false, has_gated_community: false,
  has_solar: false, has_backup_generator: false, has_water_tank: false,
  has_borehole: false, has_internet: false, has_cable_tv: false,
  has_garden: false, has_balcony: false, has_terrace: false,
  has_swimming_pool: false, has_playground: false, has_bbq_area: false,
  has_air_conditioning: false, has_heating: false, has_fireplace: false,
  has_modern_kitchen: false, has_walk_in_closet: false, has_study_room: false,
  pets_allowed: true, smoking_allowed: true,
  has_title_deed: false, title_deed_number: '', land_registration_number: '',
  agent_phone: user?.phone || '', agent_email: user?.email || '', viewing_instructions: '',
});

// Transaction types that require rental frequency
const RENTAL_TRANSACTION_TYPES = ['rent', 'shortlet', 'lease', 'rent_to_own', 'commercial_lease'];

const PROPERTY_TYPE_TABS = [
  {
    label: 'Residential',
    types: [
      { value: 'house', icon: '🏠', label: 'House' },
      { value: 'apartment', icon: '🏢', label: 'Apartment' },
      { value: 'villa', icon: '🏰', label: 'Villa' },
      { value: 'townhouse', icon: '🏘️', label: 'Townhouse' },
      { value: 'bungalow', icon: '🏗️', label: 'Bungalow' },
      { value: 'studio', icon: '🏙️', label: 'Studio' },
      { value: 'penthouse', icon: '🛎️', label: 'Penthouse' },
      { value: 'duplex', icon: '🏡', label: 'Duplex' },
      { value: 'farmhouse', icon: '🌾', label: 'Farmhouse' },
      { value: 'cottage', icon: '🪵', label: 'Cottage' },
    ],
  },
  {
    label: 'Commercial',
    types: [
      { value: 'office', icon: '🏬', label: 'Office' },
      { value: 'shop', icon: '🏪', label: 'Retail/Shop' },
      { value: 'restaurant', icon: '🍽️', label: 'Restaurant' },
      { value: 'cafe', icon: '☕', label: 'Cafe' },
      { value: 'hotel', icon: '🏨', label: 'Hotel' },
      { value: 'warehouse', icon: '🏭', label: 'Warehouse' },
      { value: 'factory', icon: '⚙️', label: 'Factory' },
      { value: 'mall_space', icon: '🛍️', label: 'Mall Space' },
    ],
  },
  {
    label: 'Land',
    types: [
      { value: 'land', icon: '🌿', label: 'Land' },
      { value: 'agricultural_land', icon: '🌱', label: 'Agricultural' },
      { value: 'commercial_land', icon: '🏗️', label: 'Commercial' },
      { value: 'residential_land', icon: '🏘️', label: 'Residential' },
      { value: 'farm_land', icon: '🌳', label: 'Farm Land' },
      { value: 'plot', icon: '📐', label: 'Building Plot' },
    ],
  },
  {
    label: 'Special',
    types: [
      { value: 'school', icon: '🏫', label: 'School' },
      { value: 'hospital', icon: '🏥', label: 'Hospital' },
      { value: 'church', icon: '⛪', label: 'Church' },
      { value: 'mosque', icon: '🕌', label: 'Mosque' },
      { value: 'event_center', icon: '🎪', label: 'Event Center' },
      { value: 'sports_facility', icon: '⚽', label: 'Sports Facility' },
    ],
  },
];

const TRANSACTION_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'shortlet', label: 'Shortlet' },
  { value: 'lease', label: 'Long-term Lease' },
  { value: 'auction', label: 'Auction' },
  { value: 'pre_construction', label: 'Pre-Construction' },
  { value: 'rent_to_own', label: 'Rent to Own' },
  { value: 'commercial_lease', label: 'Commercial Lease' },
];

const AMENITY_OPTIONS = [
  'Swimming Pool', 'Gym', 'Laundry', 'Parking', 'Elevator', 'Concierge',
  'Storage Room', 'Wheelchair Access', 'Rooftop Garden', 'Business Centre',
  'Game Room', 'Lounge', 'Café', 'Restaurant',
];

// Add this after the AMENITY_OPTIONS constant (around line 200)

const TOGGLE_GROUPS = [
  {
    title: 'Security Features',
    items: [
      { key: 'has_security_guards', icon: '🔒', label: 'Security Guard' },
      { key: 'has_cctv', icon: '📷', label: 'CCTV' },
      { key: 'has_electric_fence', icon: '⚡', label: 'Electric Fence' },
      { key: 'has_security_lights', icon: '💡', label: 'Security Lights' },
      { key: 'has_gated_community', icon: '🏰', label: 'Gated Community' },
      { key: 'has_security', icon: '🛡️', label: '24/7 Security' },
    ],
  },
  {
    title: 'Utilities & Infrastructure',
    items: [
      { key: 'has_solar', icon: '☀️', label: 'Solar Power' },
      { key: 'has_backup_generator', icon: '🔋', label: 'Backup Generator' },
      { key: 'has_water_tank', icon: '💧', label: 'Water Tank' },
      { key: 'has_borehole', icon: '🌊', label: 'Borehole' },
      { key: 'has_internet', icon: '📶', label: 'Fiber Internet' },
      { key: 'has_cable_tv', icon: '📺', label: 'Cable TV' },
    ],
  },
  {
    title: 'Outdoor & Lifestyle',
    items: [
      { key: 'has_garden', icon: '🌿', label: 'Garden' },
      { key: 'has_balcony', icon: '🌅', label: 'Balcony' },
      { key: 'has_terrace', icon: '🪴', label: 'Terrace' },
      { key: 'has_swimming_pool', icon: '🏊', label: 'Swimming Pool' },
      { key: 'has_playground', icon: '🎠', label: 'Playground' },
      { key: 'has_bbq_area', icon: '🔥', label: 'BBQ Area' },
    ],
  },
  {
    title: 'Interior Features',
    items: [
      { key: 'has_air_conditioning', icon: '❄️', label: 'Air Conditioning' },
      { key: 'has_heating', icon: '🔥', label: 'Heating' },
      { key: 'has_modern_kitchen', icon: '🍳', label: 'Modern Kitchen' },
      { key: 'has_walk_in_closet', icon: '🚪', label: 'Walk-in Closet' },
      { key: 'has_study_room', icon: '📚', label: 'Study Room' },
      { key: 'has_fireplace', icon: '🪟', label: 'Fireplace' },
    ],
  },
];

const UGANDAN_CITIES = [
  'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu', 'Mbale',
  'Lira', 'Fort Portal', 'Masaka', 'Soroti', 'Arua', 'Kabale',
];

const SECTIONS = [
  { icon: '📋', label: 'Basic Info' },
  { icon: '📍', label: 'Location' },
  { icon: '🏠', label: 'Property Details' },
  { icon: '✨', label: 'Features' },
  { icon: '🏫', label: 'Nearby Facilities' },
  { icon: '📸', label: 'Photos & Media' },
  { icon: '📄', label: 'Legal & Contact' },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const C = {
  red: '#e63946',
  teal: '#25a882',
  navy: '#0d1b2e',
  redLight: '#fff1f2',
  tealLight: '#f0fdf8',
  border: '#e2e8f0',
  muted: '#64748b',
  lightBg: '#f8fafc',
  surface: '#fff',
};

// ─── SMALL SHARED COMPONENTS ──────────────────────────────────────────────────

const Field: React.FC<{ label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  label, required, hint, error, children, style,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {hint && !error && <span style={{ fontSize: 11, color: C.muted }}>{hint}</span>}
    {error && <span style={{ fontSize: 11, color: C.red }}>{error}</span>}
  </div>
);

const inputStyle: React.CSSProperties = {
  border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px',
  fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: C.navy,
  background: C.lightBg, outline: 'none', width: '100%', boxSizing: 'border-box',
};

const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string; error?: boolean }> = ({
  prefix, suffix, error, style, ...props
}) => (
  <div style={{ position: 'relative' }}>
    {prefix && (
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.muted, fontWeight: 600, pointerEvents: 'none' }}>
        {prefix}
      </span>
    )}
    <input
      style={{ ...inputStyle, borderColor: error ? C.red : undefined, ...(prefix ? { paddingLeft: 48 } : {}), ...(suffix ? { paddingRight: 52 } : {}), ...style }}
      {...props}
    />
    {suffix && (
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.muted, background: C.border, padding: '2px 6px', borderRadius: 4, pointerEvents: 'none' }}>
        {suffix}
      </span>
    )}
  </div>
);

const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }> = ({ error, style, children, ...props }) => (
  <div style={{ position: 'relative' }}>
    <select
      style={{ ...inputStyle, borderColor: error ? C.red : undefined, appearance: 'none', WebkitAppearance: 'none', paddingRight: 32, cursor: 'pointer', ...style }}
      {...props}
    >
      {children}
    </select>
    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.muted, pointerEvents: 'none' }}>▾</span>
  </div>
);

const StyledTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }> = ({ error, style, ...props }) => (
  <textarea
    style={{ ...inputStyle, borderColor: error ? C.red : undefined, resize: 'vertical', minHeight: 90, lineHeight: 1.6, ...style }}
    {...props}
  />
);

const NumberStepper: React.FC<{ value: string; onChange: (v: string) => void; min?: number; error?: boolean }> = ({ value, onChange, min = 0, error }) => (
  <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${error ? C.red : C.border}`, borderRadius: 10, overflow: 'hidden', background: C.lightBg }}>
    <button
      type="button"
      onClick={() => onChange(String(Math.max(min, parseInt(value || '0') - 1)))}
      style={{ width: 38, height: 44, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.muted, fontFamily: 'inherit', flexShrink: 0 }}
    >−</button>
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ flex: 1, border: 'none', background: 'transparent', textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.navy, outline: 'none', minWidth: 0, fontFamily: 'inherit', padding: 0 }}
    />
    <button
      type="button"
      onClick={() => onChange(String(parseInt(value || '0') + 1))}
      style={{ width: 38, height: 44, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.muted, fontFamily: 'inherit', flexShrink: 0 }}
    >+</button>
  </div>
);

const Toggle: React.FC<{ label: string; icon: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label, icon, checked, onChange,
}) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
      border: `1.5px solid ${checked ? C.teal : C.border}`,
      background: checked ? C.tealLight : C.lightBg,
      transition: 'all 0.2s', gap: 10,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 500, color: C.navy }}>
      <span style={{ fontSize: 15 }}>{icon}</span>{label}
    </div>
    <div style={{
      width: 36, height: 20, borderRadius: 99, background: checked ? C.teal : C.border,
      position: 'relative', flexShrink: 0, transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff',
        top: 3, left: checked ? 19 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  </div>
);

const FormCard: React.FC<{ title: string; desc?: string; children: React.ReactNode; accent?: boolean }> = ({
  title, desc, children, accent,
}) => (
  <div style={{
    background: accent ? C.tealLight : C.surface, borderRadius: 16,
    border: `${accent ? 2 : 1}px solid ${accent ? C.teal : C.border}`,
    padding: 28, marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: desc ? 4 : 20, fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: accent ? C.teal : C.navy }}>
      <div style={{ width: 4, height: 16, background: accent ? C.teal : C.red, borderRadius: 2, flexShrink: 0 }} />
      {title}
    </div>
    {desc && <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, paddingLeft: 12 }}>{desc}</p>}
    {children}
  </div>
);

const Grid: React.FC<{ cols?: number; gap?: number; children: React.ReactNode }> = ({ cols = 2, gap = 16, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
    {children}
  </div>
);

// Update Section0BasicInfo to show errors
const Section0BasicInfo: React.FC<{ fd: PropertyFormData; onChange: (k: keyof PropertyFormData, v: any) => void; errors?: FormErrors }> = ({ fd, onChange, errors }) => {
  const [typeTab, setTypeTab] = useState(0);
  const isRental = RENTAL_TRANSACTION_TYPES.includes(fd.transaction_type);

  return (
    <>
      <FormCard title="Property Title & Description" desc="A compelling title and description attract more buyers and renters">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Listing Title" required hint="60–80 characters works best for search visibility" error={errors?.title}>
            <StyledInput
              type="text"
              value={fd.title}
              onChange={e => onChange('title', e.target.value)}
              placeholder="e.g. Modern 3-Bedroom Villa in Kololo, Kampala"
              error={!!errors?.title}
            />
          </Field>
          <Field label="Full Description" required error={errors?.description}>
            <StyledTextarea
              value={fd.description}
              onChange={e => onChange('description', e.target.value)}
              placeholder="Describe the property in detail — key features, condition, neighbourhood feel, and what makes it special..."
              style={{ minHeight: 120 }}
              error={!!errors?.description}
            />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Property Type" desc="Select the category that best describes your property">
        <div style={{ display: 'flex', gap: 4, background: C.lightBg, borderRadius: 10, padding: 4, marginBottom: 16, border: `1px solid ${C.border}` }}>
          {PROPERTY_TYPE_TABS.map((tab, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTypeTab(i)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: typeTab === i ? 700 : 500,
                color: typeTab === i ? C.navy : C.muted,
                background: typeTab === i ? '#fff' : 'transparent',
                fontFamily: 'inherit', boxShadow: typeTab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
          {PROPERTY_TYPE_TABS[typeTab].types.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange('property_type', t.value)}
              style={{
                border: `1.5px solid ${fd.property_type === t.value ? C.red : C.border}`,
                borderRadius: 10, padding: '10px 8px', textAlign: 'center', cursor: 'pointer',
                background: fd.property_type === t.value ? C.redLight : C.lightBg,
                fontSize: 12, fontWeight: fd.property_type === t.value ? 700 : 500,
                color: fd.property_type === t.value ? C.red : C.muted,
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </FormCard>

      <FormCard title="Transaction Type" desc="How are you listing this property?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TRANSACTION_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange('transaction_type', t.value)}
              style={{
                border: `1.5px solid ${fd.transaction_type === t.value ? C.teal : C.border}`,
                borderRadius: 99, padding: '7px 18px', fontSize: 13, fontWeight: fd.transaction_type === t.value ? 700 : 500,
                color: fd.transaction_type === t.value ? C.teal : C.muted,
                background: fd.transaction_type === t.value ? C.tealLight : C.lightBg,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FormCard>

      <FormCard title="Pricing">
        <Grid cols={2}>
          <Field label="Price" required error={errors?.price}>
            <StyledInput
              type="number"
              value={fd.price}
              onChange={e => onChange('price', e.target.value)}
              placeholder={isRental ? '2,500,000' : '450,000,000'}
              prefix="UGX"
              error={!!errors?.price}
            />
          </Field>

          {isRental && (
            <Field label="Rental Frequency">
              <StyledSelect
                value={fd.rental_frequency}
                onChange={e => onChange('rental_frequency', e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annually">Semi-Annual</option>
                <option value="annually">Annually</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </StyledSelect>
            </Field>
          )}
        </Grid>
      </FormCard>
    </>
  );
};

// Update Section1Location to show errors
const Section1Location: React.FC<{ fd: PropertyFormData; onChange: (k: keyof PropertyFormData, v: any) => void; errors?: FormErrors }> = ({ fd, onChange, errors }) => (
  <>
    <FormCard title="Address Details" desc="Enter the full address of the property">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Street Address" required error={errors?.address}>
          <StyledInput type="text" value={fd.address} onChange={e => onChange('address', e.target.value)} placeholder="e.g. Plot 45, Acacia Avenue" error={!!errors?.address} />
        </Field>
        <Grid cols={2}>
          <Field label="City" required error={errors?.city}>
            <StyledSelect value={fd.city} onChange={e => onChange('city', e.target.value)} error={!!errors?.city}>
              {UGANDAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </StyledSelect>
          </Field>
          <Field label="District" required error={errors?.district}>
            <StyledInput type="text" value={fd.district} onChange={e => onChange('district', e.target.value)} placeholder="e.g. Wakiso, Kampala..." error={!!errors?.district} />
          </Field>
        </Grid>
        <Field label="Neighbourhood / Area Name">
          <StyledInput type="text" value={fd.neighborhood_name} onChange={e => onChange('neighborhood_name', e.target.value)} placeholder="e.g. Kololo, Ntinda, Kiwatule..." />
        </Field>
      </div>
    </FormCard>

    <FormCard title="Map Coordinates" desc="Pin the exact location for better visibility">
      <div style={{ borderRadius: 14, background: 'linear-gradient(135deg, #e8edf3, #d4dde8)', height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${C.border}`, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23c5cedd' stroke-width='1'/%3E%3C/svg%3E")`, opacity: 0.5 }} />
        <span style={{ fontSize: 32, position: 'relative', zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>📍</span>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 8, position: 'relative', zIndex: 1, fontWeight: 500 }}>Click to set location on map</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, position: 'relative', zIndex: 1 }}>
          <button type="button" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${C.border}`, background: '#fff', color: C.navy }}>📌 Use My Location</button>
          <button type="button" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${C.border}`, background: '#fff', color: C.navy }}>🗺️ Search on Map</button>
        </div>
      </div>
      <Grid cols={2}>
        <Field label="Latitude">
          <StyledInput type="number" value={fd.latitude} onChange={e => onChange('latitude', e.target.value)} placeholder="0.3476" step="0.0001" />
        </Field>
        <Field label="Longitude">
          <StyledInput type="number" value={fd.longitude} onChange={e => onChange('longitude', e.target.value)} placeholder="32.5825" step="0.0001" />
        </Field>
      </Grid>
    </FormCard>

    <FormCard title="Neighbourhood Info" desc="Help buyers understand the area">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Neighbourhood Description">
          <StyledTextarea value={fd.neighborhood_description} onChange={e => onChange('neighborhood_description', e.target.value)} placeholder="Describe the neighbourhood — safety, vibe, nearby facilities..." style={{ minHeight: 80 }} />
        </Field>
        <Grid cols={3}>
          <Field label="Dist. to City Center">
            <StyledInput type="number" value={fd.distance_to_city_center} onChange={e => onChange('distance_to_city_center', e.target.value)} placeholder="5.2" suffix="km" />
          </Field>
          <Field label="Dist. to Airport">
            <StyledInput type="number" value={fd.distance_to_airport} onChange={e => onChange('distance_to_airport', e.target.value)} placeholder="12" suffix="km" />
          </Field>
          <Field label="Dist. to Highway">
            <StyledInput type="number" value={fd.distance_to_highway} onChange={e => onChange('distance_to_highway', e.target.value)} placeholder="0.5" suffix="km" />
          </Field>
        </Grid>
      </div>
    </FormCard>
  </>
);

// Update Section5Media to show video error
const Section5Media: React.FC<{
  fd: PropertyFormData;
  onChange: (k: keyof PropertyFormData, v: any) => void;
  images: UploadImage[];
  onImagesChange: (imgs: UploadImage[]) => void;
  errors?: FormErrors;
}> = ({ fd, onChange, images, onImagesChange, errors }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList) => {
    const newImgs: UploadImage[] = Array.from(files).map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      is_main: images.length === 0 && i === 0,
    }));
    onImagesChange([...images, ...newImgs]);
  }, [images, onImagesChange]);

  const removeImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    if (images[idx].is_main && updated.length > 0) updated[0].is_main = true;
    onImagesChange(updated);
  };

  const setMain = (idx: number) => {
    onImagesChange(images.map((img, i) => ({ ...img, is_main: i === idx })));
  };

  const handleVideoFile = (file: File | null) => {
    setVideoError(null);
    if (!file) {
      onChange('video_file', null);
      return;
    }
    
    const validExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    const isValidMime = file.type.startsWith('video/');
    
    if (isValid && isValidMime) {
      onChange('video_file', file);
    } else {
      const errorMsg = 'Invalid video format. Please select MP4, MOV, AVI, WEBM, or MKV file.';
      setVideoError(errorMsg);
      onChange('video_file', null);
    }
  };

  return (
    <>
      <FormCard title="Property Photos" desc="Upload 5–15 images for best results. First image becomes the main photo">
        {errors?.images && (
          <div style={{ color: C.red, fontSize: 12, marginBottom: 12, padding: '8px 12px', background: C.redLight, borderRadius: 8 }}>
            ⚠️ {errors.images}
          </div>
        )}
        
        <div style={{ background: '#f0fdf8', border: '1px solid rgba(37,168,130,0.2)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 16, marginTop: 1 }}>💡</span>
          <p style={{ fontSize: 13, color: '#0d5c45', lineHeight: 1.5, margin: 0 }}>
            Listings with 10+ high-quality photos get <strong>3× more views</strong>. Use natural lighting and shoot from corners.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          style={{
            border: `2px dashed ${dragging ? C.teal : C.border}`,
            borderRadius: 14, padding: 40, textAlign: 'center', cursor: 'pointer',
            background: dragging ? C.tealLight : C.lightBg, transition: 'all 0.2s',
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>📸</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Drop photos here or click to browse</div>
          <div style={{ fontSize: 13, color: C.muted }}>PNG, JPG, WebP up to 10MB each</div>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            style={{ marginTop: 14, background: C.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Browse Files
          </button>
        </div>

        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12, marginTop: 16 }}>
            {images.map((img, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', aspectRatio: '4/3', background: C.border, cursor: 'pointer' }} onClick={() => setMain(i)}>
                <img src={img.preview} alt={`Property ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {img.is_main && (
                  <div style={{ position: 'absolute', top: 6, left: 6, background: C.teal, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>MAIN</div>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeImage(i); }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </FormCard>

      <FormCard title="Video Tour" desc="Add a video walkthrough or 360° virtual tour">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="YouTube / Vimeo URL">
            <StyledInput type="url" value={fd.video_url} onChange={e => onChange('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </Field>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 12, padding: '4px 0' }}>— or upload video file —</div>
          <div
            onClick={() => document.getElementById('vidFileInput')?.click()}
            style={{ border: `2px dashed ${videoError ? C.red : C.border}`, borderRadius: 14, padding: 24, textAlign: 'center', cursor: 'pointer', background: videoError ? C.redLight : C.lightBg }}
          >
            <input
              id="vidFileInput"
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
              style={{ display: 'none' }}
              onChange={e => handleVideoFile(e.target.files?.[0] || null)}
            />
            <span style={{ fontSize: 24 }}>🎥</span>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 8 }}>
              {fd.video_file ? fd.video_file.name : 'Upload Video File'}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>MP4, MOV, AVI, WEBM, MKV up to 200MB</div>
          </div>
          {videoError && (
            <div style={{ color: C.red, fontSize: 12, padding: '8px 12px', background: C.redLight, borderRadius: 8 }}>
              ⚠️ {videoError}
            </div>
          )}
          {errors?.video_file && !videoError && (
            <div style={{ color: C.red, fontSize: 12, padding: '8px 12px', background: C.redLight, borderRadius: 8 }}>
              ⚠️ {errors.video_file}
            </div>
          )}
          <Field label="360° Virtual Tour URL">
            <StyledInput type="url" value={fd.virtual_tour_url} onChange={e => onChange('virtual_tour_url', e.target.value)} placeholder="https://matterport.com/..." />
          </Field>
        </div>
      </FormCard>
    </>
  );
};

// Section2PropertyDetails
const Section2PropertyDetails: React.FC<{ fd: PropertyFormData; onChange: (k: keyof PropertyFormData, v: any) => void }> = ({ fd, onChange }) => (
  <>
    <FormCard title="Rooms & Size" desc="Enter key measurements and room counts">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <Field label="Bedrooms">
          <NumberStepper value={fd.bedrooms} onChange={v => onChange('bedrooms', v)} />
        </Field>
        <Field label="Bathrooms">
          <NumberStepper value={fd.bathrooms} onChange={v => onChange('bathrooms', v)} />
        </Field>
        <Field label="Parking Spaces">
          <NumberStepper value={fd.parking_spaces} onChange={v => onChange('parking_spaces', v)} />
        </Field>
      </div>
      <Grid cols={2}>
        <Field label="Size (Square Meters)">
          <StyledInput type="number" value={fd.square_meters} onChange={e => onChange('square_meters', e.target.value)} placeholder="250" suffix="m²" />
        </Field>
        <Field label="Year Built">
          <StyledInput type="number" value={fd.year_built} onChange={e => onChange('year_built', e.target.value)} placeholder="2019" min="1800" max="2025" />
        </Field>
      </Grid>
    </FormCard>

    <FormCard title="Property Attributes" desc="Classification, condition, and legal tenure">
      <Grid cols={2}>
        <Field label="Furnishing Status">
          <StyledSelect value={fd.furnishing_status} onChange={e => onChange('furnishing_status', e.target.value)}>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi-Furnished</option>
            <option value="fully_furnished">Fully Furnished</option>
            <option value="luxury">Luxury Furnished</option>
            <option value="bare_shell">Bare Shell</option>
            <option value="turnkey">Turnkey Ready</option>
          </StyledSelect>
        </Field>
        <Field label="Parking Type">
          <StyledSelect value={fd.parking_type} onChange={e => onChange('parking_type', e.target.value)}>
            <option value="none">No Parking</option>
            <option value="street">Street Parking</option>
            <option value="open">Open Parking</option>
            <option value="covered">Covered Parking</option>
            <option value="garage">Garage</option>
            <option value="underground">Underground</option>
            <option value="carport">Carport</option>
          </StyledSelect>
        </Field>
        <Field label="Tenure Type">
          <StyledSelect value={fd.tenure_type} onChange={e => onChange('tenure_type', e.target.value)}>
            <option value="freehold">Freehold</option>
            <option value="leasehold">Leasehold</option>
            <option value="mailo">Mailo Land</option>
            <option value="kibanja">Kibanja</option>
            <option value="customary">Customary</option>
            <option value="permanent">Permanent</option>
          </StyledSelect>
        </Field>
        <Field label="Property Condition">
          <StyledSelect value={fd.property_condition} onChange={e => onChange('property_condition', e.target.value)}>
            <option value="new">New Construction</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good Condition</option>
            <option value="needs_updating">Needs Updating</option>
            <option value="needs_renovation">Needs Renovation</option>
            <option value="under_construction">Under Construction</option>
          </StyledSelect>
        </Field>
      </Grid>
    </FormCard>

    <FormCard title="Building Information" desc="Additional structural details">
      <Grid cols={3}>
        <Field label="Number of Floors">
          <StyledInput type="number" value={fd.number_of_floors} onChange={e => onChange('number_of_floors', e.target.value)} placeholder="2" min="1" />
        </Field>
        <Field label="Floor Number">
          <StyledInput type="number" value={fd.floor_number} onChange={e => onChange('floor_number', e.target.value)} placeholder="1 (if applicable)" />
        </Field>
        <Field label="Year Renovated">
          <StyledInput type="number" value={fd.year_renovated} onChange={e => onChange('year_renovated', e.target.value)} placeholder="2022" />
        </Field>
      </Grid>
    </FormCard>
  </>
);

// Section3Features
const Section3Features: React.FC<{ fd: PropertyFormData; onChange: (k: keyof PropertyFormData, v: any) => void }> = ({ fd, onChange }) => (
  <>
    {TOGGLE_GROUPS.map(group => (
      <FormCard key={group.title} title={group.title}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {group.items.map(item => (
            <Toggle
              key={item.key}
              label={item.label}
              icon={item.icon}
              checked={fd[item.key as keyof PropertyFormData] as boolean}
              onChange={v => onChange(item.key as keyof PropertyFormData, v)}
            />
          ))}
        </div>
      </FormCard>
    ))}

    <FormCard title="Amenities Nearby" desc="Select all amenities available in or around the property">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {AMENITY_OPTIONS.map(a => {
          const on = fd.amenities.includes(a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => onChange('amenities', on ? fd.amenities.filter(x => x !== a) : [...fd.amenities, a])}
              style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: `1.5px solid ${on ? C.red : C.border}`,
                background: on ? C.redLight : C.lightBg,
                color: on ? C.red : C.muted,
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              {a}
            </button>
          );
        })}
      </div>
    </FormCard>

    <FormCard title="Restrictions">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        <Toggle label="Pets Allowed" icon="🐾" checked={fd.pets_allowed} onChange={v => onChange('pets_allowed', v)} />
        <Toggle label="Smoking Allowed" icon="🚬" checked={fd.smoking_allowed} onChange={v => onChange('smoking_allowed', v)} />
      </div>
    </FormCard>
  </>
);

// Section4Nearby
const Section4Nearby: React.FC<{ fd: PropertyFormData; onChange: (k: keyof PropertyFormData, v: any) => void }> = ({ fd, onChange }) => (
  <>
    <FormCard title="Schools & Education">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nearby Schools" hint="Separate multiple schools with commas">
          <StyledInput type="text" value={fd.nearby_schools} onChange={e => onChange('nearby_schools', e.target.value)} placeholder="e.g. Kampala International School, St. Mary's College" />
        </Field>
        <Grid cols={2}>
          <Field label="Distance to Nearest School">
            <StyledInput type="number" value={fd.distance_to_nearest_school} onChange={e => onChange('distance_to_nearest_school', e.target.value)} placeholder="0.8" suffix="km" />
          </Field>
          <Field label="School Rating">
            <StyledInput type="number" value={fd.school_rating} onChange={e => onChange('school_rating', e.target.value)} placeholder="4.2" min="0" max="5" step="0.1" suffix="/ 5" />
          </Field>
        </Grid>
      </div>
    </FormCard>

    <FormCard title="Healthcare">
      <Grid cols={2}>
        <Field label="Nearest Hospital">
          <StyledInput type="text" value={fd.nearest_hospital} onChange={e => onChange('nearest_hospital', e.target.value)} placeholder="e.g. Mulago National Hospital" />
        </Field>
        <Field label="Distance to Hospital">
          <StyledInput type="number" value={fd.distance_to_hospital} onChange={e => onChange('distance_to_hospital', e.target.value)} placeholder="3.5" suffix="km" />
        </Field>
        <Field label="Nearest Pharmacy" style={{ gridColumn: 'span 2' }}>
          <StyledInput type="text" value={fd.nearest_pharmacy} onChange={e => onChange('nearest_pharmacy', e.target.value)} placeholder="e.g. Quality Chemicals" />
        </Field>
      </Grid>
    </FormCard>

    <FormCard title="Transport & Roads">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nearby Roads" hint="Separate with commas">
          <StyledInput type="text" value={fd.nearby_roads} onChange={e => onChange('nearby_roads', e.target.value)} placeholder="e.g. Entebbe Road, Jinja Highway" />
        </Field>
        <Grid cols={2}>
          <Field label="Nearest Road">
            <StyledInput type="text" value={fd.nearest_road} onChange={e => onChange('nearest_road', e.target.value)} placeholder="Main access road" />
          </Field>
          <Field label="Nearest Bus Stop">
            <StyledInput type="text" value={fd.nearest_bus_stop} onChange={e => onChange('nearest_bus_stop', e.target.value)} placeholder="e.g. Kampala Coach Terminal" />
          </Field>
          <Field label="Nearest Taxi Stage">
            <StyledInput type="text" value={fd.nearest_taxi_stage} onChange={e => onChange('nearest_taxi_stage', e.target.value)} placeholder="e.g. Old Taxi Park" />
          </Field>
        </Grid>
        <Toggle label="Public Transport Nearby" icon="🚌" checked={fd.public_transport} onChange={v => onChange('public_transport', v)} />
      </div>
    </FormCard>

    <FormCard title="Shopping & Lifestyle">
      <Grid cols={2}>
        <Field label="Nearest Mall">
          <StyledInput type="text" value={fd.nearest_mall} onChange={e => onChange('nearest_mall', e.target.value)} placeholder="e.g. Acacia Mall, Garden City" />
        </Field>
        <Field label="Distance to Mall">
          <StyledInput type="number" value={fd.distance_to_mall} onChange={e => onChange('distance_to_mall', e.target.value)} placeholder="2.1" suffix="km" />
        </Field>
        <Field label="Nearest Supermarket">
          <StyledInput type="text" value={fd.nearest_supermarket} onChange={e => onChange('nearest_supermarket', e.target.value)} placeholder="e.g. Carrefour, Shoprite" />
        </Field>
        <Field label="Nearest Market">
          <StyledInput type="text" value={fd.nearest_market} onChange={e => onChange('nearest_market', e.target.value)} placeholder="e.g. Nakasero Market" />
        </Field>
        <Field label="Nearest Restaurant">
          <StyledInput type="text" value={fd.nearest_restaurant} onChange={e => onChange('nearest_restaurant', e.target.value)} placeholder="e.g. Cafe Javas" />
        </Field>
        <Field label="Nearest Cafe">
          <StyledInput type="text" value={fd.nearest_cafe} onChange={e => onChange('nearest_cafe', e.target.value)} placeholder="e.g. Urban Brew" />
        </Field>
        <Field label="Nearest Gym">
          <StyledInput type="text" value={fd.nearest_gym} onChange={e => onChange('nearest_gym', e.target.value)} placeholder="e.g. Kampala Gym" />
        </Field>
        <Field label="Nearest Park">
          <StyledInput type="text" value={fd.nearest_park} onChange={e => onChange('nearest_park', e.target.value)} placeholder="e.g. Kololo Airstrip Park" />
        </Field>
      </Grid>
    </FormCard>
  </>
);

// Section6Legal
const Section6Legal: React.FC<{ fd: PropertyFormData; onChange: (k: keyof PropertyFormData, v: any) => void }> = ({ fd, onChange }) => (
  <>
    <FormCard title="Legal & Ownership" desc="Document verification builds buyer confidence">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Toggle label="Has Title Deed" icon="📜" checked={fd.has_title_deed} onChange={v => onChange('has_title_deed', v)} />
        {fd.has_title_deed && (
          <Grid cols={2}>
            <Field label="Title Deed Number">
              <StyledInput type="text" value={fd.title_deed_number} onChange={e => onChange('title_deed_number', e.target.value)} placeholder="e.g. KLA/12345/67" />
            </Field>
            <Field label="Land Registration Number">
              <StyledInput type="text" value={fd.land_registration_number} onChange={e => onChange('land_registration_number', e.target.value)} placeholder="e.g. LRN-2019-00456" />
            </Field>
          </Grid>
        )}
        <Grid cols={2}>
          <Field label="Ownership Type">
            <StyledSelect value={fd.ownership_type} onChange={e => onChange('ownership_type', e.target.value)}>
              <option value="freehold">Freehold</option>
              <option value="leasehold">Leasehold</option>
              <option value="shared_ownership">Shared Ownership</option>
              <option value="co_op">Co-operative</option>
              <option value="government">Government Owned</option>
              <option value="trust">Trust</option>
            </StyledSelect>
          </Field>
          <Field label="Energy Rating">
            <StyledSelect value={fd.energy_rating} onChange={e => onChange('energy_rating', e.target.value)}>
              <option value="">Not Specified</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </StyledSelect>
          </Field>
        </Grid>
      </div>
    </FormCard>

    <FormCard title="Contact Information" desc="How buyers will reach you for viewings and inquiries">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Grid cols={2}>
          <Field label="Agent / Contact Phone" required>
            <StyledInput type="tel" value={fd.agent_phone} onChange={e => onChange('agent_phone', e.target.value)} placeholder="+256 700 123 456" />
          </Field>
          <Field label="Agent / Contact Email">
            <StyledInput type="email" value={fd.agent_email} onChange={e => onChange('agent_email', e.target.value)} placeholder="agent@example.com" />
          </Field>
        </Grid>
        <Field label="Viewing Instructions">
          <StyledTextarea
            value={fd.viewing_instructions}
            onChange={e => onChange('viewing_instructions', e.target.value)}
            placeholder="e.g. Call ahead to schedule — available weekdays 9am–5pm, weekends by appointment..."
            style={{ minHeight: 80 }}
          />
        </Field>
      </div>
    </FormCard>

    <FormCard title="🎉 Ready to Publish!" accent>
      <p style={{ fontSize: 13, color: '#0d5c45', marginBottom: 16 }}>
        Review all your details, then click "List Property" to publish on metrocareproperties.com. You can edit anytime from your dashboard.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { icon: '✅', title: 'Verified Badge', sub: 'Upon admin review' },
          { icon: '🚀', title: 'Live in 60s', sub: 'Instant publishing' },
          { icon: '📊', title: 'Analytics', sub: 'Track views & leads' },
        ].map(item => (
          <div key={item.title} style={{ background: '#fff', borderRadius: 10, padding: 14, textAlign: 'center', border: '1px solid rgba(37,168,130,0.2)' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{item.title}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </FormCard>
  </>
);

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

const AddPropertyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [formData, setFormData] = useState<PropertyFormData>(EMPTY_FORM(user));
  const [currentStep, setCurrentStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const totalSteps = SECTIONS.length;
  const progressPct = Math.round(((currentStep + 1) / totalSteps) * 100);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const onChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const goToStep = (idx: number) => {
    setCurrentStep(idx);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      if (!doneSteps.includes(currentStep)) {
        setDoneSteps([...doneSteps, currentStep]);
      }
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    
    if (step === 0) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Valid price is required (must be greater than 0)';
      }
    }
    
    if (step === 1) {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (!formData.city) {
        newErrors.city = 'City is required';
      }
      if (!formData.district.trim()) {
        newErrors.district = 'District is required';
      }
    }
    
    if (step === 5) {
      if (images.length === 0) {
        newErrors.images = 'Please upload at least one image';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      nextStep();
    } else {
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const buildFD = (fd: PropertyFormData, imgs: UploadImage[]) => {
    const f = new FormData();
    
    // Required fields
    if (fd.price && fd.price !== '') {
      f.append('price', String(parseFloat(fd.price)));
    }
    if (fd.title) f.append('title', fd.title);
    if (fd.description) f.append('description', fd.description);
    if (fd.address) f.append('address', fd.address);
    if (fd.city) f.append('city', fd.city);
    if (fd.district) f.append('district', fd.district);
    if (fd.property_type) f.append('property_type', fd.property_type);
    if (fd.transaction_type) f.append('transaction_type', fd.transaction_type);
    if (fd.bedrooms) f.append('bedrooms', fd.bedrooms);
    if (fd.bathrooms) f.append('bathrooms', fd.bathrooms);
    
    Object.entries(fd).forEach(([k, v]) => {
      const skipFields = ['price', 'title', 'description', 'address', 'city', 'district', 
                          'property_type', 'transaction_type', 'bedrooms', 'bathrooms'];
      if (skipFields.includes(k)) return;
      
      if (k === 'latitude' || k === 'longitude') {
        if (v !== null && v !== undefined && v !== '') {
          f.append(k, String(v));
        }
        return;
      }
      
      if (v === null || v === undefined || v === '') return;
      
      if (k === 'amenities') {
        f.append(k, JSON.stringify(v));
      } else if (k === 'video_file') {
        if (v && v instanceof File && v.size > 0) {
          f.append('video_file', v);
        }
      } else if (typeof v === 'boolean') {
        f.append(k, String(v));
      } else {
        f.append(k, String(v));
      }
    });
    
    imgs.forEach((img, i) => {
      f.append('images', img.file);
      // if (img.is_main) {
      //   f.append('main_image_index', i.toString());
      // }
    });
    
    return f;
  };

  const handleSubmit = async () => {
    // Validate all steps before submit
    let allValid = true;
    for (let i = 0; i <= 6; i++) {
      if (!validateStep(i)) {
        allValid = false;
        setCurrentStep(i);
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(`Please fix errors in ${SECTIONS[i].label} section`, 'error');
        break;
      }
    }
    
    if (!allValid) return;
    
    setLoading(true);
    
    try {
      const formDataToSend = buildFD(formData, images);
      const response = await api.post('/properties/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      showToast('Property listed successfully!', 'success');
      setTimeout(() => navigate('/dashboard/properties'), 1500);
    } catch (err: any) {
      console.error("ERROR:", err.response?.data);
      
      const serverErrors = err.response?.data?.details || err.response?.data;
      const newErrors: FormErrors = {};
      
      if (serverErrors && typeof serverErrors === 'object') {
        if (serverErrors.video_file) newErrors.video_file = serverErrors.video_file[0];
        if (serverErrors.price) newErrors.price = serverErrors.price[0];
        if (serverErrors.title) newErrors.title = serverErrors.title[0];
        if (serverErrors.description) newErrors.description = serverErrors.description[0];
        if (serverErrors.address) newErrors.address = serverErrors.address[0];
        if (serverErrors.city) newErrors.city = serverErrors.city[0];
        if (serverErrors.district) newErrors.district = serverErrors.district[0];
        if (serverErrors.images) newErrors.images = serverErrors.images[0];
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          showToast('Please fix the highlighted errors', 'error');
        } else {
          showToast('Failed to add property. Please try again.', 'error');
        }
      } else {
        showToast('Failed to add property. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const sectionProps = { fd: formData, onChange, errors };

  const sectionContent = [
    <Section0BasicInfo {...sectionProps} />,
    <Section1Location {...sectionProps} />,
    <Section2PropertyDetails {...sectionProps} />,
    <Section3Features {...sectionProps} />,
    <Section4Nearby {...sectionProps} />,
    <Section5Media {...sectionProps} images={images} onImagesChange={setImages} errors={errors} />,
    <Section6Legal {...sectionProps} />,
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh', maxWidth: 1280, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
          backgroundColor: toast.type === 'success' ? '#1a3a2e' : '#3a1a1e',
          color: toast.type === 'success' ? '#4ade80' : '#f87171',
          border: `1px solid ${toast.type === 'success' ? C.teal : C.red}33`,
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
          animation: 'fadeDown 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
          {toast.message}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', marginLeft: 4, opacity: 0.7 }}>×</button>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ background: C.navy, color: '#fff', display: 'flex', flexDirection: 'column', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => navigate('/dashboard/properties')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', marginBottom: 20, background: 'none', border: 'none', fontFamily: 'inherit', transition: 'color 0.2s' }}
          >
            ← Back to dashboard
          </button>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Add New <span style={{ color: C.red }}>Property</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6, fontWeight: 300 }}>
            Complete all sections
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {SECTIONS.map((sec, i) => {
            const isActive = i === currentStep;
            const isDone = doneSteps.includes(i);
            const hasError = (i === 0 && (errors.title || errors.description || errors.price)) ||
                            (i === 1 && (errors.address || errors.city || errors.district)) ||
                            (i === 5 && (errors.images || errors.video_file));
            
            return (
              <div
                key={i}
                onClick={() => goToStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 24px',
                  cursor: 'pointer', borderLeft: `3px solid ${isActive ? C.red : hasError ? C.red : 'transparent'}`,
                  background: isActive ? 'rgba(230,57,70,0.12)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                  background: isActive ? C.red : isDone ? C.teal : hasError ? C.red : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.2s',
                }}>
                  {isDone ? '✓' : sec.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? '#fff' : isDone ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}>
                  {sec.label}
                </span>
                {hasError && <span style={{ marginLeft: 'auto', fontSize: 10, color: C.red }}>!</span>}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 4, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: `linear-gradient(90deg, ${C.teal}, #1dd6a1)`, borderRadius: 99, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Progress</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{currentStep + 1} of {totalSteps}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} style={{ padding: '32px 40px 100px', overflowY: 'auto', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.redLight, color: C.red, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {SECTIONS[currentStep].icon} Step {currentStep + 1}
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: C.navy, margin: 0 }}>
            {['Basic Information', 'Location & Address', 'Property Details', 'Features & Amenities', 'Nearby Facilities', 'Photos & Videos', 'Legal & Contact'][currentStep]}
          </h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6, fontWeight: 300 }}>
            {[
              'Start with the essentials — title, type, and transaction details',
              'Help buyers find your property with accurate location details',
              'Rooms, size, age, condition, and physical attributes',
              'Toggle all the features your property offers',
              'Schools, hospitals, transport, shopping — help buyers with context',
              'High-quality media dramatically increases views and inquiries',
              'Documents, ownership details, and contact information',
            ][currentStep]}
          </p>
        </div>

        {sectionContent[currentStep]}
      </main>

      {/* Bottom Action Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 260, right: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`, padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100,
      }}>
        <div style={{ fontSize: 13, color: C.muted }}>
          Step <strong style={{ color: C.navy }}>{currentStep + 1}</strong> of <strong style={{ color: C.navy }}>{totalSteps}</strong>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {currentStep > 0 && (
            <button type="button" onClick={prevStep} style={{ padding: '10px 22px', border: `1.5px solid ${C.border}`, borderRadius: 10, background: '#fff', color: C.navy, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Previous
            </button>
          )}
          {currentStep < totalSteps - 1 ? (
            <button type="button" onClick={handleNextStep} style={{ padding: '10px 22px', border: `1.5px solid ${C.teal}`, borderRadius: 10, background: C.tealLight, color: C.teal, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Next Step →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} style={{
              padding: '10px 28px', border: 'none', borderRadius: 10,
              background: loading ? '#94a3b8' : C.red, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {loading ? '⏳ Publishing...' : '🚀 List Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPropertyPage;