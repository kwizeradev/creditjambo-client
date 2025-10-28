import { CorsOptions } from 'cors';
import { rateLimit } from 'express-rate-limit';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_AUTH_LIMIT = 5;
const DEFAULT_GENERAL_LIMIT = 100;
const DEFAULT_TRANSACTION_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_TRANSACTION_LIMIT = 10;

export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_WINDOW_MS.toString()),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || DEFAULT_AUTH_LIMIT.toString()),
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_WINDOW_MS.toString()),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_GENERAL_LIMIT.toString()),
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const transactionLimiter = rateLimit({
  windowMs: parseInt(
    process.env.TRANSACTION_RATE_LIMIT_WINDOW_MS || DEFAULT_TRANSACTION_WINDOW_MS.toString(),
  ),
  max: parseInt(process.env.TRANSACTION_RATE_LIMIT_MAX || DEFAULT_TRANSACTION_LIMIT.toString()),
  message: {
    status: 'error',
    message: 'Too many transaction requests. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes('*')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400,
};

export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'sameorigin' as const },
  xssFilter: true,
};
