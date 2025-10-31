import { CorsOptions } from 'cors';

const LOCALHOST_PATTERN = /^http:\/\/localhost:\d+$/;
const LOCAL_IP_PATTERN = /^https?:\/\/192\.168\.\d+\.\d+:\d+$/;
const EXPO_PATTERN = /^exp:\/\/192\.168\.\d+\.\d+:\d+$/;

function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

function getConfiguredOrigins(): string[] {
  return process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [];
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes('*')) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (isDevelopment()) {
    return (
      LOCALHOST_PATTERN.test(origin) ||
      LOCAL_IP_PATTERN.test(origin) ||
      EXPO_PATTERN.test(origin)
    );
  }

  return false;
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = getConfiguredOrigins();

    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
  maxAge: 86400,
};
