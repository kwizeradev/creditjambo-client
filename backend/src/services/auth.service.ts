import prisma from '@/config/database';
import { hashPassword, hashToken, verifyPassword } from '@/utils/auth.util';
import { LoginUserInput, RegisterUserInput, RefreshTokenInput } from '@/dtos';
import { toUserResponse } from '@/dtos/user.dto';
import { AppError } from '@/middlewares/error.middleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt.util';

export class AuthService {
  async registerUser(data: RegisterUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    const { salt, passwordHash } = hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          salt,
          role: 'USER',
        },
      });

      const device = await tx.device.create({
        data: {
          userId: user.id,
          deviceId: data.deviceId || `web-${Date.now()}`,
          deviceInfo: data.deviceInfo || 'Unknown device',
          verified: false,
        },
      });

      const account = await tx.account.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      return { user, device, account };
    });

    return {
      user: toUserResponse(result.user),
      device: {
        id: result.device.id,
        deviceId: result.device.deviceId,
        verified: result.device.verified,
      },
      devicePending: !result.device.verified,
      message: 'Registration successful. Your device is pending admin verification.',
    };
  }

  async loginUser(data: LoginUserInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        devices: true,
      },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = verifyPassword(data.password, user.salt, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    let device = await prisma.device.findUnique({
      where: { deviceId: data.deviceId },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          userId: user.id,
          deviceId: data.deviceId,
          deviceInfo: 'Unknown device',
          verified: false,
        },
      });
    } else {
      if (device.userId !== user.id) {
        throw new AppError(403, 'Device registered to different user');
      }
    }

    if (!device.verified) {
      return {
        devicePending: true,
        deviceId: device.deviceId,
        message: 'Your device is pending admin verification. You will be notified once approved.',
      };
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId: device.deviceId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      deviceId: device.deviceId,
      sessionId: '',
    });

    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        refreshTokenHash,
        expiresAt,
        lastActivityAt: new Date(),
      },
    });

    return {
      user: toUserResponse(user),
      tokens: {
        accessToken,
        refreshToken,
      },
      message: 'Login successful',
    };
  }

  async refreshAccessToken(data: RefreshTokenInput) {
    let decoded;
    try {
      decoded = verifyRefreshToken(data.refreshToken);
    } catch (error) {
      throw new AppError(401, error instanceof Error ? error.message : 'Invalid refresh token');
    }

    const refreshTokenHash = hashToken(data.refreshToken);

    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        userId: decoded.userId,
      },
      include: {
        user: true,
        device: true,
      },
    });

    if (!session) {
      throw new AppError(401, 'Session not found or has been invalidated');
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: { id: session.id },
      });
      throw new AppError(401, 'Session has expired. Please login again.');
    }

    if (!session.device.verified) {
      throw new AppError(403, 'Device verification has been revoked');
    }

    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      deviceId: session.device.deviceId,
    });

    const shouldRotate = process.env.ROTATE_REFRESH_TOKENS === 'true';
    let newRefreshToken = data.refreshToken;

    if (shouldRotate) {
      newRefreshToken = generateRefreshToken({
        userId: session.user.id,
        deviceId: session.device.deviceId,
        sessionId: session.id,
      });

      const newRefreshTokenHash = hashToken(newRefreshToken);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: newRefreshTokenHash,
          lastActivityAt: new Date(),
        },
      });
    } else {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          lastActivityAt: new Date(),
        },
      });
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: 'Token refreshed successfully',
    };
  }

  async logoutUser(userId: string, deviceId: string) {
    const device = await prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new AppError(404, 'Device not found');
    }
    if (device.userId !== userId) {
      throw new AppError(403, 'Unauthorized device access');
    }
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId,
        deviceId: device.id,
      },
    });

    return {
      message: 'Logout successful',
      sessionsDeleted: deletedSessions.count,
    };
  }
}

export default new AuthService();
