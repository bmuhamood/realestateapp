// src/pages/legal/DataProtectionPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer/Footer';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const GREEN = '#16a34a';
const SLATE = '#475569';

const DataProtectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            📊 Data Protection Compliance
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
            Uganda Data Protection and Privacy Act, 2019
          </p>
        </div>

        {/* Compliance Banner */}
        <div style={{ backgroundColor: '#ecfdf5', borderLeft: `4px solid ${GREEN}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, color: '#166534', marginBottom: 8, fontSize: 16 }}>✅ Our Commitment</div>
          <p style={{ color: '#166534', margin: 0, fontSize: 14 }}>
            Metro Care Properties is fully compliant with the Uganda Data Protection and Privacy Act, 2019. 
            We are registered as a Data Controller with NITA-Uganda.
          </p>
        </div>

        {/* Data We Process */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📋 Personal Data We Process</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[
              { cat: 'Identity Data', items: 'Name, username, profile picture' },
              { cat: 'Contact Data', items: 'Email, phone number, physical address' },
              { cat: 'Verification Data', items: 'National ID, passport (with consent)' },
              { cat: 'Transaction Data', items: 'Payment records, booking history' },
              { cat: 'Technical Data', items: 'IP address, device information' },
              { cat: 'Location Data', items: 'District, city, approximate location' }
            ].map(item => (
              <div key={item.cat} style={{ padding: '14px', backgroundColor: '#f8faff', borderRadius: 10 }}>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>{item.cat}</div>
                <div style={{ fontSize: 12, color: SLATE }}>{item.items}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lawful Basis */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>⚖️ Lawful Basis for Processing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { basis: 'Consent', desc: 'Marketing emails, verification documents' },
              { basis: 'Contract Performance', desc: 'Property listings, bookings' },
              { basis: 'Legal Obligation', desc: 'Compliance with laws' },
              { basis: 'Legitimate Interests', desc: 'Platform improvement, fraud prevention' }
            ].map(item => (
              <div key={item.basis} style={{ padding: '14px', backgroundColor: '#f8faff', borderRadius: 10 }}>
                <div style={{ fontWeight: 700, color: TEAL, marginBottom: 4 }}>{item.basis}</div>
                <div style={{ fontSize: 12, color: SLATE }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Rights */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>✅ Your Rights Under the Act</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {[
              'Right to Access',
              'Right to Rectification',
              'Right to Erasure (Right to be Forgotten)',
              'Right to Restrict Processing',
              'Right to Data Portability',
              'Right to Object',
              'Right to Withdraw Consent'
            ].map(right => (
              <div key={right} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                <span style={{ color: GREEN, fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 13, color: NAVY }}>{right}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Protection Officer */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>👤 Data Protection Officer</h2>
          <div style={{ backgroundColor: '#f8faff', padding: 20, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Contact our DPO</div>
            <div style={{ fontSize: 13, color: SLATE, marginBottom: 4 }}>Email: dpo@metrocareproperties.ug</div>
            <div style={{ fontSize: 13, color: SLATE, marginBottom: 4 }}>Phone: +256 700 123 456</div>
            <div style={{ fontSize: 13, color: SLATE }}>Address: Kampala, Uganda</div>
          </div>
        </div>

        {/* Complaints */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📝 Complaints</h2>
          <p style={{ color: SLATE, marginBottom: 16 }}>
            If you believe we have violated your data protection rights, you may lodge a complaint with:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Metro Care Properties</div>
              <div style={{ fontSize: 12, color: SLATE }}>dpo@metrocareproperties.ug</div>
            </div>
            <div style={{ flex: 1, padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>NITA-Uganda</div>
              <div style={{ fontSize: 12, color: SLATE }}>complaints@nita.go.ug</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DataProtectionPage;