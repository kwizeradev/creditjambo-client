import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../../src/config/database';
import adminService from '../../src/services/admin.service';
import { AppError } from '../../src/middlewares/error.middleware';
import { useTestDb } from '../utils/test-db-helper';

describe('Admin Service', () => {
  let testUserId: string;
  let testAccountId: string;
  let testDeviceId: string;
  const db = useTestDb();
  const createdDeviceIds: string[] = [];
  const createdSessionIds: string[] = [];

  beforeEach(async () => {
    await db.createUser({
      name: 'Admin User',
      email: `admin-${Date.now()}-${Math.random()}@example.com`,
      role: 'ADMIN',
    });

    const user = await db.createUser({
      name: 'Test User',
      email: `test-${Date.now()}-${Math.random()}@example.com`,
    });
    testUserId = user.id;

    const account = await db.createAccount({
      userId: testUserId,
      balance: 1000,
    });
    testAccountId = account.id;

    const device = await prisma.device.create({
      data: {
        deviceId: `device-${Date.now()}-${Math.random()}`,
        deviceInfo: 'Test Device Info',
        verified: false,
        userId: testUserId,
      },
    });
    testDeviceId = device.id;
    createdDeviceIds.push(device.id);
  });

  afterEach(async () => {
    // Clean up sessions created in tests
    if (createdSessionIds.length > 0) {
      await prisma.session.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
      createdSessionIds.length = 0;
    }

    // Clean up devices created in tests
    if (createdDeviceIds.length > 0) {
      await prisma.device.deleteMany({
        where: { id: { in: createdDeviceIds } },
      });
      createdDeviceIds.length = 0;
    }

    await db.cleanup();
  });

  describe('getAllDevices', () => {
    beforeEach(async () => {
      const verifiedDevice = await prisma.device.create({
        data: {
          deviceId: `verified-device-${Date.now()}`,
          deviceInfo: 'Verified Device',
          verified: true,
          userId: testUserId,
        },
      });
      createdDeviceIds.push(verifiedDevice.id);

      const unverifiedDevice = await prisma.device.create({
        data: {
          deviceId: `unverified-device-${Date.now()}`,
          deviceInfo: 'Unverified Device',
          verified: false,
          userId: testUserId,
        },
      });
      createdDeviceIds.push(unverifiedDevice.id);
    });

    it('should return all devices when filter is "all"', async () => {
      const result = await adminService.getAllDevices('all');

      expect(result.devices.length).toBeGreaterThanOrEqual(3);
      expect(result.total).toEqual(result.devices.length);
      expect(result.devices[0]).toHaveProperty('id');
      expect(result.devices[0]).toHaveProperty('deviceId');
      expect(result.devices[0]).toHaveProperty('deviceInfo');
      expect(result.devices[0]).toHaveProperty('verified');
      expect(result.devices[0]).toHaveProperty('user');
    });

    it('should return only verified devices when filter is "verified"', async () => {
      const result = await adminService.getAllDevices('verified');

      expect(
        result.devices.every((device: { verified: boolean }) => device.verified === true),
      ).toBe(true);
      expect(result.total).toEqual(result.devices.length);
    });

    it('should return only unverified devices when filter is "unverified"', async () => {
      const result = await adminService.getAllDevices('unverified');

      expect(
        result.devices.every((device: { verified: boolean }) => device.verified === false),
      ).toBe(true);
      expect(result.total).toEqual(result.devices.length);
    });

    it('should return all devices when no filter is provided', async () => {
      const result = await adminService.getAllDevices();

      expect(result.devices.length).toBeGreaterThanOrEqual(3);
      expect(result.total).toEqual(result.devices.length);
    });

    it('should include user information in device objects', async () => {
      const result = await adminService.getAllDevices();

      expect(result.devices[0].user).toHaveProperty('id');
      expect(result.devices[0].user).toHaveProperty('name');
      expect(result.devices[0].user).toHaveProperty('email');
      expect(result.devices[0].user).toHaveProperty('role');
    });

    it('should order devices by createdAt desc', async () => {
      const result = await adminService.getAllDevices();

      if (result.devices.length > 1) {
        const dates = result.devices.map((device: { createdAt: string | number | Date }) =>
          new Date(device.createdAt).getTime(),
        );
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      }
    });
  });

  describe('getUnverifiedDevices', () => {
    beforeEach(async () => {
      const verifiedDevice2 = await prisma.device.create({
        data: {
          deviceId: `verified-device-${Date.now()}`,
          deviceInfo: 'Verified Device',
          verified: true,
          userId: testUserId,
        },
      });
      createdDeviceIds.push(verifiedDevice2.id);

      const unverifiedDevice2 = await prisma.device.create({
        data: {
          deviceId: `unverified-device-${Date.now()}`,
          deviceInfo: 'Unverified Device',
          verified: false,
          userId: testUserId,
        },
      });
      createdDeviceIds.push(unverifiedDevice2.id);
    });

    it('should return only unverified devices', async () => {
      const result = await adminService.getUnverifiedDevices();

      expect(
        result.devices.every((device: { verified: boolean }) => device.verified === false),
      ).toBe(true);
      expect(result.total).toEqual(result.devices.length);
    });

    it('should include user information', async () => {
      const result = await adminService.getUnverifiedDevices();

      expect(result.devices[0].user).toHaveProperty('id');
      expect(result.devices[0].user).toHaveProperty('name');
      expect(result.devices[0].user).toHaveProperty('email');
    });

    it('should order devices by createdAt asc', async () => {
      const result = await adminService.getUnverifiedDevices();

      if (result.devices.length > 1) {
        const dates = result.devices.map((device: { createdAt: string | number | Date }) =>
          new Date(device.createdAt).getTime(),
        );
        const sortedDates = [...dates].sort((a, b) => a - b);
        expect(dates).toEqual(sortedDates);
      }
    });
  });

  describe('verifyDevice', () => {
    it('should verify a device successfully', async () => {
      const result = await adminService.verifyDevice(testDeviceId);

      expect(result.message).toBe('Device verified successfully');
      expect(result.device.verified).toBe(true);
      expect(result.device.user).toHaveProperty('id');
      expect(result.device.user).toHaveProperty('name');
      expect(result.device.user).toHaveProperty('email');

      const updatedDevice = await prisma.device.findUnique({
        where: { id: testDeviceId },
      });
      expect(updatedDevice?.verified).toBe(true);
    });

    it('should return appropriate message if device is already verified', async () => {
      await prisma.device.update({
        where: { id: testDeviceId },
        data: { verified: true },
      });

      const result = await adminService.verifyDevice(testDeviceId);

      expect(result.message).toBe('Device is already verified');
      expect(result.device.verified).toBe(true);
    });

    it('should throw error for non-existent device', async () => {
      await expect(adminService.verifyDevice('non-existent-id')).rejects.toThrow(
        new AppError(404, 'Device not found'),
      );
    });
  });

  describe('unverifyDevice', () => {
    beforeEach(async () => {
      await prisma.device.update({
        where: { id: testDeviceId },
        data: { verified: true },
      });

      const session = await prisma.session.create({
        data: {
          deviceId: testDeviceId,
          refreshTokenHash: `refresh-token-hash-${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400000),
          userId: testUserId,
        },
      });
      createdSessionIds.push(session.id);
    });

    it('should unverify a device successfully and invalidate sessions', async () => {
      const result = await adminService.unverifyDevice(testDeviceId);

      expect(result.message).toBe(
        'Device unverified successfully. All sessions have been invalidated.',
      );
      expect(result.device.verified).toBe(false);
      expect(result.device.user).toHaveProperty('id');
      expect(result.device.user).toHaveProperty('name');
      expect(result.device.user).toHaveProperty('email');

      const updatedDevice = await prisma.device.findUnique({
        where: { id: testDeviceId },
      });
      expect(updatedDevice?.verified).toBe(false);

      const sessions = await prisma.session.findMany({
        where: { deviceId: testDeviceId },
      });
      expect(sessions).toHaveLength(0);
    });

    it('should return appropriate message if device is already unverified', async () => {
      await prisma.device.update({
        where: { id: testDeviceId },
        data: { verified: false },
      });

      const result = await adminService.unverifyDevice(testDeviceId);

      expect(result.message).toBe('Device is already unverified');
      expect(result.device.verified).toBe(false);
    });

    it('should throw error for non-existent device', async () => {
      await expect(adminService.unverifyDevice('non-existent-id')).rejects.toThrow(
        new AppError(404, 'Device not found'),
      );
    });
  });

  describe('getAllCustomers', () => {
    beforeEach(async () => {
      await db.createUser({
        name: 'Customer Two',
        email: 'customer2@example.com',
      });

      await db.createUser({
        name: 'Customer Three',
        email: 'customer3@example.com',
      });
    });

    it('should return paginated customers', async () => {
      const result = await adminService.getAllCustomers(1, 20);

      expect(result.customers.length).toBeGreaterThanOrEqual(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBeGreaterThanOrEqual(3);
      expect(result.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter customers by search term (name)', async () => {
      const result = await adminService.getAllCustomers(1, 20, 'Test User');

      expect(result.customers.length).toBeGreaterThanOrEqual(1);
      expect(
        result.customers.some((customer: { name: string }) =>
          customer.name.toLowerCase().includes('test'),
        ),
      ).toBe(true);
    });

    it('should filter customers by search term (email)', async () => {
      const result = await adminService.getAllCustomers(1, 20, 'customer2@example.com');

      expect(result.customers.length).toBeGreaterThanOrEqual(1);
      expect(
        result.customers.some((customer: { email: string | string[] }) =>
          customer.email.includes('customer2@example.com'),
        ),
      ).toBe(true);
    });

    it('should include customer details correctly', async () => {
      const result = await adminService.getAllCustomers(1, 20);

      const customer = result.customers[0];
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('role');
      expect(customer).toHaveProperty('createdAt');
      expect(customer).toHaveProperty('balance');
      expect(customer).toHaveProperty('devicesCount');
      expect(customer).toHaveProperty('verifiedDevicesCount');
    });

    it('should return correct balance from account', async () => {
      const result = await adminService.getAllCustomers(1, 20);

      const testCustomer = result.customers.find((c: { id: string }) => c.id === testUserId);
      expect(testCustomer?.balance).toBe('1000');
    });

    it('should return zero balance for users without accounts', async () => {
      const userWithoutAccount = await db.createUser({
        name: 'No Account User',
        email: 'noaccountuser@example.com',
      });

      const result = await adminService.getAllCustomers(1, 20);
      const customer = result.customers.find((c: { id: string }) => c.id === userWithoutAccount.id);

      expect(customer?.balance).toBe('0');
    });

    it('should count devices correctly', async () => {
      const result = await adminService.getAllCustomers(1, 20);

      const testCustomer = result.customers.find((c: { id: string }) => c.id === testUserId);
      expect(testCustomer?.devicesCount).toBeGreaterThanOrEqual(1);
    });

    it('should order customers by createdAt desc', async () => {
      const result = await adminService.getAllCustomers(1, 20);

      if (result.customers.length > 1) {
        const dates = result.customers.map((customer: { createdAt: string | number | Date }) =>
          new Date(customer.createdAt).getTime(),
        );
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      }
    });
  });

  describe('getCustomerDetails', () => {
    beforeEach(async () => {
      await db.createTransaction({
        accountId: testAccountId,
        type: 'DEPOSIT',
        amount: 500,
        description: 'Test deposit',
      });

      await db.createTransaction({
        accountId: testAccountId,
        type: 'WITHDRAW',
        amount: 200,
        description: 'Test withdrawal',
      });
    });

    it('should return customer details with devices and transactions', async () => {
      const result = await adminService.getCustomerDetails(testUserId);

      expect(result.customer).toHaveProperty('id', testUserId);
      expect(result.customer).toHaveProperty('name');
      expect(result.customer).toHaveProperty('email');
      expect(result.customer).toHaveProperty('role');
      expect(result.customer).toHaveProperty('createdAt');
      expect(result.customer).toHaveProperty('balance', '1000');

      expect(result.devices).toBeInstanceOf(Array);
      expect(result.devices.length).toBeGreaterThanOrEqual(1);
      expect(result.devices[0]).toHaveProperty('id');
      expect(result.devices[0]).toHaveProperty('deviceId');
      expect(result.devices[0]).toHaveProperty('deviceInfo');
      expect(result.devices[0]).toHaveProperty('verified');

      expect(result.recentTransactions).toBeInstanceOf(Array);
      expect(result.recentTransactions.length).toBeGreaterThanOrEqual(2);
      expect(result.recentTransactions[0]).toHaveProperty('id');
      expect(result.recentTransactions[0]).toHaveProperty('type');
      expect(result.recentTransactions[0]).toHaveProperty('amount');
      expect(result.recentTransactions[0]).toHaveProperty('description');
    });

    it('should return zero balance for users without accounts', async () => {
      const userWithoutAccount = await db.createUser({
        name: 'No Account User',
        email: 'noaccountuser@example.com',
      });

      const result = await adminService.getCustomerDetails(userWithoutAccount.id);

      expect(result.customer.balance).toBe('0');
      expect(result.recentTransactions).toHaveLength(0);
    });

    it('should limit recent transactions to 10', async () => {
      for (let i = 0; i < 12; i++) {
        await db.createTransaction({
          accountId: testAccountId,
          type: 'DEPOSIT',
          amount: 10,
          description: `Transaction ${i}`,
        });
      }

      const result = await adminService.getCustomerDetails(testUserId);

      expect(result.recentTransactions.length).toBeLessThanOrEqual(10);
    });

    it('should order devices by createdAt desc', async () => {
      const newerDevice = await prisma.device.create({
        data: {
          deviceId: `newer-device-${Date.now()}`,
          deviceInfo: 'Newer Device',
          verified: false,
          userId: testUserId,
        },
      });
      createdDeviceIds.push(newerDevice.id);

      const result = await adminService.getCustomerDetails(testUserId);

      if (result.devices.length > 1) {
        const dates = result.devices.map((device: { createdAt: string | number | Date }) =>
          new Date(device.createdAt).getTime(),
        );
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      }
    });

    it('should order transactions by createdAt desc', async () => {
      const result = await adminService.getCustomerDetails(testUserId);

      if (result.recentTransactions.length > 1) {
        const dates = result.recentTransactions.map((tx: { createdAt: Date }) =>
          new Date(tx.createdAt).getTime(),
        );
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      }
    });

    it('should throw error for non-existent customer', async () => {
      await expect(adminService.getCustomerDetails('non-existent-id')).rejects.toThrow(
        new AppError(404, 'Customer not found'),
      );
    });
  });

  describe('getAllTransactions', () => {
    beforeEach(async () => {
      await db.createTransaction({
        accountId: testAccountId,
        type: 'DEPOSIT',
        amount: 500,
        description: 'Deposit 1',
        createdAt: new Date('2024-10-20'),
      });

      await db.createTransaction({
        accountId: testAccountId,
        type: 'WITHDRAW',
        amount: 200,
        description: 'Withdraw 1',
        createdAt: new Date('2024-10-21'),
      });

      await db.createTransaction({
        accountId: testAccountId,
        type: 'DEPOSIT',
        amount: 300,
        description: 'Deposit 2',
        createdAt: new Date('2024-10-22'),
      });
    });

    it('should return paginated transactions', async () => {
      const result = await adminService.getAllTransactions(1, 20);

      expect(result.transactions.length).toBeGreaterThanOrEqual(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBeGreaterThanOrEqual(3);
      expect(result.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter by user ID', async () => {
      const otherUser = await db.createUser({
        name: 'Other User',
        email: 'other@example.com',
      });

      const otherAccount = await db.createAccount({
        userId: otherUser.id,
        balance: 500,
      });

      await db.createTransaction({
        accountId: otherAccount.id,
        type: 'DEPOSIT',
        amount: 100,
        description: 'Other user deposit',
      });

      const result = await adminService.getAllTransactions(1, 20, { userId: testUserId });

      expect(
        result.transactions.every((tx: { user: { id: string } }) => tx.user.id === testUserId),
      ).toBe(true);
    });

    it('should filter by transaction type (DEPOSIT)', async () => {
      const result = await adminService.getAllTransactions(1, 20, { type: 'DEPOSIT' });

      expect(result.transactions.every((tx: { type: string }) => tx.type === 'DEPOSIT')).toBe(true);
    });

    it('should filter by transaction type (WITHDRAW)', async () => {
      const result = await adminService.getAllTransactions(1, 20, { type: 'WITHDRAW' });

      expect(result.transactions.every((tx: { type: string }) => tx.type === 'WITHDRAW')).toBe(
        true,
      );
    });

    it('should filter by date range', async () => {
      const result = await adminService.getAllTransactions(1, 20, {
        startDate: '2024-10-21T00:00:00Z',
        endDate: '2024-10-22T23:59:59Z',
      });

      expect(result.transactions.length).toBeGreaterThanOrEqual(2);
      expect(
        result.transactions.every((tx: { createdAt: string | number | Date }) => {
          const txDate = new Date(tx.createdAt);
          return txDate >= new Date('2024-10-21') && txDate <= new Date('2024-10-22T23:59:59Z');
        }),
      ).toBe(true);
    });

    it('should filter by start date only', async () => {
      const result = await adminService.getAllTransactions(1, 20, {
        startDate: '2024-10-21T00:00:00Z',
      });

      expect(
        result.transactions.every(
          (tx: { createdAt: string | number | Date }) =>
            new Date(tx.createdAt) >= new Date('2024-10-21'),
        ),
      ).toBe(true);
    });

    it('should filter by end date only', async () => {
      const result = await adminService.getAllTransactions(1, 20, {
        endDate: '2024-10-21T23:59:59Z',
      });

      expect(
        result.transactions.every(
          (tx: { createdAt: string | number | Date }) =>
            new Date(tx.createdAt) <= new Date('2024-10-21T23:59:59Z'),
        ),
      ).toBe(true);
    });

    it('should handle non-existent user ID in filter', async () => {
      const result = await adminService.getAllTransactions(1, 20, { userId: 'non-existent-id' });

      expect(result.transactions.length).toBeGreaterThanOrEqual(0);
      expect(result.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('should include user information in transactions', async () => {
      const result = await adminService.getAllTransactions(1, 20);

      expect(result.transactions[0].user).toHaveProperty('id');
      expect(result.transactions[0].user).toHaveProperty('name');
      expect(result.transactions[0].user).toHaveProperty('email');
    });

    it('should order transactions by createdAt desc', async () => {
      const result = await adminService.getAllTransactions(1, 20);

      if (result.transactions.length > 1) {
        const dates = result.transactions.map((tx: { createdAt: Date }) =>
          new Date(tx.createdAt).getTime(),
        );
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      }
    });
  });

  describe('getDashboardAnalytics', () => {
    beforeEach(async () => {
      await db.createTransaction({
        accountId: testAccountId,
        type: 'DEPOSIT',
        amount: 1000,
        description: 'Test deposit',
      });

      await db.createTransaction({
        accountId: testAccountId,
        type: 'DEPOSIT',
        amount: 500,
        description: 'Test deposit 2',
      });

      await db.createTransaction({
        accountId: testAccountId,
        type: 'WITHDRAW',
        amount: 300,
        description: 'Test withdrawal',
      });

      await db.createTransaction({
        accountId: testAccountId,
        type: 'WITHDRAW',
        amount: 200,
        description: 'Test withdrawal 2',
      });
    });

    it('should return analytics with correct structure', async () => {
      const result = await adminService.getDashboardAnalytics();

      expect(result).toHaveProperty('analytics');
      expect(result).toHaveProperty('recentTransactions');

      expect(result.analytics).toHaveProperty('totalCustomers');
      expect(result.analytics).toHaveProperty('totalDeposits');
      expect(result.analytics).toHaveProperty('totalWithdrawals');
      expect(result.analytics).toHaveProperty('pendingDevices');

      expect(result.analytics.totalDeposits).toHaveProperty('amount');
      expect(result.analytics.totalDeposits).toHaveProperty('count');
      expect(result.analytics.totalWithdrawals).toHaveProperty('amount');
      expect(result.analytics.totalWithdrawals).toHaveProperty('count');
    });

    it('should calculate total customers correctly', async () => {
      const result = await adminService.getDashboardAnalytics();

      expect(result.analytics.totalCustomers).toBeGreaterThanOrEqual(1);
    });

    it('should calculate total deposits correctly', async () => {
      const result = await adminService.getDashboardAnalytics();

      expect(Number(result.analytics.totalDeposits.amount)).toBeGreaterThanOrEqual(1500);
      expect(result.analytics.totalDeposits.count).toBeGreaterThanOrEqual(2);
    });

    it('should calculate total withdrawals correctly', async () => {
      const result = await adminService.getDashboardAnalytics();

      expect(Number(result.analytics.totalWithdrawals.amount)).toBeGreaterThanOrEqual(500);
      expect(result.analytics.totalWithdrawals.count).toBeGreaterThanOrEqual(2);
    });

    it('should count pending devices correctly', async () => {
      const result = await adminService.getDashboardAnalytics();

      expect(result.analytics.pendingDevices).toBeGreaterThanOrEqual(1);
    });

    it('should return recent transactions (max 20)', async () => {
      const result = await adminService.getDashboardAnalytics();

      expect(result.recentTransactions.length).toBeGreaterThanOrEqual(4);
      expect(result.recentTransactions.length).toBeLessThanOrEqual(20);
    });

    it('should include user information in recent transactions', async () => {
      const result = await adminService.getDashboardAnalytics();

      if (result.recentTransactions.length > 0) {
        expect(result.recentTransactions[0]).toHaveProperty('id');
        expect(result.recentTransactions[0]).toHaveProperty('type');
        expect(result.recentTransactions[0]).toHaveProperty('amount');
        expect(result.recentTransactions[0]).toHaveProperty('description');
        expect(result.recentTransactions[0]).toHaveProperty('createdAt');
        expect(result.recentTransactions[0]).toHaveProperty('user');

        expect(result.recentTransactions[0].user).toHaveProperty('id');
        expect(result.recentTransactions[0].user).toHaveProperty('name');
        expect(result.recentTransactions[0].user).toHaveProperty('email');
      }
    });

    it('should order recent transactions by createdAt desc', async () => {
      const result = await adminService.getDashboardAnalytics();

      if (result.recentTransactions.length > 1) {
        const dates = result.recentTransactions.map((tx: { createdAt: Date }) =>
          new Date(tx.createdAt).getTime(),
        );
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      }
    });

    it('should handle case with no deposits', async () => {
      await prisma.transaction.deleteMany({
        where: { type: 'DEPOSIT' },
      });

      const result = await adminService.getDashboardAnalytics();

      expect(result.analytics.totalDeposits.amount).toBe('0');
      expect(result.analytics.totalDeposits.count).toBe(0);
    });

    it('should handle case with no withdrawals', async () => {
      await prisma.transaction.deleteMany({
        where: { type: 'WITHDRAW' },
      });

      const result = await adminService.getDashboardAnalytics();

      expect(result.analytics.totalWithdrawals.amount).toBe('0');
      expect(result.analytics.totalWithdrawals.count).toBe(0);
    });

    it('should handle case with no pending devices', async () => {
      await prisma.device.updateMany({
        where: { verified: false },
        data: { verified: true },
      });

      const result = await adminService.getDashboardAnalytics();

      expect(result.analytics.pendingDevices).toBe(0);
    });
  });
});
