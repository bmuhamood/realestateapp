// src/pages/legal/DisclaimerPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const AMBER = '#f59e0b';
const SLATE = '#475569';

const DisclaimerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            ⚖️ Disclaimer
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
            Last updated: May 1, 2026
          </p>
        </div>

        {/* Important Warning */}
        <div style={{ backgroundColor: '#fee2e2', borderLeft: `4px solid ${RED}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 8, fontSize: 16 }}>⚠️ Important Legal Disclaimer</div>
          <p style={{ color: '#991b1b', margin: 0, fontSize: 14 }}>
            Nothing on this Platform constitutes an offer, contract, or binding agreement. All property listings are invitations to make an offer, not binding offers themselves.
          </p>
        </div>

        {/* General Information */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📋 General Information</h2>
          <p style={{ color: SLATE, lineHeight: 1.7 }}>
            The information provided on Metro Care Properties is for general informational purposes only. 
            All information on the Platform is provided in good faith, however we make no representation or warranty 
            of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, 
            or completeness of any information on the Platform.
          </p>
        </div>

        {/* Property Listings Disclaimer */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🏠 Property Listings</h2>
          <p style={{ color: SLATE, marginBottom: 16 }}>Property listings on our Platform are submitted by third-party agents and property owners. We do not:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Guarantee the accuracy of listing information (price, size, condition, etc.)',
              'Verify the legal ownership of listed properties',
              'Inspect properties before listing (unless explicitly marked as "Verified")',
              'Confirm the professional credentials of agents'
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: RED, fontSize: 16 }}>✕</span>
                <span style={{ fontSize: 13, color: SLATE }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fef3c7', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
              Users are strongly advised to perform their own due diligence before entering into any real estate transaction.
            </p>
          </div>
        </div>

        {/* No Professional Advice */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📚 No Professional Advice</h2>
          <p style={{ color: SLATE, lineHeight: 1.7 }}>
            The information on our Platform is not intended as professional legal, financial, or real estate advice. 
            You should consult with qualified professionals (lawyers, accountants, real estate experts) before making 
            decisions based on information from our Platform.
          </p>
        </div>

        {/* Transaction Risks */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>⚠️ Transaction Risks</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[
              'You are solely responsible for your transactions',
              'We are not a party to any transaction between users',
              'We do not act as an escrow agent',
              'We do not guarantee transaction completion',
              'We are not liable for disputes between users'
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                <span style={{ color: AMBER, fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 12, color: SLATE }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Limitation of Liability */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🔒 Limitation of Liability</h2>
          <div style={{ backgroundColor: '#fee2e2', padding: 16, borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>
              To the fullest extent permitted by law, Metro Care Properties shall not be liable for any direct, indirect, 
              incidental, special, consequential, or punitive damages arising from your use of the Platform, any transaction 
              entered into through the Platform, errors or omissions in listing information, loss of data, revenue, or profits, 
              or unauthorized access to your account.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📞 Contact Us</h2>
          <p style={{ color: SLATE, marginBottom: 16 }}>If you have questions about this Disclaimer, contact us:</p>
          <div style={{ backgroundColor: '#f8faff', padding: 20, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Legal Department</div>
            <div style={{ fontSize: 13, color: SLATE, marginBottom: 4 }}>Email: legal@metrocareproperties.ug</div>
            <div style={{ fontSize: 13, color: SLATE }}>Address: Kampala, Uganda</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPage;