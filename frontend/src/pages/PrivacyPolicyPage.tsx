// src/pages/legal/PrivacyPolicyPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer/Footer';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const SLATE = '#475569';
const GREEN = '#16a34a';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            🔒 Privacy Policy
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
            Last updated: May 1, 2026
          </p>
        </div>

        {/* Info Banner */}
        <div style={{ backgroundColor: '#e0f2fe', borderLeft: `4px solid ${TEAL}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 8, fontSize: 16 }}>📋 Our Commitment to Your Privacy</div>
          <p style={{ color: '#0369a1', margin: 0, fontSize: 14 }}>
            At Metro Care Properties, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.
          </p>
        </div>

        {/* Information We Collect */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📊 Information We Collect</h2>
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Personal Information You Provide</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {[
                'Name, email, phone number',
                'Profile picture and bio',
                'Property listing details',
                'Booking and transaction history',
                'Verification documents (with consent)',
                'Support inquiries'
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                  <span style={{ color: TEAL }}>✓</span>
                  <span style={{ fontSize: 13, color: SLATE }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Information Collected Automatically</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {[
                'IP address and device information',
                'Browser type and operating system',
                'Pages visited and time spent',
                'Search queries and preferences',
                'Location data (approximate)',
                'Cookies and tracking data'
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                  <span style={{ color: TEAL }}>✓</span>
                  <span style={{ fontSize: 13, color: SLATE }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>⚙️ How We Use Your Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { icon: '🏠', title: 'Provide Services', desc: 'Enable property listings, searches, bookings, and communications' },
              { icon: '🎯', title: 'Personalize Experience', desc: 'Show relevant properties and recommendations' },
              { icon: '💳', title: 'Process Transactions', desc: 'Handle payments for bookings and boost packages' },
              { icon: '🔒', title: 'Verify Identity', desc: 'Authenticate users and prevent fraud' },
              { icon: '📧', title: 'Communicate', desc: 'Send notifications and important updates' },
              { icon: '📈', title: 'Improve Platform', desc: 'Analyze usage and enhance features' }
            ].map(item => (
              <div key={item.title} style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: SLATE }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Rights */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>✅ Your Rights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {[
              'Right to access your personal data',
              'Right to correct inaccurate information',
              'Right to request deletion of your data',
              'Right to restrict processing',
              'Right to data portability',
              'Right to withdraw consent'
            ].map(right => (
              <div key={right} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                <span style={{ color: GREEN, fontSize: 18 }}>✓</span>
                <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>{right}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Security */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🔐 Data Security</h2>
          <p style={{ color: SLATE, marginBottom: 16 }}>We implement industry-standard security measures to protect your information:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {['Encryption', 'Secure HTTPS', 'Access Controls', 'Regular Audits', 'Employee Training', 'Firewall Protection'].map(item => (
              <span key={item} style={{ padding: '6px 14px', backgroundColor: '#dcfce7', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#166534' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📞 Contact Us</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Data Protection Officer</div>
              <div style={{ fontSize: 13, color: SLATE }}>Email: dpo@metrocareproperties.ug</div>
              <div style={{ fontSize: 13, color: SLATE }}>Phone: +256 700 123 456</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Complaints</div>
              <div style={{ fontSize: 13, color: SLATE }}>Email: privacy@metrocareproperties.ug</div>
              <div style={{ fontSize: 13, color: SLATE }}>NITA-Uganda: complaints@nita.go.ug</div>
            </div>
          </div>
          
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#ecfdf5', borderRadius: 12, borderLeft: `4px solid ${GREEN}` }}>
            <strong style={{ color: '#166534' }}>✅ Our Commitment:</strong>
            <span style={{ marginLeft: 8, fontSize: 13, color: '#166534' }}>Metro Care Properties is committed to protecting your privacy and complying with the Uganda Data Protection and Privacy Act, 2019.</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;