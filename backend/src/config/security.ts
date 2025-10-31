import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

const DEFAULT_AUTH_LIMIT = 10;
const DEFAULT_GENERAL_LIMIT = 200;
const DEFAULT_TRANSACTION_LIMIT = 20;

function getWindowMs(envVar: string | undefined, defaultValue: number): number {
  return parseInt(envVar || defaultValue.toString());
}

function getMaxRequests(envVar: string | undefined, defaultValue: number): number {
  return parseInt(envVar || defaultValue.toString());
}

export const authLimiter = rateLimit({
  windowMs: getWindowMs(process.env.RATE_LIMIT_WINDOW_MS, FIFTEEN_MINUTES),
  max: getMaxRequests(process.env.AUTH_RATE_LIMIT_MAX, DEFAULT_AUTH_LIMIT),
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const generalLimiter = rateLimit({
  windowMs: getWindowMs(process.env.RATE_LIMIT_WINDOW_MS, FIFTEEN_MINUTES),
  max: getMaxRequests(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_GENERAL_LIMIT),
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const transactionLimiter = rateLimit({
  windowMs: getWindowMs(process.env.TRANSACTION_RATE_LIMIT_WINDOW_MS, TEN_MINUTES),
  max: getMaxRequests(process.env.TRANSACTION_RATE_LIMIT_MAX, DEFAULT_TRANSACTION_LIMIT),
  message: {
    status: 'error',
    message: 'Too many transaction requests. Please wait a moment.',
    retryAfter: 600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
