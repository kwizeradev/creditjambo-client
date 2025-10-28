import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { checkDatabaseConnection } from '@/utils/database.util';
import { errorHandler, notFoundHandler, requestLogger } from '@/middlewares';
import { sanitizeInput, preventNoSQLInjection } from './middlewares/sanitize.middleware';
import { generalLimiter, authLimiter, corsOptions, helmetConfig } from './config/security';

// Routes
import authRoutes from '@/routes/auth.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(helmet(helmetConfig));
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(sanitizeInput);
app.use(preventNoSQLInjection);

app.set('trust proxy', 1);

app.use('/api/', generalLimiter);

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

app.use('/api/auth', authLimiter, authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log('Credit Jambo Savings API Server');
  console.log('=================================');
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Security: Enabled`);
  console.log('=================================');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
