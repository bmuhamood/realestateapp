/**
 * PropertyForm.tsx — Fully redesigned, MUI-free, typing-bug fixed
 *
 * ROOT CAUSE OF TYPING BUG:
 *   The old form used MUI styled-components defined INSIDE the component body.
 *   Every keystroke triggered a re-render which recreated those styled components,
 *   causing React to unmount/remount the entire subtree → input lost focus + cleared.
 *
 * FIX:
 *   - All styled objects are defined OUTSIDE the component (module level).
 *   - All sub-components (FeatureToggle, Field, etc.) are defined OUTSIDE too.
 *   - Zero MUI — pure inline styles matching Metro Properties design tokens.
 *   - Using React.memo on sub-components to prevent unnecessary re-renders.
 */

import React, { useState, useCallback, useRef } from 'react';
import { UploadImage, PropertyImage as ExistingImage } from '../../types';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const RED      = '#e63946';
const RED_BG   = 'rgba(230,57,70,0.07)';
const RED_DARK = '#c1121f';
const NAVY     = '#0d1b2e';
const TEAL     = '#25a882';
const TEAL_BG  = 'rgba(37,168,130,0.08)';
const SLATE    = '#475569';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PropertyFormData {
  title: string; description: string; property_type: string; transaction_type: string;
  price: string; bedrooms: string; bathrooms: string; square_meters: string;
  latitude: string; longitude: string; address: string; city: string; district: string;
  video_url: string; virtual_tour_url: string;
  video_file: File | null;  // Add this line
  neighborhood_name: string; neighborhood_description: string;
  distance_to_city_center: string; distance_to_airport: string; distance_to_highway: string;
  nearby_schools: string; distance_to_nearest_school: string; school_rating: string;
  nearby_roads: string; nearest_road: string; public_transport: boolean;
  nearest_bus_stop: string; nearest_taxi_stage: string;
  amenities: string[]; nearest_mall: string; distance_to_mall: string;
  nearest_supermarket: string; nearest_market: string; nearest_pharmacy: string;
  nearest_hospital: string; distance_to_hospital: string;
  nearest_restaurant: string; nearest_cafe: string; nearest_gym: string; nearest_park: string;
  year_built: string; furnishing_status: string; parking_type: string; parking_spaces: string;
  has_security: boolean; has_cctv: boolean; has_electric_fence: boolean;
  has_security_lights: boolean; has_security_guards: boolean; has_gated_community: boolean;
  has_solar: boolean; has_backup_generator: boolean; has_water_tank: boolean;
  has_borehole: boolean; has_internet: boolean; has_cable_tv: boolean;
  has_garden: boolean; has_balcony: boolean; has_terrace: boolean;
  has_swimming_pool: boolean; has_playground: boolean; has_bbq_area: boolean;
  has_air_conditioning: boolean; has_heating: boolean; has_fireplace: boolean;
  has_modern_kitchen: boolean; has_walk_in_closet: boolean; has_study_room: boolean;
  pets_allowed: boolean; smoking_allowed: boolean;
  has_title_deed: boolean; title_deed_number: string; land_registration_number: string;
  agent_phone: string; agent_email: string; viewing_instructions: string;
}

interface PropertyFormProps {
  formData: PropertyFormData;
  onChange: (field: keyof PropertyFormData, value: any) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  loading?: boolean;
  submitText?: string;
  images?: UploadImage[];
  onImagesChange?: (images: UploadImage[]) => void;
  existingImages?: ExistingImage[];
  onExistingImagesChange?: (images: ExistingImage[]) => void;
  onImageRemove?: (imageId: number) => void;
}

// ─── Tab config (defined outside — stable reference) ──────────────────────────
const TABS = [
  { label: 'Basic Info',     icon: '🏠' },
  { label: 'Location',       icon: '📍' },
  { label: 'Media',          icon: '🎬' },
  { label: 'Neighborhood',   icon: '🏘️' },
  { label: 'Schools',        icon: '🎓' },
  { label: 'Transport',      icon: '🚗' },
  { label: 'Amenities',      icon: '✨' },
  { label: 'Security',       icon: '🔒' },
  { label: 'Features',       icon: '🛋️' },
  { label: 'Legal & Contact',icon: '📋' },
];

// ─── Field component (defined OUTSIDE — no remount on parent re-render) ────────
const Field = React.memo<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
  hint?: string; multiline?: boolean; rows?: number; step?: string;
  min?: number; max?: number;
}>(({ label, value, onChange, type = 'text', placeholder, required, hint, multiline, rows = 3, step, min, max }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={f.label}>{label}{required && <span style={{ color: RED, marginLeft: 3 }}>*</span>}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...f.input, resize: 'vertical', height: 'auto', minHeight: rows * 24 + 20 }}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        max={max}
        style={f.input}
      />
    )}
    {hint && <span style={f.hint}>{hint}</span>}
  </div>
));

// ─── Select component ─────────────────────────────────────────────────────────
const SelectField = React.memo<{
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}>(({ label, value, onChange, options, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={f.label}>{label}{required && <span style={{ color: RED, marginLeft: 3 }}>*</span>}</label>
    <select value={value} onChange={e => onChange(e.target.value)} required={required} style={f.input}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
));

// ─── Toggle (defined OUTSIDE) ─────────────────────────────────────────────────
const FeatureToggle = React.memo<{
  label: string; icon?: string; checked: boolean; onChange: (v: boolean) => void;
}>(({ label, icon, checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
      border: `1.5px solid ${checked ? RED : '#eef2f7'}`,
      backgroundColor: checked ? RED_BG : '#fafcff',
      transition: 'all 0.15s', userSelect: 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? RED : SLATE }}>{label}</span>
    </div>
    {/* Toggle track */}
    <div style={{
      width: 38, height: 22, borderRadius: 11,
      backgroundColor: checked ? RED : '#d1d5db',
      position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 19 : 3,
        width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
      }} />
    </div>
  </div>
));

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon?: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={f.section}>
    <div style={f.sectionTitle}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span>{title}</span>
    </div>
    {children}
  </div>
);

// ─── 2-col grid helper ────────────────────────────────────────────────────────
const Grid2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
    {children}
  </div>
);

// ─── Toggle grid helper ───────────────────────────────────────────────────────
const ToggleGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
    {children}
  </div>
);

// ─── Module-level styles (never re-created) ────────────────────────────────────
const f: Record<string, React.CSSProperties> = {
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' },
  hint:  { fontSize: 11, color: '#94a3b8' },
  input: {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: '1.5px solid #eef2f7', fontSize: 13, color: NAVY,
    backgroundColor: '#fafcff', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  section: {
    backgroundColor: '#fff', borderRadius: 16,
    border: '1px solid #eef2f7', padding: '22px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 14,
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: 11, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PropertyForm: React.FC<PropertyFormProps> = ({
  formData, onChange, onSubmit, onCancel, loading = false, submitText = 'Submit',
  images = [], onImagesChange, existingImages = [], onExistingImagesChange, onImageRemove,
}) => {
  const [activeTab,     setActiveTab]     = useState(0);
  const [uploadError,   setUploadError]   = useState<string | null>(null);
  const [amenityInput,  setAmenityInput]  = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stable callbacks so child components don't re-render unnecessarily
  const handleField = useCallback(
    (field: keyof PropertyFormData) => (value: string | boolean) => onChange(field, value),
    [onChange]
  );

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);
    const valid: UploadImage[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setUploadError('Only image files are allowed'); continue; }
      if (file.size > 5 * 1024 * 1024) { setUploadError('Each image must be under 5MB'); continue; }
      valid.push({ file, preview: URL.createObjectURL(file), is_main: images.length === 0 && existingImages.length === 0 && valid.length === 0 });
    }
    if (valid.length && onImagesChange) onImagesChange([...images, ...valid]);
    if (e.target) e.target.value = '';
  }, [images, existingImages, onImagesChange]);

  const removeNewImage = useCallback((idx: number) => {
    if (onImagesChange) onImagesChange(images.filter((_, i) => i !== idx));
  }, [images, onImagesChange]);

  const setMainNew = useCallback((idx: number) => {
    if (onImagesChange) onImagesChange(images.map((img, i) => ({ ...img, is_main: i === idx })));
  }, [images, onImagesChange]);

  const setMainExisting = useCallback((idx: number) => {
    if (onExistingImagesChange) onExistingImagesChange(existingImages.map((img, i) => ({ ...img, is_main: i === idx })));
  }, [existingImages, onExistingImagesChange]);

  const addAmenity = useCallback(() => {
    const val = amenityInput.trim();
    if (val && !formData.amenities.includes(val)) {
      onChange('amenities', [...formData.amenities, val]);
      setAmenityInput('');
    }
  }, [amenityInput, formData.amenities, onChange]);

  const removeAmenity = useCallback((a: string) => {
    onChange('amenities', formData.amenities.filter(x => x !== a));
  }, [formData.amenities, onChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 && existingImages.length === 0) {
      setUploadError('Please upload at least one image'); return;
    }
    onSubmit();
  }, [images.length, existingImages.length, onSubmit]);

  const totalImages = images.length + existingImages.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", maxWidth: 900, margin: '0 auto' }}>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
        borderRadius: 14, marginBottom: 18,
        border: '1px solid #eef2f7', padding: '10px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {TABS.map((tab, i) => {
            const isActive  = activeTab === i;
            const isDone    = activeTab > i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 13px', borderRadius: 24, border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? RED : isDone ? TEAL_BG : '#f1f5f9',
                  color: isActive ? '#fff' : isDone ? TEAL : SLATE,
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {isDone && <span style={{ fontSize: 10 }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 10, height: 3, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((activeTab + 1) / TABS.length) * 100}%`, backgroundColor: RED, borderRadius: 3, transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Step {activeTab + 1} of {TABS.length}</span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>{TABS[activeTab].icon} {TABS[activeTab].label}</span>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>

        {/* TAB 0: Basic Info */}
        {activeTab === 0 && (
          <>
            {/* Image upload */}
            <Section title="Property Images" icon="📷">
              {uploadError && (
                <div style={{ marginBottom: 12, padding: '10px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                  ⚠ {uploadError}
                </div>
              )}

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${totalImages > 0 ? TEAL : '#d1d5db'}`,
                  borderRadius: 14, padding: '32px 20px', textAlign: 'center',
                  cursor: 'pointer', backgroundColor: totalImages > 0 ? TEAL_BG : '#fafcff',
                  transition: 'all 0.2s', marginBottom: 16,
                }}
              >
                <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                  {totalImages > 0 ? `${totalImages} image${totalImages !== 1 ? 's' : ''} uploaded — click to add more` : 'Click to upload images'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>JPEG or PNG · Max 5MB each · First image = main photo</div>
              </div>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    Existing Images ({existingImages.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {existingImages.map((img, idx) => (
                      <div key={img.id} style={{ position: 'relative', width: 88, height: 72, borderRadius: 10, overflow: 'hidden', border: `2.5px solid ${img.is_main ? RED : '#eef2f7'}`, cursor: 'pointer', flexShrink: 0 }} onClick={() => setMainExisting(idx)}>
                        <img src={img.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {img.is_main && <span style={{ position: 'absolute', top: 4, left: 4, backgroundColor: RED, color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>MAIN</span>}
                        {onImageRemove && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onImageRemove(img.id); }}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              width: 20, height: 20, borderRadius: '50%',
                              border: 'none', backgroundColor: 'rgba(0,0,0,0.6)',
                              color: '#fff', cursor: 'pointer', fontSize: 10,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images */}
              {images.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>New Images</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 88, height: 72, borderRadius: 10, overflow: 'hidden', border: `2.5px solid ${img.is_main ? RED : '#eef2f7'}`, cursor: 'pointer', flexShrink: 0 }} onClick={() => setMainNew(idx)}>
                        <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {img.is_main && <span style={{ position: 'absolute', top: 4, left: 4, backgroundColor: RED, color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>MAIN</span>}
                        <button type="button" onClick={e => { e.stopPropagation(); removeNewImage(idx); }} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Basic fields */}
            <Section title="Basic Information" icon="🏠">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Property Title" value={formData.title} onChange={handleField('title')} required placeholder="e.g., Modern 3-Bedroom Villa in Kololo" />
                <Field label="Description" value={formData.description} onChange={handleField('description')} required multiline rows={4} placeholder="Describe your property in detail…" />
                <Grid2>
                  <SelectField label="Property Type" value={formData.property_type} onChange={handleField('property_type')} required options={[
                    { value: 'house', label: 'House' }, { value: 'apartment', label: 'Apartment' },
                    { value: 'land', label: 'Land' }, { value: 'commercial', label: 'Commercial' },
                    { value: 'condo', label: 'Condo' }, { value: 'villa', label: 'Villa' },
                    { value: 'townhouse', label: 'Townhouse' }, { value: 'duplex', label: 'Duplex' },
                    { value: 'bungalow', label: 'Bungalow' },
                  ]} />
                  <SelectField label="Transaction Type" value={formData.transaction_type} onChange={handleField('transaction_type')} required options={[
                    { value: 'sale', label: 'For Sale' }, { value: 'rent', label: 'For Rent' }, { value: 'shortlet', label: 'Shortlet' },
                  ]} />
                  <Field label="Price (UGX)" value={formData.price} onChange={handleField('price')} type="number" required />
                  <Field label="Bedrooms" value={formData.bedrooms} onChange={handleField('bedrooms')} type="number" />
                  <Field label="Bathrooms" value={formData.bathrooms} onChange={handleField('bathrooms')} type="number" />
                  <Field label="Square Meters" value={formData.square_meters} onChange={handleField('square_meters')} type="number" />
                  <Field label="Year Built" value={formData.year_built} onChange={handleField('year_built')} type="number" />
                  <SelectField label="Furnishing Status" value={formData.furnishing_status} onChange={handleField('furnishing_status')} options={[
                    { value: 'unfurnished', label: 'Unfurnished' }, { value: 'semi_furnished', label: 'Semi-Furnished' },
                    { value: 'fully_furnished', label: 'Fully Furnished' }, { value: 'luxury', label: 'Luxury Furnished' },
                  ]} />
                </Grid2>
              </div>
            </Section>
          </>
        )}

        {/* TAB 1: Location */}
        {activeTab === 1 && (
          <Section title="Property Location" icon="📍">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Grid2>
                <Field label="Latitude" value={formData.latitude} onChange={handleField('latitude')} type="number" required hint="e.g. 0.3136" step="any" />
                <Field label="Longitude" value={formData.longitude} onChange={handleField('longitude')} type="number" required hint="e.g. 32.5811" step="any" />
              </Grid2>
              <Field label="Full Address" value={formData.address} onChange={handleField('address')} required placeholder="e.g., Plot 12, Acacia Avenue, Kololo" />
              <Grid2>
                <Field label="City" value={formData.city} onChange={handleField('city')} required />
                <Field label="District" value={formData.district} onChange={handleField('district')} required />
              </Grid2>
            </div>
          </Section>
        )}

        {/* TAB 2: Media */}
        {activeTab === 2 && (
          <Section title="Video & Virtual Tours" icon="🎬">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Video File Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={f.label}>Upload Video File</label>
                <div
                  onClick={() => document.getElementById('video-file-upload')?.click()}
                  style={{
                    border: `2px dashed ${formData.video_file ? TEAL : '#d1d5db'}`,
                    borderRadius: 10, padding: '20px', textAlign: 'center',
                    cursor: 'pointer', backgroundColor: formData.video_file ? TEAL_BG : '#fafcff',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    id="video-file-upload"
                    type="file"
                    accept="video/mp4,video/mov,video/avi,video/webm"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (100MB limit)
                        if (file.size > 100 * 1024 * 1024) {
                          alert('Video file must be less than 100MB');
                          return;
                        }
                        onChange('video_file', file);
                      }
                    }}
                  />
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎥</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                    {formData.video_file ? formData.video_file.name : 'Click to upload video file'}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    MP4, MOV, AVI, WEBM · Max 100MB
                  </div>
                </div>
                {formData.video_file && (
                  <button
                    type="button"
                    onClick={() => onChange('video_file', null)}
                    style={{
                      alignSelf: 'flex-start', marginTop: 8,
                      padding: '4px 12px', borderRadius: 6,
                      border: '1px solid #fee2e2', backgroundColor: '#fee2e2',
                      color: '#b91c1c', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Remove video file
                  </button>
                )}
              </div>

              {/* OR Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#eef2f7' }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>OR</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#eef2f7' }} />
              </div>

              {/* Video URL */}
              <Field 
                label="YouTube / Vimeo Video URL" 
                value={formData.video_url} 
                onChange={handleField('video_url')} 
                type="url" 
                placeholder="https://youtube.com/watch?v=…" 
                hint="Add a video walkthrough of your property" 
              />
              
              {/* Virtual Tour URL */}
              <Field 
                label="Virtual Tour URL" 
                value={formData.virtual_tour_url} 
                onChange={handleField('virtual_tour_url')} 
                type="url" 
                placeholder="https://…" 
                hint="360° virtual tour link (Matterport, etc.)" 
              />
            </div>
          </Section>
        )}

        {/* TAB 3: Neighborhood */}
        {activeTab === 3 && (
          <Section title="Neighborhood Information" icon="🏘️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Neighborhood Name" value={formData.neighborhood_name} onChange={handleField('neighborhood_name')} placeholder="e.g., Kololo, Nakasero, Muyenga" />
              <Field label="Neighborhood Description" value={formData.neighborhood_description} onChange={handleField('neighborhood_description')} multiline rows={3} placeholder="Describe the neighborhood and its highlights…" />
              <Grid2>
                <Field label="Distance to City Center (km)" value={formData.distance_to_city_center} onChange={handleField('distance_to_city_center')} type="number" step="0.1" />
                <Field label="Distance to Airport (km)" value={formData.distance_to_airport} onChange={handleField('distance_to_airport')} type="number" step="0.1" />
                <Field label="Distance to Highway (km)" value={formData.distance_to_highway} onChange={handleField('distance_to_highway')} type="number" step="0.1" />
              </Grid2>
            </div>
          </Section>
        )}

        {/* TAB 4: Schools */}
        {activeTab === 4 && (
          <Section title="Nearby Schools" icon="🎓">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nearby Schools" value={formData.nearby_schools} onChange={handleField('nearby_schools')} placeholder="Aga Khan, Kampala International, Greenhill Academy" hint="Separate multiple schools with commas" />
              <Grid2>
                <Field label="Distance to Nearest School (km)" value={formData.distance_to_nearest_school} onChange={handleField('distance_to_nearest_school')} type="number" step="0.1" />
                <Field label="School Rating (1–5)" value={formData.school_rating} onChange={handleField('school_rating')} type="number" step="0.1" min={0} max={5} />
              </Grid2>
            </div>
          </Section>
        )}

        {/* TAB 5: Transport */}
        {activeTab === 5 && (
          <Section title="Transportation & Access" icon="🚗">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nearby Roads" value={formData.nearby_roads} onChange={handleField('nearby_roads')} placeholder="Jinja Road, Entebbe Road…" hint="Separate with commas" />
              <Field label="Nearest Main Road" value={formData.nearest_road} onChange={handleField('nearest_road')} />
              <Grid2>
                <Field label="Nearest Bus Stop" value={formData.nearest_bus_stop} onChange={handleField('nearest_bus_stop')} />
                <Field label="Nearest Taxi Stage" value={formData.nearest_taxi_stage} onChange={handleField('nearest_taxi_stage')} />
              </Grid2>
              <FeatureToggle label="Public Transport Available Nearby" icon="🚌" checked={formData.public_transport} onChange={handleField('public_transport') as (v: boolean) => void} />
            </div>
          </Section>
        )}

        {/* TAB 6: Amenities */}
        {activeTab === 6 && (
          <>
            <Section title="Custom Amenities" icon="✨">
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={amenityInput}
                  onChange={e => setAmenityInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
                  placeholder="Type an amenity and press Enter…"
                  style={{ ...f.input, flex: 1 }}
                />
                <button type="button" onClick={addAmenity} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>+ Add</button>
              </div>
              {formData.amenities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {formData.amenities.map((a, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: RED_BG, color: RED, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                      {a}
                      <button type="button" onClick={() => removeAmenity(a)} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              {formData.amenities.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>No custom amenities added yet.</div>}
            </Section>

            <Section title="Nearby Places" icon="🗺️">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Grid2>
                  <Field label="Nearest Mall" value={formData.nearest_mall} onChange={handleField('nearest_mall')} />
                  <Field label="Distance to Mall (km)" value={formData.distance_to_mall} onChange={handleField('distance_to_mall')} type="number" step="0.1" />
                  <Field label="Nearest Supermarket" value={formData.nearest_supermarket} onChange={handleField('nearest_supermarket')} />
                  <Field label="Nearest Market" value={formData.nearest_market} onChange={handleField('nearest_market')} />
                  <Field label="Nearest Pharmacy" value={formData.nearest_pharmacy} onChange={handleField('nearest_pharmacy')} />
                  <Field label="Nearest Hospital" value={formData.nearest_hospital} onChange={handleField('nearest_hospital')} />
                  <Field label="Distance to Hospital (km)" value={formData.distance_to_hospital} onChange={handleField('distance_to_hospital')} type="number" step="0.1" />
                  <Field label="Nearest Restaurant" value={formData.nearest_restaurant} onChange={handleField('nearest_restaurant')} />
                  <Field label="Nearest Café" value={formData.nearest_cafe} onChange={handleField('nearest_cafe')} />
                  <Field label="Nearest Gym" value={formData.nearest_gym} onChange={handleField('nearest_gym')} />
                  <Field label="Nearest Park" value={formData.nearest_park} onChange={handleField('nearest_park')} />
                </Grid2>
              </div>
            </Section>
          </>
        )}

        {/* TAB 7: Security */}
        {activeTab === 7 && (
          <Section title="Security Features" icon="🔒">
            <ToggleGrid>
              <FeatureToggle label="24/7 Security" icon="👮" checked={formData.has_security} onChange={handleField('has_security') as (v:boolean)=>void} />
              <FeatureToggle label="CCTV Cameras" icon="📹" checked={formData.has_cctv} onChange={handleField('has_cctv') as (v:boolean)=>void} />
              <FeatureToggle label="Electric Fence" icon="⚡" checked={formData.has_electric_fence} onChange={handleField('has_electric_fence') as (v:boolean)=>void} />
              <FeatureToggle label="Security Lights" icon="💡" checked={formData.has_security_lights} onChange={handleField('has_security_lights') as (v:boolean)=>void} />
              <FeatureToggle label="Security Guards" icon="🛡️" checked={formData.has_security_guards} onChange={handleField('has_security_guards') as (v:boolean)=>void} />
              <FeatureToggle label="Gated Community" icon="🏘️" checked={formData.has_gated_community} onChange={handleField('has_gated_community') as (v:boolean)=>void} />
            </ToggleGrid>
          </Section>
        )}

        {/* TAB 8: Features */}
        {activeTab === 8 && (
          <>
            <Section title="Utilities" icon="🔌">
              <ToggleGrid>
                <FeatureToggle label="Solar Power"        icon="☀️"  checked={formData.has_solar}             onChange={handleField('has_solar') as (v:boolean)=>void} />
                <FeatureToggle label="Backup Generator"   icon="⚡"  checked={formData.has_backup_generator}   onChange={handleField('has_backup_generator') as (v:boolean)=>void} />
                <FeatureToggle label="Water Tank"         icon="💧"  checked={formData.has_water_tank}         onChange={handleField('has_water_tank') as (v:boolean)=>void} />
                <FeatureToggle label="Borehole"           icon="🌊"  checked={formData.has_borehole}           onChange={handleField('has_borehole') as (v:boolean)=>void} />
                <FeatureToggle label="High-speed Internet"icon="📶"  checked={formData.has_internet}           onChange={handleField('has_internet') as (v:boolean)=>void} />
                <FeatureToggle label="Cable TV"           icon="📺"  checked={formData.has_cable_tv}           onChange={handleField('has_cable_tv') as (v:boolean)=>void} />
              </ToggleGrid>
            </Section>

            <Section title="Outdoor Features" icon="🌿">
              <ToggleGrid>
                <FeatureToggle label="Garden"        icon="🌱" checked={formData.has_garden}        onChange={handleField('has_garden') as (v:boolean)=>void} />
                <FeatureToggle label="Balcony"       icon="🏡" checked={formData.has_balcony}       onChange={handleField('has_balcony') as (v:boolean)=>void} />
                <FeatureToggle label="Terrace"       icon="🏙️" checked={formData.has_terrace}       onChange={handleField('has_terrace') as (v:boolean)=>void} />
                <FeatureToggle label="Swimming Pool" icon="🏊" checked={formData.has_swimming_pool} onChange={handleField('has_swimming_pool') as (v:boolean)=>void} />
                <FeatureToggle label="Playground"    icon="🛝" checked={formData.has_playground}    onChange={handleField('has_playground') as (v:boolean)=>void} />
                <FeatureToggle label="BBQ Area"      icon="🔥" checked={formData.has_bbq_area}      onChange={handleField('has_bbq_area') as (v:boolean)=>void} />
              </ToggleGrid>
            </Section>

            <Section title="Interior Features" icon="🛋️">
              <ToggleGrid>
                <FeatureToggle label="Air Conditioning" icon="❄️" checked={formData.has_air_conditioning} onChange={handleField('has_air_conditioning') as (v:boolean)=>void} />
                <FeatureToggle label="Heating"          icon="🌡️" checked={formData.has_heating}          onChange={handleField('has_heating') as (v:boolean)=>void} />
                <FeatureToggle label="Fireplace"        icon="🔥" checked={formData.has_fireplace}        onChange={handleField('has_fireplace') as (v:boolean)=>void} />
                <FeatureToggle label="Modern Kitchen"   icon="🍳" checked={formData.has_modern_kitchen}   onChange={handleField('has_modern_kitchen') as (v:boolean)=>void} />
                <FeatureToggle label="Walk-in Closet"   icon="👔" checked={formData.has_walk_in_closet}   onChange={handleField('has_walk_in_closet') as (v:boolean)=>void} />
                <FeatureToggle label="Study Room"       icon="📚" checked={formData.has_study_room}       onChange={handleField('has_study_room') as (v:boolean)=>void} />
              </ToggleGrid>
            </Section>

            <Section title="Rules & Restrictions" icon="📌">
              <ToggleGrid>
                <FeatureToggle label="Pets Allowed"    icon="🐾" checked={formData.pets_allowed}    onChange={handleField('pets_allowed') as (v:boolean)=>void} />
                <FeatureToggle label="Smoking Allowed" icon="🚬" checked={formData.smoking_allowed} onChange={handleField('smoking_allowed') as (v:boolean)=>void} />
              </ToggleGrid>
            </Section>

            <Section title="Parking" icon="🚗">
              <Grid2>
                <SelectField label="Parking Type" value={formData.parking_type} onChange={handleField('parking_type')} options={[
                  { value: 'none', label: 'No Parking' }, { value: 'street', label: 'Street Parking' },
                  { value: 'open', label: 'Open Parking' }, { value: 'covered', label: 'Covered Parking' },
                  { value: 'garage', label: 'Garage' }, { value: 'multiple', label: 'Multiple Garages' },
                ]} />
                <Field label="Number of Parking Spaces" value={formData.parking_spaces} onChange={handleField('parking_spaces')} type="number" />
              </Grid2>
            </Section>
          </>
        )}

        {/* TAB 9: Legal & Contact */}
        {activeTab === 9 && (
          <>
            <Section title="Legal Information" icon="⚖️">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <FeatureToggle label="Has Title Deed" icon="📄" checked={formData.has_title_deed} onChange={handleField('has_title_deed') as (v:boolean)=>void} />
                <Grid2>
                  <Field label="Title Deed Number" value={formData.title_deed_number} onChange={handleField('title_deed_number')} />
                  <Field label="Land Registration Number" value={formData.land_registration_number} onChange={handleField('land_registration_number')} />
                </Grid2>
              </div>
            </Section>

            <Section title="Agent Contact" icon="📞">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Grid2>
                  <Field label="Agent Phone Number" value={formData.agent_phone} onChange={handleField('agent_phone')} placeholder="+256 700 000 000" />
                  <Field label="Agent Email" value={formData.agent_email} onChange={handleField('agent_email')} type="email" placeholder="agent@company.com" />
                </Grid2>
                <Field label="Viewing Instructions" value={formData.viewing_instructions} onChange={handleField('viewing_instructions')} multiline rows={3} placeholder="Instructions for scheduling property viewings…" />
              </div>
            </Section>
          </>
        )}

        {/* ── Footer actions ──────────────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
          borderTop: '1px solid #eef2f7', borderRadius: '0 0 14px 14px',
          padding: '14px 16px', marginTop: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        }}>
          {/* Previous */}
          <div>
            {activeTab > 0 && (
              <button type="button" onClick={() => setActiveTab(t => t - 1)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Previous
              </button>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {onCancel && (
              <button type="button" onClick={onCancel} disabled={loading} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            )}
            {activeTab < TABS.length - 1 ? (
              <button type="button" onClick={() => setActiveTab(t => t + 1)} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(230,57,70,0.28)' }}>
                Next Step →
              </button>
            ) : (
              <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', backgroundColor: loading ? '#94a3b8' : RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 12px rgba(230,57,70,0.28)' }}>
                {loading ? (
                  <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'pfSpin 0.7s linear infinite' }} /> Saving…</>
                ) : `✓ ${submitText}`}
              </button>
            )}
          </div>
        </div>
      </form>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pfSpin { to { transform: rotate(360deg); } }
        input[type="text"]:focus, input[type="number"]:focus, input[type="email"]:focus,
        input[type="url"]:focus, textarea:focus, select:focus {
          border-color: ${RED} !important;
          outline: none;
          background-color: #fff !important;
          box-shadow: 0 0 0 3px rgba(230,57,70,0.08);
        }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        select option { color: ${NAVY}; }
      `}</style>
    </div>
  );
};

export default PropertyForm;