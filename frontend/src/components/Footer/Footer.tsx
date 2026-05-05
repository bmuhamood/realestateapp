// src/components/Footer/Footer.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Copy the toPropertiesUrl function (or import it)
const toPropertiesUrl = (params: { search?: string; property_type?: string; transaction_type?: string; bedrooms?: string; location?: string; sort?: string }) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k === 'sort' ? 'ordering' : k, v); });
  return `/properties${p.toString() ? `?${p.toString()}` : ''}`;
};

// Inner component (needed for the footer)
const Inner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px' }}>
    {children}
  </div>
);

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const legalLinks = [
    { name: 'Privacy Policy',   path: '/legal/privacy-policy' },
    { name: 'Terms of Service', path: '/legal/terms-of-service' },
    { name: 'Data Protection',  path: '/legal/data-protection' },
    { name: 'Cookie Policy',    path: '/legal/cookie-policy' },
    { name: 'Disclaimer',       path: '/legal/disclaimer' },
    { name: 'User Agreement',   path: '/legal/user-agreement' },
    { name: 'Safety Center',    path: '/safety' },
  ];

  const cols = [
    { h: 'Buy', links: [
      { name: 'Houses for Sale',    path: toPropertiesUrl({ property_type: 'house', transaction_type: 'sale' }) },
      { name: 'Apartments',         path: toPropertiesUrl({ property_type: 'apartment', transaction_type: 'sale' }) },
      { name: 'Land for Sale',      path: toPropertiesUrl({ property_type: 'land', transaction_type: 'sale' }) },
      { name: 'Commercial',         path: toPropertiesUrl({ property_type: 'commercial', transaction_type: 'sale' }) },
    ]},
    { h: 'Rent', links: [
      { name: 'Houses for Rent',    path: toPropertiesUrl({ property_type: 'house', transaction_type: 'rent' }) },
      { name: 'Apartments for Rent',path: toPropertiesUrl({ property_type: 'apartment', transaction_type: 'rent' }) },
      { name: 'Short Stay',         path: toPropertiesUrl({ transaction_type: 'shortlet' }) },
    ]},
    { h: 'Explore', links: [
      { name: 'All Properties',     path: '/properties' },
      { name: 'Newest Listings',    path: toPropertiesUrl({ sort: '-created_at' }) },
      { name: 'Most Viewed',        path: toPropertiesUrl({ sort: '-views_count' }) },
      { name: 'Services',           path: '/services' },
    ]},
    { h: 'Legal', links: legalLinks },
  ];

  return (
    <footer style={{ background: '#07111e' }}>
      {/* App download banner */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '32px 0' }}>
        <Inner>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0d9948', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Download the App</div>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>Property search, on the go</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { href: 'https://play.google.com/store', label: 'Google Play', sub: 'GET IT ON' },
                { href: 'https://apps.apple.com',        label: 'App Store',   sub: 'DOWNLOAD ON THE' },
              ].map(b => (
                <a key={b.href} href={b.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 18px', textDecoration: 'none', color: '#fff', transition: 'border-color 0.2s' }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>{b.sub}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{b.label}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Inner>
      </div>

      {/* Links grid */}
      <Inner>
        <div style={{ padding: '44px 0 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#0d9948" /><polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>Metro Care Properties</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#0d9948', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Uganda's #1 Real Estate</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#3d5566', lineHeight: 1.7, margin: 0 }}>
              The most trusted property marketplace in Uganda. Find your perfect home, office, or land investment.
            </p>
          </div>

          {/* Nav cols */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {cols.map(col => (
              <div key={col.h}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0d9948', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{col.h}</div>
                {col.links.map(link => (
                  <button key={link.name} onClick={() => navigate(link.path)} style={{ display: 'block', background: 'none', border: 'none', color: '#4a6070', fontSize: 13, marginBottom: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0, transition: 'color 0.15s' }}>
                    {link.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Inner>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '14px 28px', maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#243545' }}>© {year} Metro Properties. All rights reserved.</span>
        <span style={{ fontSize: 12, color: '#243545' }}>🇺🇬 Kampala, Uganda</span>
      </div>
    </footer>
  );
};

export default Footer;