import { API_URL } from '@/lib/constants';
import type { ApiError } from '@/types';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken } from './storage.service';

const REQUEST_TIMEOUT = 30000;
const UNAUTHORIZED_STATUS = 401;

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const ERROR_MESSAGES = {
  NETWORK_DEV:
    'Backend server not running. Please start the backend server at http://localhost:4000 or enable mock mode.',
  NETWORK:
    'Unable to connect to server. Please check your internet connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Service not found. Please check your connection.',
  BAD_REQUEST: 'Invalid request data. Please check your inputs.',
  CONFLICT: 'Resource already exists. Please try with different details.',
  UNEXPECTED: 'An unexpected error occurred',
} as const;

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
} as const;

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function attachAuthToken(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

async function handleUnauthorizedError(
  error: AxiosError<ApiError>
): Promise<never> {
  const originalRequest = error.config as RetryableRequest;

  if (
    error.response?.status === UNAUTHORIZED_STATUS &&
    !originalRequest._retry
  ) {
    originalRequest._retry = true;
    await clearTokens();
  }

  return Promise.reject(error);
}

api.interceptors.request.use(attachAuthToken, error => Promise.reject(error));
api.interceptors.response.use(response => response, handleUnauthorizedError);

function isNetworkError(error: AxiosError): boolean {
  return error.code === 'NETWORK_ERROR' || !error.response;
}

function isTimeoutError(error: AxiosError): boolean {
  return error.code === 'ECONNABORTED';
}

function extractApiErrorMessage(apiError: ApiError): string | null {
  if (apiError?.message) {
    return apiError.message;
  }

  if (
    apiError?.errors &&
    Array.isArray(apiError.errors) &&
    apiError.errors.length > 0
  ) {
    return apiError.errors.map(e => e.message || String(e)).join(', ');
  }

  return null;
}

function getStatusErrorMessage(status: number): string | null {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return ERROR_MESSAGES.BAD_REQUEST;
    case HTTP_STATUS.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;
    case HTTP_STATUS.CONFLICT:
      return ERROR_MESSAGES.CONFLICT;
    case HTTP_STATUS.SERVER_ERROR:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return null;
  }
}

export function handleApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return ERROR_MESSAGES.UNEXPECTED;
  }

  if (isNetworkError(error)) {
    return __DEV__ ? ERROR_MESSAGES.NETWORK_DEV : ERROR_MESSAGES.NETWORK;
  }

  if (isTimeoutError(error)) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  const apiError = error.response?.data as ApiError;
  const apiErrorMessage = extractApiErrorMessage(apiError);

  if (apiErrorMessage) {
    return apiErrorMessage;
  }

  if (error.response?.status) {
    const statusMessage = getStatusErrorMessage(error.response.status);
    if (statusMessage) {
      return statusMessage;
    }
  }

  if (error.message) {
    return error.message;
  }

  if (error.response?.data) {
    return `Server error: ${JSON.stringify(error.response.data)}`;
  }

  return ERROR_MESSAGES.UNEXPECTED;
}

export default api;
