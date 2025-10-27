import jwt, { SignOptions } from 'jsonwebtoken';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  deviceId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  deviceId: string;
  sessionId: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || '15m',
    issuer: 'cjsavings',
    audience: 'cjsavings-api',
  } as SignOptions);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.REFRESH_TOKEN_TTL || '7d',
    issuer: 'cjsavings',
    audience: 'cjsavings-api',
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'cjsavings',
      audience: 'cjsavings-api',
    }) as AccessTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'cjsavings',
      audience: 'cjsavings-api',
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode a token without verifying : For Debugging
 * WARNING: Do not use for authentication
 *
 * @param token - JWT token
 * @returns Decoded token payload or null
 */
export function decodeToken(token: string): jwt.JwtPayload | string | null {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded || typeof decoded === 'string' || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}
