import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Rating,
  CardActionArea,
  alpha,
  Skeleton,
  Tooltip,
  Paper,
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
  TrendingUp,
  Share,
} from '@mui/icons-material';
import { Property } from '../../types';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface PropertyCardProps {
  property: Property;
  onLike?: () => void;
  variant?: 'horizontal' | 'vertical';
  featured?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onLike, 
  variant = 'horizontal',
  featured = false 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property for ${formatPrice(property.price)}`,
          url: window.location.origin + `/property/${property.id}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/property/${property.id}`);
      alert('Link copied to clipboard!');
    }
  };

  // Horizontal variant (default)
  if (variant === 'horizontal') {
    return (
      <Card
        sx={{
          display: 'flex',
          mb: 2,
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
            '& .image-overlay': {
              opacity: 0.1,
            },
          },
        }}
        onClick={() => navigate(`/property/${property.id}`)}
      >
        {/* Image Section */}
        <Box sx={{ position: 'relative', width: 220, minWidth: 220 }}>
          <CardMedia
            component="img"
            sx={{
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
            image={property.images[0]?.image || 'https://via.placeholder.com/220x200?text=No+Image'}
            alt={property.title}
          />
          {/* Badge for featured */}
          {featured && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                bgcolor: '#F97316',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                zIndex: 1,
              }}
            >
              FEATURED
            </Box>
          )}
          {/* Status Badge */}
          {!property.is_available && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: '#ef4444',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                zIndex: 1,
              }}
            >
              SOLD
            </Box>
          )}
        </Box>

        <CardContent sx={{ flex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
          {/* Header with price and actions */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold" color="#1E3A8A" sx={{ fontSize: '1.5rem' }}>
                {formatPrice(property.price)}
                {property.transaction_type === 'rent' && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    /month
                  </Typography>
                )}
              </Typography>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mt: 0.5 }}>
                {property.title}
              </Typography>
            </Box>
            <Box display="flex" gap={0.5}>
              <Tooltip title={property.is_liked ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton 
                  onClick={handleLike} 
                  size="small"
                  sx={{
                    bgcolor: property.is_liked ? alpha('#f44336', 0.1) : 'transparent',
                    '&:hover': { bgcolor: alpha('#f44336', 0.1) },
                  }}
                >
                  {property.is_liked ? <Favorite sx={{ color: '#f44336' }} /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton onClick={handleShare} size="small">
                  <Share sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Features */}
          <Box display="flex" gap={2} mt={1.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Bed sx={{ fontSize: 16, color: '#F97316' }} />
              <Typography variant="body2">{property.bedrooms} beds</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Bathtub sx={{ fontSize: 16, color: '#F97316' }} />
              <Typography variant="body2">{property.bathrooms} baths</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <SquareFoot sx={{ fontSize: 16, color: '#F97316' }} />
              <Typography variant="body2">{property.square_meters} m²</Typography>
            </Box>
          </Box>

          {/* Location */}
          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {property.district}, {property.city}
            </Typography>
          </Box>

          {/* Footer */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
            <Box display="flex" gap={1}>
              {property.is_verified && (
                <Chip
                  icon={<Verified sx={{ fontSize: 14 }} />}
                  label="Verified"
                  size="small"
                  color="success"
                  sx={{ height: 24, '& .MuiChip-label': { fontSize: '0.7rem' } }}
                />
              )}
              <Chip
                label={property.property_type}
                size="small"
                variant="outlined"
                sx={{ height: 24, textTransform: 'capitalize', fontSize: '0.7rem' }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Visibility sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {property.views_count.toLocaleString()} views
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Vertical variant (for grid layout)
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
          '& .image-zoom': {
            transform: 'scale(1.08)',
          },
        },
      }}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      {/* Image Section */}
      <Box sx={{ position: 'relative', paddingTop: '66.67%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          className="image-zoom"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          image={property.images[0]?.image || '/placeholder-property.svg'}
          alt={property.title}
        />
        {/* Badges */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
          {featured && (
            <Box
              sx={{
                bgcolor: '#F97316',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                fontSize: '0.7rem',
                fontWeight: 'bold',
              }}
            >
              FEATURED
            </Box>
          )}
          {!property.is_available && (
            <Box
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                fontSize: '0.7rem',
                fontWeight: 'bold',
              }}
            >
              SOLD
            </Box>
          )}
        </Box>
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <IconButton
            onClick={handleLike}
            size="small"
            sx={{
              bgcolor: 'white',
              '&:hover': { bgcolor: '#f5f5f5' },
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {property.is_liked ? <Favorite sx={{ color: '#f44336' }} /> : <FavoriteBorder />}
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ flex: 1, p: 2 }}>
        {/* Price */}
        <Typography variant="h6" component="div" fontWeight="bold" color="#1E3A8A">
          {formatPrice(property.price)}
          {property.transaction_type === 'rent' && (
            <Typography component="span" variant="caption" color="text.secondary">
              /month
            </Typography>
          )}
        </Typography>

        {/* Title */}
        <Typography variant="subtitle2" fontWeight="600" noWrap sx={{ mt: 0.5 }}>
          {property.title}
        </Typography>

        {/* Features */}
        <Box display="flex" gap={1.5} mt={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Bed sx={{ fontSize: 14, color: '#F97316' }} />
            <Typography variant="caption">{property.bedrooms}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Bathtub sx={{ fontSize: 14, color: '#F97316' }} />
            <Typography variant="caption">{property.bathrooms}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <SquareFoot sx={{ fontSize: 14, color: '#F97316' }} />
            <Typography variant="caption">{property.square_meters}m²</Typography>
          </Box>
        </Box>

        {/* Location */}
        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
          <LocationOn sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {property.district}, {property.city}
          </Typography>
        </Box>

        {/* Footer */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
          <Box display="flex" gap={0.5}>
            {property.is_verified && (
              <Verified sx={{ fontSize: 14, color: '#4caf50' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              {property.views_count} views
            </Typography>
          </Box>
          <Chip
            label={property.property_type}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              textTransform: 'capitalize',
              bgcolor: alpha('#F97316', 0.1),
              color: '#F97316',
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;