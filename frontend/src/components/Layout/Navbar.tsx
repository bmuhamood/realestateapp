import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ─── Brand ────────────────────────────────────────────────────────────────────
const TEAL = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const NAVY = '#0d1b2e';

// ─── Icons ─────────────────────────────────────────────────────────────────
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Settings: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Chevron: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
  Heart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
};

// ─── Nav config ───────────────────────────────────────────────────────────────
interface NavLink { label: string; path: string; icon: React.ReactNode; requiresAuth?: boolean; }

// Base nav links without dashboard (dashboard will be added dynamically)
const BASE_NAV_LINKS: NavLink[] = [
  { label: 'Home',           path: '/',           icon: <Icon.Home /> },
  { label: 'All Properties', path: '/properties', icon: <Icon.Grid /> },
  { label: 'Services',       path: '/services',   icon: <Icon.Wrench /> },
  { label: 'Agents',         path: '/agents',     icon: <Icon.User /> },
  // { label: 'Service Providers', path: '/service-providers', icon: <Icon.Wrench /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (first?: string, last?: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';

const getAvatarSrc = (user: any) =>
  user?.profile_picture ||
  `https://ui-avatars.com/api/?background=25a882&color=fff&name=${encodeURIComponent(
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`
  )}&bold=true&size=64`;

const getUserRole = (user: any): string => {
  if ((user as any)?.is_agent) return 'Agent';
  if ((user as any)?.is_service_provider) return 'Service Provider';
  return 'Buyer';
};

const getDashboardPath = (user: any): string => {
  if ((user as any)?.is_agent) return '/dashboard';
  if ((user as any)?.is_service_provider) return '/service-provider/dashboard';
  return '/dashboard';
};

const getDashboardLabel = (user: any): string => {
  if ((user as any)?.is_agent) return 'Agent Dashboard';
  if ((user as any)?.is_service_provider) return 'Service Dashboard';
  return 'My Dashboard';
};

// Get dynamic dashboard link based on user role
const getDynamicDashboardLink = (user: any): NavLink | null => {
  if (!user) return null;
  if ((user as any)?.is_agent) {
    return { label: 'Agent Dashboard', path: '/dashboard', icon: <Icon.Dashboard />, requiresAuth: true };
  }
  if ((user as any)?.is_service_provider) {
    return { label: 'Service Dashboard', path: '/service-provider/dashboard', icon: <Icon.Dashboard />, requiresAuth: true };
  }
  return { label: 'My Dashboard', path: '/dashboard', icon: <Icon.Dashboard />, requiresAuth: true };
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build dynamic nav links including dashboard
  const getNavLinks = (): NavLink[] => {
    if (!isAuthenticated) return BASE_NAV_LINKS;
    const dashboardLink = getDynamicDashboardLink(user);
    if (!dashboardLink) return BASE_NAV_LINKS;
    return [...BASE_NAV_LINKS, dashboardLink];
  };

  const visibleLinks = getNavLinks();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleNav = (path: string) => { navigate(path); setMenuOpen(false); };

  const handleLogout = () => { logout(); setDropdownOpen(false); navigate('/'); };

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const dashLabel = getDashboardLabel(user);
  const dashPath = getDashboardPath(user);
  const userRole = getUserRole(user);

  // Dropdown menu items
  const getDropdownItems = () => {
    const items = [
      { icon: <Icon.User />, label: 'Profile Settings', path: '/profile' },
      { icon: <Icon.Dashboard />, label: dashLabel, path: dashPath },
      { icon: <Icon.Settings />, label: 'Account Settings', path: '/settings' },
    ];
    
    // Add Service Provider specific items
    if ((user as any)?.is_service_provider) {
      items.splice(2, 0, { icon: <Icon.Wrench />, label: 'Manage Services', path: '/service-provider' });
    }
    
    return items;
  };

  return (
    <nav style={{ ...n.nav, ...(scrolled ? n.navScrolled : {}) }}>
      <div style={n.inner}>

        {/* ── Logo ── */}
        <a
          href="/"
          style={n.logo}
          onClick={e => { e.preventDefault(); handleNav('/'); }}
        >
          <div style={n.logoMark}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={TEAL} />
              <polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={n.logoTextWrap}>
            <span style={n.logoMain}>Uganda</span>
            <span style={n.logoSub}>Property</span>
          </div>
        </a>

        {/* ── Desktop nav links ── */}
        <div style={n.links} className="navbar-links">
          {visibleLinks.map(link => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                style={{ ...n.link, ...(active ? n.linkActive : {}) }}
              >
                <span style={{ ...n.linkIcon, ...(active ? n.linkIconActive : {}) }}>
                  {link.icon}
                </span>
                {link.label}
                {active && <span style={n.linkBar} />}
              </button>
            );
          })}
        </div>

        {/* ── Right side ── */}
        <div style={n.right}>

          {/* List your property CTA - only for agents */}
          {isAuthenticated && (user as any)?.is_agent && (
            <button
              style={n.listBtn}
              onClick={() => handleNav('/dashboard/properties/add')}
              className="navbar-auth"
            >
              + List Property
            </button>
          )}

          {/* Add Service CTA - only for service providers */}
          {isAuthenticated && (user as any)?.is_service_provider && (
            <button
              style={n.listBtn}
              onClick={() => handleNav('/service-provider')}
              className="navbar-auth"
            >
              + Add Service
            </button>
          )}

          {isAuthenticated ? (
            /* ── Avatar + dropdown ── */
            <div ref={dropdownRef} style={{ position: 'relative' }} className="navbar-auth">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{ ...n.avatarTrigger, ...(dropdownOpen ? n.avatarTriggerOpen : {}) }}
                aria-label="User menu"
              >
                <div style={n.avatarRing}>
                  <img
                    src={getAvatarSrc(user)}
                    alt={getInitials(user?.first_name, user?.last_name)}
                    style={n.avatarImg}
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?background=25a882&color=fff&name=${getInitials(user?.first_name, user?.last_name)}&bold=true`; }}
                  />
                  <span style={{
                    ...n.onlineDot,
                    backgroundColor: user?.is_verified ? '#22c55e' : '#f59e0b',
                  }} />
                </div>
                <div style={n.avatarInfo} className="navbar-links">
                  <span style={n.avatarName}>{user?.first_name || user?.username}</span>
                  <span style={n.avatarRole}>{userRole}</span>
                </div>
                <span style={{ ...n.chevron, ...(dropdownOpen ? n.chevronOpen : {}) }}>
                  <Icon.Chevron />
                </span>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div style={n.dropdown}>
                  {/* Header */}
                  <div style={n.ddHeader}>
                    <img src={getAvatarSrc(user)} alt="" style={n.ddAvatar} />
                    <div>
                      <div style={n.ddName}>{user?.first_name} {user?.last_name}</div>
                      <div style={n.ddMeta}>
                        {user?.is_verified
                          ? <span style={n.verifiedBadge}>✓ Verified</span>
                          : <span style={n.unverifiedBadge}>Unverified</span>}
                        <span style={{ color: '#94a3b8', margin: '0 4px' }}>·</span>
                        {userRole}
                      </div>
                    </div>
                  </div>

                  <div style={n.ddDivider} />

                  {/* Menu items */}
                  {getDropdownItems().map(item => (
                    <button
                      key={item.path}
                      style={n.ddItem}
                      onClick={() => { setDropdownOpen(false); handleNav(item.path); }}
                    >
                      <span style={n.ddItemIcon}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  <div style={n.ddDivider} />

                  <button style={{ ...n.ddItem, ...n.ddLogout }} onClick={handleLogout}>
                    <span style={n.ddItemIcon}><Icon.Logout /></span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Auth buttons ── */
            <div style={n.authBtns} className="navbar-auth">
              <button style={n.loginBtn} onClick={() => handleNav('/login')}>Log in</button>
              <button style={n.signupBtn} onClick={() => handleNav('/register')}>
                Sign up — it's free
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button
            style={n.hamburger}
            className="navbar-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <Icon.Close /> : <Icon.Menu />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div style={n.mobileMenu}>
          {/* Mobile nav links */}
          {visibleLinks.map(link => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                style={{ ...n.mobileLink, ...(active ? n.mobileLinkActive : {}) }}
              >
                <span style={{ ...n.mobileLinkIcon, ...(active ? { color: TEAL } : {}) }}>
                  {link.icon}
                </span>
                {link.label}
                {active && <span style={{ marginLeft: 'auto', color: TEAL, fontSize: 10 }}>●</span>}
              </button>
            );
          })}

          <div style={n.mobileDivider} />

          {isAuthenticated ? (
            <>
              {/* Mobile user info */}
              <div style={n.mobileUser}>
                <img src={getAvatarSrc(user)} alt="" style={n.mobileAvatar} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <div style={n.mobileDivider} />
              <button style={n.mobileLink} onClick={() => handleNav('/profile')}>
                <span style={n.mobileLinkIcon}><Icon.User /></span>
                Profile Settings
              </button>
              <button style={n.mobileLink} onClick={() => handleNav(dashPath)}>
                <span style={n.mobileLinkIcon}><Icon.Dashboard /></span>
                {dashLabel}
              </button>
              {(user as any)?.is_service_provider && (
                <button style={n.mobileLink} onClick={() => handleNav('/service-provider')}>
                  <span style={n.mobileLinkIcon}><Icon.Wrench /></span>
                  Manage Services
                </button>
              )}
              <button style={{ ...n.mobileLink, color: '#ef4444' }} onClick={handleLogout}>
                <span style={{ display: 'flex', alignItems: 'center', color: '#ef4444' }}><Icon.Logout /></span>
                Sign out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
              <button style={{ ...n.loginBtn, flex: 1, height: 42, borderRadius: 10 }} onClick={() => handleNav('/login')}>
                Log in
              </button>
              <button style={{ ...n.signupBtn, flex: 2, height: 42, borderRadius: 10 }} onClick={() => handleNav('/register')}>
                Sign up free
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const n: Record<string, React.CSSProperties> = {
  // ── Nav shell ──
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    backgroundColor: '#fff',
    borderBottom: '1px solid #eef2f7',
    fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
    transition: 'box-shadow 0.2s',
  },
  navScrolled: {
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  inner: {
    maxWidth: 1640, margin: '0 auto',
    padding: '0 20px', height: 64,
    display: 'flex', alignItems: 'center', gap: 8,
  },

  // ── Logo ──
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    textDecoration: 'none', flexShrink: 0,
    marginRight: 8,
  },
  logoMark: {
    width: 36, height: 36,
    backgroundColor: TEAL_BG,
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoTextWrap: { display: 'flex', flexDirection: 'column', lineHeight: 1.1 },
  logoMain: {
    fontSize: 15, fontWeight: 800, color: NAVY,
    letterSpacing: '-0.025em',
    fontFamily: "'Sora', sans-serif",
  },
  logoSub: {
    fontSize: 11, fontWeight: 600, color: TEAL,
    letterSpacing: '0.04em', textTransform: 'uppercase',
  },

  // ── Desktop nav links ──
  links: {
    display: 'flex', alignItems: 'center', gap: 2, flex: 1,
  },
  link: {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '8px 13px',
    borderRadius: 8, border: 'none', background: 'none',
    color: '#475569', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'color 0.15s, background-color 0.15s',
    fontFamily: 'inherit',
  },
  linkActive: {
    color: NAVY,
    backgroundColor: TEAL_BG,
    fontWeight: 600,
  },
  linkIcon: { display: 'flex', alignItems: 'center', opacity: 0.5 },
  linkIconActive: { opacity: 1, color: TEAL },
  linkBar: {
    position: 'absolute', bottom: -1, left: 10, right: 10,
    height: 2, backgroundColor: TEAL,
    borderRadius: '2px 2px 0 0',
  },

  // ── Right ──
  right: {
    display: 'flex', alignItems: 'center',
    gap: 10, marginLeft: 'auto', flexShrink: 0,
  },

  // Action buttons
  listBtn: {
    padding: '7px 16px', borderRadius: 8,
    border: `1.5px solid ${TEAL}`,
    backgroundColor: 'transparent', color: TEAL,
    fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },

  // ── Avatar trigger ──
  avatarTrigger: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '5px 10px 5px 5px',
    borderRadius: 10, border: '1.5px solid #eef2f7',
    backgroundColor: '#fff', cursor: 'pointer',
    transition: 'border-color 0.15s, background-color 0.15s',
    color: '#1e293b',
  },
  avatarTriggerOpen: {
    borderColor: TEAL,
    backgroundColor: TEAL_BG,
  },
  avatarRing: {
    position: 'relative', width: 32, height: 32, flexShrink: 0,
  },
  avatarImg: {
    width: 32, height: 32, borderRadius: '50%',
    objectFit: 'cover', display: 'block',
    border: `2px solid ${TEAL}`,
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 9, height: 9, borderRadius: '50%',
    border: '2px solid #fff',
  },
  avatarInfo: {
    display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left',
  },
  avatarName: { fontSize: 13, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' },
  avatarRole: { fontSize: 11, color: '#94a3b8', fontWeight: 500 },
  chevron: { display: 'flex', color: '#94a3b8', transition: 'transform 0.2s', flexShrink: 0 },
  chevronOpen: { transform: 'rotate(180deg)' },

  // ── Dropdown ──
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 260, backgroundColor: '#fff',
    borderRadius: 14, border: '1px solid #eef2f7',
    boxShadow: '0 10px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden', zIndex: 200,
    animation: 'ddFadeIn 0.18s ease-out',
  },
  ddHeader: {
    padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
    backgroundColor: '#fafcff',
  },
  ddAvatar: {
    width: 42, height: 42, borderRadius: '50%',
    objectFit: 'cover', border: `2px solid ${TEAL}`, flexShrink: 0,
  },
  ddName: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  ddMeta: { fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center' },
  verifiedBadge: {
    color: '#16a34a', backgroundColor: '#dcfce7',
    padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  },
  unverifiedBadge: {
    color: '#d97706', backgroundColor: '#fef3c7',
    padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  },
  ddDivider: { height: 1, backgroundColor: '#f1f5f9' },
  ddItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '11px 16px',
    border: 'none', backgroundColor: 'transparent',
    textAlign: 'left', fontSize: 14, color: '#1e293b',
    cursor: 'pointer', transition: 'background-color 0.12s',
    fontFamily: 'inherit', fontWeight: 500,
  },
  ddItemIcon: { display: 'flex', color: '#94a3b8' },
  ddLogout: { color: '#ef4444' },

  // ── Auth buttons ──
  authBtns: { display: 'flex', alignItems: 'center', gap: 8 },
  loginBtn: {
    padding: '8px 16px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    color: '#475569', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  signupBtn: {
    padding: '8px 18px', borderRadius: 8,
    border: 'none', backgroundColor: TEAL, color: '#fff',
    fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: `0 3px 10px rgba(37,168,130,0.3)`,
    transition: 'all 0.15s', fontFamily: 'inherit',
  },

  // ── Hamburger ──
  hamburger: {
    display: 'none', padding: 6, borderRadius: 8,
    border: 'none', backgroundColor: 'transparent',
    color: '#475569', cursor: 'pointer',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Mobile menu ──
  mobileMenu: {
    borderTop: '1px solid #eef2f7',
    padding: '12px 16px 20px',
    display: 'flex', flexDirection: 'column', gap: 2,
    backgroundColor: '#fff',
    animation: 'mobileIn 0.2s ease-out',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 12px', borderRadius: 10,
    border: 'none', background: 'none',
    color: '#475569', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    transition: 'background-color 0.15s',
  },
  mobileLinkActive: {
    color: NAVY, backgroundColor: TEAL_BG, fontWeight: 600,
  },
  mobileLinkIcon: {
    display: 'flex', alignItems: 'center', color: '#94a3b8',
  },
  mobileDivider: {
    height: 1, backgroundColor: '#f1f5f9', margin: '8px 0',
  },
  mobileUser: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px', borderRadius: 10,
    backgroundColor: '#fafcff', border: '1px solid #eef2f7',
    marginBottom: 4,
  },
  mobileAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    objectFit: 'cover', border: `2px solid ${TEAL}`, flexShrink: 0,
  },
};

// ─── Responsive + animations ──────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'navbar-pf-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

      @keyframes ddFadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes mobileIn {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Hover states */
      nav button.nav-link:hover { background-color: rgba(37,168,130,0.06) !important; color: #0d1b2e !important; }
      nav [style*="ddItem"]:hover { background-color: #f8fafc !important; }
      nav [style*="mobileLink"]:hover { background-color: rgba(37,168,130,0.06) !important; }
      nav [style*="listBtn"]:hover { background-color: rgba(37,168,130,0.08) !important; }
      nav [style*="loginBtn"]:hover { border-color: #94a3b8 !important; color: #1e293b !important; }
      nav [style*="signupBtn"]:hover { background-color: #1d8f6e !important; }

      /* Responsive */
      @media (max-width: 900px) {
        .navbar-links { display: none !important; }
        .navbar-auth  { display: none !important; }
        .navbar-hamburger { display: flex !important; }
      }
      @media (min-width: 901px) {
        .navbar-hamburger { display: none !important; }
      }
    `;
    document.head.appendChild(el);
  }
}

export default Navbar;