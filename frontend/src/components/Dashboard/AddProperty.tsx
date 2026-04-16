// src/pages/dashboard/AddProperty.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_DARK = '#c1121f';
const RED_BG = 'rgba(230,57,70,0.08)';
const NAVY = '#0d1b2e';
const SLATE = '#475569';
const TEAL = '#25a882';
const GRAY_BG = '#f8faff';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UploadImage {
  file: File;
  preview: string;
  is_main: boolean;
}

interface FormData {
  // Basic Info
  title: string;
  description: string;
  property_type: string;
  transaction_type: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  square_meters: string;
  
  // Location
  address: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
  
  // Video
  video_url: string;
  video_file: File | null;
  virtual_tour_url: string;
  
  // Neighborhood
  neighborhood_name: string;
  neighborhood_description: string;
  distance_to_city_center: string;
  distance_to_airport: string;
  distance_to_highway: string;
  
  // Schools
  nearby_schools: string;
  distance_to_nearest_school: string;
  school_rating: string;
  
  // Transportation
  nearby_roads: string;
  nearest_road: string;
  public_transport: boolean;
  nearest_bus_stop: string;
  nearest_taxi_stage: string;
  
  // Shopping & Amenities
  amenities: string[];
  nearest_mall: string;
  distance_to_mall: string;
  nearest_supermarket: string;
  nearest_market: string;
  nearest_pharmacy: string;
  nearest_hospital: string;
  distance_to_hospital: string;
  
  // Entertainment
  nearest_restaurant: string;
  nearest_cafe: string;
  nearest_gym: string;
  nearest_park: string;
  
  // Property Features
  year_built: string;
  furnishing_status: string;
  parking_type: string;
  parking_spaces: string;
  
  // Security
  has_security: boolean;
  has_cctv: boolean;
  has_electric_fence: boolean;
  has_security_lights: boolean;
  has_security_guards: boolean;
  has_gated_community: boolean;
  
  // Utilities
  has_solar: boolean;
  has_backup_generator: boolean;
  has_water_tank: boolean;
  has_borehole: boolean;
  has_internet: boolean;
  has_cable_tv: boolean;
  
  // Outdoor
  has_garden: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_swimming_pool: boolean;
  has_playground: boolean;
  has_bbq_area: boolean;
  
  // Interior
  has_air_conditioning: boolean;
  has_heating: boolean;
  has_fireplace: boolean;
  has_modern_kitchen: boolean;
  has_walk_in_closet: boolean;
  has_study_room: boolean;
  
  // Restrictions
  pets_allowed: boolean;
  smoking_allowed: boolean;
  
  // Legal
  has_title_deed: boolean;
  title_deed_number: string;
  land_registration_number: string;
  
  // Contact
  agent_phone: string;
  agent_email: string;
  viewing_instructions: string;
}

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    property_type: 'house',
    transaction_type: 'sale',
    price: '',
    bedrooms: '',
    bathrooms: '',
    square_meters: '',
    address: '',
    city: '',
    district: '',
    latitude: '',
    longitude: '',
    video_url: '',
    video_file: null,
    virtual_tour_url: '',
    neighborhood_name: '',
    neighborhood_description: '',
    distance_to_city_center: '',
    distance_to_airport: '',
    distance_to_highway: '',
    nearby_schools: '',
    distance_to_nearest_school: '',
    school_rating: '',
    nearby_roads: '',
    nearest_road: '',
    public_transport: false,
    nearest_bus_stop: '',
    nearest_taxi_stage: '',
    amenities: [],
    nearest_mall: '',
    distance_to_mall: '',
    nearest_supermarket: '',
    nearest_market: '',
    nearest_pharmacy: '',
    nearest_hospital: '',
    distance_to_hospital: '',
    nearest_restaurant: '',
    nearest_cafe: '',
    nearest_gym: '',
    nearest_park: '',
    year_built: '',
    furnishing_status: 'unfurnished',
    parking_type: 'none',
    parking_spaces: '',
    has_security: false,
    has_cctv: false,
    has_electric_fence: false,
    has_security_lights: false,
    has_security_guards: false,
    has_gated_community: false,
    has_solar: false,
    has_backup_generator: false,
    has_water_tank: false,
    has_borehole: false,
    has_internet: false,
    has_cable_tv: false,
    has_garden: false,
    has_balcony: false,
    has_terrace: false,
    has_swimming_pool: false,
    has_playground: false,
    has_bbq_area: false,
    has_air_conditioning: false,
    has_heating: false,
    has_fireplace: false,
    has_modern_kitchen: false,
    has_walk_in_closet: false,
    has_study_room: false,
    pets_allowed: true,
    smoking_allowed: true,
    has_title_deed: false,
    title_deed_number: '',
    land_registration_number: '',
    agent_phone: user?.phone || '',
    agent_email: user?.email || '',
    viewing_instructions: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleBooleanChange = (field: keyof FormData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAmenitiesAdd = () => {
    if (amenitiesInput.trim() && !formData.amenities.includes(amenitiesInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenitiesInput.trim()]
      }));
      setAmenitiesInput('');
    }
  };

  const handleAmenitiesRemove = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      is_main: images.length === 0 && index === 0
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleSetMainImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_main: i === index
    })));
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    
    // Append all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'amenities') {
          submitData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          submitData.append(key, String(value));
        } else {
          submitData.append(key, String(value));
        }
      }
    });

    // Append images
    images.forEach((image, index) => {
      submitData.append('images', image.file);
      if (image.is_main) {
        submitData.append('main_image_index', String(index));
      }
    });

    try {
      await api.post('/properties/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard/properties');
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Failed to create property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 0, name: 'Basic Info', icon: '📋', color: RED },
    { id: 1, name: 'Location', icon: '📍', color: '#3498db' },
    { id: 2, name: 'Media', icon: '🎬', color: '#9b59b6' },
    { id: 3, name: 'Neighborhood', icon: '🏘️', color: '#1abc9c' },
    { id: 4, name: 'Schools', icon: '🎓', color: '#f39c12' },
    { id: 5, name: 'Transport', icon: '🚗', color: '#e67e22' },
    { id: 6, name: 'Amenities', icon: '✨', color: '#2ecc71' },
    { id: 7, name: 'Security', icon: '🔒', color: '#e74c3c' },
    { id: 8, name: 'Features', icon: '🏠', color: '#34495e' },
    { id: 9, name: 'Legal & Contact', icon: '📄', color: '#95a5a6' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Add New Property</h1>
          <p style={styles.subtitle}>List your property and reach thousands of potential buyers</p>
        </div>
        <button onClick={() => navigate('/dashboard/properties')} style={styles.cancelBtn}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Tab Navigation */}
        <div style={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === tab.id ? RED_BG : 'transparent',
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
                color: activeTab === tab.id ? tab.color : SLATE,
              }}
            >
              <span style={{ fontSize: 18, marginRight: 8 }}>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <div style={styles.formContent}>
          {/* Tab 0: Basic Info */}
          {activeTab === 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Basic Information</h2>
                <p style={styles.sectionSubtitle}>Tell buyers about your property</p>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Property Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Modern 3-Bedroom Villa in Kololo"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Property Type *</label>
                  <select name="property_type" value={formData.property_type} onChange={handleInputChange} style={styles.select} required>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                    <option value="condo">Condo</option>
                    <option value="villa">Villa</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="duplex">Duplex</option>
                    <option value="bungalow">Bungalow</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Transaction Type *</label>
                  <select name="transaction_type" value={formData.transaction_type} onChange={handleInputChange} style={styles.select} required>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                    <option value="shortlet">Shortlet</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (UGX) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 500000000"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="Number of bedrooms"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="Number of bathrooms"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Area (m²)</label>
                  <input
                    type="number"
                    name="square_meters"
                    value={formData.square_meters}
                    onChange={handleInputChange}
                    placeholder="Size in square meters"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your property in detail..."
                    rows={6}
                    style={styles.textarea}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Location */}
          {activeTab === 1 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Location Details</h2>
                <p style={styles.sectionSubtitle}>Where is your property located?</p>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Kampala"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>District *</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="e.g., Kampala Central"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 0.3136"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 32.5811"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Media */}
          {activeTab === 2 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Photos & Video</h2>
                <p style={styles.sectionSubtitle}>Showcase your property with media</p>
              </div>

              {/* Image Upload */}
              <div style={styles.imageUploadSection}>
                <label style={styles.label}>Property Photos</label>
                <div
                  style={styles.imageUploadArea}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 40 }}>📸</span>
                  <p style={styles.uploadText}>Click to upload photos</p>
                  <p style={styles.uploadSubtext}>PNG, JPG up to 10MB</p>
                </div>

                {images.length > 0 && (
                  <div style={styles.imagePreviewGrid}>
                    {images.map((img, idx) => (
                      <div key={idx} style={styles.imagePreviewCard}>
                        <img src={img.preview} alt={`Preview ${idx}`} style={styles.imagePreview} />
                        <div style={styles.imageActions}>
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(idx)}
                            style={{
                              ...styles.imageBtn,
                              backgroundColor: img.is_main ? RED : '#e2e8f0',
                              color: img.is_main ? '#fff' : SLATE,
                            }}
                          >
                            {img.is_main ? '★ Main' : 'Set Main'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{ ...styles.imageBtn, backgroundColor: '#ef4444', color: '#fff' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>YouTube/Vimeo URL</label>
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    placeholder="https://youtube.com/..."
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Virtual Tour URL</label>
                  <input
                    type="url"
                    name="virtual_tour_url"
                    value={formData.virtual_tour_url}
                    onChange={handleInputChange}
                    placeholder="360° virtual tour link"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Neighborhood */}
          {activeTab === 3 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Neighborhood Information</h2>
                <p style={styles.sectionSubtitle}>Help buyers understand the area</p>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Neighborhood Name</label>
                  <input
                    type="text"
                    name="neighborhood_name"
                    value={formData.neighborhood_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Kololo, Naguru, Ntinda"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Neighborhood Description</label>
                  <textarea
                    name="neighborhood_description"
                    value={formData.neighborhood_description}
                    onChange={handleInputChange}
                    placeholder="Describe the neighborhood..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Distance to City Center (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance_to_city_center"
                    value={formData.distance_to_city_center}
                    onChange={handleInputChange}
                    placeholder="e.g., 5.5"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Distance to Airport (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance_to_airport"
                    value={formData.distance_to_airport}
                    onChange={handleInputChange}
                    placeholder="e.g., 45"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Distance to Highway (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance_to_highway"
                    value={formData.distance_to_highway}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Schools */}
          {activeTab === 4 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Nearby Schools</h2>
                <p style={styles.sectionSubtitle}>Great for families with children</p>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Nearby Schools (comma separated)</label>
                  <input
                    type="text"
                    name="nearby_schools"
                    value={formData.nearby_schools}
                    onChange={handleInputChange}
                    placeholder="e.g., Aga Khan, Kampala International, Greenhill"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Distance to Nearest School (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance_to_nearest_school"
                    value={formData.distance_to_nearest_school}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.2"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>School Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    name="school_rating"
                    value={formData.school_rating}
                    onChange={handleInputChange}
                    placeholder="e.g., 4.5"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Transportation */}
          {activeTab === 5 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Transportation</h2>
                <p style={styles.sectionSubtitle}>Commute and accessibility</p>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Nearby Roads (comma separated)</label>
                  <input
                    type="text"
                    name="nearby_roads"
                    value={formData.nearby_roads}
                    onChange={handleInputChange}
                    placeholder="e.g., Jinja Road, Entebbe Road"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Main Road</label>
                  <input
                    type="text"
                    name="nearest_road"
                    value={formData.nearest_road}
                    onChange={handleInputChange}
                    placeholder="e.g., Jinja Road"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Bus Stop</label>
                  <input
                    type="text"
                    name="nearest_bus_stop"
                    value={formData.nearest_bus_stop}
                    onChange={handleInputChange}
                    placeholder="e.g., Clock Tower"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Taxi Stage</label>
                  <input
                    type="text"
                    name="nearest_taxi_stage"
                    value={formData.nearest_taxi_stage}
                    onChange={handleInputChange}
                    placeholder="e.g., Old Taxi Park"
                    style={styles.input}
                  />
                </div>

                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="public_transport"
                      checked={formData.public_transport}
                      onChange={handleInputChange}
                      style={styles.checkbox}
                    />
                    <span>Public transport available nearby</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Amenities */}
          {activeTab === 6 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Amenities & Features</h2>
                <p style={styles.sectionSubtitle}>What makes your property special?</p>
              </div>

              {/* Custom Amenities */}
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Amenities</label>
                <div style={styles.tagInputContainer}>
                  <input
                    type="text"
                    value={amenitiesInput}
                    onChange={(e) => setAmenitiesInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAmenitiesAdd())}
                    placeholder="Type an amenity and press Enter (e.g., Swimming Pool, Gym, Security)"
                    style={styles.tagInput}
                  />
                  <button type="button" onClick={handleAmenitiesAdd} style={styles.tagAddBtn}>
                    Add
                  </button>
                </div>
                <div style={styles.tagsContainer}>
                  {formData.amenities.map((amenity, idx) => (
                    <span key={idx} style={styles.tag}>
                      {amenity}
                      <button type="button" onClick={() => handleAmenitiesRemove(amenity)} style={styles.tagRemove}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Nearby Places */}
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Mall</label>
                  <input
                    type="text"
                    name="nearest_mall"
                    value={formData.nearest_mall}
                    onChange={handleInputChange}
                    placeholder="e.g., Acacia Mall"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Distance to Mall (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance_to_mall"
                    value={formData.distance_to_mall}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.5"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Supermarket</label>
                  <input
                    type="text"
                    name="nearest_supermarket"
                    value={formData.nearest_supermarket}
                    onChange={handleInputChange}
                    placeholder="e.g., Shoprite"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Market</label>
                  <input
                    type="text"
                    name="nearest_market"
                    value={formData.nearest_market}
                    onChange={handleInputChange}
                    placeholder="e.g., Nakasero Market"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Pharmacy</label>
                  <input
                    type="text"
                    name="nearest_pharmacy"
                    value={formData.nearest_pharmacy}
                    onChange={handleInputChange}
                    placeholder="e.g., Guardian Pharmacy"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Hospital</label>
                  <input
                    type="text"
                    name="nearest_hospital"
                    value={formData.nearest_hospital}
                    onChange={handleInputChange}
                    placeholder="e.g., IHK"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Distance to Hospital (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance_to_hospital"
                    value={formData.distance_to_hospital}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Restaurant</label>
                  <input
                    type="text"
                    name="nearest_restaurant"
                    value={formData.nearest_restaurant}
                    onChange={handleInputChange}
                    placeholder="e.g., Fang Fang"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Cafe</label>
                  <input
                    type="text"
                    name="nearest_cafe"
                    value={formData.nearest_cafe}
                    onChange={handleInputChange}
                    placeholder="e.g., Cafe Javas"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Gym</label>
                  <input
                    type="text"
                    name="nearest_gym"
                    value={formData.nearest_gym}
                    onChange={handleInputChange}
                    placeholder="e.g., Fitness First"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nearest Park</label>
                  <input
                    type="text"
                    name="nearest_park"
                    value={formData.nearest_park}
                    onChange={handleInputChange}
                    placeholder="e.g., Kololo Independence Grounds"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Security */}
          {activeTab === 7 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Security Features</h2>
                <p style={styles.sectionSubtitle}>Peace of mind for buyers</p>
              </div>
              
              <div style={styles.checkboxGrid}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.has_security} onChange={() => handleBooleanChange('has_security')} style={styles.checkbox} />
                  <span>Security (General)</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.has_cctv} onChange={() => handleBooleanChange('has_cctv')} style={styles.checkbox} />
                  <span>CCTV Cameras</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.has_electric_fence} onChange={() => handleBooleanChange('has_electric_fence')} style={styles.checkbox} />
                  <span>Electric Fence</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.has_security_lights} onChange={() => handleBooleanChange('has_security_lights')} style={styles.checkbox} />
                  <span>Security Lights</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.has_security_guards} onChange={() => handleBooleanChange('has_security_guards')} style={styles.checkbox} />
                  <span>Security Guards</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.has_gated_community} onChange={() => handleBooleanChange('has_gated_community')} style={styles.checkbox} />
                  <span>Gated Community</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 8: Features */}
          {activeTab === 8 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Property Features</h2>
                <p style={styles.sectionSubtitle}>Detailed property specifications</p>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Year Built</label>
                  <input
                    type="number"
                    name="year_built"
                    value={formData.year_built}
                    onChange={handleInputChange}
                    placeholder="e.g., 2020"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Furnishing Status</label>
                  <select name="furnishing_status" value={formData.furnishing_status} onChange={handleInputChange} style={styles.select}>
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi_furnished">Semi-Furnished</option>
                    <option value="fully_furnished">Fully Furnished</option>
                    <option value="luxury">Luxury Furnished</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Parking Type</label>
                  <select name="parking_type" value={formData.parking_type} onChange={handleInputChange} style={styles.select}>
                    <option value="none">No Parking</option>
                    <option value="street">Street Parking</option>
                    <option value="open">Open Parking</option>
                    <option value="covered">Covered Parking</option>
                    <option value="garage">Garage</option>
                    <option value="multiple">Multiple Garages</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Parking Spaces</label>
                  <input
                    type="number"
                    name="parking_spaces"
                    value={formData.parking_spaces}
                    onChange={handleInputChange}
                    placeholder="Number of parking spaces"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Utilities */}
              <h3 style={styles.subsectionTitle}>Utilities</h3>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_solar} onChange={() => handleBooleanChange('has_solar')} style={styles.checkbox} /><span>Solar Power</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_backup_generator} onChange={() => handleBooleanChange('has_backup_generator')} style={styles.checkbox} /><span>Backup Generator</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_water_tank} onChange={() => handleBooleanChange('has_water_tank')} style={styles.checkbox} /><span>Water Tank</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_borehole} onChange={() => handleBooleanChange('has_borehole')} style={styles.checkbox} /><span>Borehole</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_internet} onChange={() => handleBooleanChange('has_internet')} style={styles.checkbox} /><span>High-speed Internet</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_cable_tv} onChange={() => handleBooleanChange('has_cable_tv')} style={styles.checkbox} /><span>Cable TV</span></label>
              </div>

              {/* Outdoor Features */}
              <h3 style={styles.subsectionTitle}>Outdoor Features</h3>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_garden} onChange={() => handleBooleanChange('has_garden')} style={styles.checkbox} /><span>Garden</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_balcony} onChange={() => handleBooleanChange('has_balcony')} style={styles.checkbox} /><span>Balcony</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_terrace} onChange={() => handleBooleanChange('has_terrace')} style={styles.checkbox} /><span>Terrace</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_swimming_pool} onChange={() => handleBooleanChange('has_swimming_pool')} style={styles.checkbox} /><span>Swimming Pool</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_playground} onChange={() => handleBooleanChange('has_playground')} style={styles.checkbox} /><span>Playground</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_bbq_area} onChange={() => handleBooleanChange('has_bbq_area')} style={styles.checkbox} /><span>BBQ Area</span></label>
              </div>

              {/* Interior Features */}
              <h3 style={styles.subsectionTitle}>Interior Features</h3>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_air_conditioning} onChange={() => handleBooleanChange('has_air_conditioning')} style={styles.checkbox} /><span>Air Conditioning</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_heating} onChange={() => handleBooleanChange('has_heating')} style={styles.checkbox} /><span>Heating</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_fireplace} onChange={() => handleBooleanChange('has_fireplace')} style={styles.checkbox} /><span>Fireplace</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_modern_kitchen} onChange={() => handleBooleanChange('has_modern_kitchen')} style={styles.checkbox} /><span>Modern Kitchen</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_walk_in_closet} onChange={() => handleBooleanChange('has_walk_in_closet')} style={styles.checkbox} /><span>Walk-in Closet</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.has_study_room} onChange={() => handleBooleanChange('has_study_room')} style={styles.checkbox} /><span>Study Room</span></label>
              </div>

              {/* Restrictions */}
              <h3 style={styles.subsectionTitle}>Restrictions</h3>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.pets_allowed} onChange={() => handleBooleanChange('pets_allowed')} style={styles.checkbox} /><span>Pets Allowed</span></label>
                <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.smoking_allowed} onChange={() => handleBooleanChange('smoking_allowed')} style={styles.checkbox} /><span>Smoking Allowed</span></label>
              </div>
            </div>
          )}

          {/* Tab 9: Legal & Contact */}
          {activeTab === 9 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Legal & Contact Information</h2>
                <p style={styles.sectionSubtitle}>Important documents and contact details</p>
              </div>

              {/* Legal */}
              <h3 style={styles.subsectionTitle}>Legal Documents</h3>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.has_title_deed} onChange={() => handleBooleanChange('has_title_deed')} style={styles.checkbox} />
                  <span>Has Title Deed</span>
                </label>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Title Deed Number</label>
                  <input
                    type="text"
                    name="title_deed_number"
                    value={formData.title_deed_number}
                    onChange={handleInputChange}
                    placeholder="e.g., LRV 1234"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Land Registration Number</label>
                  <input
                    type="text"
                    name="land_registration_number"
                    value={formData.land_registration_number}
                    onChange={handleInputChange}
                    placeholder="e.g., BLK 1234"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Contact */}
              <h3 style={styles.subsectionTitle}>Contact Information</h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Agent Phone</label>
                  <input
                    type="tel"
                    name="agent_phone"
                    value={formData.agent_phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 0777123456"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Agent Email</label>
                  <input
                    type="email"
                    name="agent_email"
                    value={formData.agent_email}
                    onChange={handleInputChange}
                    placeholder="agent@example.com"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Viewing Instructions</label>
                  <textarea
                    name="viewing_instructions"
                    value={formData.viewing_instructions}
                    onChange={handleInputChange}
                    placeholder="Instructions for scheduling viewings..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div style={styles.formActions}>
          <button type="button" onClick={() => navigate('/dashboard/properties')} style={styles.secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Creating Property...' : 'List Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 24px',
    backgroundColor: '#f4f7fb',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: NAVY,
    fontFamily: "'Sora', sans-serif",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: SLATE,
  },
  cancelBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#fff',
    color: SLATE,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  },
  tabsContainer: {
    display: 'flex',
    overflowX: 'auto',
    borderBottom: '1px solid #eef2f7',
    backgroundColor: '#fff',
    padding: '0 16px',
    gap: 4,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    fontSize: 14,
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  formContent: {
    padding: 32,
  },
  section: {
    animation: 'fadeIn 0.3s ease',
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 6,
    fontFamily: "'Sora', sans-serif",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: SLATE,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: NAVY,
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '1px solid #eef2f7',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 20,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    gridColumn: 'span 2',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: NAVY,
  },
  input: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #eef2f7',
    fontSize: 14,
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    outline: 'none',
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #eef2f7',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
  },
  select: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #eef2f7',
    fontSize: 14,
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  checkboxGroup: {
    gridColumn: 'span 2',
    marginTop: 8,
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 16,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: SLATE,
    cursor: 'pointer',
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: 'pointer',
    accentColor: RED,
  },
  imageUploadSection: {
    marginBottom: 24,
  },
  imageUploadArea: {
    border: '2px dashed #e2e8f0',
    borderRadius: 16,
    padding: 40,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: GRAY_BG,
  },
  uploadText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: 500,
    color: NAVY,
  },
  uploadSubtext: {
    fontSize: 12,
    color: SLATE,
    marginTop: 4,
  },
  imagePreviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginTop: 20,
  },
  imagePreviewCard: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #eef2f7',
  },
  imagePreview: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
  },
  imageActions: {
    display: 'flex',
    gap: 4,
    padding: 8,
    backgroundColor: '#fff',
  },
  imageBtn: {
    flex: 1,
    padding: '4px 8px',
    borderRadius: 6,
    border: 'none',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tagInputContainer: {
    display: 'flex',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #eef2f7',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  tagAddBtn: {
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: RED,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    backgroundColor: RED_BG,
    color: RED,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  tagRemove: {
    background: 'none',
    border: 'none',
    color: RED,
    fontSize: 16,
    cursor: 'pointer',
    padding: '0 4px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '24px 32px',
    borderTop: '1px solid #eef2f7',
    backgroundColor: '#fff',
  },
  secondaryBtn: {
    padding: '12px 28px',
    borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#fff',
    color: SLATE,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  submitBtn: {
    padding: '12px 32px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: RED,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
  },
};

// Add animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

export default AddProperty;