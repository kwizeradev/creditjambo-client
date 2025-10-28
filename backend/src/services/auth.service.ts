import prisma from '@/config/database';
import { hashPassword, hashToken, verifyPassword } from '@/utils/auth.util';
import { LoginUserInput, RegisterUserInput, RefreshTokenInput, TokenResponse } from '@/dtos';
import { toUserResponse, UserResponse } from '@/dtos/user.dto';
import { Decimal } from '@prisma/client/runtime/library';
import type { Role } from '@/generated/prisma';
import { AppError } from '@/middlewares/error.middleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt.util';
import { findOrCreateDevice, validateDeviceOwnership } from '@/utils/device.util';
import type { PrismaClient } from '@/generated/prisma';

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

interface RegistrationResult {
  user: UserResponse;
  device: {
    id: string;
    deviceId: string;
    verified: boolean;
  };
  devicePending: boolean;
  message: string;
}

interface LoginResult {
  user?: UserResponse;
  tokens?: TokenResponse;
  devicePending?: boolean;
  deviceId?: string;
  message: string;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  message: string;
}

interface TransactionResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    passwordHash: string;
    salt: string;
    createdAt: Date;
    updatedAt: Date;
  };
  device: {
    id: string;
    deviceId: string;
    verified: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    deviceInfo: string | null;
  };
  account: {
    id: string;
    userId: string;
    balance: Decimal;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface UserWithDevices {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  salt: string;
  createdAt: Date;
  updatedAt: Date;
  devices: Array<{
    id: string;
    deviceId: string;
    verified: boolean;
  }>;
}

interface DeviceInfo {
  id: string;
  deviceId: string;
  verified: boolean;
  userId: string;
}

export class AuthService {
  async registerUser(data: RegisterUserInput): Promise<RegistrationResult> {
    await this.validateEmailAvailability(data.email);

    const { salt, passwordHash } = hashPassword(data.password);
    const result = await this.createUserWithDeviceAndAccount(data, passwordHash, salt);

    return this.buildRegistrationResponse(result);
  }

  private async validateEmailAvailability(email: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }
  }

  private async createUserWithDeviceAndAccount(
    data: RegisterUserInput,
    passwordHash: string,
    salt: string,
  ) {
    return prisma.$transaction(async (tx) => {
      try {
        const user = await this.createUser(tx, data, passwordHash, salt);
        const device = await this.createDevice(tx, user.id, data);
        const account = await this.createAccount(tx, user.id);

        return { user, device, account };
      } catch (error) {
        console.error('Registration transaction failed:', error);
        throw new AppError(500, 'Registration failed. Please try again.');
      }
    });
  }

  private async createUser(
    tx: TransactionClient,
    data: RegisterUserInput,
    passwordHash: string,
    salt: string,
  ) {
    return tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        salt,
        role: 'USER',
      },
    });
  }

  private async createDevice(tx: TransactionClient, userId: string, data: RegisterUserInput) {
    return tx.device.create({
      data: {
        userId,
        deviceId: data.deviceId || `web-${Date.now()}`,
        deviceInfo: data.deviceInfo || 'Unknown device',
        verified: false,
      },
    });
  }

  private async createAccount(tx: TransactionClient, userId: string) {
    return tx.account.create({
      data: {
        userId,
        balance: 0,
      },
    });
  }

  private buildRegistrationResponse(result: TransactionResult): RegistrationResult {
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

  async loginUser(data: LoginUserInput): Promise<LoginResult> {
    const user = await this.validateUserCredentials(data);
    const device = await findOrCreateDevice(user.id, data.deviceId, 'Unknown device');

    if (!device.verified) {
      return this.buildDevicePendingResponse(device);
    }

    const tokens = await this.createUserSession(user, device);
    return this.buildLoginSuccessResponse(user, tokens);
  }

  private async validateUserCredentials(data: LoginUserInput): Promise<UserWithDevices> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { devices: true },
    });

    if (!user || !verifyPassword(data.password, user.salt, user.passwordHash)) {
      throw new AppError(401, 'Invalid email or password');
    }

    return user;
  }

  private buildDevicePendingResponse(device: DeviceInfo): LoginResult {
    return {
      devicePending: true,
      deviceId: device.deviceId,
      message: 'Your device is pending admin verification. You will be notified once approved.',
    };
  }

  private async createUserSession(
    user: UserWithDevices,
    device: DeviceInfo,
  ): Promise<TokenResponse> {
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId: device.deviceId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      deviceId: device.deviceId,
    });

    await this.storeRefreshTokenSession(user.id, device.id, refreshToken);

    return { accessToken, refreshToken };
  }

  private async storeRefreshTokenSession(userId: string, deviceId: string, refreshToken: string) {
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId,
        deviceId,
        refreshTokenHash,
        expiresAt,
        lastActivityAt: new Date(),
      },
    });
  }

  private buildLoginSuccessResponse(user: UserWithDevices, tokens: TokenResponse): LoginResult {
    return {
      user: toUserResponse(user),
      tokens,
      message: 'Login successful',
    };
  }

  async refreshAccessToken(data: RefreshTokenInput): Promise<RefreshResult> {
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
    await validateDeviceOwnership(userId, deviceId);

    const device = await prisma.device.findUnique({
      where: { deviceId },
      select: { id: true },
    });

    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId,
        deviceId: device!.id,
      },
    });

    return {
      message: 'Logout successful',
      sessionsDeleted: deletedSessions.count,
    };
  }
}

export default new AuthService();
