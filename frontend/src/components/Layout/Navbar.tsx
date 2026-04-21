import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const TEAL = '#25a882';
const TEAL_DARK = '#1d8f6e';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const NAVY = '#0d1b2e';
const NAVY_LIGHT = '#1e293b';
const SLATE = '#475569';
const SLATE_LIGHT = '#94a3b8';
const RED = '#e63946';
const BORDER = '#eef2f7';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Home: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Grid: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  Wrench: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Building: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="22" x2="9" y2="2" /><line x1="8" y1="7" x2="9" y2="7" />
      <line x1="8" y1="11" x2="9" y2="11" /><line x1="14" y1="7" x2="16" y2="7" />
      <line x1="14" y1="11" x2="16" y2="11" /><line x1="14" y1="15" x2="16" y2="15" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface NavLink { label: string; path: string; icon: React.ReactNode; }

const BASE_NAV: NavLink[] = [
  { label: 'Home', path: '/', icon: <Icon.Home /> },
  { label: 'Properties', path: '/properties', icon: <Icon.Grid /> },
  { label: 'Services', path: '/services', icon: <Icon.Wrench /> },
  { label: 'Agents', path: '/agents', icon: <Icon.Users /> },
];

const getAvatarSrc = (user: any) =>
  user?.profile_picture ||
  `https://ui-avatars.com/api/?background=0d1b2e&color=25a882&name=${encodeURIComponent(`${user?.first_name ?? ''} ${user?.last_name ?? ''}`)}&bold=true&size=64`;

const getUserRole = (user: any) => {
  if (user?.is_agent) return 'Agent';
  if (user?.is_service_provider) return 'Service Provider';
  return 'Member';
};

const getDashPath = (user: any) => user?.is_service_provider ? '/service-provider/dashboard' : '/dashboard';
const getDashLabel = (user: any) => user?.is_service_provider ? 'Service Dashboard' : user?.is_agent ? 'Agent Dashboard' : 'My Dashboard';

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const navLinks: NavLink[] = isAuthenticated
    ? [...BASE_NAV, { label: getDashLabel(user), path: getDashPath(user), icon: <Icon.Dashboard /> }]
    : BASE_NAV;

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const go = (path: string) => { navigate(path); setMenuOpen(false); setDropOpen(false); };
  const handleLogout = () => { logout(); setDropOpen(false); navigate('/'); };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const dropItems = [
    { icon: <Icon.User />, label: 'My Profile', path: '/profile' },
    { icon: <Icon.Dashboard />, label: getDashLabel(user), path: getDashPath(user) },
    ...((user as any)?.is_agent ? [{ icon: <Icon.Building />, label: 'My Listings', path: '/dashboard/properties' }] : []),
    ...((user as any)?.is_service_provider ? [{ icon: <Icon.Wrench />, label: 'Manage Services', path: '/service-provider' }] : []),
    { icon: <Icon.Settings />, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        backgroundColor: '#fff',
        borderBottom: scrolled ? '1px solid #eef2f7' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 24px rgba(13,27,46,0.07)' : 'none',
        transition: 'box-shadow 0.25s, border-color 0.25s',
        fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', gap: 0 }}>

          {/* ── Logo ── */}
          <a href="/" onClick={e => { e.preventDefault(); go('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 32, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={TEAL} />
                <polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: NAVY, letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif" }}>Metro</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: TEAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>Properties</span>
            </div>
          </a>

          {/* ── Desktop Nav Links ── */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {navLinks.map(link => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => go(link.path)}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 14px',
                    borderRadius: 9, border: 'none',
                    background: active ? TEAL_BG : 'transparent',
                    color: active ? NAVY : SLATE,
                    fontSize: 13.5, fontWeight: active ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  className="nav-link-btn"
                >
                  <span style={{ display: 'flex', color: active ? TEAL : 'currentColor', opacity: active ? 1 : 0.55, transition: 'all 0.15s' }}>
                    {link.icon}
                  </span>
                  {link.label}
                  {active && (
                    <span style={{
                      position: 'absolute', bottom: -1, left: 10, right: 10,
                      height: 2, borderRadius: '2px 2px 0 0',
                      backgroundColor: TEAL,
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Right Section ── */}
          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16, flexShrink: 0 }}>

            {/* CTA Button */}
            {isAuthenticated && user?.is_agent && (
              <button
                onClick={() => go('/dashboard/properties/add')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px',
                  borderRadius: 9, border: 'none',
                  backgroundColor: NAVY, color: '#fff',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                className="cta-btn"
              >
                <Icon.Plus />
                List Property
              </button>
            )}

            {isAuthenticated && (user as any)?.is_service_provider && (
              <button
                onClick={() => go('/service-provider')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px',
                  borderRadius: 9, border: 'none',
                  backgroundColor: NAVY, color: '#fff',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                className="cta-btn"
              >
                <Icon.Plus />
                Add Service
              </button>
            )}

            {isAuthenticated ? (
              /* ── Avatar Dropdown ── */
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '5px 10px 5px 5px',
                    borderRadius: 40,
                    border: `1.5px solid ${dropOpen ? TEAL : BORDER}`,
                    backgroundColor: dropOpen ? TEAL_BG : '#fff',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  className="avatar-trigger"
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                    <img
                      src={getAvatarSrc(user)}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `2px solid ${TEAL}` }}
                      onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?background=0d1b2e&color=25a882&name=U&bold=true`; }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 9, height: 9, borderRadius: '50%',
                      backgroundColor: user?.is_verified ? '#22c55e' : '#f59e0b',
                      border: '2px solid #fff',
                    }} />
                  </div>
                  {/* Name + role */}
                  <div className="avatar-info" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY_LIGHT, whiteSpace: 'nowrap', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.first_name || user?.username}
                    </span>
                    <span style={{ fontSize: 10, color: SLATE_LIGHT, fontWeight: 500 }}>{getUserRole(user)}</span>
                  </div>
                  <span style={{ display: 'flex', color: SLATE_LIGHT, transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <Icon.ChevronDown />
                  </span>
                </button>

                {/* Dropdown panel */}
                {dropOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 268,
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    border: '1px solid #eef2f7',
                    boxShadow: '0 16px 48px rgba(13,27,46,0.12), 0 2px 8px rgba(13,27,46,0.06)',
                    overflow: 'hidden', zIndex: 500,
                  }}>
                    {/* User header */}
                    <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #f8faff 0%, #f0f9f5 100%)', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={getAvatarSrc(user)} alt="" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${TEAL}`, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY_LIGHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: SLATE_LIGHT, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.email}
                        </div>
                        <div style={{ marginTop: 5 }}>
                          {user?.is_verified
                            ? <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20 }}>✓ Verified</span>
                            : <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#fef9c3', color: '#92400e', padding: '2px 8px', borderRadius: 20 }}>Unverified</span>
                          }
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px 0' }}>
                      {dropItems.map(item => (
                        <button
                          key={item.path}
                          onClick={() => go(item.path)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            width: '100%', padding: '10px 16px',
                            border: 'none', background: 'none',
                            textAlign: 'left', fontSize: 13.5, color: NAVY_LIGHT,
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                            transition: 'background-color 0.12s',
                          }}
                          className="dd-item"
                        >
                          <span style={{ display: 'flex', color: SLATE_LIGHT, width: 18, flexShrink: 0 }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Logout */}
                    <div style={{ borderTop: `1px solid ${BORDER}`, padding: '6px 0' }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', padding: '10px 16px',
                          border: 'none', background: 'none',
                          textAlign: 'left', fontSize: 13.5, color: RED,
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                          transition: 'background-color 0.12s',
                        }}
                        className="dd-item"
                      >
                        <span style={{ display: 'flex', color: RED, width: 18 }}><Icon.Logout /></span>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Auth buttons ── */
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => go('/login')}
                  style={{
                    padding: '8px 18px', borderRadius: 9,
                    border: `1.5px solid ${BORDER}`, backgroundColor: '#fff',
                    color: SLATE, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  className="login-btn"
                >
                  Log in
                </button>
                <button
                  onClick={() => go('/register')}
                  style={{
                    padding: '8px 20px', borderRadius: 9,
                    border: 'none', backgroundColor: TEAL, color: '#fff',
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 3px 14px rgba(37,168,130,0.28)',
                    transition: 'all 0.15s',
                  }}
                  className="signup-btn"
                >
                  Sign up free
                </button>
              </div>
            )}

            {/* Hamburger */}
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(v => !v)}
              style={{
                display: 'none', padding: 8, borderRadius: 9,
                border: `1.5px solid ${BORDER}`, backgroundColor: '#fff',
                color: SLATE, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Menu"
            >
              {menuOpen ? <Icon.Close /> : <Icon.Menu />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div style={{
            borderTop: `1px solid ${BORDER}`,
            padding: '12px 16px 20px',
            backgroundColor: '#fff',
            display: 'flex', flexDirection: 'column', gap: 2,
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            {/* Nav links */}
            {navLinks.map(link => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => go(link.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 11,
                    border: 'none',
                    background: active ? TEAL_BG : 'transparent',
                    color: active ? NAVY : SLATE,
                    fontSize: 14.5, fontWeight: active ? 600 : 500,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ display: 'flex', color: active ? TEAL : SLATE_LIGHT }}>{link.icon}</span>
                  {link.label}
                  {active && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', backgroundColor: TEAL, flexShrink: 0 }} />}
                </button>
              );
            })}

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: BORDER, margin: '10px 0' }} />

            {isAuthenticated ? (
              <>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', backgroundColor: '#f8faff', borderRadius: 12, border: `1px solid ${BORDER}`, marginBottom: 6 }}>
                  <img src={getAvatarSrc(user)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${TEAL}`, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: NAVY_LIGHT }}>{user?.first_name} {user?.last_name}</div>
                    <div style={{ fontSize: 12, color: SLATE_LIGHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                  </div>
                </div>
                {dropItems.map(item => (
                  <button key={item.path} onClick={() => go(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, border: 'none', background: 'none', color: SLATE, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ display: 'flex', color: SLATE_LIGHT }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <div style={{ height: 1, backgroundColor: BORDER, margin: '6px 0' }} />
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, border: 'none', background: 'none', color: RED, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ display: 'flex', color: RED }}><Icon.Logout /></span>
                  Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => go('/login')} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1.5px solid ${BORDER}`, backgroundColor: '#fff', color: SLATE, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Log in</button>
                <button onClick={() => go('/register')} style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', backgroundColor: TEAL, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sign up free</button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── CSS Injection ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .nav-link-btn:hover { background-color: rgba(13,27,46,0.04) !important; color: ${NAVY} !important; }
        .nav-link-btn:hover span { opacity: 0.8 !important; }
        .cta-btn:hover { background-color: #162338 !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(13,27,46,0.2); }
        .avatar-trigger:hover { border-color: #cbd5e1 !important; background-color: #f8fafc !important; }
        .dd-item:hover { background-color: #f8fafc !important; }
        .login-btn:hover { border-color: #94a3b8 !important; background-color: #f8fafc !important; color: ${NAVY} !important; }
        .signup-btn:hover { background-color: ${TEAL_DARK} !important; transform: translateY(-1px); box-shadow: 0 5px 18px rgba(37,168,130,0.38) !important; }

        @media (max-width: 920px) {
          .nav-links { display: none !important; }
          .nav-right .avatar-info { display: none !important; }
          .cta-btn { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .nav-right > div:not(:last-child) { display: none !important; }
        }
        @media (min-width: 921px) {
          .hamburger-btn { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;