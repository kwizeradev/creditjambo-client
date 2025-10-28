import { Application, Request, Response } from 'express';
import { checkDatabaseConnection } from '@/utils/database.util';
import { authLimiter } from './security';
import authRoutes from '@/routes/auth.routes';

export function configureRoutes(app: Application): void {
  configureRootRoute(app);
  configureHealthRoute(app);
  configureApiRoutes(app);
}

function configureRootRoute(app: Application): void {
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Credit Jambo Savings API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
      },
    });
  });
}

function configureHealthRoute(app: Application): void {
  app.get('/api/health', async (_req: Request, res: Response) => {
    const dbConnected = await checkDatabaseConnection();

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? 'success' : 'error',
      message: 'CJ-Savings API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected',
    });
  });
}

function configureApiRoutes(app: Application): void {
  app.use('/api/auth', authLimiter, authRoutes);
}
