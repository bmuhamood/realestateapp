// src/components/Legal/LegalLayout.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
  lastUpdated?: string;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, children, lastUpdated }) => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <div style={styles.container}>
      {/* Background Gradient */}
      <div style={styles.bgGradient} />
      
      {/* Navigation Bar */}
      <div style={styles.navbar}>
        <div style={styles.navContent}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        <div style={styles.contentCard}>
          <div style={styles.header}>
            <div style={styles.headerBadge}>Legal Document</div>
            <h1 style={styles.title}>{title}</h1>
            {lastUpdated && <p style={styles.lastUpdated}>Last updated: {lastUpdated}</p>}
          </div>
          <div style={styles.divider} />
          <div style={styles.content}>
            {children}
          </div>
          <div style={styles.footer}>
            <div style={styles.footerDivider} />
            <p style={styles.copyright}>© {year} Metro Care Properties. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f7f8fa',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    marginTop: 64,
    position: 'relative',
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    background: 'linear-gradient(135deg, #0d1b2e 0%, #1a3a5c 50%, #e6394622 100%)',
    zIndex: 0,
  },
  navbar: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    padding: '0 24px',
  },
  navContent: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '16px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    color: '#e63946',
    fontFamily: "'Sora', sans-serif",
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 10,
    border: '1.5px solid #e2e5ea',
    background: '#fff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 10,
    maxWidth: 1000,
    margin: '0 auto',
    padding: '40px 24px',
  },
  contentCard: {
    background: '#fff',
    borderRadius: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    padding: '40px 48px 24px',
    background: 'linear-gradient(135deg, #fff 0%, #fafcff 100%)',
  },
  headerBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(230,57,70,0.1)',
    color: '#e63946',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 20,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: '#0d1b2e',
    fontFamily: "'Sora', sans-serif",
    letterSpacing: '-0.02em',
    margin: 0,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 0,
  },
  divider: {
    height: 1,
    background: '#eef2f7',
  },
  content: {
    padding: '32px 48px',
    color: '#475569',
    lineHeight: 1.7,
  },
  footer: {
    padding: '24px 48px 40px',
    background: '#f8fafc',
  },
  footerDivider: {
    height: 1,
    background: '#e2e5ea',
    marginBottom: 24,
  },
  copyright: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center' as const,
    margin: 0,
  },
};

export default LegalLayout;