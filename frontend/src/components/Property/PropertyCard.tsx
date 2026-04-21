// src/components/Property/PropertyCard.tsx - FULLY FIXED
import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Skeleton,
} from '@mui/material';
import { 
  LocationOn, 
  Favorite, 
  FavoriteBorder, 
  Visibility, 
  Bed, 
  Bathtub, 
  SquareFoot,
  Verified,
} from '@mui/icons-material';
import { Property } from '../../types';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface PropertyCardProps {
  property: Property;
  onLike?: () => void;
  variant?: 'horizontal' | 'vertical';
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onLike, 
  variant = 'horizontal',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatShortPrice = (price: number) => {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}B`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)}M`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
    return `${price}`;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/properties/${property.id}/like/`);
      if (onLike) onLike();
    } catch (error) {
      console.error('Error liking property:', error);
    }
  };

  const getTxLabel = () => {
    if (property.transaction_type === 'sale') return 'For Sale';
    if (property.transaction_type === 'rent') return 'For Rent';
    return 'Short Stay';
  };

  const getTxColor = () => {
    if (property.transaction_type === 'sale') return '#10b981';
    if (property.transaction_type === 'rent') return '#3b82f6';
    return '#f59e0b';
  };

  const getTypeLabel = () => {
    const types: Record<string, string> = {
      house: 'House', apartment: 'Apartment', land: 'Land', 
      commercial: 'Commercial', condo: 'Condo', villa: 'Villa'
    };
    return types[property.property_type] || property.property_type;
  };

  const getTypeColor = () => {
    const colors: Record<string, string> = {
      house: '#0369a1', apartment: '#7c3aed', land: '#15803d',
      commercial: '#b45309', condo: '#0891b2', villa: '#b91c1c'
    };
    return colors[property.property_type] || '#475569';
  };

  const getTypeBg = () => {
    const bg: Record<string, string> = {
      house: '#e0f2fe', apartment: '#ede9fe', land: '#dcfce7',
      commercial: '#fef3c7', condo: '#cffafe', villa: '#fee2e2'
    };
    return bg[property.property_type] || '#f1f5f9';
  };

  const getTypeEmoji = () => {
    const emojis: Record<string, string> = {
      house: '🏠', apartment: '🏢', land: '🌾',
      commercial: '🏭', condo: '🏙️', villa: '🏡'
    };
    return emojis[property.property_type] || '🏠';
  };

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <Card
        sx={{
          display: 'flex',
          mb: 2,
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        }}
        onClick={() => navigate(`/property/${property.id}`)}
      >
        {/* Image Section */}
        <Box sx={{ position: 'relative', width: 260, minWidth: 260 }}>
          {!imageLoaded && (
            <Skeleton variant="rectangular" width={260} height="100%" sx={{ position: 'absolute' }} />
          )}
          <CardMedia
            component="img"
            sx={{
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
            }}
            image={property.images?.[0]?.image || '/placeholder-property.svg'}
            alt={property.title}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Property Type Badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: getTypeColor(),
              color: 'white',
              px: 1.2,
              py: 0.6,
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 1,
            }}
          >
            {getTypeEmoji()} {getTypeLabel()}
          </Box>

          {/* Transaction Type Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              bgcolor: getTxColor(),
              color: 'white',
              px: 1.2,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              zIndex: 1,
            }}
          >
            {getTxLabel()}
          </Box>

          {/* Boosted Badge */}
          {property.is_boosted && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                bgcolor: '#f59e0b',
                color: 'white',
                px: 1,
                py: 0.4,
                borderRadius: 1,
                fontSize: '0.65rem',
                fontWeight: 'bold',
                zIndex: 1,
              }}
            >
              ⭐ Featured
            </Box>
          )}

          {/* Verified Badge */}
          {property.is_verified && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 50,
                bgcolor: 'rgba(16,185,129,0.85)',
                color: 'white',
                px: 1,
                py: 0.4,
                borderRadius: 1,
                fontSize: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.3,
                zIndex: 1,
              }}
            >
              <Verified sx={{ fontSize: 11 }} />
              Verified
            </Box>
          )}

          {/* Favorite Button */}
          <IconButton
            onClick={handleLike}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.4)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
              zIndex: 1,
              width: 32,
              height: 32,
            }}
          >
            {property.is_liked ? (
              <Favorite sx={{ color: '#e63946', fontSize: 16 }} />
            ) : (
              <FavoriteBorder sx={{ color: '#fff', fontSize: 16 }} />
            )}
          </IconButton>
        </Box>

        {/* Content Section */}
        <CardContent sx={{ flex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
          {/* Price Row */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="h5" component="div" fontWeight="800" color="#0d1b2e" sx={{ fontSize: '1.3rem' }}>
              {formatShortPrice(property.price)}
              {property.transaction_type === 'rent' && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.8rem' }}>
                  /mo
                </Typography>
              )}
            </Typography>
            <Chip
              label={`${getTypeEmoji()} ${getTypeLabel()}`}
              size="small"
              sx={{
                height: 26,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: getTypeBg(),
                color: getTypeColor(),
              }}
            />
          </Box>

          {/* Title */}
          <Typography 
            variant="subtitle1" 
            fontWeight="700" 
            sx={{ 
              mb: 0.75, 
              fontSize: '0.9rem', 
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {property.title}
          </Typography>

          {/* Location */}
          <Box display="flex" alignItems="center" gap={0.5} mb={1.2}>
            <LocationOn sx={{ fontSize: 13, color: '#94a3b8' }} />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {property.district}, {property.city}
            </Typography>
          </Box>

          {/* Stats Row */}
          <Box display="flex" gap={2} mb={1.2}>
            {property.bedrooms > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Bed sx={{ fontSize: 14, color: '#64748b' }} />
                <Typography variant="body2" color="#475569" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
            {property.bathrooms > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Bathtub sx={{ fontSize: 14, color: '#64748b' }} />
                <Typography variant="body2" color="#475569" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
            {property.square_meters > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <SquareFoot sx={{ fontSize: 14, color: '#64748b' }} />
                <Typography variant="body2" color="#475569" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {property.square_meters}m²
                </Typography>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box display="flex" justifyContent="space-between" alignItems="center" pt={0.75} sx={{ borderTop: '1px solid #f1f5f9' }}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Visibility sx={{ fontSize: 13, color: '#94a3b8' }} />
              <Typography variant="body2" color="#94a3b8" sx={{ fontSize: '0.7rem' }}>
                {property.views_count || 0} views
              </Typography>
            </Box>
            <Typography variant="body2" color="#94a3b8" sx={{ fontSize: '0.7rem' }}>
              {new Date(property.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Vertical variant (grid layout)
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      {/* Image Section */}
      <Box sx={{ position: 'relative', paddingTop: '66.67%', overflow: 'hidden' }}>
        {!imageLoaded && (
          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', top: 0 }} />
        )}
        <CardMedia
          component="img"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
          }}
          image={property.images?.[0]?.image || '/placeholder-property.svg'}
          alt={property.title}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Property Type Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: getTypeColor(),
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 20,
            fontSize: '0.7rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
            zIndex: 1,
          }}
        >
          {getTypeEmoji()} {getTypeLabel()}
        </Box>

        {/* Transaction Badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            bgcolor: getTxColor(),
            color: 'white',
            px: 1,
            py: 0.4,
            borderRadius: 1,
            fontSize: '0.65rem',
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          {getTxLabel()}
        </Box>

        {/* Boosted Badge */}
        {property.is_boosted && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              bgcolor: '#f59e0b',
              color: 'white',
              px: 0.8,
              py: 0.3,
              borderRadius: 1,
              fontSize: '0.6rem',
              fontWeight: 'bold',
              zIndex: 1,
            }}
          >
            ⭐ Featured
          </Box>
        )}

        {/* Favorite Button */}
        <IconButton
          onClick={handleLike}
          size="small"
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            bgcolor: 'rgba(0,0,0,0.4)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
            zIndex: 1,
            width: 30,
            height: 30,
          }}
        >
          {property.is_liked ? (
            <Favorite sx={{ color: '#e63946', fontSize: 15 }} />
          ) : (
            <FavoriteBorder sx={{ color: '#fff', fontSize: 15 }} />
          )}
        </IconButton>
      </Box>

      {/* Content Section */}
      <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
        <Typography variant="h6" component="div" fontWeight="800" color="#0d1b2e" sx={{ fontSize: '1rem' }}>
          {formatShortPrice(property.price)}
          {property.transaction_type === 'rent' && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              /mo
            </Typography>
          )}
        </Typography>

        {/* Title */}
        <Typography 
          variant="body2" 
          fontWeight="700" 
          sx={{ 
            mb: 0.5, 
            display: 'block', 
            fontSize: '0.8rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {property.title}
        </Typography>

        {/* Location */}
        <Box display="flex" alignItems="center" gap={0.3} mb={0.8}>
          <LocationOn sx={{ fontSize: 11, color: '#94a3b8' }} />
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.7rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {property.district}, {property.city}
          </Typography>
        </Box>

        <Box display="flex" gap={1.5} mb={0.8}>
          {property.bedrooms > 0 && (
            <Box display="flex" alignItems="center" gap={0.3}>
              <Bed sx={{ fontSize: 12, color: '#64748b' }} />
              <Typography variant="caption" color="#475569" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
                {property.bedrooms}
              </Typography>
            </Box>
          )}
          {property.bathrooms > 0 && (
            <Box display="flex" alignItems="center" gap={0.3}>
              <Bathtub sx={{ fontSize: 12, color: '#64748b' }} />
              <Typography variant="caption" color="#475569" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
                {property.bathrooms}
              </Typography>
            </Box>
          )}
          {property.square_meters > 0 && (
            <Box display="flex" alignItems="center" gap={0.3}>
              <SquareFoot sx={{ fontSize: 12, color: '#64748b' }} />
              <Typography variant="caption" color="#475569" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
                {property.square_meters}
              </Typography>
            </Box>
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" pt={0.5} sx={{ borderTop: '1px solid #f1f5f9' }}>
          <Box display="flex" alignItems="center" gap={0.3}>
            <Visibility sx={{ fontSize: 11, color: '#94a3b8' }} />
            <Typography variant="caption" color="#94a3b8" sx={{ fontSize: '0.65rem' }}>
              {property.views_count || 0}
            </Typography>
          </Box>
          {property.is_verified && (
            <Verified sx={{ fontSize: 12, color: '#10b981' }} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;