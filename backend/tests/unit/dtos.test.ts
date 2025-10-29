import { describe, it, expect } from 'vitest';
import { RegisterUserSchema, LoginUserSchema, toUserResponse } from '../../src/dtos/user.dto';
import {
  DepositSchema,
  WithdrawSchema,
  toTransactionResponse,
  toTransactionWithAccountResponse,
  TransactionQuerySchema,
} from '../../src/dtos/transaction.dto';
import {
  AccountResponseSchema,
  toAccountResponse,
  toDecimal,
  formatCurrency,
} from '../../src/dtos/account.dto';
import { PaginationQuerySchema, successResponse, errorResponse } from '../../src/dtos/common.dto';
import {
  DeviceResponseSchema,
  DeviceVerificationSchema,
  toDeviceResponse,
  toDeviceWithUserResponse,
} from '../../src/dtos/device.dto';
import type { Role, TransactionType, Account, Device, User } from '../../src/generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

describe('DTO Validation', () => {
  describe('User DTOs', () => {
    describe('RegisterUserSchema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
          deviceId: 'device-123',
          deviceInfo: 'iPhone 14',
        };

        const result = RegisterUserSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject short name', () => {
        const invalidData = {
          name: 'J',
          email: 'john@example.com',
          password: 'Password123',
        };

        const result = RegisterUserSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 2 characters');
        }
      });

      it('should reject invalid email', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'invalid-email',
          password: 'Password123',
        };

        const result = RegisterUserSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject password without number', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'PasswordOnly',
        };

        const result = RegisterUserSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('number');
        }
      });

      it('should reject password without uppercase', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        };

        const result = RegisterUserSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('uppercase');
        }
      });

      it('should trim and lowercase email', () => {
        const data = {
          name: 'John Doe',
          email: '  JOHN@EXAMPLE.COM  ',
          password: 'Password123',
        };

        const result = RegisterUserSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('john@example.com');
        }
      });
    });

    describe('LoginUserSchema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'john@example.com',
          password: 'Password123',
          deviceId: 'device-123',
        };

        const result = LoginUserSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject missing deviceId', () => {
        const invalidData = {
          email: 'john@example.com',
          password: 'Password123',
        };

        const result = LoginUserSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('toUserResponse', () => {
      it('should exclude sensitive fields', () => {
        const dbUser = {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          passwordHash: 'hashed-password',
          salt: 'random-salt',
          role: 'USER' as Role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const userResponse = toUserResponse(dbUser);

        expect(userResponse).not.toHaveProperty('passwordHash');
        expect(userResponse).not.toHaveProperty('salt');
        expect(userResponse).not.toHaveProperty('updatedAt');
        expect(userResponse).toHaveProperty('id');
        expect(userResponse).toHaveProperty('name');
        expect(userResponse).toHaveProperty('email');
        expect(userResponse).toHaveProperty('role');
        expect(userResponse).toHaveProperty('createdAt');
      });
    });
  });

  describe('Transaction DTOs', () => {
    describe('DepositSchema', () => {
      it('should validate correct deposit data', () => {
        const validData = {
          amount: 100.5,
          description: 'Salary deposit',
        };

        const result = DepositSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative amount', () => {
        const invalidData = {
          amount: -50,
          description: 'Invalid',
        };

        const result = DepositSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject zero amount', () => {
        const invalidData = {
          amount: 0,
          description: 'Invalid',
        };

        const result = DepositSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject amount exceeding limit', () => {
        const invalidData = {
          amount: 2000000,
          description: 'Too much',
        };

        const result = DepositSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject more than 2 decimal places', () => {
        const invalidData = {
          amount: 100.123,
          description: 'Too precise',
        };

        const result = DepositSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should accept without description', () => {
        const validData = {
          amount: 100.5,
        };

        const result = DepositSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('WithdrawSchema', () => {
      it('should validate correct withdraw data', () => {
        const validData = {
          amount: 50.25,
          description: 'ATM withdrawal',
        };

        const result = WithdrawSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should have same validation rules as deposit', () => {
        expect(WithdrawSchema.shape.amount).toBeDefined();
        expect(WithdrawSchema.shape.description).toBeDefined();
      });
    });

    describe('TransactionQuerySchema', () => {
      it('should validate with default values', () => {
        const result = TransactionQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
          expect(result.data.page).toBe(1);
        }
      });

      it('should transform string values to numbers', () => {
        const validData = {
          limit: '50',
          page: '2',
          type: 'DEPOSIT',
        };

        const result = TransactionQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(result.data.page).toBe(2);
          expect(result.data.type).toBe('DEPOSIT');
        }
      });

      it('should reject invalid limit values', () => {
        const invalidData = { limit: '200' };
        const result = TransactionQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid page values', () => {
        const invalidData = { page: '0' };
        const result = TransactionQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should validate optional date fields', () => {
        const validData = {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
        };

        const result = TransactionQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('toTransactionResponse', () => {
      it('should convert transaction to response DTO', () => {
        const dbTransaction = {
          id: '123',
          accountId: 'acc-123',
          type: 'DEPOSIT' as TransactionType,
          amount: new Decimal('100.50'),
          description: 'Test deposit',
          createdAt: new Date(),
        };

        const response = toTransactionResponse(dbTransaction);

        expect(response.id).toBe('123');
        expect(response.accountId).toBe('acc-123');
        expect(response.type).toBe('DEPOSIT');
        expect(response.amount).toBe('100.5');
        expect(response.description).toBe('Test deposit');
        expect(response.createdAt).toBeInstanceOf(Date);
      });
    });

    describe('toTransactionWithAccountResponse', () => {
      it('should convert transaction with account to response DTO', () => {
        const dbTransaction = {
          id: '123',
          accountId: 'acc-123',
          type: 'DEPOSIT' as TransactionType,
          amount: new Decimal('100.50'),
          description: 'Test deposit',
          createdAt: new Date(),
          account: {
            id: 'acc-123',
            userId: 'user-123',
            balance: new Decimal('1000.00'),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };

        const response = toTransactionWithAccountResponse(dbTransaction);

        expect(response.id).toBe('123');
        expect(response.accountId).toBe('acc-123');
        expect(response.type).toBe('DEPOSIT');
        expect(response.amount).toBe('100.5');
        expect(response.description).toBe('Test deposit');
        expect(response.createdAt).toBeInstanceOf(Date);
        expect(response.account).toEqual({
          id: 'acc-123',
          userId: 'user-123',
        });
      });

      it('should handle transaction without account', () => {
        const dbTransaction = {
          id: '123',
          accountId: 'acc-123',
          type: 'DEPOSIT' as TransactionType,
          amount: new Decimal('100.50'),
          description: 'Test deposit',
          createdAt: new Date(),
        };

        const response = toTransactionWithAccountResponse(dbTransaction);

        expect(response.account).toBeUndefined();
      });
    });
  });

  describe('Account DTOs', () => {
    describe('AccountResponseSchema', () => {
      it('should validate correct account response data', () => {
        const validData = {
          id: 'acc-123',
          userId: 'user-123',
          balance: '1000.50',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = AccountResponseSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('toAccountResponse', () => {
      it('should convert account to response DTO', () => {
        const dbAccount: Account = {
          id: 'acc-123',
          userId: 'user-123',
          balance: new Decimal('1000.50'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const response = toAccountResponse(dbAccount);

        expect(response.id).toBe('acc-123');
        expect(response.userId).toBe('user-123');
        expect(response.balance).toBe('1000.5');
        expect(response.createdAt).toBeInstanceOf(Date);
        expect(response.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('toDecimal', () => {
      it('should convert string to Decimal', () => {
        const result = toDecimal('100.50');
        expect(result).toBeInstanceOf(Decimal);
        expect(result.toString()).toBe('100.5');
      });

      it('should convert number to Decimal', () => {
        const result = toDecimal(100.5);
        expect(result).toBeInstanceOf(Decimal);
        expect(result.toString()).toBe('100.5');
      });
    });

    describe('formatCurrency', () => {
      it('should format string amount as RWF currency', () => {
        const result = formatCurrency('1000.50');
        expect(result).toContain('RF');
        expect(result).toContain('1,001');
      });

      it('should format Decimal amount as RWF currency', () => {
        const decimal = new Decimal('1000.50');
        const result = formatCurrency(decimal);
        expect(result).toContain('RF');
        expect(result).toContain('1,001');
      });
    });
  });

  describe('Common DTOs', () => {
    describe('PaginationQuerySchema', () => {
      it('should validate with default values', () => {
        const result = PaginationQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it('should transform string values to numbers', () => {
        const validData = {
          page: '5',
          limit: '50',
        };

        const result = PaginationQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(5);
          expect(result.data.limit).toBe(50);
        }
      });

      it('should reject invalid page values', () => {
        const invalidData = { page: '0' };
        const result = PaginationQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject limit exceeding maximum', () => {
        const invalidData = { limit: '200' };
        const result = PaginationQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('successResponse', () => {
      it('should create success response with data', () => {
        const data = { id: '123', name: 'Test' };
        const result = successResponse(data);

        expect(result.status).toBe('success');
        expect(result.data).toEqual(data);
        expect(result.message).toBeUndefined();
      });

      it('should create success response with data and message', () => {
        const data = { id: '123', name: 'Test' };
        const message = 'Operation successful';
        const result = successResponse(data, message);

        expect(result.status).toBe('success');
        expect(result.data).toEqual(data);
        expect(result.message).toBe(message);
      });
    });

    describe('errorResponse', () => {
      it('should create error response with message', () => {
        const message = 'Something went wrong';
        const result = errorResponse(message);

        expect(result.status).toBe('error');
        expect(result.message).toBe(message);
        expect(result.errors).toBeUndefined();
      });

      it('should create error response with message and errors', () => {
        const message = 'Validation failed';
        const errors = [{ field: 'email', message: 'Invalid email' }];
        const result = errorResponse(message, errors);

        expect(result.status).toBe('error');
        expect(result.message).toBe(message);
        expect(result.errors).toEqual(errors);
      });
    });
  });

  describe('Device DTOs', () => {
    describe('DeviceResponseSchema', () => {
      it('should validate correct device response data', () => {
        const validData = {
          id: 'dev-123',
          userId: 'user-123',
          deviceId: 'device-456',
          deviceInfo: 'iPhone 14',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = DeviceResponseSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow null deviceInfo', () => {
        const validData = {
          id: 'dev-123',
          userId: 'user-123',
          deviceId: 'device-456',
          deviceInfo: null,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = DeviceResponseSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('DeviceVerificationSchema', () => {
      it('should validate correct verification data', () => {
        const validData = {
          deviceId: 'device-123',
          verified: true,
        };

        const result = DeviceVerificationSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty deviceId', () => {
        const invalidData = {
          deviceId: '',
          verified: true,
        };

        const result = DeviceVerificationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('toDeviceResponse', () => {
      it('should convert device to response DTO', () => {
        const dbDevice: Device = {
          id: 'dev-123',
          userId: 'user-123',
          deviceId: 'device-456',
          deviceInfo: 'iPhone 14',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const response = toDeviceResponse(dbDevice);

        expect(response.id).toBe('dev-123');
        expect(response.userId).toBe('user-123');
        expect(response.deviceId).toBe('device-456');
        expect(response.deviceInfo).toBe('iPhone 14');
        expect(response.verified).toBe(true);
        expect(response.createdAt).toBeInstanceOf(Date);
        expect(response.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('toDeviceWithUserResponse', () => {
      it('should convert device with user to response DTO', () => {
        const dbUser: User = {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          passwordHash: 'hash',
          salt: 'salt',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const dbDevice: Device & { user?: User } = {
          id: 'dev-123',
          userId: 'user-123',
          deviceId: 'device-456',
          deviceInfo: 'iPhone 14',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: dbUser,
        };

        const response = toDeviceWithUserResponse(dbDevice);

        expect(response.id).toBe('dev-123');
        expect(response.userId).toBe('user-123');
        expect(response.deviceId).toBe('device-456');
        expect(response.deviceInfo).toBe('iPhone 14');
        expect(response.verified).toBe(true);
        expect(response.user).toEqual({
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        });
      });

      it('should handle device without user', () => {
        const dbDevice: Device = {
          id: 'dev-123',
          userId: 'user-123',
          deviceId: 'device-456',
          deviceInfo: 'iPhone 14',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const response = toDeviceWithUserResponse(dbDevice);

        expect(response.id).toBe('dev-123');
        expect(response.user).toBeUndefined();
      });
    });
  });
});
