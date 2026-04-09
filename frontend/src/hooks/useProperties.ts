import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Property } from '../types';

interface UsePropertiesOptions {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

export const useProperties = (options: UsePropertiesOptions = {}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: options.page || 1,
        page_size: options.limit || 20,
        ...options.filters,
      };
      const response = await api.get('/properties/', { params });
      setProperties(response.data.results || response.data);
      setTotal(response.data.count || response.data.length);
      setHasMore(!!response.data.next);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, total, hasMore, refetch: fetchProperties };
};

export const useProperty = (id: number) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/properties/${id}/`);
        setProperty(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  return { property, loading, error };
};