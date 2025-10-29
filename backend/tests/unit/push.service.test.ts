import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import pushService from '../../src/services/push.service';
import prisma from '../../src/config/database';
import { useTestDb } from '../utils/test-db-helper';

describe('Push Service', () => {
  let testUserId: string;
  const db = useTestDb();

  beforeEach(async () => {
    const user = await db.createUser({
      name: 'Test User',
      email: `test-push-${Date.now()}-${Math.random()}@example.com`,
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('savePushToken', () => {
    it('should save new push token', async () => {
      const result = await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[test-token]',
        platform: 'ios',
      });

      expect(result.message).toBe('Push token registered successfully');

      const savedToken = await prisma.pushToken.findUnique({
        where: { token: 'ExponentPushToken[test-token]' },
      });

      expect(savedToken).toBeDefined();
      expect(savedToken?.userId).toBe(testUserId);
      expect(savedToken?.platform).toBe('ios');
    });

    it('should refresh existing token for same user', async () => {
      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[test-token]',
        platform: 'ios',
      });

      const result = await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[test-token]',
        platform: 'android',
      });

      expect(result.message).toBe('Push token refreshed successfully');

      const tokens = await prisma.pushToken.findMany({
        where: { token: 'ExponentPushToken[test-token]' },
      });

      expect(tokens).toHaveLength(1);
      expect(tokens[0].platform).toBe('android');
    });

    it('should handle multiple tokens for same user', async () => {
      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[ios-token]',
        platform: 'ios',
      });

      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[android-token]',
        platform: 'android',
      });

      const tokens = await prisma.pushToken.findMany({
        where: { userId: testUserId },
      });

      expect(tokens).toHaveLength(2);
    });

    it('should transfer token from one user to another', async () => {
      const anotherUser = await db.createUser({
        name: 'Another User',
        email: `transfer-push-${Date.now()}-${Math.random()}@example.com`,
      });

      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[shared-token]',
        platform: 'ios',
      });

      const result = await pushService.savePushToken(anotherUser.id, {
        token: 'ExponentPushToken[shared-token]',
        platform: 'android',
      });

      expect(result.message).toBe('Push token updated successfully');

      const token = await prisma.pushToken.findUnique({
        where: { token: 'ExponentPushToken[shared-token]' },
      });

      expect(token?.userId).toBe(anotherUser.id);
      expect(token?.platform).toBe('android');

      const tokens = await prisma.pushToken.findMany({
        where: { token: 'ExponentPushToken[shared-token]' },
      });
      expect(tokens).toHaveLength(1);
    });
  });

  describe('deletePushToken', () => {
    beforeEach(async () => {
      await db.createPushToken({
        userId: testUserId,
        token: 'ExponentPushToken[test-token]',
        platform: 'ios',
      });
    });

    it('should delete push token successfully', async () => {
      const result = await pushService.deletePushToken(testUserId, 'ExponentPushToken[test-token]');

      expect(result.message).toBe('Push token deleted successfully');

      const token = await prisma.pushToken.findUnique({
        where: { token: 'ExponentPushToken[test-token]' },
      });

      expect(token).toBeNull();
    });

    it('should throw error for non-existent token', async () => {
      await expect(pushService.deletePushToken(testUserId, 'NonExistentToken')).rejects.toThrow(
        'Push token not found',
      );
    });

    it("should throw error when deleting another user's token", async () => {
      const anotherUser = await db.createUser({
        name: 'Another User',
        email: `another-push-${Date.now()}-${Math.random()}@example.com`,
      });

      await expect(
        pushService.deletePushToken(anotherUser.id, 'ExponentPushToken[test-token]'),
      ).rejects.toThrow('Unauthorized to delete this token');
    });
  });

  describe('getUserPushTokens', () => {
    it('should return empty array when no tokens', async () => {
      const result = await pushService.getUserPushTokens(testUserId);

      expect(result.tokens).toHaveLength(0);
    });

    it('should return all user push tokens', async () => {
      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[ios]',
        platform: 'ios',
      });

      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[android]',
        platform: 'android',
      });

      const result = await pushService.getUserPushTokens(testUserId);

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0]).toHaveProperty('token');
      expect(result.tokens[0]).toHaveProperty('platform');
      expect(result.tokens[0]).toHaveProperty('createdAt');
    });

    it('should order tokens by updatedAt desc', async () => {
      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[first]',
        platform: 'ios',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[second]',
        platform: 'android',
      });

      const result = await pushService.getUserPushTokens(testUserId);

      expect(result.tokens[0].token).toBe('ExponentPushToken[second]');
      expect(result.tokens[1].token).toBe('ExponentPushToken[first]');
    });
  });

  describe('sendNotification', () => {
    it('should return zero sent when no tokens', async () => {
      const result = await pushService.sendNotification(testUserId, {
        title: 'Test',
        body: 'Test message',
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should send to all user tokens', async () => {
      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[ios]',
        platform: 'ios',
      });

      await pushService.savePushToken(testUserId, {
        token: 'ExponentPushToken[android]',
        platform: 'android',
      });

      const result = await pushService.sendNotification(testUserId, {
        title: 'Test Notification',
        body: 'This is a test',
        data: { type: 'test' },
      });

      expect(result.sent).toBe(2);
      expect(result.tokens).toHaveLength(2);
    });
  });

  describe('sendBulkNotification', () => {
    it('should send notifications to multiple users', async () => {
      const user1 = await db.createUser({
        name: 'User 1',
        email: `bulk-user1-${Date.now()}-${Math.random()}@example.com`,
      });

      const user2 = await db.createUser({
        name: 'User 2',
        email: `bulk-user2-${Date.now()}-${Math.random()}@example.com`,
      });

      await pushService.savePushToken(user1.id, {
        token: 'ExponentPushToken[user1-token]',
        platform: 'ios',
      });

      await pushService.savePushToken(user2.id, {
        token: 'ExponentPushToken[user2-token]',
        platform: 'android',
      });

      const result = await pushService.sendBulkNotification([user1.id, user2.id], {
        title: 'Bulk Notification',
        body: 'This is a bulk notification',
        data: { type: 'bulk' },
      });

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle mix of users with and without tokens', async () => {
      const userWithToken = await db.createUser({
        name: 'User With Token',
        email: `with-token-${Date.now()}-${Math.random()}@example.com`,
      });

      const userWithoutToken = await db.createUser({
        name: 'User Without Token',
        email: `without-token-${Date.now()}-${Math.random()}@example.com`,
      });

      await pushService.savePushToken(userWithToken.id, {
        token: 'ExponentPushToken[user-with-token]',
        platform: 'ios',
      });

      const result = await pushService.sendBulkNotification(
        [userWithToken.id, userWithoutToken.id],
        {
          title: 'Mixed Bulk Notification',
          body: 'This notification goes to mixed users',
        },
      );

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle empty user list', async () => {
      const result = await pushService.sendBulkNotification([], {
        title: 'Empty Notification',
        body: 'This should not send to anyone',
      });

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
    });
  });
});
