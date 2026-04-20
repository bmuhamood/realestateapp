import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const TEAL = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const TEAL_HOVER = '#1d8f6e';
const NAVY = '#0d1b2e';
const NAVY_LIGHT = '#1e293b';
const SLATE = '#475569';
const SLATE_LIGHT = '#94a3b8';
const RED = '#e63946';

// ─── Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Grid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  Wrench: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Chevron: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Heart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="12" y2="14" /><line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  ),
};

// ─── Nav config ───────────────────────────────────────────────────────────────
interface NavLink { label: string; path: string; icon: React.ReactNode; requiresAuth?: boolean; }

const BASE_NAV_LINKS: NavLink[] = [
  { label: 'Home', path: '/', icon: <Icon.Home /> },
  { label: 'Properties', path: '/properties', icon: <Icon.Grid /> },
  { label: 'Services', path: '/services', icon: <Icon.Wrench /> },
  { label: 'Agents', path: '/agents', icon: <Icon.User /> },
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

// ─── Navbar Component ─────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const getDropdownItems = () => {
    const items = [
      { icon: <Icon.User />, label: 'Profile', path: '/profile' },
      { icon: <Icon.Dashboard />, label: dashLabel, path: dashPath },
      { icon: <Icon.Settings />, label: 'Settings', path: '/settings' },
    ];
    
    if ((user as any)?.is_service_provider) {
      items.splice(2, 0, { icon: <Icon.Wrench />, label: 'Manage Services', path: '/service-provider' });
    }
    
    if ((user as any)?.is_agent) {
      items.splice(2, 0, { icon: <Icon.Building />, label: 'My Listings', path: '/dashboard/properties' });
    }
    
    return items;
  };

  return (
    <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
      <div style={styles.inner}>

        {/* Logo - Metro Properties */}
        <a
          href="/"
          style={styles.logo}
          onClick={e => { e.preventDefault(); handleNav('/'); }}
        >
          <div style={styles.logoMark}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={TEAL} />
              <polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div style={styles.logoTextWrap}>
            <span style={styles.logoMain}>Metro</span>
            <span style={styles.logoSub}>Properties</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div style={styles.links} className="navbar-links">
          {visibleLinks.map(link => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                style={{ ...styles.link, ...(active ? styles.linkActive : {}) }}
              >
                <span style={{ ...styles.linkIcon, ...(active ? styles.linkIconActive : {}) }}>
                  {link.icon}
                </span>
                {link.label}
                {active && <span style={styles.linkBar} />}
              </button>
            );
          })}
        </div>

        {/* Right Section */}
        <div style={styles.right}>

          {/* List Property CTA */}
          {isAuthenticated && (user as any)?.is_agent && (
            <button
              style={styles.listBtn}
              onClick={() => handleNav('/dashboard/properties/add')}
              className="navbar-auth"
            >
              + List Property
            </button>
          )}

          {/* Add Service CTA */}
          {isAuthenticated && (user as any)?.is_service_provider && (
            <button
              style={styles.listBtn}
              onClick={() => handleNav('/service-provider')}
              className="navbar-auth"
            >
              + Add Service
            </button>
          )}

          {isAuthenticated ? (
            /* User Avatar + Dropdown */
            <div ref={dropdownRef} style={{ position: 'relative' }} className="navbar-auth">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{ ...styles.avatarTrigger, ...(dropdownOpen ? styles.avatarTriggerOpen : {}) }}
                aria-label="User menu"
              >
                <div style={styles.avatarRing}>
                  <img
                    src={getAvatarSrc(user)}
                    alt={getInitials(user?.first_name, user?.last_name)}
                    style={styles.avatarImg}
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?background=25a882&color=fff&name=${getInitials(user?.first_name, user?.last_name)}&bold=true`; }}
                  />
                  <span style={{
                    ...styles.onlineDot,
                    backgroundColor: user?.is_verified ? '#22c55e' : '#f59e0b',
                  }} />
                </div>
                <div style={styles.avatarInfo} className="navbar-links">
                  <span style={styles.avatarName}>{user?.first_name || user?.username}</span>
                  <span style={styles.avatarRole}>{userRole}</span>
                </div>
                <span style={{ ...styles.chevron, ...(dropdownOpen ? styles.chevronOpen : {}) }}>
                  <Icon.Chevron />
                </span>
              </button>

              {dropdownOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.ddHeader}>
                    <img src={getAvatarSrc(user)} alt="" style={styles.ddAvatar} />
                    <div>
                      <div style={styles.ddName}>{user?.first_name} {user?.last_name}</div>
                      <div style={styles.ddMeta}>
                        {user?.is_verified
                          ? <span style={styles.verifiedBadge}>✓ Verified</span>
                          : <span style={styles.unverifiedBadge}>Unverified</span>}
                        <span style={{ color: SLATE_LIGHT, margin: '0 4px' }}>·</span>
                        {userRole}
                      </div>
                    </div>
                  </div>

                  <div style={styles.ddDivider} />

                  {getDropdownItems().map(item => (
                    <button
                      key={item.path}
                      style={styles.ddItem}
                      onClick={() => { setDropdownOpen(false); handleNav(item.path); }}
                    >
                      <span style={styles.ddItemIcon}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  <div style={styles.ddDivider} />

                  <button style={{ ...styles.ddItem, ...styles.ddLogout }} onClick={handleLogout}>
                    <span style={styles.ddItemIcon}><Icon.Logout /></span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Auth Buttons */
            <div style={styles.authBtns} className="navbar-auth">
              <button style={styles.loginBtn} onClick={() => handleNav('/login')}>Log in</button>
              <button style={styles.signupBtn} onClick={() => handleNav('/register')}>
                Sign up free
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            style={styles.hamburger}
            className="navbar-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <Icon.Close /> : <Icon.Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {visibleLinks.map(link => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                style={{ ...styles.mobileLink, ...(active ? styles.mobileLinkActive : {}) }}
              >
                <span style={{ ...styles.mobileLinkIcon, ...(active ? { color: TEAL } : {}) }}>
                  {link.icon}
                </span>
                {link.label}
                {active && <span style={{ marginLeft: 'auto', color: TEAL, fontSize: 10 }}>●</span>}
              </button>
            );
          })}

          <div style={styles.mobileDivider} />

          {isAuthenticated ? (
            <>
              <div style={styles.mobileUser}>
                <img src={getAvatarSrc(user)} alt="" style={styles.mobileAvatar} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: NAVY_LIGHT }}>
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: SLATE_LIGHT }}>{user?.email}</div>
                </div>
              </div>
              <div style={styles.mobileDivider} />
              <button style={styles.mobileLink} onClick={() => handleNav('/profile')}>
                <span style={styles.mobileLinkIcon}><Icon.User /></span>
                Profile
              </button>
              <button style={styles.mobileLink} onClick={() => handleNav(dashPath)}>
                <span style={styles.mobileLinkIcon}><Icon.Dashboard /></span>
                {dashLabel}
              </button>
              {(user as any)?.is_agent && (
                <button style={styles.mobileLink} onClick={() => handleNav('/dashboard/properties')}>
                  <span style={styles.mobileLinkIcon}><Icon.Building /></span>
                  My Listings
                </button>
              )}
              {(user as any)?.is_service_provider && (
                <button style={styles.mobileLink} onClick={() => handleNav('/service-provider')}>
                  <span style={styles.mobileLinkIcon}><Icon.Wrench /></span>
                  Manage Services
                </button>
              )}
              <button style={{ ...styles.mobileLink, color: RED }} onClick={handleLogout}>
                <span style={{ display: 'flex', alignItems: 'center', color: RED }}><Icon.Logout /></span>
                Sign out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
              <button style={{ ...styles.loginBtn, flex: 1, height: 42, borderRadius: 10 }} onClick={() => handleNav('/login')}>
                Log in
              </button>
              <button style={{ ...styles.signupBtn, flex: 2, height: 42, borderRadius: 10 }} onClick={() => handleNav('/register')}>
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
const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    backgroundColor: '#fff',
    borderBottom: '1px solid #eef2f7',
    fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
    transition: 'box-shadow 0.2s',
  },
  navScrolled: {
    boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
  },
  inner: {
    maxWidth: 1640, margin: '0 auto',
    padding: '0 24px', height: 70,
    display: 'flex', alignItems: 'center', gap: 8,
  },

  // Logo
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none', flexShrink: 0,
    marginRight: 8, cursor: 'pointer',
  },
  logoMark: {
    width: 40, height: 40,
    backgroundColor: TEAL_BG,
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoTextWrap: { display: 'flex', flexDirection: 'column', lineHeight: 1.1 },
  logoMain: {
    fontSize: 18, fontWeight: 800, color: NAVY,
    letterSpacing: '-0.02em',
    fontFamily: "'Sora', sans-serif",
  },
  logoSub: {
    fontSize: 10, fontWeight: 700, color: TEAL,
    letterSpacing: '0.05em', textTransform: 'uppercase',
  },

  // Desktop Nav Links
  links: {
    display: 'flex', alignItems: 'center', gap: 4, flex: 1,
  },
  link: {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px',
    borderRadius: 10, border: 'none', background: 'none',
    color: SLATE, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  linkActive: {
    color: NAVY,
    backgroundColor: TEAL_BG,
    fontWeight: 600,
  },
  linkIcon: { display: 'flex', alignItems: 'center', opacity: 0.5, transition: 'opacity 0.2s' },
  linkIconActive: { opacity: 1, color: TEAL },
  linkBar: {
    position: 'absolute', bottom: -1, left: 12, right: 12,
    height: 2.5, backgroundColor: TEAL,
    borderRadius: '2px 2px 0 0',
  },

  // Right Section
  right: {
    display: 'flex', alignItems: 'center',
    gap: 12, marginLeft: 'auto', flexShrink: 0,
  },

  // CTA Buttons
  listBtn: {
    padding: '8px 18px', borderRadius: 10,
    border: `1.5px solid ${TEAL}`,
    backgroundColor: 'transparent', color: TEAL,
    fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.2s', fontFamily: 'inherit',
  },

  // Avatar
  avatarTrigger: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '5px 12px 5px 6px',
    borderRadius: 40, border: '1.5px solid #eef2f7',
    backgroundColor: '#fff', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  avatarTriggerOpen: {
    borderColor: TEAL,
    backgroundColor: TEAL_BG,
  },
  avatarRing: { position: 'relative', width: 34, height: 34, flexShrink: 0 },
  avatarImg: {
    width: 34, height: 34, borderRadius: '50%',
    objectFit: 'cover', display: 'block',
    border: `2px solid ${TEAL}`,
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: '50%',
    border: '2px solid #fff',
  },
  avatarInfo: { display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left' },
  avatarName: { fontSize: 13, fontWeight: 700, color: NAVY_LIGHT, whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' },
  avatarRole: { fontSize: 10, color: SLATE_LIGHT, fontWeight: 500 },
  chevron: { display: 'flex', color: SLATE_LIGHT, transition: 'transform 0.2s', flexShrink: 0 },
  chevronOpen: { transform: 'rotate(180deg)' },

  // Dropdown
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 280, backgroundColor: '#fff',
    borderRadius: 16, border: '1px solid #eef2f7',
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
    overflow: 'hidden', zIndex: 200,
  },
  ddHeader: {
    padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
    backgroundColor: '#fafcff',
  },
  ddAvatar: {
    width: 48, height: 48, borderRadius: '50%',
    objectFit: 'cover', border: `2px solid ${TEAL}`, flexShrink: 0,
  },
  ddName: { fontSize: 15, fontWeight: 700, color: NAVY_LIGHT },
  ddMeta: { fontSize: 11, color: SLATE, marginTop: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  verifiedBadge: {
    color: '#16a34a', backgroundColor: '#dcfce7',
    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
  },
  unverifiedBadge: {
    color: '#d97706', backgroundColor: '#fef3c7',
    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
  },
  ddDivider: { height: 1, backgroundColor: '#f1f5f9' },
  ddItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: '12px 16px',
    border: 'none', backgroundColor: 'transparent',
    textAlign: 'left', fontSize: 14, color: NAVY_LIGHT,
    cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'inherit', fontWeight: 500,
  },
  ddItemIcon: { display: 'flex', color: SLATE_LIGHT, width: 20 },
  ddLogout: { color: RED },

  // Auth Buttons
  authBtns: { display: 'flex', alignItems: 'center', gap: 10 },
  loginBtn: {
    padding: '8px 18px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    color: SLATE, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.2s', fontFamily: 'inherit',
  },
  signupBtn: {
    padding: '8px 20px', borderRadius: 10,
    border: 'none', backgroundColor: TEAL, color: '#fff',
    fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: `0 3px 12px rgba(37,168,130,0.3)`,
    transition: 'all 0.2s', fontFamily: 'inherit',
  },

  // Hamburger
  hamburger: {
    display: 'none', padding: 8, borderRadius: 10,
    border: 'none', backgroundColor: 'transparent',
    color: SLATE, cursor: 'pointer',
    alignItems: 'center', justifyContent: 'center',
  },

  // Mobile Menu
  mobileMenu: {
    borderTop: '1px solid #eef2f7',
    padding: '16px 20px 24px',
    display: 'flex', flexDirection: 'column', gap: 4,
    backgroundColor: '#fff',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 12,
    border: 'none', background: 'none',
    color: SLATE, fontSize: 15, fontWeight: 500,
    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  mobileLinkActive: {
    color: NAVY, backgroundColor: TEAL_BG, fontWeight: 600,
  },
  mobileLinkIcon: { display: 'flex', alignItems: 'center', color: SLATE_LIGHT },
  mobileDivider: { height: 1, backgroundColor: '#f1f5f9', margin: '12px 0' },
  mobileUser: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px', borderRadius: 14,
    backgroundColor: '#fafcff', border: '1px solid #eef2f7',
    marginBottom: 8,
  },
  mobileAvatar: {
    width: 48, height: 48, borderRadius: '50%',
    objectFit: 'cover', border: `2px solid ${TEAL}`, flexShrink: 0,
  },
};

// ─── Styles Injection ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'navbar-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

      /* Hover Effects */
      nav button[style*="link"]:hover { background-color: rgba(37,168,130,0.06) !important; color: #0d1b2e !important; }
      nav [style*="ddItem"]:hover { background-color: #f8fafc !important; }
      nav [style*="mobileLink"]:hover { background-color: rgba(37,168,130,0.06) !important; }
      nav [style*="listBtn"]:hover { background-color: rgba(37,168,130,0.08) !important; transform: translateY(-1px); }
      nav [style*="loginBtn"]:hover { border-color: #94a3b8 !important; background-color: #f8fafc !important; }
      nav [style*="signupBtn"]:hover { background-color: #1d8f6e !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,168,130,0.4) !important; }
      nav [style*="avatarTrigger"]:hover { border-color: #cbd5e1 !important; background-color: #f8fafc !important; }

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