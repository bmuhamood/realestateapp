// ServiceProviderPortal.tsx - Fixed update functionality
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const TEAL = '#25a882';
const NAVY = '#0d1b2e';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image: string;
  gallery_images?: Array<{ id: number; image: string; order: number; is_main: boolean }>;
  duration: string;
  is_featured: boolean;
  is_active: boolean;
  category: number;
  category_name: string;
  service_type: string;
  provider: string;
  provider_phone: string;
  provider_email: string;
  rating: number;
  reviews_count: number;
}

interface ServiceCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
}

const ServiceProviderPortal: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    service_type: 'other',
    price: '',
    price_unit: '',
    duration: '',
    provider: '',
    provider_phone: '',
    provider_email: '',
  });
  
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [existingMainImage, setExistingMainImage] = useState<string | null>(null);
  
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<Array<{ id: number; image: string }>>([]);
  
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated]);

    const fetchData = async () => {
    try {
        setError(null);
        const categoriesRes = await api.get('/services/categories/');
        let categoriesData = categoriesRes.data.results || categoriesRes.data;
        if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
        }
        
        // Fetch all services (since filtering by provider might not work)
        const servicesRes = await api.get('/services/');
        const allServices = servicesRes.data.results || servicesRes.data;
        
        // Filter services by current user as provider (based on provider email or username)
        const userServices = allServices.filter((s: Service) => 
        s.provider_email === user?.email || 
        s.provider === user?.username ||
        s.provider === `${user?.first_name} ${user?.last_name}`.trim()
        );
        
        console.log('User services:', userServices);
        setServices(userServices);
    } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please refresh the page.');
    } finally {
        setLoading(false);
    }
    };

  const fetchServiceDetails = async (serviceId: number) => {
    try {
      const response = await api.get(`/services/${serviceId}/`);
      const service = response.data;
      
      setFormData({
        name: service.name || '',
        description: service.description || '',
        category_id: service.category?.toString() || '',
        service_type: service.service_type || 'other',
        price: service.price?.toString() || '',
        price_unit: service.price_unit || '',
        duration: service.duration || '',
        provider: service.provider || '',
        provider_phone: service.provider_phone || '',
        provider_email: service.provider_email || '',
      });
      
      if (service.image) {
        setExistingMainImage(service.image);
      }
      
      if (service.gallery_images && Array.isArray(service.gallery_images)) {
        setExistingGalleryImages(service.gallery_images.map((img: any) => ({
          id: img.id,
          image: img.image
        })));
      }
      
    } catch (error) {
      console.error('Error fetching service details:', error);
      alert('Failed to load service details for editing.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
      setExistingMainImage(null);
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(prev => [...prev, ...previews]);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setExistingVideo(null);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    if (galleryPreviews[index]) {
      URL.revokeObjectURL(galleryPreviews[index]);
    }
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (imageId: number) => {
    setExistingGalleryImages(prev => prev.filter(img => img.id !== imageId));
  };

  const removeMainImage = () => {
    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
    }
    setMainImage(null);
    setMainImagePreview(null);
    setExistingMainImage(null);
  };

  const handleEdit = async (service: Service) => {
    setEditingService(service);
    setShowForm(true);
    await fetchServiceDetails(service.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category_id);
      formDataToSend.append('service_type', formData.service_type);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('price_unit', formData.price_unit);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('provider', formData.provider || (user?.first_name ?? user?.username ?? ''));
      formDataToSend.append('provider_phone', formData.provider_phone || (user?.phone ?? ''));
      formDataToSend.append('provider_email', formData.provider_email || (user?.email ?? ''));
      
      if (mainImage) {
        formDataToSend.append('image', mainImage);
      }
      
      galleryImages.forEach((image) => {
        formDataToSend.append('gallery_images', image);
      });
      
      // Send IDs of gallery images to keep
      if (existingGalleryImages.length > 0) {
        formDataToSend.append('existing_gallery_ids', JSON.stringify(existingGalleryImages.map(img => img.id)));
      }
      
      if (video) {
        formDataToSend.append('video', video);
      }
      
      let response;
      if (editingService) {
        // Use PUT for update with multipart form data
        response = await api.put(`/services/${editingService.id}/`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await api.post('/services/', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      console.log('Service saved:', response.data);
      resetForm();
      fetchData();
      alert(editingService ? 'Service updated successfully!' : 'Service created successfully!');
    } catch (error: any) {
      console.error('Error saving service:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to save service. Please try again.';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      service_type: 'other',
      price: '',
      price_unit: '',
      duration: '',
      provider: '',
      provider_phone: '',
      provider_email: '',
    });
    
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    galleryPreviews.forEach(preview => URL.revokeObjectURL(preview));
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    
    setMainImage(null);
    setMainImagePreview(null);
    setExistingMainImage(null);
    setGalleryImages([]);
    setGalleryPreviews([]);
    setExistingGalleryImages([]);
    setVideo(null);
    setVideoPreview(null);
    setExistingVideo(null);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await api.delete(`/services/${id}/`);
        fetchData();
        alert('Service deleted successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service.');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #e2e8f0', borderTop: `3px solid ${TEAL}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', marginTop: 64, padding: '40px 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" }}>
              Service Provider Portal
            </h1>
            <p style={{ color: '#64748b', marginTop: 4 }}>Manage your services, images, and videos</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: TEAL,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add New Service
          </button>
        </div>

        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>No Services Yet</h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Click "Add New Service" to create your first service</p>
            <button
              onClick={() => setShowForm(true)}
              style={{ padding: '10px 24px', backgroundColor: TEAL, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              + Add New Service
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {services.map(service => (
              <div key={service.id} style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #eef2f7' }}>
                {service.image && (
                  <img src={service.image} alt={service.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                )}
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{service.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{service.description.substring(0, 100)}...</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: TEAL }}>UGX {service.price.toLocaleString()}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(service)}
                        style={{ padding: '6px 12px', backgroundColor: TEAL, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Form Modal */}
        {showForm && (
          <>
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={resetForm} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: 20, zIndex: 1000, padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 20 }}>
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h2>
              
              {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Service Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Price (UGX)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Price Unit</label>
                    <input
                      type="text"
                      name="price_unit"
                      value={formData.price_unit}
                      onChange={handleInputChange}
                      placeholder="e.g., per hour, per room"
                      style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 2-3 hours, 1 day"
                    style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}
                  />
                </div>

                {/* Main Image */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Main Image {!editingService && '*'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    style={{ width: '100%', padding: 8 }}
                  />
                  {(mainImagePreview || existingMainImage) && (
                    <div style={{ position: 'relative', marginTop: 8, display: 'inline-block' }}>
                      <img 
                        src={mainImagePreview || existingMainImage || ''} 
                        alt="Main preview" 
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} 
                      />
                      <button
                        type="button"
                        onClick={removeMainImage}
                        style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Gallery Images (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImagesChange}
                    style={{ width: '100%', padding: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {existingGalleryImages.map((img, idx) => (
                      <div key={`existing-${img.id}`} style={{ position: 'relative' }}>
                        <img src={img.image} alt={`Gallery ${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                        <button
                          type="button"
                          onClick={() => removeExistingGalleryImage(img.id)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {galleryPreviews.map((preview, idx) => (
                      <div key={`new-${idx}`} style={{ position: 'relative' }}>
                        <img src={preview} alt={`New ${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Video (Optional)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    style={{ width: '100%', padding: 8 }}
                  />
                  {(videoPreview || existingVideo) && (
                    <video 
                      src={videoPreview || existingVideo || ''} 
                      controls 
                      style={{ width: '100%', maxHeight: 200, marginTop: 8, borderRadius: 8 }} 
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: 12,
                      backgroundColor: TEAL,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      flex: 1,
                      padding: 12,
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderPortal;