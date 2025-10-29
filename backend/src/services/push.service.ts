import prisma from '@/config/database';
import { AppError } from '@/middlewares/error.middleware';
import { SavePushTokenInput } from '@/dtos';

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

  async sendNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: unknown;
    },
  ) {
    const userTokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });

    if (userTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    console.log('Sending push notification:', {
      tokens: userTokens.map((t) => t.token),
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });

    return {
      sent: userTokens.length,
      failed: 0,
      tokens: userTokens.map((t) => t.token),
    };
  }

  async sendBulkNotification(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: unknown;
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
