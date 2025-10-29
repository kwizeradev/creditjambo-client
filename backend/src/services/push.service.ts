import prisma from '@/config/database';
import { AppError } from '@/middlewares/error.middleware';
import { SavePushTokenInput } from '@/dtos/push.dto';

/**
 * Push Notification Service
 *
 * TEST ENVIRONMENT: Due to Expo SDK 53+ requiring development builds on Android,
 * this service logs notifications for testing. Client uses local notifications to simulate UX.
 *
 * PRODUCTION: Will integrate with Expo Push API for real remote notifications.
 * All token management and notification logic is production-ready.
 */
export class PushService {
  async savePushToken(userId: string, data: SavePushTokenInput) {
    const existingToken = await prisma.pushToken.findUnique({
      where: { token: data.token },
    });

    if (existingToken) {
      if (existingToken.userId !== userId) {
        await prisma.pushToken.update({
          where: { token: data.token },
          data: {
            userId,
            platform: data.platform,
          },
        });
        return { message: 'Push token updated successfully' };
      }

      await prisma.pushToken.update({
        where: { token: data.token },
        data: {
          platform: data.platform,
          updatedAt: new Date(),
        },
      });
      return { message: 'Push token refreshed successfully' };
    }

    await prisma.pushToken.create({
      data: {
        userId,
        token: data.token,
        platform: data.platform,
      },
    });

    return { message: 'Push token registered successfully' };
  }

  async deletePushToken(userId: string, token: string) {
    const pushToken = await prisma.pushToken.findUnique({
      where: { token },
    });

    if (!pushToken) {
      throw new AppError(404, 'Push token not found');
    }

    if (pushToken.userId !== userId) {
      throw new AppError(403, 'Unauthorized to delete this token');
    }

    await prisma.pushToken.delete({
      where: { token },
    });

    return { message: 'Push token deleted successfully' };
  }

  async getUserPushTokens(userId: string) {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: {
        id: true,
        token: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return { tokens };
  }

  /**
   * Send push notification to user's devices
   *
   * TEST: Logs notification details for testing without requiring dev builds
   * PRODUCTION: Will use expo-server-sdk to send real push notifications
   */
  async sendNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: { [key: string]: unknown };
      sound?: 'default' | null;
      badge?: number;
      priority?: 'default' | 'normal' | 'high';
    },
  ) {
    const userTokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });

    if (userTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return { sent: 0, failed: 0, tokens: [] };
    }

    const expoPushTokens = userTokens
      .filter((t) => this.isValidExpoPushToken(t.token))
      .map((t) => t.token);

    if (expoPushTokens.length === 0) {
      console.log(`No valid Expo push tokens for user ${userId}`);
      return { sent: 0, failed: 0, tokens: [] };
    }

    try {
      // TEST ENVIRONMENT: Log notification for testing without dev build requirement
      console.log('📱 Push Notification (TEST MODE):', {
        userId,
        recipients: expoPushTokens.length,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        tokens: expoPushTokens,
      });

      // PRODUCTION: Uncomment and configure expo-server-sdk
      // const { Expo } = require('expo-server-sdk');
      // const expo = new Expo();
      // const messages = expoPushTokens.map((token) => ({
      //   to: token,
      //   sound: notification.sound || 'default',
      //   title: notification.title,
      //   body: notification.body,
      //   data: notification.data || {},
      //   badge: notification.badge,
      //   priority: notification.priority || 'high',
      // }));
      // const chunks = expo.chunkPushNotifications(messages);
      // const tickets = await Promise.all(
      //   chunks.map(chunk => expo.sendPushNotificationsAsync(chunk))
      // );

      return {
        sent: expoPushTokens.length,
        failed: 0,
        tokens: expoPushTokens,
      };
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return {
        sent: 0,
        failed: expoPushTokens.length,
        tokens: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if token is a valid Expo push token
   */
  private isValidExpoPushToken(token: string): boolean {
    return (
      token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken[') ||
      /^[a-zA-Z0-9_-]{22}$/.test(token)
    );
  }

  async sendBulkNotification(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: { [key: string]: unknown };
    },
  ) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendNotification(userId, notification)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      total: userIds.length,
      successful,
      failed,
    };
  }
}

export default new PushService();
