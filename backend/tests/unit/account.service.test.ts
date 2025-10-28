import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../../src/config/database';
import accountService from '../../src/services/account.service';

describe('Account Service', () => {
  let testUserId: string;
  let testAccountId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        salt: 'salt',
        role: 'USER',
      },
    });

    testUserId = user.id;

    const account = await prisma.account.create({
      data: {
        userId: testUserId,
        balance: 1000,
      },
    });
    testAccountId = account.id;
  });

  afterEach(async () => {
    await prisma.transaction.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('getAccountBalance', () => {
    it('should return account balance', async () => {
      const result = await accountService.getAccountBalance(testUserId);

      expect(result).toHaveProperty('balance');
      expect(result.balance).toBe('1000');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should throw error for non-existent account', async () => {
      await expect(accountService.getAccountBalance('non-existent-id')).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('getTransactionHistory', () => {
    beforeEach(async () => {
      await prisma.transaction.createMany({
        data: [
          {
            accountId: testAccountId,
            type: 'DEPOSIT',
            amount: 500,
            description: 'Deposit 1',
            createdAt: new Date('2024-10-20'),
          },
          {
            accountId: testAccountId,
            type: 'DEPOSIT',
            amount: 200,
            description: 'Deposit 2',
            createdAt: new Date('2024-10-22'),
          },
          {
            accountId: testAccountId,
            type: 'WITHDRAW',
            amount: 150,
            description: 'Withdraw 1',
            createdAt: new Date('2024-10-24'),
          },
          {
            accountId: testAccountId,
            type: 'WITHDRAW',
            amount: 100,
            description: 'Withdraw 2',
            createdAt: new Date('2024-10-26'),
          },
        ],
      });
    });

    it('should return paginated transactions', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
      });

      expect(result.transactions).toHaveLength(4);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should paginate correctly', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 2,
        page: 1,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should filter by transaction type (DEPOSIT)', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
        type: 'DEPOSIT',
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions.every((t) => t.type === 'DEPOSIT')).toBe(true);
    });

    it('should filter by transaction type (WITHDRAW)', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
        type: 'WITHDRAW',
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions.every((t) => t.type === 'WITHDRAW')).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
        startDate: '2024-10-22T00:00:00Z',
        endDate: '2024-10-25T00:00:00Z',
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should order transactions by createdAt DESC', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
      });

      const dates = result.transactions.map((t) => new Date(t.createdAt).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sortedDates);
    });

    it('should return empty array for user with no transactions', async () => {
      const newUser = await prisma.user.create({
        data: {
          name: 'New User',
          email: 'new@example.com',
          passwordHash: 'hash',
          salt: 'salt',
          role: 'USER',
        },
      });

      await prisma.account.create({
        data: {
          userId: newUser.id,
          balance: 0,
        },
      });

      const result = await accountService.getTransactionHistory(newUser.id, {
        limit: 20,
        page: 1,
      });

      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw error for non-existent account', async () => {
      await expect(
        accountService.getTransactionHistory('non-existent-id', {
          limit: 20,
          page: 1,
        }),
      ).rejects.toThrow('Account not found');
    });

    it('should handle string limit and page parameters', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: '3' as any,
        page: '2' as any,
      });

      expect(result.pagination.limit).toBe(3);
      expect(result.pagination.page).toBe(2);
      expect(result.transactions).toHaveLength(1); // 4 total, skip 3, take 3 -> 1 result
    });

    it('should filter by startDate only', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
        startDate: '2024-10-23T00:00:00Z',
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by endDate only', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
        endDate: '2024-10-23T00:00:00Z',
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });
});
