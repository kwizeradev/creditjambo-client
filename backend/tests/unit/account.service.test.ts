import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../../src/config/database';
import accountService from '../../src/services/account.service';
import { useTestDb } from '../utils/test-db-helper';

describe('Account Service', () => {
  let testUserId: string;
  let testAccountId: string;
  const db = useTestDb();

  beforeEach(async () => {
    const user = await db.createUser({
      name: 'Test User',
      email: `test-account-${Date.now()}-${Math.random()}@example.com`,
    });

    testUserId = user.id;

    const account = await db.createAccount({
      userId: testUserId,
      balance: 1000,
    });
    testAccountId = account.id;
  });

  afterEach(async () => {
    await db.cleanup();
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
      await Promise.all([
        db.createTransaction({
          accountId: testAccountId,
          type: 'DEPOSIT',
          amount: 500,
          description: 'Deposit 1',
          createdAt: new Date('2024-10-20'),
        }),
        db.createTransaction({
          accountId: testAccountId,
          type: 'DEPOSIT',
          amount: 200,
          description: 'Deposit 2',
          createdAt: new Date('2024-10-22'),
        }),
        db.createTransaction({
          accountId: testAccountId,
          type: 'WITHDRAW',
          amount: 150,
          description: 'Withdraw 1',
          createdAt: new Date('2024-10-24'),
        }),
        db.createTransaction({
          accountId: testAccountId,
          type: 'WITHDRAW',
          amount: 100,
          description: 'Withdraw 2',
          createdAt: new Date('2024-10-26'),
        }),
      ]);
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
      expect(result.transactions.every((t: { type: string }) => t.type === 'DEPOSIT')).toBe(true);
    });

    it('should filter by transaction type (WITHDRAW)', async () => {
      const result = await accountService.getTransactionHistory(testUserId, {
        limit: 20,
        page: 1,
        type: 'WITHDRAW',
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions.every((t: { type: string }) => t.type === 'WITHDRAW')).toBe(true);
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

      const dates = result.transactions.map((t: { createdAt: Date }) =>
        new Date(t.createdAt).getTime(),
      );
      const sortedDates = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sortedDates);
    });

    it('should return empty array for user with no transactions', async () => {
      const newUser = await db.createUser({
        name: 'New User',
        email: 'new@example.com',
      });

      await db.createAccount({
        userId: newUser.id,
        balance: 0,
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
      expect(result.transactions).toHaveLength(1);
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

  describe('deposit', () => {
    it('should deposit money successfully', async () => {
      const result = await accountService.deposit(testUserId, {
        amount: 500,
        description: 'Test deposit',
      });

      expect(result.transaction.type).toBe('DEPOSIT');
      expect(result.transaction.amount).toBe('500');
      expect(result.transaction.description).toBe('Test deposit');
      expect(result.balance).toBe('1500');
    });

    it('should use default description if not provided', async () => {
      const result = await accountService.deposit(testUserId, {
        amount: 250,
      });

      expect(result.transaction.description).toBe('Deposit');
      expect(result.balance).toBe('1250');
    });

    it('should handle decimal amounts correctly', async () => {
      const result = await accountService.deposit(testUserId, {
        amount: 123.45,
        description: 'Decimal deposit',
      });

      expect(result.transaction.amount).toBe('123.45');
      expect(result.balance).toBe('1123.45');
    });

    it('should create transaction record', async () => {
      await accountService.deposit(testUserId, {
        amount: 500,
        description: 'Test deposit',
      });

      const transactions = await prisma.transaction.findMany({
        where: { accountId: testAccountId },
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('DEPOSIT');
      expect(transactions[0].amount.toString()).toBe('500');
    });

    it('should update account balance atomically', async () => {
      await accountService.deposit(testUserId, {
        amount: 300,
      });

      const updatedBalance = await prisma.account.findUnique({
        where: { id: testAccountId },
        select: { balance: true },
      });

      expect(updatedBalance?.balance.toString()).toBe('1300');
    });

    it('should accumulate multiple deposits', async () => {
      await accountService.deposit(testUserId, { amount: 100 });
      await accountService.deposit(testUserId, { amount: 200 });
      await accountService.deposit(testUserId, { amount: 300 });

      const result = await accountService.getAccountBalance(testUserId);
      expect(result.balance).toBe('1600');
    });

    it('should throw error for non-existent account', async () => {
      await expect(accountService.deposit('non-existent-id', { amount: 100 })).rejects.toThrow(
        'Account not found',
      );
    });

    it('should maintain data consistency on transaction failure', async () => {
      const initialBalance = await prisma.account.findUnique({
        where: { id: testAccountId },
      });

      try {
        await accountService.deposit(testUserId, { amount: 100 });
      } catch {
        const currentBalance = await prisma.account.findUnique({
          where: { id: testAccountId },
        });
        expect(currentBalance?.balance).toEqual(initialBalance?.balance);
      }
    });
  });

  describe('withdraw', () => {
    it('should withdraw money successfully', async () => {
      const result = await accountService.withdraw(testUserId, {
        amount: 300,
        description: 'Test withdrawal',
      });

      expect(result.transaction.type).toBe('WITHDRAW');
      expect(result.transaction.amount).toBe('300');
      expect(result.transaction.description).toBe('Test withdrawal');
      expect(result.balance).toBe('700');
    });

    it('should use default description if not provided', async () => {
      const result = await accountService.withdraw(testUserId, {
        amount: 200,
      });

      expect(result.transaction.description).toBe('Withdrawal');
      expect(result.balance).toBe('800');
    });

    it('should handle decimal amounts correctly', async () => {
      const result = await accountService.withdraw(testUserId, {
        amount: 123.45,
        description: 'Decimal withdrawal',
      });

      expect(result.transaction.amount).toBe('123.45');
      expect(result.balance).toBe('876.55');
    });

    it('should throw error for insufficient funds', async () => {
      await expect(accountService.withdraw(testUserId, { amount: 2000 })).rejects.toThrow(
        'Insufficient funds',
      );
    });

    it('should allow withdrawal of exact balance', async () => {
      const result = await accountService.withdraw(testUserId, {
        amount: 1000,
        description: 'Withdraw all',
      });

      expect(result.balance).toBe('0');
    });

    it('should throw error when withdrawing from zero balance', async () => {
      await accountService.withdraw(testUserId, { amount: 1000 });

      await expect(accountService.withdraw(testUserId, { amount: 1 })).rejects.toThrow(
        'Insufficient funds',
      );
    });

    it('should create transaction record', async () => {
      await accountService.withdraw(testUserId, {
        amount: 250,
        description: 'Test withdrawal',
      });

      const transactions = await prisma.transaction.findMany({
        where: { accountId: testAccountId, type: 'WITHDRAW' },
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount.toString()).toBe('250');
    });

    it('should update account balance atomically', async () => {
      await accountService.withdraw(testUserId, { amount: 400 });

      const updatedBalance = await prisma.account.findUnique({
        where: { id: testAccountId },
        select: { balance: true },
      });

      expect(updatedBalance?.balance.toString()).toBe('600');
    });

    it('should process multiple withdrawals correctly', async () => {
      await accountService.withdraw(testUserId, { amount: 100 });
      await accountService.withdraw(testUserId, { amount: 200 });
      await accountService.withdraw(testUserId, { amount: 150 });

      const result = await accountService.getAccountBalance(testUserId);
      expect(result.balance).toBe('550');
    });

    it('should throw error for non-existent account', async () => {
      await expect(accountService.withdraw('non-existent-id', { amount: 100 })).rejects.toThrow(
        'Account not found',
      );
    });

    it('should maintain balance after mixed operations', async () => {
      await accountService.deposit(testUserId, { amount: 500 });
      await accountService.withdraw(testUserId, { amount: 300 });
      await accountService.deposit(testUserId, { amount: 200 });
      await accountService.withdraw(testUserId, { amount: 600 });

      const result = await accountService.getAccountBalance(testUserId);
      expect(result.balance).toBe('800');
    });

    it('should provide accurate balance in error message', async () => {
      try {
        await accountService.withdraw(testUserId, { amount: 1500 });
      } catch (error: any) {
        expect(error.message).toContain('Available balance: RF 1,000');
      }
    });
  });
});
