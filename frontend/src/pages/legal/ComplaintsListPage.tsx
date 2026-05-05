// src/pages/legal/ComplaintsListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Complaint } from '../../types';

const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const SLATE = '#475569';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  investigating: { bg: '#fed7aa', color: '#9b2c1d' },
  resolved: { bg: '#dcfce7', color: '#166534' },
  dismissed: { bg: '#f1f5f9', color: '#64748b' },
  escalated: { bg: '#fee2e2', color: '#991b1b' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const style = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const ComplaintsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'against'>('my');

  useEffect(() => {
    fetchComplaints();
  }, [activeTab]);


    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'my' ? '/complaints/my-complaints/' : '/complaints/against-me/';
            const response = await api.get(endpoint);
            // ✅ Ensure we always set an array
            const data = response.data;
            setComplaints(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
            setComplaints([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: NAVY, margin: 0 }}>Complaints & Disputes</h1>
            <p style={{ color: '#64748b', marginTop: 4 }}>Track and manage your complaints</p>
          </div>
          <button onClick={() => navigate('/legal/complaints/new')} style={{ padding: '10px 20px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            + New Complaint
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('my')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'my' ? 700 : 500,
              color: activeTab === 'my' ? RED : '#64748b',
              borderBottom: activeTab === 'my' ? `2px solid ${RED}` : 'none',
            }}
          >
            My Complaints
          </button>
          <button
            onClick={() => setActiveTab('against')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'against' ? 700 : 500,
              color: activeTab === 'against' ? RED : '#64748b',
              borderBottom: activeTab === 'against' ? `2px solid ${RED}` : 'none',
            }}
          >
            Complaints Against Me
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
            <h3 style={{ color: NAVY, marginBottom: 8 }}>No complaints found</h3>
            <p style={{ color: '#64748b' }}>{activeTab === 'my' ? 'You haven\'t filed any complaints yet.' : 'No complaints have been filed against you.'}</p>
            {activeTab === 'my' && (
              <button onClick={() => navigate('/legal/complaints/new')} style={{ marginTop: 16, padding: '10px 24px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                File a Complaint
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {complaints.map(complaint => (
              <div
                key={complaint.id}
                onClick={() => navigate(`/legal/complaints/${complaint.id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #eef2f7', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{complaint.complaint_number}</div>
                    <div style={{ fontWeight: 700, color: NAVY, fontSize: 16 }}>{complaint.title}</div>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                  <span>📂 {complaint.category_display}</span>
                  <span>📅 {fmtDate(complaint.created_at)}</span>
                  {complaint.priority && <span>⚠️ Priority: {complaint.priority}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsListPage;