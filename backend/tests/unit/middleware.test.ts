import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  authenticate,
  requireRole,
  ensureDeviceVerified,
  optionalAuth,
} from '../../src/middlewares/auth.middleware';
import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
} from '../../src/middlewares/validation.middleware';
import { requestLogger, simpleLogger } from '../../src/middlewares/logger.middleware';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
} from '../../src/middlewares/error.middleware';
import { z } from 'zod';
import { Prisma } from '../../src/generated/prisma';

vi.mock('../../src/utils/jwt.util', () => ({
  verifyAccessToken: vi.fn(),
  extractTokenFromHeader: vi.fn(),
}));

vi.mock('../../src/config/database', () => ({
  default: {
    device: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
      query: {},
      params: {},
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('authenticate middleware', () => {
    it('should call next() with valid token', async () => {
      const { verifyAccessToken, extractTokenFromHeader } = await import(
        '../../src/utils/jwt.util'
      );

      vi.mocked(extractTokenFromHeader).mockReturnValue('valid-token');
      vi.mocked(verifyAccessToken).mockReturnValue({
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      });

      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('123');
    });

    it('should return 401 without token', async () => {
      const { extractTokenFromHeader } = await import('../../src/utils/jwt.util');

      vi.mocked(extractTokenFromHeader).mockReturnValue(null);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Authentication required'),
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', async () => {
      const { verifyAccessToken, extractTokenFromHeader } = await import(
        '../../src/utils/jwt.util'
      );

      vi.mocked(extractTokenFromHeader).mockReturnValue('invalid-token');
      vi.mocked(verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 with non-Error exception', async () => {
      const { verifyAccessToken, extractTokenFromHeader } = await import(
        '../../src/utils/jwt.util'
      );

      vi.mocked(extractTokenFromHeader).mockReturnValue('invalid-token');
      vi.mocked(verifyAccessToken).mockImplementation(() => {
        throw 'String error';
      });

      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should call next() for matching role', () => {
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'ADMIN',
        deviceId: 'device-123',
      };

      const middleware = requireRole('ADMIN');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 for non-matching role', () => {
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const middleware = requireRole('ADMIN');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Insufficient permissions'),
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 without user', () => {
      const middleware = requireRole('ADMIN');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept multiple roles', () => {
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      const middleware = requireRole('ADMIN', 'USER');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validate middleware', () => {
    it('should validate and transform valid data', () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.string().transform((val) => parseInt(val, 10)),
      });

      mockRequest.body = {
        name: 'John',
        age: '25',
      };

      const middleware = validate(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.age).toBe(25);
    });

    it('should return 400 for invalid data', () => {
      const schema = z.object({
        name: z.string().min(5),
      });

      mockRequest.body = {
        name: 'Jo',
      };

      const middleware = validate(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Validation failed',
          errors: expect.any(Array),
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate query parameters', () => {
      const schema = z.object({
        page: z.string().transform((val) => parseInt(val, 10)),
      });

      mockRequest.query = {
        page: '2',
      };

      const middleware = validate(schema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query.page).toBe(2);
    });

    it('should validate params', () => {
      const schema = z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
      });

      mockRequest.params = {
        id: '123',
      };

      const middleware = validate(schema, 'params');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.params.id).toBe(123);
    });

    it('should return 500 for non-Zod validation errors', () => {
      const schema = {
        parse: () => {
          throw new Error('Generic error');
        },
      } as unknown as z.ZodSchema;

      mockRequest.body = {
        data: 'test',
      };

      const middleware = validate(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validation helper functions', () => {
    it('should use validateBody correctly', () => {
      const schema = z.object({
        name: z.string(),
      });

      mockRequest.body = {
        name: 'test',
      };

      const middleware = validateBody(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use validateQuery correctly', () => {
      const schema = z.object({
        search: z.string(),
      });

      mockRequest.query = {
        search: 'test',
      };

      const middleware = validateQuery(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use validateParams correctly', () => {
      const schema = z.object({
        id: z.string(),
      });

      mockRequest.params = {
        id: '123',
      };

      const middleware = validateParams(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('ensureDeviceVerified middleware', () => {
    it('should call next() when device is verified', async () => {
      const prisma = await import('../../src/config/database');

      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      vi.mocked(prisma.default.device.findUnique).mockResolvedValue({
        id: 'device-123',
        verified: true,
      });

      await ensureDeviceVerified(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 without user', async () => {
      await ensureDeviceVerified(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Authentication required',
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when device not found', async () => {
      const prisma = await import('../../src/config/database');

      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      vi.mocked(prisma.default.device.findUnique).mockResolvedValue(null);

      await ensureDeviceVerified(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Device not found',
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when device not verified', async () => {
      const prisma = await import('../../src/config/database');

      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      vi.mocked(prisma.default.device.findUnique).mockResolvedValue({
        id: 'device-123',
        verified: false,
      });

      await ensureDeviceVerified(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Device not verified. Please wait for admin approval.',
          devicePending: true,
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const prisma = await import('../../src/config/database');

      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      };

      vi.mocked(prisma.default.device.findUnique).mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await ensureDeviceVerified(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to verify device status',
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should set user when valid token provided', async () => {
      const { verifyAccessToken, extractTokenFromHeader } = await import(
        '../../src/utils/jwt.util'
      );

      vi.mocked(extractTokenFromHeader).mockReturnValue('valid-token');
      vi.mocked(verifyAccessToken).mockReturnValue({
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
        deviceId: 'device-123',
      });

      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
    });

    it('should continue without user when no token provided', async () => {
      const { extractTokenFromHeader } = await import('../../src/utils/jwt.util');

      vi.mocked(extractTokenFromHeader).mockReturnValue(null);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should continue without user when invalid token provided', async () => {
      const { verifyAccessToken, extractTokenFromHeader } = await import(
        '../../src/utils/jwt.util'
      );

      vi.mocked(extractTokenFromHeader).mockReturnValue('invalid-token');
      vi.mocked(verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(404, 'Not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create AppError with custom isOperational', () => {
      const error = new AppError(500, 'Server error', false);

      expect(error.isOperational).toBe(false);
    });
  });

  describe('errorHandler middleware', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should handle AppError correctly', () => {
      const error = new AppError(400, 'Bad request');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Bad request',
      });
    });

    it('should handle Prisma P2002 error', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '4.0.0',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'A record with this value already exists',
      });
    });

    it('should handle Prisma P2025 error', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Record not found',
      });
    });

    it('should handle unknown Prisma error', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '4.0.0',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Unknown error',
      });
    });

    it('should handle JsonWebTokenError', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid token',
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token expired',
      });
    });

    it('should handle generic error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Generic error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Generic error',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Generic error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler middleware', () => {
    it('should return 404 with correct message', () => {
      (mockRequest as any).path = '/api/nonexistent';

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Route GET /api/nonexistent not found',
      });
    });
  });

  describe('asyncHandler middleware', () => {
    it('should call next() when async function succeeds', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next(error) when async function fails', async () => {
      const error = new Error('Async error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('requestLogger middleware', () => {
    let consoleSpy: {
      log: any;
      warn: any;
      error: any;
    };

    beforeEach(() => {
      consoleSpy = {
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      consoleSpy.log.mockRestore();
      consoleSpy.warn.mockRestore();
      consoleSpy.error.mockRestore();
    });

    it('should log successful requests (2xx)', () => {
      const mockEmitter = {
        on: vi.fn(),
      };
      mockResponse.on = mockEmitter.on;
      mockResponse.statusCode = 200;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockEmitter.on).toHaveBeenCalledWith('finish', expect.any(Function));

      const finishCallback = mockEmitter.on.mock.calls[0][1];
      finishCallback();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅',
        expect.objectContaining({
          method: 'GET',
          path: '/test',
          status: 200,
          ip: '127.0.0.1',
          duration: expect.stringMatching(/\d+ms/),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should log client error requests (4xx)', () => {
      mockRequest.method = 'POST';

      const mockEmitter = {
        on: vi.fn(),
      };
      mockResponse.on = mockEmitter.on;
      mockResponse.statusCode = 404;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const finishCallback = mockEmitter.on.mock.calls[0][1];
      finishCallback();

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '⚠️',
        expect.objectContaining({
          method: 'POST',
          path: '/test',
          status: 404,
        }),
      );
    });

    it('should log server error requests (5xx)', () => {
      mockRequest.method = 'PUT';

      const mockEmitter = {
        on: vi.fn(),
      };
      mockResponse.on = mockEmitter.on;
      mockResponse.statusCode = 500;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const finishCallback = mockEmitter.on.mock.calls[0][1];
      finishCallback();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌',
        expect.objectContaining({
          method: 'PUT',
          path: '/test',
          status: 500,
        }),
      );
    });
  });

  describe('simpleLogger middleware', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log request method and path', () => {
      simpleLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('GET /test');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
