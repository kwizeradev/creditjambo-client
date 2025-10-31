import express, { Application } from 'express';
import { Server } from 'http';
import dotenv from 'dotenv';
import { cleanupExpiredSessions } from '@/utils/database.util';

import { configureMiddleware, configureErrorHandling } from './config/middleware';
import { configureRoutes } from './config/routes';
import { logServerStart } from './utils/server.util';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

configureMiddleware(app);
configureRoutes(app);
configureErrorHandling(app);

const server = app.listen(PORT, () => {
  logServerStart(PORT);
});

setupGracefulShutdown(server);


function setupGracefulShutdown(server: Server): void {
  const shutdown = (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server`);
    server.close(() => {
      console.log('HTTP server closed');
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
