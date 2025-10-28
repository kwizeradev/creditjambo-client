import { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { errorHandler, notFoundHandler, requestLogger } from '@/middlewares';
import { sanitizeInput, preventNoSQLInjection } from '@/middlewares';
import { generalLimiter, corsOptions, helmetConfig } from './security';

export function configureMiddleware(app: Application): void {
  configureSecurity(app);
  configureLogging(app);
  configureBodyParsing(app);
  configureSanitization(app);
  configureProxy(app);
  configureRateLimiting(app);
}

export function configureErrorHandling(app: Application): void {
  app.use(notFoundHandler);
  app.use(errorHandler);
}

function configureSecurity(app: Application): void {
  app.use(helmet(helmetConfig));
  app.use(cors(corsOptions));
}

function configureLogging(app: Application): void {
  if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
  }
}

function configureBodyParsing(app: Application): void {
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
}

function configureSanitization(app: Application): void {
  app.use(sanitizeInput);
  app.use(preventNoSQLInjection);
}

function configureProxy(app: Application): void {
  app.set('trust proxy', 1);
}

function configureRateLimiting(app: Application): void {
  app.use('/api/', generalLimiter);
}
