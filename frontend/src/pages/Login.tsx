import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const SLATE = '#475569';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string>('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        
        {/* Main Card */}
        <div style={{
          display: 'flex',
          maxWidth: 1100,
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        }}>
          
          {/* LEFT IMAGE SECTION */}
          <div style={{
            flex: 1,
            position: 'relative',
            backgroundImage: 'url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'block',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${NAVY}CC, ${RED}CC)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '48px 32px',
            }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#fff" />
                      <polyline points="9 22 9 12 15 12 15 22" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>Uganda</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Property</div>
                  </div>
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif", margin: '0 0 12px', lineHeight: 1.2 }}>
                  Find Your Dream Property
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6 }}>
                  Verified homes, apartments & land across Uganda. Join thousands of satisfied customers.
                </p>
              </div>
              
              {/* Testimonial */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '16px 20px',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: '#fff', margin: '0 0 8px', fontStyle: 'italic' }}>
                  "Found my dream apartment in just 3 days! The platform is incredibly easy to use."
                </p>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>— Sarah Okello, Kampala</div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM SECTION */}
          <div style={{ flex: 1, padding: '48px 40px', maxWidth: 480 }}>
            
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif", margin: '0 0 8px' }}>Welcome Back</h1>
              <p style={{ fontSize: 14, color: SLATE, margin: 0 }}>Login to continue your property journey</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 24, fontSize: 13, border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            {/* Social Login */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <SocialButton icon="G" text="Continue with Google" onClick={() => {}} bgColor="#fff" color="#475569" borderColor="#eef2f7" />
              <SocialButton icon="f" text="Continue with Facebook" onClick={() => {}} bgColor="#fff" color="#475569" borderColor="#eef2f7" />
              <SocialButton icon="A" text="Continue with Apple" onClick={() => {}} bgColor="#fff" color="#475569" borderColor="#eef2f7" />
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#eef2f7' }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#eef2f7' }} />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Username/Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Email or Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.5 }}>👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField('')}
                    required
                    style={{
                      ...inputStyle,
                      paddingLeft: 44,
                      borderColor: focusedField === 'username' ? RED : '#eef2f7',
                    }}
                    placeholder="Enter your email or username"
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.5 }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    required
                    style={{
                      ...inputStyle,
                      paddingLeft: 44,
                      paddingRight: 44,
                      borderColor: focusedField === 'password' ? RED : '#eef2f7',
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={passwordToggleStyle}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{ background: 'none', border: 'none', color: RED, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: RED, color: '#fff',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: 'inherit',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.backgroundColor = '#c1121f'); }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.backgroundColor = RED); }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={spinnerStyle} />
                    Logging in...
                  </span>
                ) : (
                  'Login →'
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Don't have an account? </span>
              <button
                onClick={() => navigate('/register')}
                style={{ background: 'none', border: 'none', color: RED, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Sign up for free →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Social Button Component ──────────────────────────────────────────────────
const SocialButton: React.FC<{ icon: string; text: string; onClick: () => void; bgColor: string; color: string; borderColor: string }> = ({ icon, text, onClick, bgColor, color, borderColor }) => {
  const [hover, setHover] = useState(false);
  
  const getIconStyle = () => {
    if (icon === 'G') return { backgroundColor: '#fff', color: '#db4437' };
    if (icon === 'f') return { backgroundColor: '#1877f2', color: '#fff' };
    return { backgroundColor: '#000', color: '#fff' };
  };
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 16px',
        width: '100%',
        backgroundColor: hover ? '#f8faff' : bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        backgroundColor: getIconStyle().backgroundColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: getIconStyle().color,
      }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: hover ? NAVY : color, textAlign: 'left' }}>{text}</span>
    </button>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid #eef2f7',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
};

const passwordToggleStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  padding: 4,
};

const spinnerStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTop: '2px solid #fff',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  display: 'inline-block',
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'login-styles';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(el);
  }
}

export default Login;