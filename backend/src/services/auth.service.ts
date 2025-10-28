import prisma from '@/config/database';
import { hashPassword, hashToken, verifyPassword } from '@/utils/auth.util';
import { LoginUserInput, RegisterUserInput } from '@/dtos/user.dto';
import { toUserResponse } from '@/dtos/user.dto';
import { AppError } from '@/middlewares/error.middleware';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt.util';

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
}

export default new AuthService();
