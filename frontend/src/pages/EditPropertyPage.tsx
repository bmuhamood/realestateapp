// src/pages/EditPropertyPage.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PropertyForm, { PropertyFormData } from '../components/Forms/PropertyForm';
import { UploadImage, PropertyImage } from '../types';

const EditPropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [deletingImage, setDeletingImage] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}/`);
        const property = res.data;
        
        setFormData({
          title: property.title,
          description: property.description,
          property_type: property.property_type,
          transaction_type: property.transaction_type,
          price: property.price.toString(),
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          square_meters: property.square_meters?.toString() || '',
          address: property.address,
          city: property.city,
          district: property.district,
          latitude: property.latitude?.toString() || '',
          longitude: property.longitude?.toString() || '',
          video_url: property.video_url || '',
          video_file: null,
          virtual_tour_url: property.virtual_tour_url || '',
          neighborhood_name: property.neighborhood_name || '',
          neighborhood_description: property.neighborhood_description || '',
          distance_to_city_center: property.distance_to_city_center?.toString() || '',
          distance_to_airport: property.distance_to_airport?.toString() || '',
          distance_to_highway: property.distance_to_highway?.toString() || '',
          nearby_schools: property.nearby_schools || '',
          distance_to_nearest_school: property.distance_to_nearest_school?.toString() || '',
          school_rating: property.school_rating?.toString() || '',
          nearby_roads: property.nearby_roads || '',
          nearest_road: property.nearest_road || '',
          public_transport: property.public_transport || false,
          nearest_bus_stop: property.nearest_bus_stop || '',
          nearest_taxi_stage: property.nearest_taxi_stage || '',
          amenities: property.amenities_list || property.amenities || [],
          nearest_mall: property.nearest_mall || '',
          distance_to_mall: property.distance_to_mall?.toString() || '',
          nearest_supermarket: property.nearest_supermarket || '',
          nearest_market: property.nearest_market || '',
          nearest_pharmacy: property.nearest_pharmacy || '',
          nearest_hospital: property.nearest_hospital || '',
          distance_to_hospital: property.distance_to_hospital?.toString() || '',
          nearest_restaurant: property.nearest_restaurant || '',
          nearest_cafe: property.nearest_cafe || '',
          nearest_gym: property.nearest_gym || '',
          nearest_park: property.nearest_park || '',
          year_built: property.year_built?.toString() || '',
          furnishing_status: property.furnishing_status || 'unfurnished',
          parking_type: property.parking_type || 'none',
          parking_spaces: property.parking_spaces?.toString() || '',
          has_security: property.has_security || false,
          has_cctv: property.has_cctv || false,
          has_electric_fence: property.has_electric_fence || false,
          has_security_lights: property.has_security_lights || false,
          has_security_guards: property.has_security_guards || false,
          has_gated_community: property.has_gated_community || false,
          has_solar: property.has_solar || false,
          has_backup_generator: property.has_backup_generator || false,
          has_water_tank: property.has_water_tank || false,
          has_borehole: property.has_borehole || false,
          has_internet: property.has_internet || false,
          has_cable_tv: property.has_cable_tv || false,
          has_garden: property.has_garden || false,
          has_balcony: property.has_balcony || false,
          has_terrace: property.has_terrace || false,
          has_swimming_pool: property.has_swimming_pool || false,
          has_playground: property.has_playground || false,
          has_bbq_area: property.has_bbq_area || false,
          has_air_conditioning: property.has_air_conditioning || false,
          has_heating: property.has_heating || false,
          has_fireplace: property.has_fireplace || false,
          has_modern_kitchen: property.has_modern_kitchen || false,
          has_walk_in_closet: property.has_walk_in_closet || false,
          has_study_room: property.has_study_room || false,
          pets_allowed: property.pets_allowed ?? true,
          smoking_allowed: property.smoking_allowed ?? true,
          has_title_deed: property.has_title_deed || false,
          title_deed_number: property.title_deed_number || '',
          land_registration_number: property.land_registration_number || '',
          agent_phone: property.agent_phone || user?.phone || '',
          agent_email: property.agent_email || user?.email || '',
          viewing_instructions: property.viewing_instructions || '',
        });
        setExistingImages(property.images || []);
      } catch (err) {
        console.error(err);
        navigate('/dashboard/properties');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProperty();
  }, [id, user, navigate]);

  const onChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleDeleteExistingImage = (imageId: number) => {
    setSelectedImageId(imageId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!selectedImageId) return;

    setDeletingImage(selectedImageId);

    try {
        await api.delete(`/properties/images/${selectedImageId}/`);

        setExistingImages(prev =>
        prev.filter(img => img.id !== selectedImageId)
        );

        showToast('Image deleted successfully');
    } catch (err) {
        console.error('Error deleting image:', err);
        showToast('Failed to delete image');
    } finally {
        setDeletingImage(null);
        setDeleteDialogOpen(false);
        setSelectedImageId(null);
    }
  };

  const handleSetMainExistingImage = (imageId: number) => {
    setExistingImages(prev => prev.map(img => ({
      ...img,
      is_main: img.id === imageId
    })));
  };

const buildFD = (fd: PropertyFormData, imgs: UploadImage[], existing: PropertyImage[]) => {
  const f = new FormData();
  Object.entries(fd).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      if (k === 'amenities') {
        f.append(k, JSON.stringify(v));
      } 
      else if (k === 'video_file' && v instanceof File) {
        f.append(k, v);  // Append the video file
      }
      else if (typeof v === 'boolean') {
        f.append(k, String(v));
      }
      else if (k !== 'video_file') {  // Skip video_file if not a File object
        f.append(k, String(v));
      }
    }
  });
  f.append('existing_images', JSON.stringify(existing.map(i => i.id)));
  const main = existing.find(i => i.is_main);
  if (main) f.append('main_image_id', main.id.toString());
  const newMainIdx = imgs.findIndex(i => i.is_main);
  if (newMainIdx !== -1) f.append('main_image_index', newMainIdx.toString());
  imgs.forEach((img) => { f.append('images', img.file); });
  return f;
};

  const handleSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      await api.put(`/properties/${id}/`, buildFD(formData, images, existingImages), { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/dashboard/properties');
    } catch (err) {
      console.error(err);
      alert('Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    // You can implement a proper toast notification here
    console.log(msg);
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #eef2f7', borderTop: '3px solid #e63946', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!formData) return null;

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
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0d1b2e', fontFamily: "'Sora', sans-serif", margin: 0 }}>Edit Property</h1>
        <p style={{ color: '#475569', marginTop: 8 }}>Update your property details</p>
      </div>

    <PropertyForm
        formData={formData}
        onChange={onChange}
        onSubmit={handleSubmit}
        loading={loading}
        submitText="Update Property"
        images={images}
        onImagesChange={setImages}
        existingImages={existingImages}
        onExistingImagesChange={setExistingImages}
        onImageRemove={handleDeleteExistingImage}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        >
        <DialogTitle>Delete Image</DialogTitle>

        <DialogContent>
            Are you sure you want to delete this image? This action cannot be undone.
        </DialogContent>

        <DialogActions>
            <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingImage !== null}
            >
            Cancel
            </Button>

            <Button
            onClick={confirmDeleteImage}
            color="error"
            variant="contained"
            disabled={deletingImage !== null}
            >
            {deletingImage ? 'Deleting...' : 'Delete'}
            </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EditPropertyPage;