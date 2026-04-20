// src/pages/AddPropertyPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PropertyForm, { PropertyFormData } from '../components/Forms/PropertyForm';
import { UploadImage } from '../types';

const EMPTY_FORM = (user: any): PropertyFormData => ({
  title: '', description: '', property_type: 'house', transaction_type: 'sale',
  price: '', bedrooms: '', bathrooms: '', square_meters: '',
  address: '', city: '', district: '', latitude: '', longitude: '',
  video_url: '', virtual_tour_url: '',
  video_file: null,
  neighborhood_name: '', neighborhood_description: '', distance_to_city_center: '',
  distance_to_airport: '', distance_to_highway: '',
  nearby_schools: '', distance_to_nearest_school: '', school_rating: '',
  nearby_roads: '', nearest_road: '', public_transport: false,
  nearest_bus_stop: '', nearest_taxi_stage: '',
  amenities: [], nearest_mall: '', distance_to_mall: '',
  nearest_supermarket: '', nearest_market: '', nearest_pharmacy: '',
  nearest_hospital: '', distance_to_hospital: '',
  nearest_restaurant: '', nearest_cafe: '', nearest_gym: '', nearest_park: '',
  year_built: '', furnishing_status: 'unfurnished', parking_type: 'none', parking_spaces: '',
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

const AddPropertyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [formData, setFormData] = useState<PropertyFormData>(EMPTY_FORM(user));

  const onChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const buildFD = (fd: PropertyFormData, imgs: UploadImage[]) => {
    const f = new FormData();
    Object.entries(fd).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        if (k === 'amenities') f.append(k, JSON.stringify(v));
        else if (typeof v === 'boolean') f.append(k, String(v));
        else f.append(k, String(v));
      }
    });
    imgs.forEach((img, i) => { f.append('images', img.file); if (img.is_main) f.append('main_image_index', i.toString()); });
    return f;
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      alert('Please upload at least one image');
      return;
    }
    setLoading(true);
    try {
      await api.post('/properties/', buildFD(formData, images), { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/dashboard/properties');
    } catch (err) {
      console.error(err);
      alert('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/dashboard/properties')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#e63946',
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
            fontFamily: 'inherit', marginBottom: 16,
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0d1b2e', fontFamily: "'Sora', sans-serif", margin: 0 }}>Add New Property</h1>
        <p style={{ color: '#475569', marginTop: 8 }}>Fill in the details below to list your property</p>
      </div>

      <PropertyForm
        formData={formData}
        onChange={onChange}
        onSubmit={handleSubmit}
        loading={loading}
        submitText="List Property"
        images={images}
        onImagesChange={setImages}
      />
    </div>
  );
};

export default AddPropertyPage;