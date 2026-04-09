import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Delete, Favorite as FavoriteIcon } from '@mui/icons-material';
import api from '../services/api';
import { Favorite } from '../types';
import PropertyCard from '../components/Property/PropertyCard';
import { useAuth } from '../contexts/AuthContext';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/favorites/');
      setFavorites(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId: number) => {
    try {
      await api.delete(`/favorites/${propertyId}/`);
      setFavorites(favorites.filter(f => f.property.id !== propertyId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
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
        <Paper sx={{ p: 6, textAlign: 'center', mt: 4 }}>
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
          {favorites.map((favorite) => (
            <Grid size={{ xs: 12 }} key={favorite.id}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Box sx={{ flex: 1 }}>
                  <PropertyCard
                    property={favorite.property}
                    onLike={fetchFavorites}
                  />
                </Box>
                <IconButton
                  onClick={() => removeFavorite(favorite.property.id)}
                  sx={{ color: '#f44336', mt: 1 }}
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