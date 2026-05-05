// src/pages/legal/UserAgreementPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer/Footer';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const GREEN = '#16a34a';
const SLATE = '#475569';

const UserAgreementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back
        </button>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            📜 User Agreement
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
            Last updated: May 1, 2026
          </p>
        </div>

        {/* Agreement Banner */}
        <div style={{ backgroundColor: '#ecfdf5', borderLeft: `4px solid ${GREEN}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, color: '#166534', marginBottom: 8, fontSize: 16 }}>✓ Binding Agreement</div>
          <p style={{ color: '#166534', margin: 0, fontSize: 14 }}>
            This User Agreement is a binding contract between you and Metro Care Properties. By creating an account or using our Platform, you agree to be bound by this Agreement.
          </p>
        </div>

        {/* Eligibility */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>👤 Eligibility</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {[
              'Be at least 18 years old',
              'Have legal capacity to enter contracts',
              'Not prohibited by law from using our Platform',
              'Provide accurate registration information'
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                <span style={{ color: GREEN, fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 13, color: NAVY }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account Responsibilities */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🔐 Account Responsibilities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Maintain the confidentiality of your password',
              'Notify us immediately of unauthorized account access',
              'Accept responsibility for all activities under your account',
              'Not share your account with others',
              'Not create multiple accounts without permission'
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: TEAL, fontSize: 16 }}>→</span>
                <span style={{ fontSize: 13, color: SLATE }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Terms */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>💰 Payment Terms</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Booking Fees</div>
              <div style={{ fontSize: 12, color: SLATE }}>Paid by users to confirm viewing appointments</div>
              <div style={{ fontSize: 12, color: SLATE }}>Non-refundable per cancellation policy</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Boost Packages</div>
              <div style={{ fontSize: 12, color: SLATE }}>Paid by agents to promote property listings</div>
              <div style={{ fontSize: 12, color: SLATE }}>Non-refundable once activated</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Payment Processing</div>
              <div style={{ fontSize: 12, color: SLATE }}>MTN Mobile Money, Airtel Money</div>
              <div style={{ fontSize: 12, color: SLATE }}>All fees in Ugandan Shillings (UGX)</div>
            </div>
          </div>
        </div>

        {/* Cancellation & Refund */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🔄 Cancellation & Refund</h2>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Booking Cancellations</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#dcfce7', borderRadius: 8, fontSize: 12 }}>24+ hours → Full refund</div>
              <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: 8, fontSize: 12 }}>Less than 24 hours → No refund</div>
              <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: 8, fontSize: 12 }}>No-show → No refund</div>
            </div>
          </div>
          
          <div>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Boost Packages</div>
            <div style={{ padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
              No refunds for boost packages once activated
            </div>
          </div>
        </div>

        {/* Termination */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>⛔ Termination</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {[
              'Violation of this Agreement',
              'Fraudulent or illegal activity',
              'Non-payment of fees',
              'Harassment of other users'
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: 8 }}>
                <span style={{ color: RED, fontSize: 16 }}>✕</span>
                <span style={{ fontSize: 12, color: '#991b1b' }}>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            Upon termination, you lose access to your account and any associated data. Fees paid are non-refundable.
          </p>
        </div>

        {/* Contact */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📞 Contact Us</h2>
          <div style={{ backgroundColor: '#f8faff', padding: 20, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Legal Department</div>
            <div style={{ fontSize: 13, color: SLATE, marginBottom: 4 }}>Email: legal@metrocareproperties.ug</div>
            <div style={{ fontSize: 13, color: SLATE }}>Phone: +256 700 123 456</div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default UserAgreementPage;