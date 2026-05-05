// src/pages/legal/CookiePolicyPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const SLATE = '#475569';

const CookiePolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            🍪 Cookie Policy
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
            Last updated: May 1, 2026
          </p>
        </div>

        {/* What Are Cookies */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🍪 What Are Cookies?</h2>
          <p style={{ color: SLATE, lineHeight: 1.7 }}>
            Cookies are small text files placed on your device when you visit our Platform. They help us remember your preferences, 
            analyze usage, and improve your experience.
          </p>
        </div>

        {/* Types of Cookies */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📋 Types of Cookies We Use</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { type: 'Essential Cookies', icon: '🔒', desc: 'Authentication, security, session management', required: true },
              { type: 'Preference Cookies', icon: '⚙️', desc: 'Language preferences, search filters, saved properties', required: true },
              { type: 'Analytics Cookies', icon: '📊', desc: 'Page views, navigation, performance monitoring', required: false },
              { type: 'Marketing Cookies', icon: '🎯', desc: 'Property recommendations, retargeting ads', required: false }
            ].map(item => (
              <div key={item.type} style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>{item.type}</div>
                <div style={{ fontSize: 12, color: SLATE, marginBottom: 8 }}>{item.desc}</div>
                {item.required ? (
                  <span style={{ fontSize: 10, color: TEAL, fontWeight: 600 }}>✓ Always Active</span>
                ) : (
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Requires Consent</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🔗 Third-Party Cookies</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {['Google Analytics', 'Cloudinary', 'Social Login', 'Payment Processors'].map(item => (
              <div key={item} style={{ padding: '8px 16px', backgroundColor: '#f8faff', borderRadius: 20, fontSize: 13, color: SLATE }}>
                {item}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            We do not control third-party cookies. Please review their privacy policies for more information.
          </p>
        </div>

        {/* Managing Cookies */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>⚙️ Managing Cookies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { browser: 'Chrome', path: 'Settings → Privacy → Cookies' },
              { browser: 'Firefox', path: 'Options → Privacy → Cookies' },
              { browser: 'Safari', path: 'Preferences → Privacy → Cookies' },
              { browser: 'Edge', path: 'Settings → Cookies and Permissions' }
            ].map(item => (
              <div key={item.browser} style={{ padding: '10px', backgroundColor: '#f8faff', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, color: NAVY }}>{item.browser}</div>
                <div style={{ fontSize: 11, color: SLATE }}>{item.path}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            Disabling cookies may affect Platform functionality (e.g., staying logged in, saved preferences).
          </p>
        </div>

        {/* Cookie Consent */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>✅ Cookie Consent</h2>
          <p style={{ color: SLATE }}>
            When you first visit our Platform, you'll see a cookie banner. By continuing to use our Platform, 
            you consent to our use of essential and preference cookies. For analytics and marketing cookies, 
            we will request your explicit consent.
          </p>
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f8faff', borderRadius: 12, borderLeft: `4px solid ${TEAL}` }}>
            <strong style={{ color: NAVY }}>📞 Contact Us</strong>
            <div style={{ fontSize: 13, color: SLATE, marginTop: 8 }}>Email: privacy@metrocareproperties.ug</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;