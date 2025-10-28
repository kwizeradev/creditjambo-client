import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      console.error('❌', log);
    } else if (res.statusCode >= 400) {
      console.warn('⚠️', log);
    } else {
      console.log('✅', log);
    }
  });

  next();
}

export function simpleLogger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`${req.method} ${req.path}`);
  next();
}
