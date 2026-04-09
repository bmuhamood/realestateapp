import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Rating,
} from '@mui/material';
import {
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  ThumbUp,
  TrendingUp,
} from '@mui/icons-material';
import api from '../../services/api';
import { Property } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface PropertyRecommendationsProps {
  propertyId?: number;
  limit?: number;
  title?: string;
}

const PropertyRecommendations: React.FC<PropertyRecommendationsProps> = ({
  propertyId,
  limit = 4,
  title = "You Might Also Like",
}) => {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(25% - 16px)' } }}>
              <CircularProgress />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TrendingUp sx={{ color: '#F97316' }} />
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
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              },
            }}
            onClick={() => window.location.href = `/property/${property.id}`}
          >
            <CardMedia
              component="img"
              height="160"
              image={property.images[0]?.image || 'https://via.placeholder.com/300x160'}
              alt={property.title}
            />
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="#1E3A8A">
                {formatPrice(property.price)}
                {property.transaction_type === 'rent' && '/month'}
              </Typography>
              <Typography variant="body2" fontWeight={500} noWrap>
                {property.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                <LocationOn sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {property.district}, {property.city}
                </Typography>
              </Box>
              <Box display="flex" gap={1} mt={1}>
                <Chip size="small" label={`${property.bedrooms} beds`} variant="outlined" />
                <Chip size="small" label={`${property.bathrooms} baths`} variant="outlined" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default PropertyRecommendations;