import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, AccessTokenPayload } from '@/utils/jwt.util';
import prisma from '@/config/database';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AccessTokenPayload;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please provide a valid token.',
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (error: unknown) {
    res.status(401).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Invalid or expired token',
    });
  }
}

export async function ensureDeviceVerified(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const device = await prisma.device.findUnique({
      where: { deviceId: req.user.deviceId },
      select: { verified: true, id: true },
    });

    if (!device) {
      res.status(403).json({
        status: 'error',
        message: 'Device not found',
      });
      return;
    }

    if (!device.verified) {
      res.status(403).json({
        status: 'error',
        message: 'Device not verified. Please wait for admin approval.',
        devicePending: true,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Device verification check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify device status',
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions. Admin access required.',
      });
      return;
    }

    next();
  };
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch {
    next();
  }
}
