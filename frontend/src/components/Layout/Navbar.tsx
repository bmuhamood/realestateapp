// src/components/Navbar/Navbar.tsx — Fixed & Bayut-inspired

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';

// ─── Inject responsive styles once ───────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('navbar-styles')) {
  const s = document.createElement('style');
  s.id = 'navbar-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    .nav-desktop-links { display: flex; }
    .nav-right-desktop { display: flex; }
    .nav-mobile-btn    { display: none !important; }
    .nav-mobile-menu   { display: none; }

    @media (max-width: 900px) {
      .nav-desktop-links { display: none !important; }
      .nav-right-desktop { display: none !important; }
      .nav-mobile-btn    { display: flex !important; }
      .nav-mobile-menu.open { display: block !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:     '#e84035',
  primaryDark: '#c0392b',
  primaryBg:   'rgba(232,64,53,0.08)',
  teal:        '#0d9948',
  tealBg:      'rgba(13,153,72,0.08)',
  navy:        '#0f1923',
  navyLight:   '#1e2d3d',
  slate:       '#64748b',
  slateLight:  '#94a3b8',
  border:      '#e2e8f0',
  border2:     '#f1f5f9',
  white:       '#ffffff',
  bg:          '#f8fafc',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const GridIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const WrenchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const DashboardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
  </svg>
);
const LegalIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
  </svg>
);
const UserIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BuildingIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="9" y1="22" x2="9" y2="2" />
    <line x1="14" y1="7" x2="16" y2="7" /><line x1="14" y1="11" x2="16" y2="11" /><line x1="14" y1="15" x2="16" y2="15" />
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.includes('/')) return `https://res.cloudinary.com/drcy2xxkg/${url}`;
  return url;
};

const getAvatarSrc = (user: User | null | undefined): string => {
  const pic = user?.profile_picture_url || user?.profile_picture;
  const full = getImageUrl(pic);
  if (full) return full;
  const name = encodeURIComponent(`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'U');
  return `https://ui-avatars.com/api/?background=0f1923&color=0d9948&name=${name}&bold=true&size=64`;
};

const getUserRole = (user: User | null | undefined): string => {
  if (user?.is_agent) return 'Agent';
  if (user?.is_service_provider) return 'Service Provider';
  return 'Member';
};

const getDashPath  = (user: User | null | undefined): string => user?.is_service_provider ? '/service-provider/dashboard' : '/dashboard';
const getDashLabel = (user: User | null | undefined): string => user?.is_service_provider ? 'Service Dashboard' : user?.is_agent ? 'Agent Dashboard' : 'Dashboard';

// ─── Data ─────────────────────────────────────────────────────────────────────
const LEGAL_LINKS = [
  { label: 'Privacy Policy',   path: '/legal/privacy-policy/',   icon: '🔐' },
  { label: 'Terms of Service', path: '/legal/terms-of-service/', icon: '📄' },
  { label: 'Data Protection',  path: '/legal/data-protection/',  icon: '🔒' },
  { label: 'Cookie Policy',    path: '/legal/cookie-policy/',    icon: '🍪' },
  { label: 'Disclaimer',       path: '/legal/disclaimer/',       icon: '⚠️' },
  { label: 'User Agreement',   path: '/legal/user-agreement/',   icon: '📜' },
  { label: 'Safety Center',    path: '/safety/',                 icon: '🛡️' },
];

const BASE_NAV = [
  { label: 'Home',       path: '/',           icon: <HomeIcon /> },
  { label: 'Properties', path: '/properties', icon: <GridIcon /> },
  { label: 'Services',   path: '/services',   icon: <WrenchIcon /> },
  { label: 'Agents',     path: '/agents',     icon: <UsersIcon /> },
];

// ─── Reusable sub-components ──────────────────────────────────────────────────

/** Pill nav button */
const NavBtn: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '8px 16px',
      borderRadius: 40,
      border: 'none',
      background: active ? C.primaryBg : 'transparent',
      color: active ? C.primary : C.slate,
      fontSize: 13.5,
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.primaryBg; if (!active) e.currentTarget.style.color = C.primary; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; if (!active) e.currentTarget.style.color = C.slate; }}
  >
    <span style={{ opacity: active ? 1 : 0.65, display: 'flex' }}>{icon}</span>
    {label}
    {active && (
      <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2.5, borderRadius: 2, background: C.primary }} />
    )}
  </button>
);

/** Dropdown menu item */
const DropItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      width: '100%', padding: '10px 16px',
      border: 'none', background: 'none',
      fontSize: 13.5,
      color: danger ? C.primary : C.slate,
      fontWeight: danger ? 600 : 400,
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'background 0.12s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? '#fff5f4' : C.bg; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    <span style={{ color: danger ? C.primary : C.slateLight, display: 'flex', flexShrink: 0 }}>{icon}</span>
    {label}
  </button>
);

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const { user: authUser, logout, isAuthenticated } = useAuth();
  const user = authUser as User | null;   // AuthContext may type this loosely; cast to our full User type
  const navigate  = useNavigate();
  const location  = useLocation();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [dropOpen,      setDropOpen]      = useState(false);
  const [legalOpen,     setLegalOpen]     = useState(false);
  const [scrolled,      setScrolled]      = useState(false);

  const dropRef  = useRef<HTMLDivElement>(null);
  const legalRef = useRef<HTMLDivElement>(null);

  // Derived
  const navLinks = isAuthenticated
    ? [...BASE_NAV, { label: getDashLabel(user), path: getDashPath(user), icon: <DashboardIcon /> }]
    : BASE_NAV;

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const go = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setDropOpen(false);
    setLegalOpen(false);
  };

  const handleLogout = () => { logout(); setDropOpen(false); navigate('/'); };

  // Scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Click-outside close
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current  && !dropRef.current.contains(e.target as Node))  setDropOpen(false);
      if (legalRef.current && !legalRef.current.contains(e.target as Node)) setLegalOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // User menu items
  const dropItems: { icon: React.ReactNode; label: string; path: string }[] = [
    { icon: <UserIcon />,      label: 'My Profile',       path: '/profile' },
    { icon: <DashboardIcon />, label: getDashLabel(user),  path: getDashPath(user) },
    ...(user?.is_agent            ? [{ icon: <BuildingIcon />, label: 'My Listings',     path: '/dashboard/properties' }] : []),
    ...(user?.is_service_provider ? [{ icon: <WrenchIcon />,   label: 'Manage Services', path: '/service-provider' }]     : []),
    { icon: <SettingsIcon />,  label: 'Settings',          path: '/settings' },
  ];

  // ─── Shared CTAs ───────────────────────────────────────────────────────────
  const listPropertyBtn = isAuthenticated && user?.is_agent ? (
    <button
      onClick={() => go('/dashboard/properties/add')}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 40, border: 'none', background: C.navy, color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { e.currentTarget.style.background = C.navyLight; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.transform = 'none'; }}
    >
      <PlusIcon /> List Property
    </button>
  ) : null;

  const addServiceBtn = isAuthenticated && user?.is_service_provider ? (
    <button
      onClick={() => go('/service-provider')}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 40, border: 'none', background: C.navy, color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
    >
      <PlusIcon /> Add Service
    </button>
  ) : null;

  const authButtons = !isAuthenticated ? (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => go('/login')}
        style={{ padding: '8px 20px', borderRadius: 40, border: `1.5px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.slate; }}
      >
        Log in
      </button>
      <button
        onClick={() => go('/register')}
        style={{ padding: '8px 22px', borderRadius: 40, border: 'none', background: C.primary, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = C.primaryDark; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.transform = 'none'; }}
      >
        Sign up
      </button>
    </div>
  ) : null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: C.white,
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* ── Logo ── */}
          <button onClick={() => go('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" opacity="0.9" />
                <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Metro<span style={{ color: C.primary }}>Care</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Properties
              </div>
            </div>
          </button>

          {/* ── Desktop nav links ── */}
          <div className="nav-desktop-links" style={{ alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
            {navLinks.map(link => (
              <NavBtn
                key={link.path}
                label={link.label}
                icon={link.icon}
                active={isActive(link.path)}
                onClick={() => go(link.path)}
              />
            ))}

            {/* Legal dropdown */}
            <div ref={legalRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setLegalOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 40, border: 'none',
                  background: legalOpen ? C.primaryBg : 'transparent',
                  color: legalOpen ? C.primary : C.slate,
                  fontSize: 13.5, fontWeight: legalOpen ? 600 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!legalOpen) { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.color = C.primary; } }}
                onMouseLeave={e => { if (!legalOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.slate; } }}
              >
                <span style={{ opacity: legalOpen ? 1 : 0.65, display: 'flex' }}><LegalIcon /></span>
                Legal
                <span style={{ display: 'flex', transform: legalOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <ChevronDownIcon />
                </span>
              </button>

              {legalOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                  minWidth: 220, background: C.white, borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                  overflow: 'hidden', zIndex: 500, padding: '6px 0',
                }}>
                  {LEGAL_LINKS.map(link => {
                    const active = location.pathname === link.path;
                    return (
                      <button
                        key={link.path}
                        onClick={() => go(link.path)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '10px 16px', border: 'none',
                          background: active ? C.primaryBg : 'transparent',
                          color: active ? C.primary : C.slate,
                          fontSize: 13, fontWeight: active ? 600 : 400,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s', textAlign: 'left',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.bg; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{link.icon}</span>
                        {link.label}
                        {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop right section ── */}
          <div className="nav-right-desktop" style={{ alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {listPropertyBtn}
            {addServiceBtn}

            {isAuthenticated ? (
              /* Avatar dropdown */
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px 5px 5px', borderRadius: 40,
                    border: `1.5px solid ${dropOpen ? C.teal : C.border}`,
                    background: dropOpen ? C.tealBg : C.white,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <img
                    src={getAvatarSrc(user)}
                    alt="avatar"
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.teal}`, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=0f1923&color=0d9948&bold=true`; }}
                  />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, lineHeight: 1.2 }}>
                      {user?.first_name || user?.username || 'User'}
                    </div>
                    <div style={{ fontSize: 10, color: C.slateLight, fontWeight: 500 }}>{getUserRole(user)}</div>
                  </div>
                  <span style={{ display: 'flex', transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: C.slateLight }}>
                    <ChevronDownIcon />
                  </span>
                </button>

                {dropOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 268, background: C.white, borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    overflow: 'hidden', zIndex: 500,
                  }}>
                    {/* User header */}
                    <div style={{ padding: '16px', background: `linear-gradient(135deg, ${C.primaryBg}, ${C.tealBg})`, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12 }}>
                      <img
                        src={getAvatarSrc(user)}
                        alt="avatar"
                        style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.white}`, flexShrink: 0 }}
                        onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=0f1923&color=0d9948&bold=true`; }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: C.slateLight, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                        {user?.is_verified ? (
                          <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20 }}>✓ Verified</span>
                        ) : (
                          <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20 }}>Unverified</span>
                        )}
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px 0' }}>
                      {dropItems.map(item => (
                        <DropItem key={item.path} icon={item.icon} label={item.label} onClick={() => go(item.path)} />
                      ))}
                    </div>

                    <div style={{ borderTop: `1px solid ${C.border}`, padding: '6px 0' }}>
                      <DropItem icon={<LogoutIcon />} label="Sign out" onClick={handleLogout} danger />
                    </div>
                  </div>
                )}
              </div>
            ) : authButtons}
          </div>

          {/* ── Hamburger (mobile only) ── */}
          <button
            className="nav-mobile-btn"
            onClick={() => setMenuOpen(v => !v)}
            style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40, padding: 0, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: 'pointer', color: C.slate, flexShrink: 0 }}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* ── Mobile menu ── */}
        <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`} style={{ borderTop: `1px solid ${C.border}`, background: C.white, maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px' }}>

            {/* Nav links */}
            {navLinks.map(link => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => go(link.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none',
                    background: active ? C.primaryBg : 'transparent',
                    color: active ? C.primary : C.slate,
                    fontSize: 14, fontWeight: active ? 600 : 500,
                    cursor: 'pointer', marginBottom: 3, fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.65, display: 'flex' }}>{link.icon}</span>
                  {link.label}
                </button>
              );
            })}

            {/* Legal section */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.slateLight, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px 4px' }}>
                Legal
              </div>
              {LEGAL_LINKS.map(link => {
                const active = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => go(link.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
                      background: active ? C.primaryBg : 'transparent',
                      color: active ? C.primary : C.slate,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', marginBottom: 2, fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{link.icon}</span>
                    {link.label}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: C.border, margin: '12px 0' }} />

            {/* Auth section */}
            {isAuthenticated ? (
              <>
                {/* User mini-card */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: C.bg, borderRadius: 10, marginBottom: 8 }}>
                  <img
                    src={getAvatarSrc(user)}
                    alt="avatar"
                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.teal}`, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=0f1923&color=0d9948&bold=true`; }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{user?.first_name} {user?.last_name}</div>
                    <div style={{ fontSize: 11, color: C.slateLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                  </div>
                </div>

                {dropItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
                      background: 'transparent', color: C.slate,
                      fontSize: 13.5, cursor: 'pointer', marginBottom: 2, fontFamily: 'inherit', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ color: C.slateLight, display: 'flex' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}

                {listPropertyBtn && <div style={{ marginTop: 4 }}>{listPropertyBtn}</div>}
                {addServiceBtn   && <div style={{ marginTop: 4 }}>{addServiceBtn}</div>}

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
                    background: '#fff5f4', color: C.primary,
                    fontSize: 13.5, fontWeight: 600, cursor: 'pointer', marginTop: 6, fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <LogoutIcon /> Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                <button
                  onClick={() => go('/login')}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.slate, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Log in
                </button>
                <button
                  onClick={() => go('/register')}
                  style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: C.primary, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Sign up free
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;