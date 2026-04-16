// src/pages/FavoritesPage.tsx - FIXED FOR WEB
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete, Favorite as FavoriteIcon } from '@mui/icons-material';
import api from '../services/api';
import { Property } from '../types'; // Use Property directly, not Favorite
import PropertyCard from '../components/Property/PropertyCard';
import { useAuth } from '../contexts/AuthContext';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      // ✅ FIXED: Use correct endpoint
      const response = await api.get('/properties/favorites/');
      const properties = response.data.results || response.data;
      setFavorites(properties);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      setError(error.response?.data?.detail || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId: number) => {
    try {
      // ✅ FIXED: Use POST to the like endpoint (toggles)
      await api.post(`/properties/${propertyId}/like/`);
      // Update local state
      setFavorites(favorites.filter(property => property.id !== propertyId));
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      setError(error.response?.data?.detail || 'Failed to remove favorite');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#F97316' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
        My Favorites
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Properties you've saved for later
      </Typography>

      {favorites.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', mt: 4, borderRadius: 3 }}>
          <FavoriteIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start exploring properties and save your favorites here
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {favorites.map((property) => (
            <Grid size={{ xs: 12 }} key={property.id}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Box sx={{ flex: 1 }}>
                  <PropertyCard
                    property={property}
                    onLike={fetchFavorites}
                  />
                </Box>
                <IconButton
                  onClick={() => removeFavorite(property.id)}
                  sx={{ 
                    color: '#f44336', 
                    mt: 1,
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                    '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default FavoritesPage;