// src/pages/ServiceProvidersList.tsx — Redesigned to match AgentsList/PropertyHub.ug design system
// Colors: RED #e63946 · NAVY #0d1b2e · TEAL #25a882
// Fonts: Sora (headings) · DM Sans (body)
// Patterns: Bayut-inspired sticky filter bar, card styles, badges, animations

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User } from '../types';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const RED     = '#e63946';
const RED_BG  = 'rgba(230,57,70,0.07)';
const NAVY    = '#0d1b2e';
const TEAL    = '#25a882';
const TEAL_BG = 'rgba(37,168,130,0.08)';
const ORANGE  = '#F97316';
const ORANGE_BG = 'rgba(249,115,22,0.08)';

// ─── Inline styles ───────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:      { minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif", marginTop: 64 },
  fullCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinner:   { width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'apSpin 0.7s linear infinite' },

  // ── Sticky filter bar ────────────────────────────────────────────────────
  filterBar: {
    position: 'sticky', top: 0, zIndex: 200,
    backgroundColor: '#fff',
    borderBottom: '1px solid #eef2f7',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  filterBarInner: {
    maxWidth: 1400, margin: '0 auto',
    padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const,
  },
  searchPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    border: '1.5px solid #eef2f7', borderRadius: 30,
    padding: '0 8px 0 14px', height: 40,
    backgroundColor: '#fafcff', minWidth: 260, flexShrink: 0,
  },
  searchPillInput: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 13, color: NAVY, backgroundColor: 'transparent', fontFamily: 'inherit',
  },
  pillClear: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, padding: '0 2px' },
  pillSearchBtn: {
    width: 30, height: 30, borderRadius: '50%', border: 'none',
    backgroundColor: RED, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },
  rightControls: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 },
  resultCount: { fontSize: 13, whiteSpace: 'nowrap' as const },
  sortSelect: {
    padding: '6px 12px', borderRadius: 20, border: '1.5px solid #eef2f7',
    fontSize: 12, color: NAVY, backgroundColor: '#fff',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
  },
  viewToggle: { display: 'flex', gap: 2, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 },
  viewBtn: {
    width: 32, height: 32, borderRadius: 8, border: 'none',
    cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },

  // ── Content ───────────────────────────────────────────────────────────────
  contentWrap:  { maxWidth: 1400, margin: '0 auto', padding: '24px 20px 60px' },
  contextHeader:{ marginBottom: 22 },
  contextTitle: { fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1rem, 2vw, 1.35rem)', fontWeight: 800, color: NAVY, margin: '0 0 4px' },
  contextSub:   { fontSize: 13, color: '#94a3b8', margin: 0 },
  gridWrap:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  listWrap:     { display: 'flex', flexDirection: 'column', gap: 14 },
  empty:        { textAlign: 'center' as const, padding: '80px 24px', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eef2f7' },
  emptyBtn:     { padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  errorBox:     { maxWidth: 480, margin: '100px auto', background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 16, padding: '32px 40px', textAlign: 'center' as const, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#ef4444' },
  retryBtn:     { marginTop: 16, padding: '10px 28px', borderRadius: 10, border: 'none', backgroundColor: RED, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};

// ─── SVG icons ────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconUserPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);
const IconUserMinus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);
const IconPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5" style={{ flexShrink: 0 }}>
    <path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z"/>
    <circle cx="12" cy="10.5" r="3"/>
  </svg>
);
const IconWrench = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

// ─── Spinner pill ─────────────────────────────────────────────────────────────
const SpinPill = () => (
  <span style={{
    width: 13, height: 13, border: '2px solid currentColor',
    borderTopColor: 'transparent', borderRadius: '50%',
    display: 'inline-block', animation: 'apSpin 0.7s linear infinite',
  }} />
);

// ─── Service Provider Card — Vertical (grid view) ────────────────────────────
const ServiceProviderCardVertical: React.FC<{
  provider: User;
  currentUserId?: number;
  followingId: number | null;
  onFollow: (provider: User) => void;
  onNavigate: (username: string) => void;
}> = ({ provider, currentUserId, followingId, onFollow, onNavigate }) => {
  const [hov, setHov] = useState(false);
  const initials = ((provider.first_name?.[0] || '') + (provider.last_name?.[0] || '') || provider.username?.[0] || '?').toUpperCase();

  return (
    <div
      style={{
        backgroundColor: '#fff', borderRadius: 14,
        overflow: 'hidden', cursor: 'pointer',
        border: '1px solid #eef2f7',
        transition: 'all 0.22s',
        animation: 'apFadeUp 0.38s ease-out both',
        boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onNavigate(provider.username)}
    >
      {/* Cover band */}
      <div style={{
        height: 72, position: 'relative',
        background: `linear-gradient(135deg, ${ORANGE} 0%, #ea580c 100%)`,
      }}>
        {provider.is_verified && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            backgroundColor: TEAL, color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            boxShadow: '0 2px 6px rgba(37,168,130,0.35)',
          }}>✓ Verified</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0 18px 18px' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginTop: -22, marginBottom: 10 }}>
          {provider.profile_picture ? (
            <img src={provider.profile_picture} alt={provider.username} style={{
              width: 52, height: 52, borderRadius: 13, objectFit: 'cover',
              border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'block',
            }} />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: 13,
              background: `linear-gradient(135deg, ${ORANGE} 0%, #ea580c 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff',
              fontFamily: "'Sora', sans-serif",
              border: '3px solid #fff', boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
            }}>
              {initials}
            </div>
          )}
          <span style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: TEAL, border: '2px solid #fff',
          }} />
        </div>

        {/* Name & handle */}
        <h3 style={{ margin: '0 0 2px', fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 800, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {provider.first_name} {provider.last_name}
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
          @{provider.username}
        </p>

        {/* Location */}
        {(provider.city || provider.district) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
            <IconPin />
            {[provider.district, provider.city].filter(Boolean).join(', ')}
          </div>
        )}

        {/* Bio */}
        {provider.bio && (
          <p style={{
            margin: '0 0 12px', fontSize: 12.5, color: '#475569', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>{provider.bio}</p>
        )}

        {/* Stats */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f8fafc', borderRadius: 10,
          border: '1px solid #f1f5f9', overflow: 'hidden',
          marginBottom: 12,
        }}>
          {[
            { num: provider.followers_count || 0,       label: 'Followers' },
            { num: provider.following_count || 0,       label: 'Following' },
            { num: (provider as any).services_count || 0, label: 'Services' },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{
              flex: 1, padding: '9px 6px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                {stat.num.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8 }}>
          {currentUserId && currentUserId !== provider.id && (
            <button
              onClick={e => { e.stopPropagation(); onFollow(provider); }}
              disabled={followingId === provider.id}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                border: provider.is_following ? `1.5px solid ${ORANGE}` : 'none',
                backgroundColor: provider.is_following ? ORANGE_BG : ORANGE,
                color: provider.is_following ? ORANGE : '#fff',
                boxShadow: provider.is_following ? 'none' : '0 3px 10px rgba(249,115,22,0.28)',
              }}
            >
              {followingId === provider.id ? <SpinPill /> : provider.is_following ? <><IconUserMinus /> Unfollow</> : <><IconUserPlus /> Follow</>}
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onNavigate(provider.username); }}
            style={{
              flex: currentUserId && currentUserId !== provider.id ? 'none' : 1,
              padding: '8px 14px', borderRadius: 10,
              border: `1.5px solid ${ORANGE}`, backgroundColor: ORANGE_BG, color: ORANGE,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
            }}
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Service Provider Card — Horizontal (list view) ──────────────────────────
const ServiceProviderCardHorizontal: React.FC<{
  provider: User;
  currentUserId?: number;
  followingId: number | null;
  onFollow: (provider: User) => void;
  onNavigate: (username: string) => void;
}> = ({ provider, currentUserId, followingId, onFollow, onNavigate }) => {
  const [hov, setHov] = useState(false);
  const initials = ((provider.first_name?.[0] || '') + (provider.last_name?.[0] || '') || provider.username?.[0] || '?').toUpperCase();

  return (
    <div
      style={{
        display: 'flex', backgroundColor: '#fff', borderRadius: 14,
        overflow: 'hidden', cursor: 'pointer', border: '1px solid #eef2f7',
        transition: 'all 0.22s', animation: 'apFadeUp 0.38s ease-out both',
        boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onNavigate(provider.username)}
    >
      {/* Left panel */}
      <div style={{
        width: 170, minWidth: 170, flexShrink: 0,
        background: `linear-gradient(160deg, ${ORANGE} 0%, #ea580c 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '20px 14px', position: 'relative',
      }}>
        {provider.profile_picture ? (
          <img src={provider.profile_picture} alt={provider.username} style={{
            width: 68, height: 68, borderRadius: 18, objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.18)',
          }} />
        ) : (
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: `linear-gradient(135deg, ${ORANGE} 0%, #ea580c 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff',
            fontFamily: "'Sora', sans-serif",
            border: '3px solid rgba(255,255,255,0.15)',
          }}>{initials}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: TEAL, boxShadow: `0 0 5px ${TEAL}` }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Active</span>
        </div>
        {provider.is_verified && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            backgroundColor: TEAL, color: '#fff',
            fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20,
          }}>✓ Verified</span>
        )}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: '0 0 2px', fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: NAVY }}>
              {provider.first_name} {provider.last_name}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>@{provider.username}</p>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
            👥 {(provider.followers_count || 0).toLocaleString()} followers
          </div>
        </div>

        {/* Location */}
        {(provider.city || provider.district) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
            <IconPin />
            {[provider.district, provider.city].filter(Boolean).join(', ')}
          </div>
        )}

        {/* Bio */}
        {provider.bio && (
          <p style={{
            margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>{provider.bio}</p>
        )}

        {/* Features row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
          {[
            { icon: '👥', label: `${provider.followers_count || 0} Followers` },
            { icon: '👤', label: `${provider.following_count || 0} Following` },
            { icon: '🔧', label: `${(provider as any).services_count || 0} Services` },
          ].map((feat, i, arr) => (
            <React.Fragment key={feat.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                <span>{feat.icon}</span> {feat.label}
              </div>
              {i < arr.length - 1 && <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#d1d5db' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: ORANGE_BG, border: `1.5px solid ${ORANGE}`,
              color: ORANGE, fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconWrench />
            </div>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              Service Provider
              {provider.is_verified && <span style={{ color: TEAL }}> ✓</span>}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {currentUserId && currentUserId !== provider.id && (
              <button
                onClick={e => { e.stopPropagation(); onFollow(provider); }}
                disabled={followingId === provider.id}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' as const,
                  border: provider.is_following ? `1.5px solid ${ORANGE}` : 'none',
                  backgroundColor: provider.is_following ? ORANGE_BG : ORANGE,
                  color: provider.is_following ? ORANGE : '#fff',
                  boxShadow: provider.is_following ? 'none' : '0 3px 10px rgba(249,115,22,0.28)',
                }}
              >
                {followingId === provider.id ? <SpinPill /> : provider.is_following ? <><IconUserMinus /> Unfollow</> : <><IconUserPlus /> Follow</>}
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onNavigate(provider.username); }}
              style={{
                padding: '7px 14px', borderRadius: 8,
                border: `1.5px solid ${ORANGE}`, backgroundColor: ORANGE_BG, color: ORANGE,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
              }}
            >
              View Profile →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ mode: 'grid' | 'list' }> = ({ mode }) => (
  <div style={{
    backgroundColor: '#fff', borderRadius: 14, border: '1px solid #eef2f7',
    overflow: 'hidden', animation: 'apShimmer 1.5s infinite',
    ...(mode === 'list' ? { display: 'flex' } : {}),
  }}>
    {mode === 'list' ? (
      <>
        <div style={{ width: 170, minWidth: 170, background: '#e8edf4', height: 130 }} />
        <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 16, borderRadius: 8, background: '#f1f5f9', width: '40%' }} />
          <div style={{ height: 12, borderRadius: 8, background: '#f8fafc', width: '25%' }} />
          <div style={{ height: 12, borderRadius: 8, background: '#f8fafc', width: '55%' }} />
          <div style={{ height: 12, borderRadius: 8, background: '#f8fafc', width: '75%' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <div style={{ height: 34, flex: 1, borderRadius: 8, background: '#f1f5f9' }} />
            <div style={{ height: 34, width: 110, borderRadius: 8, background: '#f1f5f9' }} />
          </div>
        </div>
      </>
    ) : (
      <>
        <div style={{ height: 72, background: '#e8edf4' }} />
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: '#dde3ec', border: '3px solid #fff', marginTop: -16, marginBottom: 10 }} />
          <div style={{ height: 15, borderRadius: 8, background: '#f1f5f9', width: '65%', marginBottom: 6 }} />
          <div style={{ height: 11, borderRadius: 8, background: '#f8fafc', width: '40%', marginBottom: 10 }} />
          <div style={{ height: 54, borderRadius: 10, background: '#f8fafc', marginBottom: 10 }} />
          <div style={{ height: 36, borderRadius: 10, background: '#f1f5f9' }} />
        </div>
      </>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ServiceProvidersList: React.FC = () => {
  const navigate    = useNavigate();
  const { user: currentUser } = useAuth();

  const [providers,    setProviders]    = useState<User[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState('');
  const [inputVal,     setInputVal]     = useState('');
  const [sortBy,       setSortBy]       = useState('default');
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid');
  const [followingId,  setFollowingId]  = useState<number | null>(null);
  const [filterVerified, setFilterVerified] = useState(false);

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/?is_service_provider=true');
      setProviders(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load service providers');
    } finally { setLoading(false); }
  };

  const handleFollowToggle = async (provider: User) => {
    if (!currentUser) { navigate('/login'); return; }
    setFollowingId(provider.id);
    try {
      if (provider.is_following) {
        await api.delete(`/users/${provider.username}/follow/`);
        setProviders(prev => prev.map(p =>
          p.id === provider.id ? { ...p, is_following: false, followers_count: Math.max(0, (p.followers_count || 0) - 1) } : p
        ));
      } else {
        await api.post(`/users/${provider.username}/follow/`);
        setProviders(prev => prev.map(p =>
          p.id === provider.id ? { ...p, is_following: true, followers_count: (p.followers_count || 0) + 1 } : p
        ));
      }
    } catch (err) { console.error(err); }
    finally { setFollowingId(null); }
  };

  const filteredProviders = React.useMemo(() => {
    const q = search.toLowerCase();
    let list = providers.filter(p => {
      const mS = !q || [p.first_name, p.last_name, p.username, p.city, p.district]
        .some(v => v?.toLowerCase().includes(q));
      const mV = !filterVerified || p.is_verified;
      return mS && mV;
    });
    if (sortBy === 'followers') list = [...list].sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0));
    if (sortBy === 'name')      list = [...list].sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
    return list;
  }, [providers, search, sortBy, filterVerified]);

  const verifiedCount = providers.filter(p => p.is_verified).length;
  const hasActive = search || filterVerified;

  // Global keyframes
  if (typeof document !== 'undefined' && !document.getElementById('service-providers-v2')) {
    const el = document.createElement('style');
    el.id = 'service-providers-v2';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes apSpin    { to { transform: rotate(360deg); } }
      @keyframes apFadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      @keyframes apShimmer { 0%,100%{opacity:1} 50%{opacity:.5} }
      .provider-entry { animation: apFadeUp 0.38s ease-out both; }
    `;
    document.head.appendChild(el);
  }

  if (loading) return (
    <div style={s.fullCenter}>
      <div style={s.spinner} />
      <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        Discovering service providers…
      </p>
    </div>
  );

  if (error) return (
    <div style={s.errorBox}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
      <strong>Couldn't load service providers</strong>
      <p style={{ margin: '6px 0 0', opacity: 0.75 }}>{error}</p>
      <button onClick={fetchProviders} style={s.retryBtn}>Try again</button>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ══ STICKY FILTER BAR ════════════════════════════════════════════════ */}
      <div style={s.filterBar}>
        <div style={s.filterBarInner}>

          {/* Search pill */}
          <div style={s.searchPill}>
            <IconSearch />
            <input
              type="text"
              placeholder="Search by name, city, district…"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearch(inputVal); }}
              style={s.searchPillInput}
            />
            {inputVal && (
              <button onClick={() => { setInputVal(''); setSearch(''); }} style={s.pillClear}>✕</button>
            )}
            <button onClick={() => setSearch(inputVal)} style={s.pillSearchBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>

          {/* Verified pill */}
          <button
            onClick={() => setFilterVerified(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 30, cursor: 'pointer',
              border: `1.5px solid ${filterVerified ? TEAL : '#e2e8f0'}`,
              backgroundColor: filterVerified ? TEAL_BG : '#fff',
              color: filterVerified ? TEAL : '#475569',
              fontSize: 13, fontWeight: filterVerified ? 700 : 500,
              fontFamily: 'inherit', transition: 'all 0.15s',
              boxShadow: filterVerified ? '0 2px 8px rgba(37,168,130,0.15)' : 'none',
              whiteSpace: 'nowrap' as const,
            }}
          >
            ✓ Verified Only
            {filterVerified && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: TEAL }} />}
          </button>

          {/* Clear all */}
          {hasActive && (
            <button
              onClick={() => { setSearch(''); setInputVal(''); setFilterVerified(false); }}
              style={{
                padding: '8px 14px', borderRadius: 30,
                border: `1.5px solid rgba(230,57,70,0.3)`,
                backgroundColor: RED_BG, color: RED,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ✕ Clear all
            </button>
          )}

          {/* Right controls */}
          <div style={s.rightControls}>
            <span style={s.resultCount}>
              <strong style={{ color: NAVY }}>{filteredProviders.length.toLocaleString()}</strong>
              <span style={{ color: '#94a3b8' }}> service providers</span>
            </span>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={s.sortSelect}>
              <option value="default">Default</option>
              <option value="followers">Most Followed</option>
              <option value="name">Name A–Z</option>
            </select>

            <div style={s.viewToggle}>
              {(['grid', 'list'] as const).map(mode => (
                <button
                  key={mode}
                  title={`${mode} view`}
                  onClick={() => setViewMode(mode)}
                  style={{
                    ...s.viewBtn,
                    backgroundColor: viewMode === mode ? RED : 'transparent',
                    color: viewMode === mode ? '#fff' : '#64748b',
                  }}
                >
                  {mode === 'grid' ? '⊞' : '≡'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══════════════════════════════════════════════════════ */}
      <div style={s.contentWrap}>

        {/* Context header */}
        <div style={s.contextHeader}>
          <h1 style={s.contextTitle}>
            {filteredProviders.length.toLocaleString()} Service Provider{filteredProviders.length !== 1 ? 's' : ''}
            {search ? ` matching "${search}"` : ' across Uganda'}
          </h1>
          <p style={s.contextSub}>
            {verifiedCount} verified · Connect, follow, and hire trusted service professionals
          </p>
        </div>

        {/* Cards */}
        {filteredProviders.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔍</div>
            <h3 style={{ margin: '0 0 8px', color: NAVY, fontFamily: "'Sora', sans-serif" }}>No service providers found</h3>
            <p style={{ margin: '0 0 22px', color: '#94a3b8', fontSize: 14 }}>
              {hasActive ? 'Try broadening your search criteria' : 'No service providers available yet'}
            </p>
            {hasActive && (
              <button onClick={() => { setSearch(''); setInputVal(''); setFilterVerified(false); }} style={s.emptyBtn}>
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div style={s.gridWrap}>
            {filteredProviders.map((provider, i) => (
              <div key={provider.id} className="provider-entry" style={{ animationDelay: `${i * 0.03}s` }}>
                <ServiceProviderCardVertical
                  provider={provider}
                  currentUserId={currentUser?.id}
                  followingId={followingId}
                  onFollow={handleFollowToggle}
                  onNavigate={u => navigate(`/profile/${u}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={s.listWrap}>
            {filteredProviders.map((provider, i) => (
              <div key={provider.id} className="provider-entry" style={{ animationDelay: `${i * 0.025}s` }}>
                <ServiceProviderCardHorizontal
                  provider={provider}
                  currentUserId={currentUser?.id}
                  followingId={followingId}
                  onFollow={handleFollowToggle}
                  onNavigate={u => navigate(`/profile/${u}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProvidersList;