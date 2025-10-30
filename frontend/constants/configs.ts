const ENV = {
  dev: {
    apiUrl: 'http://localhost:4000/api',
  },
  prod: {
    apiUrl: '',
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export const config = getEnvVars();

export const API_URL = config.apiUrl;

export const LOW_BALANCE_THRESHOLD = 100;

export const COLORS = {
  primary: '#10b981',
  primaryDark: '#059669',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  disabled: '#d1d5db',
};