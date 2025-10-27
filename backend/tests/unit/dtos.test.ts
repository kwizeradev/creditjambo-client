import { describe, it, expect } from 'vitest';
import { RegisterUserSchema, LoginUserSchema, toUserResponse } from '../../src/dtos/user.dto';
import {
  DepositSchema,
  WithdrawSchema,
  toTransactionResponse,
  toTransactionWithAccountResponse,
  TransactionQuerySchema,
} from '../../src/dtos/transaction.dto';
import type { Role, TransactionType } from '../../src/generated/prisma';
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
});
