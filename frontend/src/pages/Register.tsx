import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_BG = 'rgba(230,57,70,0.07)';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const SLATE = '#475569';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    phone: '',
    first_name: '',
    last_name: '',
    is_agent: false,
    is_service_provider: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string>('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_agent' || name === 'is_service_provider' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setError(errors.join(', '));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px 60px' }}>
        
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={RED} />
                <polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif" }}>Uganda</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEAL }}>Property</div>
            </div>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: NAVY, fontFamily: "'Sora', sans-serif", margin: '0 0 8px' }}>Create Account</h1>
          <p style={{ fontSize: 14, color: SLATE, margin: 0 }}>Join Uganda's fastest growing property platform</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '14px 18px', borderRadius: 12, marginBottom: 24, fontSize: 13, border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                onFocus={() => setFocusedField('first_name')}
                onBlur={() => setFocusedField('')}
                style={{ ...inputStyle, borderColor: focusedField === 'first_name' ? RED : '#eef2f7' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                onFocus={() => setFocusedField('last_name')}
                onBlur={() => setFocusedField('')}
                style={{ ...inputStyle, borderColor: focusedField === 'last_name' ? RED : '#eef2f7' }}
              />
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField('')}
              required
              style={{ ...inputStyle, borderColor: focusedField === 'username' ? RED : '#eef2f7' }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              required
              style={{ ...inputStyle, borderColor: focusedField === 'email' ? RED : '#eef2f7' }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField('')}
              placeholder="0771234567"
              required
              style={{ ...inputStyle, borderColor: focusedField === 'phone' ? RED : '#eef2f7' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                required
                style={{ ...inputStyle, paddingRight: 44, borderColor: focusedField === 'password' ? RED : '#eef2f7' }}
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

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Confirm Password *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              onFocus={() => setFocusedField('password2')}
              onBlur={() => setFocusedField('')}
              required
              style={{ ...inputStyle, borderColor: focusedField === 'password2' ? RED : '#eef2f7' }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: '#eef2f7', margin: '24px 0 20px' }} />

          {/* Role Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...labelStyle, fontSize: 13, color: NAVY }}>I want to:</label>
            
            {/* Agent Option */}
            <div
              onClick={() => setFormData(prev => ({ ...prev, is_agent: !prev.is_agent }))}
              style={{
                ...roleCardStyle,
                borderColor: formData.is_agent ? RED : '#eef2f7',
                backgroundColor: formData.is_agent ? RED_BG : '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: formData.is_agent ? RED : '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🏠
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>Real Estate Agent</div>
                  <div style={{ fontSize: 12, color: SLATE }}>List properties for sale or rent</div>
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', border: `2px solid ${formData.is_agent ? RED : '#d1d5db'}`,
                backgroundColor: formData.is_agent ? RED : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {formData.is_agent && <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fff' }} />}
              </div>
            </div>

            {/* Service Provider Option */}
            <div
              onClick={() => setFormData(prev => ({ ...prev, is_service_provider: !prev.is_service_provider }))}
              style={{
                ...roleCardStyle,
                borderColor: formData.is_service_provider ? TEAL : '#eef2f7',
                backgroundColor: formData.is_service_provider ? TEAL_BG : '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: formData.is_service_provider ? TEAL : '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🔧
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>Service Provider</div>
                  <div style={{ fontSize: 12, color: SLATE }}>Offer cleaning, moving, renovation services</div>
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', border: `2px solid ${formData.is_service_provider ? TEAL : '#d1d5db'}`,
                backgroundColor: formData.is_service_provider ? TEAL : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {formData.is_service_provider && <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fff' }} />}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', marginTop: 24,
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
            {loading ? 'Creating account...' : 'Sign Up — It\'s free →'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 13, color: SLATE }}>Already have an account? </span>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: RED, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Log in →
          </button>
        </div>

        {/* Terms */}
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 32 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
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

const roleCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid #eef2f7',
  marginBottom: 12,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

export default Register;