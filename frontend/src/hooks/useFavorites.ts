import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Favorite } from '../types';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/favorites/');
      setFavorites(response.data.results || response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (propertyId: number) => {
    try {
      const response = await api.post(`/favorites/${propertyId}/`);
      await fetchFavorites();
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to add favorite');
    }
  };

  const removeFavorite = async (propertyId: number) => {
    try {
      await api.delete(`/favorites/${propertyId}/`);
      await fetchFavorites();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to remove favorite');
    }
  };

  const isFavorite = (propertyId: number) => {
    return favorites.some(f => f.property.id === propertyId);
  };

  return { favorites, loading, error, addFavorite, removeFavorite, isFavorite, refetch: fetchFavorites };
};