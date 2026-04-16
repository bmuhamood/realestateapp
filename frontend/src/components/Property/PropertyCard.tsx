// src/components/Property/PropertyCard.tsx - FIXED VERSION
import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Rating,
  alpha,
  Skeleton,
  Tooltip,
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
  Share,
  Videocam,
  Security,
  LocalParking,
  Pool,
  Description,
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
  showDetails?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onLike, 
  variant = 'horizontal',
  featured = false,
  showDetails = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);

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
      navigator.clipboard.writeText(window.location.origin + `/property/${property.id}`);
      alert('Link copied to clipboard!');
    }
  };

  // Safe access helper functions
  const getAmenitiesList = (): string[] => {
    return property.amenities_list || property.amenities || [];
  };

  const getNearbySchoolsList = (): string[] => {
    return property.nearby_schools_list || [];
  };

  const getParkingSpaces = (): number => {
    return property.parking_spaces || 0;
  };

  const getDistanceToCityCenter = (): number | null => {
    return property.distance_to_city_center ?? null;
  };

  const getDistanceToNearestSchool = (): number | null => {
    return property.distance_to_nearest_school ?? null;
  };

  const getSchoolRating = (): number => {
    return property.school_rating || 0;
  };

  const getViewsCount = (): number => {
    return property.views_count || 0;
  };

  const getSquareMeters = (): number => {
    return property.square_meters || 0;
  };

  const getBedrooms = (): number => {
    return property.bedrooms || 0;
  };

  const getBathrooms = (): number => {
    return property.bathrooms || 0;
  };

  const hasVideo = (): boolean => {
    return !!(property.has_video || property.video_url || property.video_file);
  };

  const getFullAddress = (): string => {
    return property.full_address || `${property.district || ''}, ${property.city || ''}`;
  };

  const getAverageRating = (): number => {
    return property.average_rating || 0;
  };

  const getReviewsCount = (): number => {
    return property.reviews_count || property.reviews?.length || 0;
  };

  const amenitiesCount = getAmenitiesList().length;
  const parkingSpaces = getParkingSpaces();
  const hasSecurityFeatures = !!(property.has_security || property.has_cctv || property.has_gated_community);
  const hasPool = property.has_swimming_pool || false;
  const hasTitleDeed = property.has_title_deed || false;

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
              transition: 'transform 0.5s ease',
              opacity: imageLoaded ? 1 : 0,
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
            image={property.images?.[0]?.image || '/placeholder-property.svg'}
            alt={property.title}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Video Badge */}
          {hasVideo() && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                zIndex: 1,
              }}
            >
              <Videocam sx={{ fontSize: 12 }} />
              Video Tour
            </Box>
          )}
          
          {/* Featured Badge */}
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
          <Box display="flex" gap={2} mt={1.5} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Bed sx={{ fontSize: 16, color: '#F97316' }} />
              <Typography variant="body2">{getBedrooms()} beds</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Bathtub sx={{ fontSize: 16, color: '#F97316' }} />
              <Typography variant="body2">{getBathrooms()} baths</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <SquareFoot sx={{ fontSize: 16, color: '#F97316' }} />
              <Typography variant="body2">{getSquareMeters().toLocaleString()} m²</Typography>
            </Box>
            {parkingSpaces > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocalParking sx={{ fontSize: 16, color: '#F97316' }} />
                <Typography variant="body2">{parkingSpaces} parking</Typography>
              </Box>
            )}
          </Box>

          {/* Location */}
          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {getFullAddress()}
            </Typography>
          </Box>

          {/* Rating */}
          {getAverageRating() > 0 && (
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Rating value={getAverageRating()} readOnly size="small" precision={0.5} />
              <Typography variant="caption" color="text.secondary">
                ({getReviewsCount()} reviews)
              </Typography>
            </Box>
          )}

          {/* Amenities Preview */}
          {amenitiesCount > 0 && (
            <Box display="flex" gap={1} mt={1} flexWrap="wrap">
              {getAmenitiesList().slice(0, 3).map((amenity, index) => (
                <Chip
                  key={index}
                  label={amenity}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              ))}
              {amenitiesCount > 3 && (
                <Chip
                  label={`+${amenitiesCount - 3} more`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#F97316', 0.1) }}
                />
              )}
            </Box>
          )}

          {/* Security Badges */}
          {hasSecurityFeatures && (
            <Box display="flex" gap={1} mt={1} flexWrap="wrap">
              {property.has_security && (
                <Chip
                  icon={<Security sx={{ fontSize: 12 }} />}
                  label="Security"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#4caf50', 0.1) }}
                />
              )}
              {property.has_cctv && (
                <Chip
                  label="CCTV"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#2196f3', 0.1) }}
                />
              )}
              {property.has_gated_community && (
                <Chip
                  label="Gated"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#9c27b0', 0.1) }}
                />
              )}
              {hasPool && (
                <Chip
                  icon={<Pool sx={{ fontSize: 12 }} />}
                  label="Pool"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#00bcd4', 0.1) }}
                />
              )}
            </Box>
          )}

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
              {hasTitleDeed && (
                <Chip
                  icon={<Description sx={{ fontSize: 12 }} />}
                  label="Title Deed"
                  size="small"
                  sx={{ height: 24, fontSize: '0.65rem' }}
                />
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Visibility sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {getViewsCount().toLocaleString()} views
              </Typography>
            </Box>
          </Box>

          {/* Distance to amenities (if available) */}
          {showDetails && getDistanceToCityCenter() && (
            <Box display="flex" gap={2} mt={1.5} sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
              {getDistanceToCityCenter() && (
                <Typography variant="caption" color="text.secondary">
                  📍 {getDistanceToCityCenter()} km to city center
                </Typography>
              )}
              {getDistanceToNearestSchool() && (
                <Typography variant="caption" color="text.secondary">
                  🏫 {getDistanceToNearestSchool()} km to school
                </Typography>
              )}
            </Box>
          )}
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
            transition: 'transform 0.5s ease',
            opacity: imageLoaded ? 1 : 0,
          }}
          image={property.images?.[0]?.image || '/placeholder-property.svg'}
          alt={property.title}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Video Badge */}
        {hasVideo() && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              px: 0.8,
              py: 0.3,
              borderRadius: 1,
              fontSize: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              zIndex: 1,
            }}
          >
            <Videocam sx={{ fontSize: 10 }} />
            Video
          </Box>
        )}
        
        {/* Badges */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 0.5 }}>
          {featured && (
            <Box
              sx={{
                bgcolor: '#F97316',
                color: 'white',
                px: 0.8,
                py: 0.3,
                borderRadius: 1,
                fontSize: '0.6rem',
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
                px: 0.8,
                py: 0.3,
                borderRadius: 1,
                fontSize: '0.6rem',
                fontWeight: 'bold',
              }}
            >
              SOLD
            </Box>
          )}
        </Box>
        
        {/* Favorite Button */}
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
            {property.is_liked ? <Favorite sx={{ color: '#f44336', fontSize: 18 }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ flex: 1, p: 1.5 }}>
        {/* Price */}
        <Typography variant="h6" component="div" fontWeight="bold" color="#1E3A8A" sx={{ fontSize: '1.1rem' }}>
          {formatPrice(property.price)}
          {property.transaction_type === 'rent' && (
            <Typography component="span" variant="caption" color="text.secondary">
              /mo
            </Typography>
          )}
        </Typography>

        {/* Title */}
        <Typography variant="subtitle2" fontWeight="600" noWrap sx={{ mt: 0.5, fontSize: '0.8rem' }}>
          {property.title}
        </Typography>

        {/* Features */}
        <Box display="flex" gap={1} mt={0.8}>
          <Box display="flex" alignItems="center" gap={0.3}>
            <Bed sx={{ fontSize: 12, color: '#F97316' }} />
            <Typography variant="caption">{getBedrooms()}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.3}>
            <Bathtub sx={{ fontSize: 12, color: '#F97316' }} />
            <Typography variant="caption">{getBathrooms()}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.3}>
            <SquareFoot sx={{ fontSize: 12, color: '#F97316' }} />
            <Typography variant="caption">{getSquareMeters()}m²</Typography>
          </Box>
        </Box>

        {/* Location */}
        <Box display="flex" alignItems="center" gap={0.3} mt={0.5}>
          <LocationOn sx={{ fontSize: 10, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {property.district}, {property.city}
          </Typography>
        </Box>

        {/* Rating */}
        {getAverageRating() > 0 && (
          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
            <Rating value={getAverageRating()} readOnly size="small" precision={0.5} sx={{ fontSize: 12 }} />
            <Typography variant="caption" color="text.secondary">
              ({getReviewsCount()})
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Box display="flex" gap={0.5}>
            {property.is_verified && (
              <Verified sx={{ fontSize: 12, color: '#4caf50' }} />
            )}
            {hasSecurityFeatures && (
              <Security sx={{ fontSize: 12, color: '#4caf50' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              {getViewsCount().toLocaleString()} views
            </Typography>
          </Box>
          <Chip
            label={property.property_type}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
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