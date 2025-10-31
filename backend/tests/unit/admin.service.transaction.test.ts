import { describe, expect, it } from 'vitest';
import { withTransaction } from '../utils/transaction-test';
import { createTestDbHelper } from '../utils/test-db-helper-v2';
import adminService from '../../src/services/admin.service';
import { AppError } from '../../src/middlewares/error.middleware';
import { hashPassword, hashToken } from '../../src/utils/auth.util';
import { generateRefreshToken } from '../../src/utils/jwt.util';

describe('Admin Service (Transaction Safe)', () => {
  describe('getAllDevices', () => {
    it(
      'should return all devices when filter is "all"',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user = await db.createUser({
          name: 'Test User',
          email: 'test@example.com',
        });

        const device1 = await db.createDevice({
          userId: user.id,
          deviceId: 'verified-device',
          verified: true,
        });

        const device2 = await db.createDevice({
          userId: user.id,
          deviceId: 'unverified-device',
          verified: false,
        });

        const result = await adminService.getAllDevices('all');

        expect(result.devices.length).toBeGreaterThanOrEqual(2);
        expect(result.total).toEqual(result.devices.length);
        expect(result.devices[0]).toHaveProperty('id');
        expect(result.devices[0]).toHaveProperty('deviceId');
        expect(result.devices[0]).toHaveProperty('verified');
        expect(result.devices[0]).toHaveProperty('user');
      }),
    );

    it(
      'should return only verified devices when filter is "verified"',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user = await db.createUser({
          name: 'Test User',
          email: 'test@example.com',
        });

        await db.createDevice({ userId: user.id, verified: true });
        await db.createDevice({ userId: user.id, verified: false });

        const result = await adminService.getAllDevices('verified');

        expect(
          result.devices.every((device: { verified: boolean }) => device.verified === true),
        ).toBe(true);
        expect(result.total).toEqual(result.devices.length);
      }),
    );

    it(
      'should return only unverified devices when filter is "unverified"',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user = await db.createUser({
          name: 'Test User',
          email: 'test@example.com',
        });

        await db.createDevice({ userId: user.id, verified: true });
        await db.createDevice({ userId: user.id, verified: false });

        const result = await adminService.getAllDevices('unverified');

        expect(
          result.devices.every((device: { verified: boolean }) => device.verified === false),
        ).toBe(true);
        expect(result.total).toEqual(result.devices.length);
      }),
    );
  });

  describe('verifyDevice', () => {
    it(
      'should verify a device successfully',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user = await db.createUser({
          name: 'Test User',
          email: 'test@example.com',
        });

        const device = await db.createDevice({
          userId: user.id,
          verified: false,
        });

        const result = await adminService.verifyDevice(device.id);

        expect(result.message).toBe('Device verified successfully');
        expect(result.device.verified).toBe(true);
        expect(result.device.user).toHaveProperty('id');
        expect(result.device.user).toHaveProperty('name');
        expect(result.device.user).toHaveProperty('email');

        const updatedDevice = await prisma.device.findUnique({
          where: { id: device.id },
        });
        expect(updatedDevice?.verified).toBe(true);
      }),
    );

    it(
      'should return appropriate message if device is already verified',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user = await db.createUser({
          name: 'Test User',
          email: 'test@example.com',
        });

        const device = await db.createDevice({
          userId: user.id,
          verified: true,
        });

        const result = await adminService.verifyDevice(device.id);

        expect(result.message).toBe('Device is already verified');
        expect(result.device.verified).toBe(true);
      }),
    );

    it(
      'should throw error for non-existent device',
      withTransaction(async ({ prisma }) => {
        await expect(adminService.verifyDevice('non-existent-id')).rejects.toThrow(
          new AppError(404, 'Device not found'),
        );
      }),
    );
  });

  describe('unverifyDevice', () => {
    it(
      'should unverify a device and invalidate sessions',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user = await db.createUser({
          name: 'Test User',
          email: 'test@example.com',
        });

        const device = await db.createDevice({
          userId: user.id,
          verified: true,
        });

        await db.createSession({
          userId: user.id,
          deviceId: device.id,
        });

        const result = await adminService.unverifyDevice(device.id);

        expect(result.message).toBe(
          'Device unverified successfully. All sessions have been invalidated.',
        );
        expect(result.device.verified).toBe(false);

        const updatedDevice = await prisma.device.findUnique({
          where: { id: device.id },
        });
        expect(updatedDevice?.verified).toBe(false);

        const sessions = await prisma.session.findMany({
          where: { deviceId: device.id },
        });
        expect(sessions).toHaveLength(0);
      }),
    );
  });

  describe('getAllCustomers', () => {
    it(
      'should return paginated customers',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user1 = await db.createUser({
          name: 'Customer One',
          email: 'customer1@example.com',
        });

        const user2 = await db.createUser({
          name: 'Customer Two',
          email: 'customer2@example.com',
        });

        await db.createAccount({ userId: user1.id, balance: 1000 });
        await db.createAccount({ userId: user2.id, balance: 500 });

        const result = await adminService.getAllCustomers(1, 20);

        expect(result.customers.length).toBeGreaterThanOrEqual(2);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(20);
        expect(result.pagination.total).toBeGreaterThanOrEqual(2);

        const customer = result.customers[0];
        expect(customer).toHaveProperty('id');
        expect(customer).toHaveProperty('name');
        expect(customer).toHaveProperty('email');
        expect(customer).toHaveProperty('balance');
        expect(customer).toHaveProperty('devicesCount');
      }),
    );

    it(
      'should filter customers by search term',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        await db.createUser({
          name: 'John Doe',
          email: 'john@example.com',
        });

        await db.createUser({
          name: 'Jane Smith',
          email: 'jane@example.com',
        });

        const result = await adminService.getAllCustomers(1, 20, 'John');

        expect(result.customers.length).toBeGreaterThanOrEqual(1);
        expect(
          result.customers.some((customer: { name: string }) =>
            customer.name.toLowerCase().includes('john'),
          ),
        ).toBe(true);
      }),
    );
  });

  describe('adminLogin', () => {
    it(
      'should successfully login admin user',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const { salt, passwordHash } = hashPassword('password123');
        const adminUser = await db.createUser({
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
          passwordHash,
          salt,
        });

        const result = await adminService.adminLogin(adminUser.email, 'password123');

        expect(result.user).toHaveProperty('id', adminUser.id);
        expect(result.user).toHaveProperty('email', adminUser.email);
        expect(result.user).toHaveProperty('role', 'ADMIN');
        expect(result.tokens).toHaveProperty('accessToken');
        expect(result.tokens).toHaveProperty('refreshToken');

        const device = await prisma.device.findFirst({
          where: {
            userId: adminUser.id,
            deviceId: `admin-web-${adminUser.id}`,
          },
        });
        expect(device).toBeTruthy();
        expect(device?.verified).toBe(true);

        const session = await prisma.session.findFirst({
          where: { userId: adminUser.id },
        });
        expect(session).toBeTruthy();
      }),
    );

    it(
      'should throw error for invalid credentials',
      withTransaction(async ({ prisma }) => {
        await expect(
          adminService.adminLogin('invalid@example.com', 'wrongpassword'),
        ).rejects.toThrow(new AppError(401, 'Invalid email or password'));
      }),
    );

    it(
      'should throw error for non-admin user',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const { salt, passwordHash } = hashPassword('password123');
        const regularUser = await db.createUser({
          name: 'Regular User',
          email: 'user@example.com',
          role: 'USER',
          passwordHash,
          salt,
        });

        await expect(adminService.adminLogin(regularUser.email, 'password123')).rejects.toThrow(
          new AppError(403, 'Access denied. Admin privileges required.'),
        );
      }),
    );
  });

  describe('getDashboardAnalytics', () => {
    it(
      'should return analytics with correct structure',
      withTransaction(async ({ prisma }) => {
        const db = createTestDbHelper(prisma);

        const user = await db.createUser({
          name: 'Test User',
          email: 'test@example.com',
        });

        const account = await db.createAccount({
          userId: user.id,
          balance: 1000,
        });

        await db.createTransaction({
          accountId: account.id,
          type: 'DEPOSIT',
          amount: 500,
        });

        await db.createTransaction({
          accountId: account.id,
          type: 'WITHDRAW',
          amount: 200,
        });

        await db.createDevice({
          userId: user.id,
          verified: false,
        });

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

        expect(result.analytics.totalCustomers).toBeGreaterThanOrEqual(1);
        expect(Number(result.analytics.totalDeposits.amount)).toBeGreaterThanOrEqual(500);
        expect(Number(result.analytics.totalWithdrawals.amount)).toBeGreaterThanOrEqual(200);
        expect(result.analytics.pendingDevices).toBeGreaterThanOrEqual(1);
      }),
    );
  });
});
