import axios from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    const data = response?.data;
    
    if (response?.status === 401) {
      return {
        message: 'Your session has expired. Please login again.',
        status: 401,
      };
    }
    
    if (response?.status === 403) {
      return {
        message: 'You do not have permission to perform this action.',
        status: 403,
      };
    }
    
    if (response?.status === 404) {
      return {
        message: 'The requested resource was not found.',
        status: 404,
      };
    }
    
    if (data?.message) {
      return {
        message: data.message,
        status: response?.status,
        errors: data.errors,
      };
    }
    
    if (data?.detail) {
      return {
        message: data.detail,
        status: response?.status,
      };
    }
    
    return {
      message: 'An unexpected error occurred. Please try again.',
      status: response?.status,
    };
  }
  
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
  };
};

export const getErrorMessage = (error: unknown): string => {
  const handled = handleApiError(error);
  return handled.message;
};