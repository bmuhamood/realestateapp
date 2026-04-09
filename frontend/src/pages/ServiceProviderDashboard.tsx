// ServiceProviderDashboard.tsx - Fixed client info display
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const TEAL = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const NAVY = '#0d1b2e';
const RED = '#e63946';
const AMBER = '#f59e0b';
const GREEN = '#16a34a';
const SLATE = '#475569';

interface ServiceBooking {
  id: number;
  service: {
    id: number;
    name: string;
    price: number;
    price_unit: string;
    image: string;
  };
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  booking_date: string;
  address: string;
  special_instructions: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image: string;
  duration: string;
  bookings_count?: number;
  rating: number;
  reviews_count: number;
}

interface Payment {
  id: number;
  reference: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  metadata?: {
    service_name?: string;
    service_id?: number;
  };
}

const ServiceProviderDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch service bookings (for provider's services)
      const bookingsRes = await api.get('/services/agent/bookings/');
      console.log('Bookings response:', bookingsRes.data);
      
      let bookingsData = bookingsRes.data.results || bookingsRes.data;
      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
      } else {
        setBookings([]);
      }
      
      // Fetch provider's services
      const servicesRes = await api.get('/services/');
      const allServices = servicesRes.data.results || servicesRes.data;
      const myServices = allServices.filter((s: any) => 
        s.provider_email === user?.email || 
        s.provider === user?.username
      );
      setServices(myServices);
      
      // Fetch payments
      try {
        const paymentsRes = await api.get('/payments/');
        const allPayments = paymentsRes.data.results || paymentsRes.data;
        const servicePayments = allPayments.filter((p: any) => 
          p.metadata?.type === 'service' || p.metadata?.service_id
        );
        setPayments(servicePayments);
      } catch (error) {
        console.log('Payments endpoint not available yet');
        setPayments([]);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    setUpdatingBookingId(bookingId);
    try {
      await api.patch(`/services/bookings/${bookingId}/status/`, { status });
      await fetchDashboardData();
      showToast(`Booking ${status} successfully!`);
    } catch (error: any) {
      console.error('Error updating booking:', error);
      showToast(error.response?.data?.error || 'Failed to update booking status');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-UG', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      confirmed: { bg: '#dcfce7', color: '#166534' },
      in_progress: { bg: '#fed7aa', color: '#9b2c1d' },
      completed: { bg: '#dbeafe', color: '#1e40af' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' },
    };
    const style = colors[status] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ backgroundColor: style.bg, color: style.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getClientName = (booking: ServiceBooking): string => {
    if (booking.user?.first_name) {
      return `${booking.user.first_name} ${booking.user.last_name || ''}`.trim();
    }
    if (booking.user?.username) {
      return booking.user.username;
    }
    if (booking.user?.email) {
      return booking.user.email.split('@')[0];
    }
    return 'Client';
  };

  const getClientContact = (booking: ServiceBooking): string => {
    if (booking.user?.phone) {
      return booking.user.phone;
    }
    if (booking.user?.email) {
      return booking.user.email;
    }
    return 'No contact info';
  };

  const stats = {
    totalServices: services.length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalEarnings: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || b.service?.price || 0), 0),
    averageRating: services.reduce((sum, s) => sum + (s.rating || 0), 0) / (services.length || 1),
  };

  const TABS = [
    { icon: '📅', label: 'Bookings', count: stats.totalBookings },
    { icon: '💰', label: 'Payments', count: payments.length },
    { icon: '📊', label: 'Analytics', count: 0 },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', marginTop: 64 }}>
        <div>
          <div style={{ width: 44, height: 44, border: '3px solid #eef2f7', borderTop: `3px solid ${TEAL}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 20px 60px' }}>
        
        {/* Toast Notification */}
        {toast && (
          <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, backgroundColor: NAVY, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'fadeDown 0.3s ease-out', whiteSpace: 'nowrap' }}>
            {toast}
            <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 10, fontSize: 14 }}>✕</button>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28, backgroundColor: '#fff', borderRadius: 18, padding: '20px 22px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Service Provider Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Manage your services, bookings, and earnings</p>
          </div>
          <button
            onClick={() => navigate('/service-provider')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', backgroundColor: TEAL, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            + Manage Services
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="🔧" label="Total Services" value={stats.totalServices} color={TEAL} />
          <StatCard icon="📅" label="Total Bookings" value={stats.totalBookings} color={AMBER} />
          <StatCard icon="⏳" label="Pending Bookings" value={stats.pendingBookings} color="#f97316" />
          <StatCard icon="✅" label="Completed" value={stats.completedBookings} color={GREEN} />
          <StatCard icon="💰" label="Total Earnings" value={formatPrice(stats.totalEarnings)} color={RED} />
        </div>

        {/* Main Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
          
          {/* Sidebar */}
          <nav style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 12px', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 88 }}>
            <div style={{ padding: '0 0 16px', borderBottom: '1px solid #f1f5f9', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, padding: '0 4px' }}>Navigation</div>
              {TABS.map((tab, i) => (
                <NavTab key={i} icon={tab.icon} label={tab.label} count={tab.count} active={activeTab === i} onClick={() => setActiveTab(i)} />
              ))}
            </div>
            <button onClick={() => navigate('/services')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              🔍 Browse Services
            </button>
          </nav>

          {/* Content */}
          <div style={{ minWidth: 0 }}>
            
            {/* Bookings Tab */}
            {activeTab === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>Service Bookings</h2>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', backgroundColor: '#f4f7fb', padding: '3px 10px', borderRadius: 20 }}>{bookings.length} total</span>
                </div>
                
                {bookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>📅</div>
                    <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>No Bookings Yet</h3>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px' }}>When clients book your services, they'll appear here.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                      <thead style={{ backgroundColor: '#f8faff' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Service</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Client</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Booking Date</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Address</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Amount</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(booking => (
                          <tr key={booking.id} style={{ borderBottom: '1px solid #f8faff' }}>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 2 }}>{booking.service?.name || 'Service'}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{booking.service?.price_unit || 'Fixed price'}</div>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 600, color: NAVY, fontSize: 13, marginBottom: 2 }}>
                                {getClientName(booking)}
                              </div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                {getClientContact(booking)}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{formatDate(booking.booking_date)}</div>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: 12, color: SLATE, maxWidth: 200, wordBreak: 'break-word' }}>{booking.address || 'No address provided'}</div>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: TEAL }}>
                                {formatPrice(booking.total_price || booking.service?.price || 0)}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>{getStatusBadge(booking.status)}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {booking.status === 'pending' && (
                                  <>
                                    <button 
                                      onClick={() => updateBookingStatus(booking.id, 'confirmed')} 
                                      disabled={updatingBookingId === booking.id} 
                                      style={{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: GREEN, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Confirm
                                    </button>
                                    <button 
                                      onClick={() => updateBookingStatus(booking.id, 'cancelled')} 
                                      disabled={updatingBookingId === booking.id} 
                                      style={{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {booking.status === 'confirmed' && (
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id, 'in_progress')} 
                                    disabled={updatingBookingId === booking.id} 
                                    style={{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: AMBER, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Start
                                  </button>
                                )}
                                {booking.status === 'in_progress' && (
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id, 'completed')} 
                                    disabled={updatingBookingId === booking.id} 
                                    style={{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: TEAL, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 1 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>Payment History</h2>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', backgroundColor: '#f4f7fb', padding: '3px 10px', borderRadius: 20 }}>{payments.length} transactions</span>
                </div>
                
                {payments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>💰</div>
                    <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>No Payments Yet</h3>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px' }}>Payments will appear here when clients complete bookings.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead style={{ backgroundColor: '#f8faff' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Reference</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Service</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Amount</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Method</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #eef2f7' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(payment => (
                          <tr key={payment.id} style={{ borderBottom: '1px solid #f8faff' }}>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, backgroundColor: '#f4f7fb', padding: '3px 8px', borderRadius: 6 }}>{payment.reference}</span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: NAVY }}>{payment.metadata?.service_name || 'Service Payment'}</span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>{formatPrice(payment.amount)}</span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span style={{ fontSize: 12, backgroundColor: '#f4f7fb', padding: '3px 10px', borderRadius: 20 }}>{payment.payment_method}</span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              {getStatusBadge(payment.status)}
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span style={{ fontSize: 13, color: SLATE }}>{formatDate(payment.created_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 2 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>Performance Analytics</h2>
                </div>
                
                <div style={{ padding: '24px' }}>
                  {/* Services Performance */}
                  <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Services Performance</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {services.map(service => (
                        <div key={service.id} style={{ border: '1px solid #eef2f7', borderRadius: 12, padding: 14 }}>
                          <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>{service.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{service.duration || 'Flexible duration'}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: TEAL }}>{formatPrice(service.price)}</span>
                              {service.price_unit && <span style={{ fontSize: 11, color: '#94a3b8' }}> /{service.price_unit}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, color: AMBER }}>★ {service.rating?.toFixed(1) || '0'}</span>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>({service.reviews_count || 0} reviews)</span>
                            </div>
                          </div>
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: SLATE }}>Bookings: {service.bookings_count || 0}</span>
                            <button onClick={() => navigate(`/services/${service.id}`)} style={{ fontSize: 11, color: TEAL, background: 'none', border: 'none', cursor: 'pointer' }}>
                              View Details →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats Summary */}
                  <div style={{ backgroundColor: TEAL_BG, borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Quick Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Completion Rate</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: TEAL }}>
                          {stats.totalBookings === 0 ? '0%' : `${Math.round((stats.completedBookings / stats.totalBookings) * 100)}%`}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg. Rating</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: AMBER }}>{stats.averageRating.toFixed(1)} ★</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Active Services</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>{stats.totalServices}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Clients</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>
                          {new Set(bookings.map(b => b.user?.id).filter(Boolean)).size}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: '#fff', borderRadius: 16, padding: '20px 18px',
        border: `1.5px solid ${hov ? color : '#eef2f7'}`,
        boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.2s',
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

// Nav Tab Component
const NavTab: React.FC<{ icon: string; label: string; count?: number; active: boolean; onClick: () => void }> = ({ icon, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', padding: '11px 14px', borderRadius: 10,
      border: 'none', cursor: 'pointer', textAlign: 'left',
      fontFamily: 'inherit', transition: 'all 0.15s',
      backgroundColor: active ? TEAL_BG : 'transparent',
      color: active ? TEAL : SLATE,
      fontWeight: active ? 700 : 500,
      fontSize: 13,
    }}
  >
    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {count != null && count > 0 && (
      <span style={{ backgroundColor: active ? TEAL : '#e2e8f0', color: active ? '#fff' : '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>
        {count}
      </span>
    )}
  </button>
);

export default ServiceProviderDashboard;