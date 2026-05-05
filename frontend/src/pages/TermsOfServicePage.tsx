// src/pages/legal/TermsOfServicePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const AMBER = '#f59e0b';
const SLATE = '#475569';

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            📜 Terms of Service
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
            Last updated: May 1, 2026
          </p>
        </div>

        {/* Alert Banner */}
        <div style={{ backgroundColor: '#fee2e2', borderLeft: `4px solid ${RED}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 8, fontSize: 16 }}>⚠️ Important Legal Notice</div>
          <p style={{ color: '#991b1b', margin: 0, fontSize: 14 }}>
            By using Metro Care Properties, you agree to be bound by these Terms of Service. Please read them carefully before using our Platform.
          </p>
        </div>

        {/* Acceptance of Terms */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>✓ Acceptance of Terms</h2>
          <p style={{ color: SLATE, lineHeight: 1.7 }}>
            By accessing or using Metro Care Properties ("Platform"), you agree to be bound by these Terms of Service. 
            If you do not agree to these Terms, please do not use our Platform. We may modify these Terms at any time, 
            and your continued use constitutes acceptance of the modified Terms.
          </p>
        </div>

        {/* Platform Description */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🏠 Platform Description</h2>
          <p style={{ color: SLATE, marginBottom: 16 }}>Metro Care Properties is a real estate marketplace that connects:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {['Buyers & Sellers', 'Tenants & Landlords', 'Property Seekers & Agents', 'Service Providers & Customers'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                <span style={{ color: TEAL, fontSize: 18 }}>→</span>
                <span style={{ fontSize: 13, color: NAVY }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Accounts */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>👤 User Accounts</h2>
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Account Types</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {[
                { type: 'Regular Users', desc: 'Search properties, book viewings, contact agents' },
                { type: 'Agents', desc: 'Verified real estate professionals who can list properties' },
                { type: 'Service Providers', desc: 'Verified professionals offering real estate services' }
              ].map(item => (
                <div key={item.type} style={{ padding: '12px', backgroundColor: '#f8faff', borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>{item.type}</div>
                  <div style={{ fontSize: 12, color: SLATE }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Your Responsibilities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Provide accurate and complete registration information',
                'Maintain the confidentiality of your password',
                'Notify us immediately of unauthorized account access',
                'Accept responsibility for all activities under your account'
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: RED, fontSize: 16 }}>•</span>
                  <span style={{ fontSize: 13, color: SLATE }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prohibited Conduct */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🚫 Prohibited Conduct</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[
              'Posting fake or fraudulent listings',
              'Harassing or abusing other users',
              'Using the Platform for illegal activities',
              'Circumventing our fee structure',
              'Attempting to hack or disrupt Platform operations',
              'Scraping or copying content without permission'
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: 8 }}>
                <span style={{ color: RED, fontSize: 16 }}>✕</span>
                <span style={{ fontSize: 12, color: '#991b1b' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation & Refund */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>💰 Cancellation & Refund Policy</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Booking Cancellations</div>
              <div style={{ fontSize: 12, color: SLATE }}>24+ hours before viewing: Full refund</div>
              <div style={{ fontSize: 12, color: SLATE }}>Less than 24 hours: No refund</div>
              <div style={{ fontSize: 12, color: SLATE }}>No-show: No refund</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Boost Packages</div>
              <div style={{ fontSize: 12, color: SLATE }}>Cannot be cancelled once activated</div>
              <div style={{ fontSize: 12, color: SLATE }}>No refunds for boost packages</div>
              <div style={{ fontSize: 12, color: SLATE }}>Technical issues reviewed case-by-case</div>
            </div>
          </div>
        </div>

        {/* Disclaimer & Liability */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>⚖️ Disclaimer & Limitation of Liability</h2>
          <div style={{ backgroundColor: '#fef3c7', padding: 16, borderRadius: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED OR ERROR-FREE.
            </p>
          </div>
          <p style={{ color: SLATE, fontSize: 13, marginBottom: 12 }}>
            To the maximum extent permitted by law, Metro Care Properties shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages resulting from your use of the Platform or any transaction entered into through the Platform.
          </p>
        </div>

        {/* Governing Law */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🏛️ Governing Law</h2>
          <p style={{ color: SLATE, marginBottom: 16 }}>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of Uganda. 
            Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Uganda.
          </p>
          
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f8faff', borderRadius: 12, borderLeft: `4px solid ${TEAL}` }}>
            <strong style={{ color: NAVY }}>📞 Contact Us</strong>
            <div style={{ fontSize: 13, color: SLATE, marginTop: 8 }}>
              Email: legal@metrocareproperties.ug<br />
              Phone: +256 700 123 456<br />
              Address: Kampala, Uganda
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;