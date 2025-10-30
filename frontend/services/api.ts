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
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;

    if (apiError?.message) {
      return apiError.message;
    }

    if (apiError?.errors && apiError.errors.length > 0) {
      return apiError.errors.map(e => e.message).join(', ');
    }

    if (error.message) {
      return error.message;
    }
  }

  return 'An unexpected error occurred';
}

export default api;
