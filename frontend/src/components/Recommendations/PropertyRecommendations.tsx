// src/components/Recommendations/PropertyRecommendations.tsx - IMPROVED VERSION
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Rating,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  TrendingUp,
  Favorite,
  FavoriteBorder,
  Visibility,
  Verified,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Property } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface PropertyRecommendationsProps {
  propertyId?: number;
  limit?: number;
  title?: string;
  variant?: 'horizontal' | 'vertical';
}

const PropertyRecommendations: React.FC<PropertyRecommendationsProps> = ({
  propertyId,
  limit = 4,
  title = "You Might Also Like",
  variant = 'vertical',
}) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendations();
  }, [propertyId]);

  const fetchRecommendations = async () => {
    try {
      const endpoint = propertyId
        ? `/properties/${propertyId}/recommendations/`
        : '/properties/recommendations/';
      const response = await api.get(endpoint, {
        params: { limit, user_id: user?.id },
      });
      setRecommendations(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/properties/${property.id}/like/`);
      // Update local state
      setRecommendations(prev =>
        prev.map(p =>
          p.id === property.id ? { ...p, is_liked: !p.is_liked } : p
        )
      );
    } catch (error) {
      console.error('Error liking property:', error);
    }
  };

  const formatShortPrice = (price: number) => {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}B`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)}M`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
    return `${price}`;
  };

  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      house: '🏠', apartment: '🏢', land: '🌾',
      commercial: '🏭', condo: '🏙️', villa: '🏡'
    };
    return emojis[type] || '🏠';
  };

  const getTxLabel = (type: string) => {
    if (type === 'sale') return 'Sale';
    if (type === 'rent') return 'Rent';
    return 'Short';
  };

  if (loading) {
    return (
      <Box sx={{ mt: 4, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TrendingUp sx={{ color: '#e63946' }} />
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(limit, 4)}, 1fr)` },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4].slice(0, limit).map((i) => (
            <Box
              key={i}
              sx={{
                height: 280,
                bgcolor: '#f1f5f9',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={40} sx={{ color: '#e63946' }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (recommendations.length === 0) return null;

  // Horizontal variant (carousel style)
  if (variant === 'horizontal') {
    return (
      <Box sx={{ mt: 4, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TrendingUp sx={{ color: '#e63946' }} />
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 3 },
          }}
        >
          {recommendations.map((property) => (
            <Card
              key={property.id}
              sx={{
                minWidth: 280,
                maxWidth: 280,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderRadius: 3,
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                },
              }}
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={property.images?.[0]?.image || '/placeholder-property.svg'}
                  alt={property.title}
                />
                {/* Transaction Badge */}
                <Chip
                  label={getTxLabel(property.transaction_type)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    bgcolor: property.transaction_type === 'sale' ? '#10b981' : property.transaction_type === 'rent' ? '#3b82f6' : '#f59e0b',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                />
                {/* Favorite Button */}
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    bgcolor: 'rgba(0,0,0,0.4)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                    width: 28,
                    height: 28,
                  }}
                  onClick={(e) => handleLike(e, property)}
                >
                  {property.is_liked ? (
                    <Favorite sx={{ color: '#e63946', fontSize: 14 }} />
                  ) : (
                    <FavoriteBorder sx={{ color: '#fff', fontSize: 14 }} />
                  )}
                </IconButton>
              </Box>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="800" color="#0d1b2e" sx={{ fontSize: '0.9rem' }}>
                  {formatShortPrice(property.price)}
                  {property.transaction_type === 'rent' && '/mo'}
                </Typography>
                <Typography variant="caption" fontWeight="600" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                  {property.title.length > 40 ? property.title.substring(0, 40) + '...' : property.title}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.3} mb={0.8}>
                  <LocationOn sx={{ fontSize: 9, color: '#94a3b8' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    {property.district}, {property.city}
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Chip
                    size="small"
                    icon={<Bed sx={{ fontSize: 10 }} />}
                    label={property.bedrooms}
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                  <Chip
                    size="small"
                    icon={<Bathtub sx={{ fontSize: 10 }} />}
                    label={property.bathrooms}
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                  <Chip
                    size="small"
                    icon={<SquareFoot sx={{ fontSize: 10 }} />}
                    label={`${property.square_meters}m²`}
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1} pt={0.5} sx={{ borderTop: '1px solid #f1f5f9' }}>
                  <Box display="flex" alignItems="center" gap={0.3}>
                    <Visibility sx={{ fontSize: 9, color: '#94a3b8' }} />
                    <Typography variant="caption" color="#94a3b8" sx={{ fontSize: '0.55rem' }}>
                      {property.views_count || 0}
                    </Typography>
                  </Box>
                  {property.is_verified && (
                    <Verified sx={{ fontSize: 10, color: '#10b981' }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  // Vertical variant (grid layout - default)
  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TrendingUp sx={{ color: '#e63946' }} />
        <Typography variant="h6" fontWeight="bold">{title}</Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(limit, 4)}, 1fr)` },
          gap: 2,
        }}
      >
        {recommendations.map((property) => (
          <Card
            key={property.id}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderRadius: 3,
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
            onClick={() => navigate(`/property/${property.id}`)}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="160"
                image={property.images?.[0]?.image || '/placeholder-property.svg'}
                alt={property.title}
              />
              {/* Property Type Emoji Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  px: 0.8,
                  py: 0.3,
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                }}
              >
                {getTypeEmoji(property.property_type)} {property.property_type}
              </Box>
              {/* Transaction Badge */}
              <Chip
                label={getTxLabel(property.transaction_type)}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  bgcolor: property.transaction_type === 'sale' ? '#10b981' : property.transaction_type === 'rent' ? '#3b82f6' : '#f59e0b',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                }}
              />
              {/* Boosted Badge */}
              {property.is_boosted && (
                <Chip
                  label="⭐ Featured"
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: '#f59e0b',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.6rem',
                  }}
                />
              )}
              {/* Favorite Button */}
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  bgcolor: 'rgba(0,0,0,0.4)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                  width: 28,
                  height: 28,
                }}
                onClick={(e) => handleLike(e, property)}
              >
                {property.is_liked ? (
                  <Favorite sx={{ color: '#e63946', fontSize: 14 }} />
                ) : (
                  <FavoriteBorder sx={{ color: '#fff', fontSize: 14 }} />
                )}
              </IconButton>
            </Box>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="800" color="#0d1b2e" sx={{ fontSize: '0.9rem' }}>
                {formatShortPrice(property.price)}
                {property.transaction_type === 'rent' && '/mo'}
              </Typography>
              <Typography variant="caption" fontWeight="600" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                {property.title.length > 45 ? property.title.substring(0, 45) + '...' : property.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.3} mb={0.8}>
                <LocationOn sx={{ fontSize: 9, color: '#94a3b8' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {property.district}, {property.city}
                </Typography>
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <Chip
                  size="small"
                  icon={<Bed sx={{ fontSize: 10 }} />}
                  label={property.bedrooms}
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
                <Chip
                  size="small"
                  icon={<Bathtub sx={{ fontSize: 10 }} />}
                  label={property.bathrooms}
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
                <Chip
                  size="small"
                  icon={<SquareFoot sx={{ fontSize: 10 }} />}
                  label={`${property.square_meters}m²`}
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" pt={0.5} sx={{ borderTop: '1px solid #f1f5f9' }}>
                <Box display="flex" alignItems="center" gap={0.3}>
                  <Visibility sx={{ fontSize: 9, color: '#94a3b8' }} />
                  <Typography variant="caption" color="#94a3b8" sx={{ fontSize: '0.55rem' }}>
                    {property.views_count || 0} views
                  </Typography>
                </Box>
                {property.is_verified && (
                  <Verified sx={{ fontSize: 10, color: '#10b981' }} />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default PropertyRecommendations;