/**
 * Chatbot.tsx — Enhanced AI Property Assistant with Multi-Agent Support
 * Now supports: Property Search, Price Analysis, Investment Advice, 
 * Location Info, Legal Help, Mortgage Calculator, Construction Advice
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Brand ────────────────────────────────────────────────────────────────────
const RED = '#e63946';
const RED_DARK = '#c1121f';
const RED_LITE = 'rgba(230,57,70,0.08)';
const NAVY = '#0d1b2e';
const GRAY_BG = '#f8faff';

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  properties?: any[];
  property?: any;
  isTyping?: boolean;
  quickReplies?: string[];
  intent?: string;
  confidence?: number;
  agent_used?: string;  // Track which agent handled the query
  collaboration_note?: string; // Multi-agent collaboration message
}

// Agent colors and icons
const AGENT_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  'Property Finder': { icon: '🏠', color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
  'Price Analyst': { icon: '💰', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
  'Investment Advisor': { icon: '📈', color: '#f39c12', bg: 'rgba(243,156,18,0.1)' },
  'Location Expert': { icon: '📍', color: '#3498db', bg: 'rgba(52,152,219,0.1)' },
  'Booking Specialist': { icon: '📅', color: '#9b59b6', bg: 'rgba(155,89,182,0.1)' },
  'Mortgage Expert': { icon: '🏦', color: '#1abc9c', bg: 'rgba(26,188,156,0.1)' },
  'Legal Advisor': { icon: '⚖️', color: '#e74c3c', bg: 'rgba(231,76,60,0.1)' },
  'Construction Expert': { icon: '🏗️', color: '#34495e', bg: 'rgba(52,73,94,0.1)' },
  'Orchestrator': { icon: '🎯', color: '#95a5a6', bg: 'rgba(149,165,166,0.1)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const fmtPrice = (p: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);

// Get responsive dimensions
const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    isMobile: window.innerWidth < BREAKPOINTS.tablet,
    isDesktop: window.innerWidth >= BREAKPOINTS.desktop,
    isWide: window.innerWidth >= BREAKPOINTS.wide,
    width: window.innerWidth,
    chatWidth: window.innerWidth >= BREAKPOINTS.wide ? 550 : window.innerWidth >= BREAKPOINTS.desktop ? 480 : 380,
    chatHeight: window.innerWidth >= BREAKPOINTS.desktop ? '85vh' : '78vh',
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        isMobile: window.innerWidth < BREAKPOINTS.tablet,
        isDesktop: window.innerWidth >= BREAKPOINTS.desktop,
        isWide: window.innerWidth >= BREAKPOINTS.wide,
        width: window.innerWidth,
        chatWidth: window.innerWidth >= BREAKPOINTS.wide ? 550 : window.innerWidth >= BREAKPOINTS.desktop ? 480 : 380,
        chatHeight: window.innerWidth >= BREAKPOINTS.desktop ? '85vh' : '78vh',
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
};

/** Parse markdown links and lists */
const RichText: React.FC<{ text: string; onLink: (url: string) => void }> = ({ text, onLink }) => {
  if (!text) return null;

  const mdLink = /\[([^\]]+)\]\(([^)]+)\)/g;

  const parseLine = (line: string, key: string | number) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    mdLink.lastIndex = 0;

    while ((m = mdLink.exec(line)) !== null) {
      if (m.index > last) parts.push(<span key={`t${last}`}>{line.slice(last, m.index)}</span>);
      const [, linkText, url] = m;
      const valid = url && url !== 'undefined' && url !== 'null' && url.trim() !== '';
      parts.push(valid
        ? <button key={`l${m.index}`} onClick={() => onLink(url)} style={rt.link}>
            {linkText}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 2 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        : <span key={`l${m.index}`}>{linkText}</span>
      );
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(<span key={`t${last}`}>{line.slice(last)}</span>);
    return parts.length > 0 ? parts : [<span key="0">{line}</span>];
  };

  // Parse bold text
  const parseBold = (line: string, idx: number) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match: RegExpExecArray | null;
    
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > last) {
        parts.push(<span key={`t${last}`}>{line.slice(last, match.index)}</span>);
      }
      parts.push(<strong key={`b${match.index}`}>{match[1]}</strong>);
      last = match.index + match[0].length;
    }
    if (last < line.length) {
      parts.push(<span key={`t${last}`}>{line.slice(last)}</span>);
    }
    return parts.length > 0 ? parts : parseLine(line, idx);
  };

  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const content = trimmed.slice(1).trim();
          return (
            <div key={i} style={rt.bulletRow}>
              <span style={rt.bullet}>•</span>
              <span>{parseBold(content, i)}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={i} style={rt.bulletRow}>
              <span style={{ ...rt.bullet, fontWeight: 700, minWidth: 18 }}>{numMatch[1]}.</span>
              <span>{parseBold(numMatch[2], i)}</span>
            </div>
          );
        }

        return (
          <React.Fragment key={i}>
            {parseBold(line, i)}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
};

const rt: Record<string, React.CSSProperties> = {
  link: {
    display: 'inline-flex', alignItems: 'center',
    background: 'none', border: 'none',
    color: RED, fontWeight: 700, cursor: 'pointer',
    fontSize: 'inherit', padding: '0 1px',
    textDecoration: 'none', fontFamily: 'inherit',
  },
  bulletRow: { display: 'flex', alignItems: 'flex-start', gap: 8, margin: '3px 0' },
  bullet: { color: RED, flexShrink: 0, fontWeight: 700 },
};

// ─── Agent Badge Component ────────────────────────────────────────────────────
const AgentBadge: React.FC<{ agentName?: string }> = ({ agentName }) => {
  if (!agentName) return null;
  const style = AGENT_STYLES[agentName] || AGENT_STYLES['Orchestrator'];
  
  return (
    <div style={agentBadge.container}>
      <span style={agentBadge.icon}>{style.icon}</span>
      <span style={agentBadge.name}>{agentName}</span>
    </div>
  );
};

const agentBadge = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 600,
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
  },
  icon: { fontSize: 10 },
  name: { color: '#666' },
};

// ─── Property Mini-Card (Single) ──────────────────────────────────────────────
const PropMiniCard: React.FC<{ property: any; onClick: () => void }> = ({ property, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...pm.card,
        boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      {property.image && (
        <img src={property.image} alt={property.title} style={pm.img} />
      )}
      <div style={pm.body}>
        <div style={pm.title}>{property.title}</div>
        <div style={pm.loc}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10.5" r="3" />
          </svg>
          {property.district}, {property.city}
        </div>
        <div style={pm.price}>
          {fmtPrice(property.price)}{property.transaction_type === 'rent' ? '/mo' : ''}
        </div>
        <div style={pm.chips}>
          {property.bedrooms != null && <span style={pm.chip}>🛏 {property.bedrooms}</span>}
          {property.bathrooms != null && <span style={pm.chip}>🚿 {property.bathrooms}</span>}
          <span style={pm.viewLink}>View →</span>
        </div>
      </div>
    </div>
  );
};

// ─── Property Cards List (Multiple) ───────────────────────────────────────────
const PropertyCardsList: React.FC<{ properties: any[]; onPropertyClick: (id: number) => void; onBookClick?: (id: number, title: string) => void }> = ({ 
  properties, 
  onPropertyClick,
  onBookClick 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {properties.map((property, idx) => (
        <div key={property.id} style={pm.cardWrapper}>
          <div
            onClick={() => onPropertyClick(property.id)}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              ...pm.card,
              boxShadow: hoveredIndex === idx ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
              transform: hoveredIndex === idx ? 'translateY(-2px)' : 'none',
            }}
          >
            {property.image && (
              <img src={property.image} alt={property.title} style={pm.img} />
            )}
            <div style={pm.body}>
              <div style={pm.title}>{property.title}</div>
              <div style={pm.loc}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 1 1 18 0z" />
                  <circle cx="12" cy="10.5" r="3" />
                </svg>
                {property.district ? `${property.district}, ` : ''}{property.city || 'Uganda'}
              </div>
              <div style={pm.price}>
                {fmtPrice(property.price)}{property.transaction_type === 'rent' ? '/mo' : ''}
              </div>
              <div style={pm.chips}>
                {property.bedrooms != null && <span style={pm.chip}>🛏 {property.bedrooms}</span>}
                {property.bathrooms != null && <span style={pm.chip}>🚿 {property.bathrooms}</span>}
                {property.square_meters != null && <span style={pm.chip}>📐 {property.square_meters}m²</span>}
                <span style={pm.viewLink}>View →</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onBookClick?.(property.id, property.title)}
            style={pm.bookButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = RED;
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = RED;
            }}
          >
            📅 Book Viewing
          </button>
        </div>
      ))}
    </div>
  );
};

const pm: Record<string, React.CSSProperties> = {
  card: { display: 'flex', gap: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid #eef2f7', backgroundColor: '#ffffff', marginTop: 12, cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' },
  img: { width: 90, height: 90, objectFit: 'cover', flexShrink: 0 },
  body: { padding: '10px 12px 10px 0', flex: 1, minWidth: 0 },
  title: { fontSize: 13, fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  loc: { fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 },
  price: { fontSize: 14, fontWeight: 800, color: RED, marginTop: 5 },
  chips: { display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 },
  chip: { fontSize: 10, backgroundColor: '#f4f7fb', color: '#475569', padding: '2px 8px', borderRadius: 12 },
  viewLink: { fontSize: 10, color: RED, fontWeight: 700, marginLeft: 'auto' },
  cardWrapper: { display: 'flex', flexDirection: 'column', gap: 8 },
  bookButton: { 
    padding: '8px 12px', 
    borderRadius: 10, 
    border: `1px solid ${RED}`, 
    backgroundColor: '#f8fafc', 
    color: RED,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    width: '100%',
  },
};

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div style={{ display: 'flex', gap: 6, padding: '8px 6px', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <div
        key={i}
        style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: '#94a3b8',
          animation: `cbBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Chatbot: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const responsive = useResponsive();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pillVisible, setPillVisible] = useState(true);
  const [isTypingLong, setIsTypingLong] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Init greeting with agent info
  useEffect(() => {
    if (authLoading || initialized) return;
    setInitialized(true);

    const name = user?.first_name || user?.username || '';

    setMessages([{
      id: '1',
      text: isAuthenticated && user
        ? `👋 Welcome back, **${name}!**\n\nI'm your AI property assistant with a team of specialized experts:\n\n` +
          `🏠 **Property Finder** - Find your dream home\n` +
          `💰 **Price Analyst** - Market prices & budgets\n` +
          `📈 **Investment Advisor** - ROI & wealth building\n` +
          `📍 **Location Expert** - Neighborhood insights\n` +
          `📅 **Booking Specialist** - Viewing appointments\n` +
          `🏦 **Mortgage Expert** - Home loans & financing\n` +
          `⚖️ **Legal Advisor** - Property law & compliance\n` +
          `🏗️ **Construction Expert** - Building & renovation\n\n` +
          `What would you like help with today?`
        : `👋 Hi there! I'm **PropertyGPT** - your AI property assistant with a team of experts.\n\n` +
          `🔍 I can help you find properties, check prices, get investment advice, and more — even without an account.\n\n` +
          `[🔑 Login](/login) or [📝 Create an account](/register) for the best experience.\n\n` +
          `Try asking:\n` +
          `• "Find 3 bedroom houses in Kololo"\n` +
          `• "What's the average price in Kira?"\n` +
          `• "Is Nansana good for investment?"\n` +
          `• "Calculate mortgage for 500M property"\n` +
          `• "What documents do I need to buy land?"\n` +
          `• "Cost to build 200 sqm house"`,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: isAuthenticated
        ? ['🏠 Find properties', '💰 Price check', '📈 Investment', '🏦 Mortgage', '⚖️ Legal', '🏗️ Construction']
        : ['Find properties', 'Price check', 'Investment advice', 'Login'],
      agent_used: 'Orchestrator',
    }]);
  }, [authLoading, initialized, isAuthenticated, user]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Unread badge
  useEffect(() => {
    if (!open && messages.some(m => m.sender === 'bot' && !m.isTyping)) {
      setUnread(u => Math.min(u + 1, 99));
    }
  }, [messages, open]);

  // Hide pill after 6s
  useEffect(() => {
    if (open) { setPillVisible(false); return; }
    const t = setTimeout(() => setPillVisible(false), 6000);
    return () => clearTimeout(t);
  }, [open]);

  const openChat = () => {
    setOpen(true);
    setUnread(0);
    setPillVisible(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleLink = useCallback((url: string) => {
    if (!url || url === 'undefined') return;
    if (url.startsWith('/')) { navigate(url); setOpen(false); }
    else window.open(url, '_blank');
  }, [navigate]);

  const handleQuickReply = (reply: string, propertyId?: number) => {
    if (reply === 'Login') { 
      navigate('/login'); 
      setOpen(false); 
      return; 
    }
    
    if (reply === '⭐ View my favorites') { 
      navigate('/favorites'); 
      setOpen(false); 
      return; 
    }
    
    if (reply === '🔧 Property services') { 
      navigate('/services'); 
      setOpen(false); 
      return; 
    }
    
    if (reply.startsWith('📅 Book viewing for') || (reply === '📅 Book viewing' && propertyId)) {
      if (propertyId) {
        navigate(`/property/${propertyId}`);
        setOpen(false);
        return;
      }
      setInput(reply);
      setTimeout(() => sendMessage(reply), 50);
      return;
    }
    
    setInput(reply);
    setTimeout(() => sendMessage(reply), 50);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);

    const userMsg: Message = { id: Date.now().toString(), text: msg, sender: 'user', timestamp: new Date() };
    const typingId = `typing-${Date.now()}`;
    const typingMsg: Message = { id: typingId, text: '', sender: 'bot', timestamp: new Date(), isTyping: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);

    // Simulate "thinking deeply" after 3 seconds
    const longThinkingTimeout = setTimeout(() => setIsTypingLong(true), 3000);

    try {
      const res = await api.post('/chatbot/message/', { 
        message: msg,
        session_id: localStorage.getItem('chat_session_id') || Date.now().toString()
      });
      
      clearTimeout(longThinkingTimeout);
      
      const messageData: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.reply,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: res.data.suggestions,
        property: res.data.property,
        properties: res.data.properties,
        quickReplies: res.data.quick_replies,
        intent: res.data.intent,
        agent_used: res.data.agent_used,
        collaboration_note: res.data.collaboration_note,
      };
      
      setMessages(prev => [...prev.filter(m => m.id !== typingId), messageData]);
      if (!open) setUnread(u => Math.min(u + 1, 99));
    } catch (error: any) {
      console.error('Chatbot error:', error);
      clearTimeout(longThinkingTimeout);
      
      let errorText = "I'm having trouble connecting right now. Please try again in a moment.";
      
      if (error.response?.data?.detail) {
        errorText = error.response.data.detail;
      } else if (error.message) {
        errorText = `Connection error: ${error.message}`;
      }
      
      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'bot',
          timestamp: new Date(),
          quickReplies: ['Try again 🔄', 'Browse properties 🏠', 'Contact support 📧'],
        },
      ]);
    } finally {
      setLoading(false);
      setIsTypingLong(false);
    }
  }, [input, loading, open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) return null;

  const lastMsg = messages[messages.length - 1];
  const panelWidth = responsive.chatWidth;
  const panelHeight = responsive.chatHeight;
  const fabBottom = responsive.isMobile ? 20 : 28;
  const fabRight = responsive.isMobile ? 20 : 28;

  return (
    <>
      <style>{`
        @keyframes cbBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes cbSpin { to { transform: rotate(360deg); } }
        @keyframes cbPillIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cbPulse {
          0% { box-shadow: 0 0 0 0 rgba(230,57,70,0.5); }
          70% { box-shadow: 0 0 0 12px rgba(230,57,70,0); }
          100% { box-shadow: 0 0 0 0 rgba(230,57,70,0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .cb-quick-chip {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cb-quick-chip:hover {
          background-color: ${RED} !important;
          color: #fff !important;
          border-color: ${RED} !important;
          transform: translateY(-1px);
        }
        .message-enter {
          animation: slideIn 0.3s ease-out forwards;
        }
        .typing-animation {
          animation: fadeInScale 0.2s ease-out;
        }
        @media (max-width: 640px) {
          .chat-panel {
            bottom: 80px !important;
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
            max-width: none !important;
          }
        }
      `}</style>

      {/* TRIGGER BUTTON */}
      <div style={{ ...trig.wrap, bottom: fabBottom, right: fabRight }}>
        {pillVisible && !open && (
          <div style={trig.pill}>
            <span style={trig.pillSparkle}>✦</span>
            Ask PropertyGPT anything
            <button onClick={() => setPillVisible(false)} style={trig.pillClose}>✕</button>
          </div>
        )}

        <button
          onClick={openChat}
          style={{
            ...trig.fab,
            padding: responsive.isMobile ? '10px 16px' : '12px 20px',
          }}
          aria-label="Open AI property assistant"
        >
          {unread > 0 && !open && (
            <span style={trig.badge}>{unread > 99 ? '99+' : unread}</span>
          )}
          <span style={trig.fabIcon}>
            <svg width={responsive.isMobile ? 18 : 20} height={responsive.isMobile ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2.5" />
            </svg>
          </span>
          {!responsive.isMobile && (
            <span style={trig.fabLabel}>
              <span style={trig.fabLabelTop}>Ask AI</span>
              <span style={trig.fabLabelBot}>Property Assistant</span>
            </span>
          )}
        </button>
      </div>

      {/* CHAT PANEL */}
      <div
        className="chat-panel"
        style={{
          ...panel.root,
          width: responsive.isMobile ? 'calc(100vw - 32px)' : panelWidth,
          maxWidth: responsive.isMobile ? 'none' : 'calc(100vw - 40px)',
          height: responsive.isMobile ? 'calc(100vh - 100px)' : 'auto',
          maxHeight: responsive.isMobile ? 'calc(100vh - 100px)' : panelHeight,
          bottom: responsive.isMobile ? 80 : 100,
          right: responsive.isMobile ? 16 : 28,
          left: responsive.isMobile ? 16 : 'auto',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          pointerEvents: open ? 'all' : 'none',
        }}
      >
        {/* Header */}
        <div style={panel.header}>
          <div style={panel.headerLeft}>
            <div style={panel.avatar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div>
              <div style={panel.headerName}>PropertyGPT</div>
              <div style={panel.headerStatus}>
                <span style={panel.onlineDot} />
                8 AI Experts Online
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={panel.headerBtn}
              onClick={() => setMessages([messages[0]])}
              title="New conversation"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
              </svg>
            </button>
            <button style={panel.headerBtn} onClick={() => setOpen(false)} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Powered-by strip */}
        <div style={panel.poweredBy}>
          <span style={panel.poweredByDot}>✦</span>
          Uganda's first multi-agent AI property assistant
        </div>

        {/* Messages Container */}
        <div ref={messagesContainerRef} style={panel.messages}>
          {messages.map((msg, idx) => (
            <div key={msg.id} className="message-enter" style={{ animationDelay: `${idx * 0.02}s` }}>
              {msg.isTyping ? (
                <div style={bub.row}>
                  <div style={bub.botAvatar}>🤖</div>
                  <div style={{ ...bub.bubble, ...bub.botBubble }} className="typing-animation">
                    <TypingDots />
                    {isTypingLong && (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                        Consulting experts...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ ...bub.row, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.sender === 'bot' && <div style={bub.botAvatar}>🤖</div>}

                  <div style={{ maxWidth: responsive.isMobile ? '85%' : '80%' }}>
                    <div style={{
                      ...bub.bubble,
                      ...(msg.sender === 'user' ? bub.userBubble : bub.botBubble),
                    }}>
                      {/* Agent badge */}
                      {msg.agent_used && msg.sender === 'bot' && (
                        <AgentBadge agentName={msg.agent_used} />
                      )}
                      
                      <div style={{ fontSize: responsive.isMobile ? 12 : 13, lineHeight: 1.55 }}>
                        <RichText text={msg.text} onLink={handleLink} />
                      </div>

                      {/* Collaboration note */}
                      {msg.collaboration_note && msg.sender === 'bot' && (
                        <div style={bub.collabNote}>
                          <span>💡</span> {msg.collaboration_note}
                        </div>
                      )}

                      {/* Multiple properties */}
                      {msg.properties && msg.properties.length > 0 && (
                        <PropertyCardsList 
                          properties={msg.properties} 
                          onPropertyClick={(id) => { navigate(`/property/${id}`); setOpen(false); }}
                          onBookClick={(id, title) => { 
                            navigate(`/property/${id}`); 
                            setOpen(false);
                          }}
                        />
                      )}

                      {/* Single property (backward compatible) */}
                      {!msg.properties && msg.property && (
                        <PropMiniCard
                          property={msg.property}
                          onClick={() => { navigate(`/property/${msg.property.id}`); setOpen(false); }}
                        />
                      )}

                      {/* Suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div style={bub.suggRow}>
                          {msg.suggestions.slice(0, 3).map((s, i) => (
                            <button key={i} onClick={() => handleQuickReply(s)} style={bub.suggChip}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ ...bub.time, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                        {fmtTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div style={bub.userAvatar}>
                      {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '👤'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Quick replies */}
        {lastMsg?.quickReplies && lastMsg.quickReplies.length > 0 && !loading && (
          <div style={panel.quickRow}>
            <span style={panel.quickLabel}>Suggested replies:</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {lastMsg.quickReplies.slice(0, 4).map((r, i) => (
                <button key={i} onClick={() => handleQuickReply(r)} style={panel.quickChip} className="cb-quick-chip">
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div style={panel.inputRow}>
          <textarea
            ref={inputRef}
            placeholder="Ask me anything... (Try: 'Find houses in Kololo', 'Mortgage for 500M', 'Investment in Kira')"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={panel.input}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              ...panel.sendBtn,
              backgroundColor: loading || !input.trim() ? '#e2e8f0' : RED,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'cbSpin 0.7s linear infinite' }} />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
            }
          </button>
        </div>
        
        <div style={panel.footer}>
          🤖 8 AI Experts · PropertyHub.ug
        </div>
      </div>
    </>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const trig: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 12,
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    color: NAVY,
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 18px',
    borderRadius: 40,
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
    border: '1px solid #eef2f7',
    animation: 'cbPillIn 0.4s ease-out',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    backdropFilter: 'blur(10px)',
    background: 'rgba(255,255,255,0.95)',
  },
  pillSparkle: { color: RED, fontSize: 16 },
  pillClose: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    padding: '0 4px',
    marginLeft: 6,
    borderRadius: '50%',
    transition: 'all 0.2s',
  },
  fab: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderRadius: 40,
    border: 'none',
    background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 8px 28px rgba(230,57,70,0.4)',
    animation: 'cbPulse 2.5s ease-in-out infinite',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    fontFamily: 'inherit',
  },
  fabIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  fabLabel: { display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left' },
  fabLabelTop: { fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' },
  fabLabelBot: { fontSize: 10, fontWeight: 500, opacity: 0.85, letterSpacing: '0.02em' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: '#fff',
    color: RED,
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    border: `2px solid ${RED}`,
  },
};

const panel: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    borderRadius: 24,
    backgroundColor: '#fff',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1199,
    transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1)',
    fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
    border: '1px solid rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px 16px',
    background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.3)',
  },
  headerName: { fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" },
  headerStatus: { fontSize: 11, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
    display: 'inline-block',
    animation: 'cbPulse 2s ease-in-out infinite',
  },
  headerBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  poweredBy: {
    backgroundColor: RED_LITE,
    borderBottom: '1px solid rgba(230,57,70,0.1)',
    padding: '8px 20px',
    fontSize: 11,
    color: RED,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  poweredByDot: { fontSize: 12 },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    backgroundColor: GRAY_BG,
  },
  quickRow: {
    padding: '12px 16px',
    borderTop: '1px solid #f0f4f8',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  quickLabel: { fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' },
  quickChip: {
    padding: '6px 14px',
    borderRadius: 24,
    border: `1.5px solid #e2e8f0`,
    backgroundColor: '#fff',
    color: NAVY,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
    padding: '14px 16px 12px',
    borderTop: '1px solid #eef2f7',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: '1.5px solid #eef2f7',
    borderRadius: 14,
    padding: '10px 14px',
    fontSize: 13,
    color: NAVY,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
    maxHeight: 100,
    overflow: 'auto',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    transition: 'background-color 0.2s, transform 0.1s',
  },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94a3b8',
    padding: '8px 16px 12px',
    backgroundColor: '#fff',
    flexShrink: 0,
    fontFamily: 'inherit',
  },
};

const bub: Record<string, React.CSSProperties> = {
  row: { display: 'flex', alignItems: 'flex-end', gap: 10 },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: RED_LITE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
    border: `1.5px solid rgba(230,57,70,0.2)`,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: RED,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    color: '#fff',
    fontWeight: 700,
    flexShrink: 0,
  },
  bubble: { padding: '10px 14px', borderRadius: 18, wordBreak: 'break-word' },
  botBubble: {
    backgroundColor: '#fff',
    color: NAVY,
    borderBottomLeftRadius: 5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #eef2f7',
  },
  userBubble: {
    backgroundColor: RED,
    color: '#fff',
    borderBottomRightRadius: 5,
    boxShadow: '0 4px 12px rgba(230,57,70,0.3)',
  },
  time: { fontSize: 9, opacity: 0.6, marginTop: 6 },
  suggRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  suggChip: {
    padding: '4px 12px',
    borderRadius: 20,
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  collabNote: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px dashed #e2e8f0',
    fontSize: 11,
    color: '#64748b',
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
};

export default Chatbot;