import { describe, it, expect, beforeAll, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  isTokenExpired,
  extractTokenFromHeader,
  decodeToken,
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../src/utils/jwt.util';

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.ACCESS_TOKEN_TTL = '15m';
  process.env.REFRESH_TOKEN_TTL = '7d';
});

describe('JWT Utility', () => {
  describe('Environment Variables', () => {
    it('should throw error when JWT_ACCESS_SECRET is not set', () => {
      const originalSecret = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;

      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      expect(() => generateAccessToken(payload)).toThrow(
        'JWT_ACCESS_SECRET is not defined in environment variables',
      );

      process.env.JWT_ACCESS_SECRET = originalSecret;
    });

    it('should throw error when JWT_REFRESH_SECRET is not set', () => {
      const originalSecret = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      const payload: RefreshTokenPayload = {
        userId: '123',
        deviceId: 'device-123',
        sessionId: 'session-123',
      };

      expect(() => generateRefreshToken(payload)).toThrow(
        'JWT_REFRESH_SECRET is not defined in environment variables',
      );

      process.env.JWT_REFRESH_SECRET = originalSecret;
    });

    it('should throw error when verifying access token without secret', () => {
      const originalSecret = process.env.JWT_ACCESS_SECRET;
      const token = 'dummy-token';
      delete process.env.JWT_ACCESS_SECRET;

      expect(() => verifyAccessToken(token)).toThrow(
        'JWT_ACCESS_SECRET is not defined in environment variables',
      );

      process.env.JWT_ACCESS_SECRET = originalSecret;
    });

    it('should throw error when verifying refresh token without secret', () => {
      const originalSecret = process.env.JWT_REFRESH_SECRET;
      const token = 'dummy-token';
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => verifyRefreshToken(token)).toThrow(
        'JWT_REFRESH_SECRET is not defined in environment variables',
      );

      process.env.JWT_REFRESH_SECRET = originalSecret;
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload data in token', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);
      const decoded = decodeToken(token) as AccessTokenPayload;

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('USER');
      expect(decoded.deviceId).toBe('device-123');
    });

    it('should include standard JWT claims', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);
      const decoded = decodeToken(token) as jwt.JwtPayload;

      expect(decoded).toBeDefined();
      expect(decoded.iss).toBe('cjsavings');
      expect(decoded.aud).toBe('cjsavings-api');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should use default TTL when ACCESS_TOKEN_TTL is not set', () => {
      const originalTTL = process.env.ACCESS_TOKEN_TTL;
      delete process.env.ACCESS_TOKEN_TTL;

      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);
      const decoded = decodeToken(token) as jwt.JwtPayload;

      expect(decoded).toBeDefined();
      expect(decoded.exp).toBeDefined();

      process.env.ACCESS_TOKEN_TTL = originalTTL;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: '123',
        deviceId: 'device-123',
        sessionId: 'session-123',
      };

      const token = generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload data in token', () => {
      const payload: RefreshTokenPayload = {
        userId: '123',
        deviceId: 'device-123',
        sessionId: 'session-123',
      };

      const token = generateRefreshToken(payload);
      const decoded = decodeToken(token) as RefreshTokenPayload;

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('123');
      expect(decoded.deviceId).toBe('device-123');
      expect(decoded.sessionId).toBe('session-123');
    });

    it('should use default TTL when REFRESH_TOKEN_TTL is not set', () => {
      const originalTTL = process.env.REFRESH_TOKEN_TTL;
      delete process.env.REFRESH_TOKEN_TTL;

      const payload: RefreshTokenPayload = {
        userId: '123',
        deviceId: 'device-123',
        sessionId: 'session-123',
      };

      const token = generateRefreshToken(payload);
      const decoded = decodeToken(token) as jwt.JwtPayload;

      expect(decoded).toBeDefined();
      expect(decoded.exp).toBeDefined();

      process.env.REFRESH_TOKEN_TTL = originalTTL;
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);

      expect(verified.userId).toBe('123');
      expect(verified.email).toBe('test@example.com');
      expect(verified.role).toBe('USER');
      expect(verified.deviceId).toBe('device-123');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid access token');
    });

    it('should throw error for token with wrong secret', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      // Generate with different secret
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });

      expect(() => verifyAccessToken(token)).toThrow('Invalid access token');
    });

    it('should throw error for expired access token', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };
      const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: '-1s',
        issuer: 'cjsavings',
        audience: 'cjsavings-api',
      });

      expect(() => verifyAccessToken(token)).toThrow('Access token has expired');
    });

    it('should re-throw unexpected errors', () => {
      const originalVerify = jwt.verify;
      jwt.verify = vi.fn(() => {
        throw new Error('Unexpected error');
      });

      expect(() => verifyAccessToken('dummy-token')).toThrow('Unexpected error');

      jwt.verify = originalVerify;
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: '123',
        deviceId: 'device-123',
        sessionId: 'session-123',
      };

      const token = generateRefreshToken(payload);
      const verified = verifyRefreshToken(token);

      expect(verified.userId).toBe('123');
      expect(verified.deviceId).toBe('device-123');
      expect(verified.sessionId).toBe('session-123');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyRefreshToken(invalidToken)).toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: '123',
        deviceId: 'device-123',
        sessionId: 'session-123',
      };
      const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '-1s',
        issuer: 'cjsavings',
        audience: 'cjsavings-api',
      });

      expect(() => verifyRefreshToken(token)).toThrow('Refresh token has expired');
    });

    it('should re-throw unexpected errors', () => {
      const originalVerify = jwt.verify;
      jwt.verify = vi.fn(() => {
        throw new Error('Unexpected refresh error');
      });

      expect(() => verifyRefreshToken('dummy-token')).toThrow('Unexpected refresh error');

      jwt.verify = originalVerify;
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);
      const expired = isTokenExpired(token);

      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      const payload = { userId: '123' };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '-1s' });

      const expired = isTokenExpired(token);

      expect(expired).toBe(true);
    });

    it('should return true for malformed token', () => {
      const expired = isTokenExpired('invalid-token');

      expect(expired).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const payload = { userId: '123' };
      const token = jwt.sign(payload, 'test-secret');

      const expired = isTokenExpired(token);

      expect(expired).toBe(true);
    });

    it('should handle decoding errors gracefully', () => {
      const originalDecode = jwt.decode;
      jwt.decode = vi.fn(() => {
        throw new Error('Decode error');
      });

      const expired = isTokenExpired('dummy-token');

      expect(expired).toBe(true);

      jwt.decode = originalDecode;
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'sample-jwt-token';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('should return null for invalid format', () => {
      const extracted = extractTokenFromHeader('InvalidFormat token');

      expect(extracted).toBeNull();
    });

    it('should return null for missing token', () => {
      const extracted = extractTokenFromHeader('Bearer');

      expect(extracted).toBeNull();
    });

    it('should return null for empty token part', () => {
      const extracted = extractTokenFromHeader('Bearer ');

      expect(extracted).toBeNull();
    });

    it('should return null for token without Bearer', () => {
      const extracted = extractTokenFromHeader('sample-jwt-token');

      expect(extracted).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect((decoded as AccessTokenPayload).userId).toBe('123');
      expect((decoded as AccessTokenPayload).email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');

      expect(decoded).toBeNull();
    });

    it('should handle decode errors gracefully', () => {
      const originalDecode = jwt.decode;
      jwt.decode = vi.fn(() => {
        throw new Error('Decode error');
      });

      const decoded = decodeToken('dummy-token');

      expect(decoded).toBeNull();

      jwt.decode = originalDecode;
    });
  });

  describe('Token Differences', () => {
    it('access and refresh tokens should be different', () => {
      const accessPayload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const refreshPayload: RefreshTokenPayload = {
        userId: '123',
        deviceId: 'device-123',
        sessionId: 'session-123',
      };

      const accessToken = generateAccessToken(accessPayload);
      const refreshToken = generateRefreshToken(refreshPayload);

      expect(accessToken).not.toBe(refreshToken);
    });

    it('should not verify access token with refresh secret', () => {
      const payload: AccessTokenPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const token = generateAccessToken(payload);

      expect(() => verifyRefreshToken(token)).toThrow();
    });
  });
});
