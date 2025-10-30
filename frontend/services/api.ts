import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from '../constants/configs';
import { ApiError } from '../types';
import { clearTokens, getAccessToken } from './storage.service';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await clearTokens();

        return Promise.reject(error);
      } catch (refreshError) {
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function handleApiError(error: unknown): string {
  console.log('=== API Error Debug ===');
  console.log('Error object:', error);

  if (axios.isAxiosError(error)) {
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);

    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      if (__DEV__) {
        return 'Backend server not running. Please start the backend server at http://localhost:4000 or enable mock mode.';
      }
      return 'Unable to connect to server. Please check your internet connection and try again.';
    }

    
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    const apiError = error.response?.data as ApiError;
    console.log('Parsed API error:', apiError);

    
    if (apiError?.message) {
      return apiError.message;
    }

    
    if (
      apiError?.errors &&
      Array.isArray(apiError.errors) &&
      apiError.errors.length > 0
    ) {
      return apiError.errors.map(e => e.message || e).join(', ');
    }


    
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }

    if (error.response?.status === 404) {
      return 'Service not found. Please check your connection.';
    }

    if (error.response?.status === 400) {
      return 'Invalid request data. Please check your inputs.';
    }

    if (error.response?.status === 409) {
      return 'Resource already exists. Please try with different details.';
    }

    if (error.message) {
      return error.message;
    }

    
    if (error.response?.data) {
      return `Server error: ${JSON.stringify(error.response.data)}`;
    }
  }

  console.log('Non-axios error:', error);
  return 'An unexpected error occurred';
}

export default api;
