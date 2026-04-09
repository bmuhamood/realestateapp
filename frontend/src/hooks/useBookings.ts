import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Booking } from '../types';

export const useBookings = (agentMode = false) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = agentMode ? '/bookings/agent/' : '/bookings/';
      const response = await api.get(endpoint);
      setBookings(response.data.results || response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [agentMode]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (data: {
    property: number;
    visit_date: string;
    message?: string;
  }) => {
    try {
      const response = await api.post('/bookings/', data);
      setBookings(prev => [response.data, ...prev]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create booking');
    }
  };

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      const response = await api.patch(`/bookings/${id}/`, { status });
      setBookings(prev => prev.map(b => b.id === id ? response.data : b));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update booking');
    }
  };

  return { bookings, loading, error, createBooking, updateBookingStatus, refetch: fetchBookings };
};