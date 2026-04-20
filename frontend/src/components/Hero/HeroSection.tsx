// components/Hero/HeroSection.tsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Property } from '../../types';

// Brand Colors
const RED = '#e63946';
const NAVY = '#0d1b2e';

interface HeroSectionProps {
  onSearch: (filters: any) => void;
  stats: { total: number; forSale: number; forRent: number; forShortlet: number };
  heroTxType: 'sale' | 'rent' | 'shortlet';
  setHeroTxType: (type: 'sale' | 'rent' | 'shortlet') => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  onSearch, 
  stats, 
  heroTxType, 
  setHeroTxType 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/properties/', { params: { page_size: 500 } });
        const properties = res.data.results || res.data;
        const locations = new Set<string>();
        properties.forEach((p: Property) => {
          if (p.city) locations.add(p.city);
          if (p.district) locations.add(p.district);
        });
        setAllLocations(Array.from(locations).sort());
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  const handleSearch = () => {
    const filters: any = {};
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (selectedLocation) filters.location = selectedLocation;
    filters.transaction_type = heroTxType;
    onSearch(filters);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  const handleTxTypeChange = (type: 'sale' | 'rent' | 'shortlet') => {
    setHeroTxType(type);
    const filters: any = {};
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (selectedLocation) filters.location = selectedLocation;
    filters.transaction_type = type;
    onSearch(filters);
  };

  return (
    <div style={styles.container}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }} />
      
      {/* Dark Overlay */}
      <div style={styles.overlay} />
      
      <img 
        src="https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1600"
        style={{ display: 'none' }}
        onLoad={() => setImageLoaded(true)}
      />

      <div style={styles.content}>
        <h1 style={styles.title}>
          {stats.total > 0 ? `${stats.total.toLocaleString()}+` : 'Find Your'}<br />
          Dream Property
        </h1>
        
        <p style={styles.subtitle}>
          {stats.total > 0 
            ? `${stats.total.toLocaleString()} properties in Uganda` 
            : 'Search through thousands of properties across Uganda'}
        </p>

        {/* Transaction Type Toggle */}
        <div style={styles.txToggle}>
          {(['sale', 'rent', 'shortlet'] as const).map((t) => (
            <button
              key={t}
              style={{
                ...styles.txBtn,
                ...(heroTxType === t && styles.txBtnActive),
              }}
              onClick={() => handleTxTypeChange(t)}
            >
              {t === 'sale' ? 'For Sale' : t === 'rent' ? 'For Rent' : 'Short Stay'}
            </button>
          ))}
        </div>

        {/* Location Input */}
        <div style={styles.locationRow}>
          <div style={styles.locationInputContainer}>
            <span>📍</span>
            <input
              type="text"
              placeholder="City or district..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              onFocus={() => setShowLocationDropdown(true)}
              style={styles.locationInput}
            />
            {selectedLocation && (
              <button onClick={() => setSelectedLocation('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <button style={styles.locationSearchBtn} onClick={() => selectedLocation && handleSearch()}>
            🔍
          </button>
        </div>

        {/* Location Dropdown */}
        {showLocationDropdown && allLocations.length > 0 && (
          <div style={styles.locationDropdown}>
            {allLocations
              .filter(loc => loc.toLowerCase().includes(selectedLocation.toLowerCase()))
              .slice(0, 10)
              .map(loc => (
                <div
                  key={loc}
                  onClick={() => handleLocationSelect(loc)}
                  style={styles.locationItem}
                >
                  {loc}
                </div>
              ))}
          </div>
        )}

        {/* Search Bar */}
        <div style={styles.searchBar}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by keyword, area, or property name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={styles.searchInput}
          />
          <button style={styles.searchBtn} onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    padding: '80px 24px',
    marginTop: 64,
    minHeight: 550,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,27,46,0.75)',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 800,
    margin: '0 auto',
    textAlign: 'center',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800,
    color: '#fff',
    fontFamily: "'Sora', sans-serif",
    marginBottom: 16,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
  },
  txToggle: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  txBtn: {
    padding: '8px 24px',
    borderRadius: 30,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontFamily: 'inherit',
  },
  txBtnActive: {
    backgroundColor: '#fff',
    color: NAVY,
  },
  locationRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
  locationInputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '12px 16px',
    position: 'relative',
  },
  locationInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: 14,
  },
  locationSearchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: 'none',
    backgroundColor: RED,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 18,
  },
  locationDropdown: {
    position: 'absolute',
    top: 380,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 48px)',
    maxWidth: 800,
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #eef2f7',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 100,
    maxHeight: 250,
    overflowY: 'auto',
  },
  locationItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 13,
    color: NAVY,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 48,
    padding: '6px 6px 6px 20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  searchBtn: {
    padding: '12px 28px',
    borderRadius: 40,
    border: 'none',
    backgroundColor: RED,
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default HeroSection;