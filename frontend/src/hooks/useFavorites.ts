// src/hooks/useFavorites.ts - FIXED
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Property } from '../types'; // Use Property directly, not Favorite

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ FIXED: Use correct endpoint
      const response = await api.get('/properties/favorites/');
      const properties = response.data.results || response.data;
      setFavorites(properties);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(err.response?.data?.detail || 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // ✅ FIXED: Use the like endpoint (POST toggles like/unlike)
  const addFavorite = async (propertyId: number) => {
    try {
      const response = await api.post(`/properties/${propertyId}/like/`);
      const { liked } = response.data;
      
      if (liked) {
        // Fetch full property details
        const propertyResponse = await api.get(`/properties/${propertyId}/`);
        setFavorites(prev => [...prev, propertyResponse.data]);
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error adding favorite:', err);
      throw new Error(err.response?.data?.detail || 'Failed to add favorite');
    }
  };

  // ✅ FIXED: Same endpoint - calling it again toggles off
  const removeFavorite = async (propertyId: number) => {
    try {
      const response = await api.post(`/properties/${propertyId}/like/`);
      const { liked } = response.data;
      
      if (!liked) {
        // Remove from local state
        setFavorites(prev => prev.filter(property => property.id !== propertyId));
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error removing favorite:', err);
      throw new Error(err.response?.data?.detail || 'Failed to remove favorite');
    }
  };

  // ✅ FIXED: Check if property is in favorites array
  const isFavorite = (propertyId: number): boolean => {
    return favorites.some(property => property.id === propertyId);
  };

  // ✅ FIXED: Toggle favorite (add if not exists, remove if exists)
  const toggleFavorite = async (propertyId: number): Promise<boolean> => {
    const currentlyFavorite = isFavorite(propertyId);
    
    try {
      const response = await api.post(`/properties/${propertyId}/like/`);
      const { liked } = response.data;
      
      if (liked && !currentlyFavorite) {
        // Add to favorites - fetch full property
        const propertyResponse = await api.get(`/properties/${propertyId}/`);
        setFavorites(prev => [...prev, propertyResponse.data]);
      } else if (!liked && currentlyFavorite) {
        // Remove from favorites
        setFavorites(prev => prev.filter(property => property.id !== propertyId));
      }
      
      return liked;
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      throw new Error(err.response?.data?.detail || 'Failed to toggle favorite');
    }
  };

  return { 
    favorites, 
    loading, 
    error, 
    addFavorite, 
    removeFavorite, 
    isFavorite, 
    toggleFavorite,
    refetch: fetchFavorites 
  };
};