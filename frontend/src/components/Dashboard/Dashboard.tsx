/**
 * Dashboard.tsx — Bayut-inspired Agent Dashboard
 * 
 * Design: Clean white, Bayut red (#e63946) accents,
 * Sora display font, card-based stats, modern tables, smooth transitions.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Property, Booking, PropertyImage } from '../../types';
import { format } from 'date-fns';
import BoostModal from '../Boost/BoostModal';
import PropertyForm from '../Forms/PropertyForm';

// ─── Brand ────────────────────────────────────────────────────────────────────
const RED      = '#e63946';
const RED_BG   = 'rgba(230,57,70,0.07)';
const RED_DARK = '#c1121f';
const TEAL     = '#25a882';
const NAVY     = '#0d1b2e';
const SLATE    = '#475569';
const AMBER    = '#f59e0b';
const GREEN    = '#16a34a';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadImage {
  file: File;
  preview: string;
  is_main: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (price: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const fmtTime = (d: string) => {
  try { return new Date(d).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return ''; }
};

const getInitials = (user: any) =>
  user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#fef3c7', color: '#92400e' },
    confirmed: { bg: '#dcfce7', color: '#166534' },
    completed: { bg: '#dbeafe', color: '#1e40af' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
    in_progress: { bg: '#fed7aa', color: '#9b2c1d' },
  };
  const style = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ backgroundColor: style.bg, color: style.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status.replace('_', ' ')}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string; delay?: string }> = ({ icon, label, value, color, delay = '0s' }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: '#fff', borderRadius: 16, padding: '20px 18px',
        border: `1.5px solid ${hov ? color : '#eef2f7'}`,
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.2s', animation: `dbFadeUp 0.4s ease-out ${delay} both`,
        transform: hov ? 'translateY(-3px)' : 'none',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "'Sora', sans-serif", marginTop: 2, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
};

// ─── Nav Tab ──────────────────────────────────────────────────────────────────
const NavTab: React.FC<{ icon: string; label: string; count?: number; active: boolean; onClick: () => void }> = ({ icon, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', padding: '11px 14px', borderRadius: 10,
      border: 'none', cursor: 'pointer', textAlign: 'left',
      fontFamily: 'inherit', transition: 'all 0.15s',
      backgroundColor: active ? RED_BG : 'transparent',
      color: active ? RED : SLATE,
      fontWeight: active ? 700 : 500,
      fontSize: 13,
    }}
  >
    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {count != null && count > 0 && (
      <span style={{ backgroundColor: active ? RED : '#e2e8f0', color: active ? '#fff' : '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>
        {count}
      </span>
    )}
  </button>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ icon: string; title: string; desc: string; btnLabel: string; onClick: () => void }> = ({ icon, title, desc, btnLabel, onClick }) => (
  <div style={{ textAlign: 'center', padding: '56px 24px' }}>
    <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
    <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 17 }}>{title}</h3>
    <p style={{ margin: '0 0 22px', color: '#94a3b8', fontSize: 14 }}>{desc}</p>
    <button onClick={onClick} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
      {btnLabel}
    </button>
  </div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{ title: string; desc: string; onConfirm: () => void; onClose: () => void; loading?: boolean }> = ({ title, desc, onConfirm, onClose, loading }) => (
  <>
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={onClose} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 18, padding: '28px 26px', zIndex: 1001, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'dbModalIn 0.2s ease-out' }}>
      <h3 style={{ margin: '0 0 10px', color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18 }}>{title}</h3>
      <p style={{ margin: '0 0 24px', color: SLATE, fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #eef2f7', backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Keep it
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Deleting…' : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState(0);
  const [properties, setProperties]       = useState<Property[]>([]);
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [loading, setLoading]             = useState(true);
  const [toast, setToast]                 = useState('');

  // Modals
  const [addDialogOpen, setAddDialogOpen]           = useState(false);
  const [editDialogOpen, setEditDialogOpen]         = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen]     = useState(false);
  const [boostModalOpen, setBoostModalOpen]         = useState(false);
  const [selectedProperty, setSelectedProperty]     = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete]     = useState<Property | null>(null);
  const [selectedBoostProperty, setSelectedBoostProperty] = useState<Property | null>(null);
  const [deleteError, setDeleteError]               = useState<string | null>(null);
  const [submitLoading, setSubmitLoading]           = useState(false);
  const [updatingBookingId, setUpdatingBookingId]   = useState<number | null>(null);

  // Form state
  const [images, setImages] = useState<UploadImage[]>([]);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'house',
    transaction_type: 'rent',
    price: '',
    bedrooms: '',
    bathrooms: '',
    square_meters: '',
    latitude: '',
    longitude: '',
    address: '',
    city: '',
    district: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [propertiesRes, bookingsRes] = await Promise.all([
        api.get('/properties/my/'),
        api.get('/bookings/agent/'),
      ]);
      
      setProperties(propertiesRes.data.results || propertiesRes.data);
      setBookings(bookingsRes.data.results || bookingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      property_type: 'house',
      transaction_type: 'rent',
      price: '',
      bedrooms: '',
      bathrooms: '',
      square_meters: '',
      latitude: '',
      longitude: '',
      address: '',
      city: '',
      district: '',
    });
    setImages([]);
    setExistingImages([]);
    setSelectedProperty(null);
  };

  const hasBookings = (propertyId: number): boolean => {
    return bookings.some(booking => booking.property?.id === propertyId);
  };

  const getPropertyBookings = (propertyId: number): Booking[] => {
    return bookings.filter(booking => booking.property?.id === propertyId);
  };

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteError(null);

    if (hasBookings(property.id)) {
      const propertyBookings = getPropertyBookings(property.id);
      const activeBookings = propertyBookings.filter(b =>
        b.status === 'pending' || b.status === 'confirmed'
      );

      if (activeBookings.length > 0) {
        setDeleteError(
          `Cannot delete this property because it has ${activeBookings.length} active booking(s).`
        );
      } else {
        setDeleteError(
          `This property has ${propertyBookings.length} booking(s) in history.`
        );
      }
    }

    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    
    setSubmitLoading(true);
    try {
      await api.delete(`/properties/${propertyToDelete.id}/`);
      await fetchData();
      showToast('✅ Property deleted successfully.');
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to delete property.';
      showToast(`❌ ${errorMsg}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddProperty = async () => {
    if (images.length === 0) {
      showToast('❌ Please upload at least one image');
      return;
    }

    setSubmitLoading(true);
    try {
      const formDataToSend = new FormData();
      
      const propertyData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        transaction_type: formData.transaction_type,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        square_meters: parseInt(formData.square_meters) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        address: formData.address,
        city: formData.city,
        district: formData.district,
      };
      
      Object.keys(propertyData).forEach(key => {
        formDataToSend.append(key, String(propertyData[key as keyof typeof propertyData]));
      });
      
      images.forEach((image, index) => {
        formDataToSend.append('images', image.file);
        if (image.is_main) {
          formDataToSend.append('main_image_index', index.toString());
        }
      });
      
      await api.post('/properties/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('✅ Property added successfully!');
      setAddDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error adding property:', error);
      showToast('❌ Failed to add property.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateProperty = async () => {
    if (!selectedProperty) return;
    
    setSubmitLoading(true);
    try {
      const formDataToSend = new FormData();
      
      const propertyData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        transaction_type: formData.transaction_type,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        square_meters: parseInt(formData.square_meters) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        address: formData.address,
        city: formData.city,
        district: formData.district,
      };
      
      Object.keys(propertyData).forEach(key => {
        formDataToSend.append(key, String(propertyData[key as keyof typeof propertyData]));
      });
      
      const existingImageIds = existingImages.map(img => img.id);
      formDataToSend.append('existing_images', JSON.stringify(existingImageIds));
      
      let mainImageId = null;
      const existingMain = existingImages.find(img => img.is_main);
      if (existingMain) {
        mainImageId = existingMain.id;
      }
      
      const newMainIndex = images.findIndex(img => img.is_main);
      
      if (mainImageId) {
        formDataToSend.append('main_image_id', mainImageId.toString());
      }
      if (newMainIndex !== -1) {
        formDataToSend.append('main_image_index', newMainIndex.toString());
      }
      
      images.forEach((image) => {
        formDataToSend.append('images', image.file);
      });
      
      await api.put(`/properties/${selectedProperty.id}/`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('✅ Property updated successfully!');
      setEditDialogOpen(false);
      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error updating property:', error);
      showToast('❌ Failed to update property.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    setUpdatingBookingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/agent-status/`, { status });
      await fetchData();
      showToast(`✅ Booking ${status} successfully!`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update booking status';
      showToast(`❌ ${errorMsg}`);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const openEditDialog = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      property_type: property.property_type,
      transaction_type: property.transaction_type,
      price: property.price.toString(),
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      square_meters: property.square_meters.toString(),
      latitude: property.latitude.toString(),
      longitude: property.longitude.toString(),
      address: property.address,
      city: property.city,
      district: property.district,
    });
    setExistingImages(property.images || []);
    setImages([]);
    setEditDialogOpen(true);
  };

  const stats = {
    totalProperties: properties.length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    views: properties.reduce((sum, p) => sum + (p.views_count || 0), 0),
  };

  const TABS = [
    { icon: '🏠', label: 'My Properties', count: properties.length },
    { icon: '📅', label: 'Bookings', count: bookings.length },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
      <div>
        <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'dbSpin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', fontFamily: 'inherit' }}>Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={pg.page}>

      {/* ══ TOAST ══════════════════════════════════════════════════════════ */}
      {toast && (
        <div style={pg.toast}>
          {toast}
          <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 10, fontSize: 14 }}>✕</button>
        </div>
      )}

      <div style={pg.inner}>

        {/* ══ HEADER ═════════════════════════════════════════════════════════ */}
        <div style={pg.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={pg.avatarWrap}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800 }}>{getInitials(user)}</span>
            </div>
            <div>
              <h1 style={pg.headerName}>Agent Dashboard</h1>
              <p style={pg.headerSub}>Welcome back, {user?.first_name || user?.username}!</p>
            </div>
          </div>
          <button onClick={openAddDialog} style={pg.addBtn}>
            + Add Property
          </button>
        </div>

        {/* ══ STATS ══════════════════════════════════════════════════════════ */}
        <div style={pg.statsGrid}>
          <StatCard icon="🏠" label="Total Properties" value={stats.totalProperties} color={RED} delay="0s" />
          <StatCard icon="📅" label="Total Bookings" value={stats.totalBookings} color={AMBER} delay="0.07s" />
          <StatCard icon="⏳" label="Pending Bookings" value={stats.pendingBookings} color="#f97316" delay="0.14s" />
          <StatCard icon="👁️" label="Total Views" value={stats.views.toLocaleString()} color={GREEN} delay="0.21s" />
        </div>

        {/* ══ MAIN PANEL ═════════════════════════════════════════════════════ */}
        <div style={pg.mainPanel}>

          {/* Sidebar nav */}
          <nav style={pg.sidebar}>
            <div style={{ padding: '0 0 16px', borderBottom: '1px solid #f1f5f9', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, padding: '0 4px' }}>Navigation</div>
              {TABS.map((t, i) => (
                <NavTab key={i} icon={t.icon} label={t.label} count={t.count} active={activeTab === i} onClick={() => setActiveTab(i)} />
              ))}
            </div>
            <button onClick={() => navigate('/properties')} style={pg.browseBtn}>
              🔍 Browse Properties
            </button>
          </nav>

          {/* Content */}
          <div style={pg.content}>

            {/* ── Properties Tab ── */}
            {activeTab === 0 && (
              <div style={pg.tabPane}>
                <div style={pg.tabHead}>
                  <h2 style={pg.tabTitle}>My Properties</h2>
                  <span style={pg.tabCount}>{properties.length} total</span>
                </div>
                {properties.length === 0 ? (
                  <EmptyState icon="🏚️" title="No properties yet" desc="Add your first property to start receiving bookings." btnLabel="Add Property" onClick={openAddDialog} />
                ) : (
                  <div style={pg.tableWrap}>
                    <table style={pg.table}>
                      <thead>
                        <tr style={pg.thead}>
                          <th style={pg.th}>Title</th>
                          <th style={pg.th}>Price</th>
                          <th style={pg.th}>Type</th>
                          <th style={pg.th}>Status</th>
                          <th style={pg.th}>Bookings</th>
                          <th style={pg.th}>Views</th>
                          <th style={pg.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map(property => {
                          const propertyBookings = getPropertyBookings(property.id);
                          const hasActiveBookings = propertyBookings.some(b => 
                            b.status === 'pending' || b.status === 'confirmed'
                          );
                          
                          return (
                            <tr key={property.id} style={pg.tr}>
                              <td style={pg.td}>
                                <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 2 }}>{property.title}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{property.address}</div>
                              </td>
                              <td style={pg.td}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: RED }}>{fmtPrice(property.price)}</span>
                                {property.transaction_type === 'rent' && <span style={{ fontSize: 11, color: '#94a3b8' }}>/month</span>}
                              </td>
                              <td style={pg.td}>
                                <span style={{ fontSize: 12, backgroundColor: '#f4f7fb', color: SLATE, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                                  {property.property_type}
                                </span>
                              </td>
                              <td style={pg.td}>
                                <StatusBadge status={property.is_available ? 'available' : 'unavailable'} />
                              </td>
                              <td style={pg.td}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{propertyBookings.length}</span>
                              </td>
                              <td style={pg.td}>{property.views_count || 0}</td>
                              <td style={pg.td}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => openEditDialog(property)} style={pg.actionBtn} title="Edit">
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClick(property)} 
                                    disabled={hasActiveBookings}
                                    style={{ ...pg.dangerBtn, opacity: hasActiveBookings ? 0.5 : 1, cursor: hasActiveBookings ? 'not-allowed' : 'pointer' }}
                                    title={hasActiveBookings ? 'Cannot delete property with active bookings' : 'Delete property'}
                                  >
                                    🗑️
                                  </button>
                                  <button onClick={() => { setSelectedBoostProperty(property); setBoostModalOpen(true); }} style={pg.boostBtn} title="Boost Property">
                                    ⚡
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Bookings Tab ── */}
            {activeTab === 1 && (
              <div style={pg.tabPane}>
                <div style={pg.tabHead}>
                  <h2 style={pg.tabTitle}>Property Bookings</h2>
                  <span style={pg.tabCount}>{bookings.length} total</span>
                </div>
                {bookings.length === 0 ? (
                  <EmptyState icon="📅" title="No bookings yet" desc="When clients book your properties, they'll appear here." btnLabel="Browse Properties" onClick={() => navigate('/')} />
                ) : (
                  <div style={pg.tableWrap}>
                    <table style={pg.table}>
                      <thead>
                        <tr style={pg.thead}>
                          <th style={pg.th}>Property</th>
                          <th style={pg.th}>Client</th>
                          <th style={pg.th}>Visit Date</th>
                          <th style={pg.th}>Status</th>
                          <th style={pg.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(booking => (
                          <tr key={booking.id} style={pg.tr}>
                            <td style={pg.td}>
                              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 2 }}>{booking.property?.title}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{booking.property?.address}</div>
                            </td>
                            <td style={pg.td}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: NAVY }}>{booking.user?.first_name || booking.user?.username}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{booking.user?.phone || 'No phone'}</div>
                            </td>
                            <td style={pg.td}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{fmtDate(booking.visit_date)}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtTime(booking.visit_date)}</div>
                            </td>
                            <td style={pg.td}><StatusBadge status={booking.status} /></td>
                            <td style={pg.td}>
                              {booking.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')} 
                                    disabled={updatingBookingId === booking.id}
                                    style={pg.confirmBtn}
                                  >
                                    ✓ Confirm
                                  </button>
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id, 'cancelled')} 
                                    disabled={updatingBookingId === booking.id}
                                    style={pg.cancelBtn}
                                  >
                                    ✗ Cancel
                                  </button>
                                </div>
                              )}
                              {booking.status === 'confirmed' && (
                                <button 
                                  onClick={() => updateBookingStatus(booking.id, 'completed')} 
                                  disabled={updatingBookingId === booking.id}
                                  style={pg.completeBtn}
                                >
                                  ✓ Complete
                                </button>
                              )}
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}
      {deleteDialogOpen && propertyToDelete && (
        <ConfirmModal
          title="Delete Property?"
          desc={deleteError || `Are you sure you want to delete "${propertyToDelete.title}"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteDialogOpen(false)}
          loading={submitLoading}
        />
      )}

      {/* Add Property Dialog */}
      {addDialogOpen && (
        <div style={pg.modalOverlay}>
          <div style={pg.modalContainer}>
            <div style={pg.modalHeader}>
              <h3 style={pg.modalTitle}>Add New Property</h3>
              <button onClick={() => setAddDialogOpen(false)} style={pg.modalClose}>✕</button>
            </div>
            <div style={pg.modalBody}>
              <PropertyForm
                formData={formData}
                onChange={handleFormChange}
                onSubmit={handleAddProperty}
                onCancel={() => setAddDialogOpen(false)}
                loading={submitLoading}
                submitText="Add Property"
                images={images}
                onImagesChange={setImages}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Dialog */}
      {editDialogOpen && selectedProperty && (
        <div style={pg.modalOverlay}>
          <div style={pg.modalContainer}>
            <div style={pg.modalHeader}>
              <h3 style={pg.modalTitle}>Edit Property</h3>
              <button onClick={() => setEditDialogOpen(false)} style={pg.modalClose}>✕</button>
            </div>
            <div style={pg.modalBody}>
              <PropertyForm
                formData={formData}
                onChange={handleFormChange}
                onSubmit={handleUpdateProperty}
                onCancel={() => setEditDialogOpen(false)}
                loading={submitLoading}
                submitText="Update Property"
                images={images}
                onImagesChange={setImages}
                existingImages={existingImages}
                onExistingImagesChange={setExistingImages}
              />
            </div>
          </div>
        </div>
      )}

      {/* Boost Modal */}
      <BoostModal
        open={boostModalOpen}
        onClose={() => {
          setBoostModalOpen(false);
          setSelectedBoostProperty(null);
        }}
        propertyId={selectedBoostProperty?.id || 0}
        propertyTitle={selectedBoostProperty?.title || ''}
        onBoostSuccess={() => {
          fetchData();
          showToast('✅ Property boosted successfully!');
        }}
      />
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const pg: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 },
  inner:     { maxWidth: 1400, margin: '0 auto', padding: '28px 20px 60px' },
  toast:     { position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, backgroundColor: NAVY, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'dbFadeDown 0.3s ease-out', whiteSpace: 'nowrap' },

  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28, backgroundColor: '#fff', borderRadius: 18, padding: '20px 22px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: 'dbFadeUp 0.4s ease-out both' },
  avatarWrap:{ width: 64, height: 64, borderRadius: '50%', backgroundColor: RED_BG, border: `2.5px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontSize: 24, fontWeight: 800, flexShrink: 0, overflow: 'hidden' },
  headerName:{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 4px', letterSpacing: '-0.02em' },
  headerSub: { fontSize: 13, color: '#94a3b8', margin: 0 },
  addBtn:    { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 },

  mainPanel: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' },
  sidebar:   { backgroundColor: '#fff', borderRadius: 16, padding: '16px 12px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 88, animation: 'dbFadeUp 0.4s ease-out 0.1s both' },
  browseBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  content:   { minWidth: 0 },

  tabPane:   { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', animation: 'dbFadeUp 0.35s ease-out both' },
  tabHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' },
  tabTitle:  { fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 },
  tabCount:  { fontSize: 12, fontWeight: 700, color: '#94a3b8', backgroundColor: '#f4f7fb', padding: '3px 10px', borderRadius: 20 },

  tableWrap: { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  thead:     { backgroundColor: '#f8faff' },
  th:        { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid #eef2f7' },
  tr:        { borderBottom: '1px solid #f8faff', transition: 'background-color 0.1s' },
  td:        { padding: '14px 16px', verticalAlign: 'top' },

  actionBtn: { padding: '5px 12px', borderRadius: 8, border: `1.5px solid rgba(230,57,70,0.2)`, backgroundColor: RED_BG, color: RED, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  dangerBtn: { padding: '5px 12px', borderRadius: 8, border: `1.5px solid rgba(239,68,68,0.3)`, backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  boostBtn:  { padding: '5px 12px', borderRadius: 8, border: `1.5px solid rgba(245,158,11,0.3)`, backgroundColor: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  confirmBtn:{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: GREEN, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  cancelBtn: { padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  completeBtn:{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(13,27,46,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 18, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'dbModalIn 0.2s ease-out' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 24px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 },
  modalTitle: { margin: 0, color: NAVY, fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700 },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', padding: 4 },
  modalBody: { padding: '20px 24px' },
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'agent-dashboard-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes dbSpin    { to { transform: rotate(360deg); } }
      @keyframes dbFadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes dbFadeDown{ from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes dbModalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }

      tr:hover { background-color: #fafcff !important; }
      button[style*="actionBtn"]:hover, button[style*="dangerBtn"]:hover, button[style*="boostBtn"]:hover { transform: scale(1.05); }
      button[style*="confirmBtn"]:hover, button[style*="cancelBtn"]:hover, button[style*="completeBtn"]:hover { opacity: 0.85; }
      button[style*="addBtn"]:hover { background-color: ${RED_DARK} !important; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      input:focus, textarea:focus, select:focus { border-color: ${RED} !important; outline: none; }
    `;
    document.head.appendChild(el);
  }
}

export default Dashboard;