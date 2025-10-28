import prisma from '@/config/database';
import { hashPassword } from '@/utils/auth.util';
import { RegisterUserInput } from '@/dtos/user.dto';
import { toUserResponse } from '@/dtos/user.dto';
import { AppError } from '@/middlewares/error.middleware';

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
}

export default new AuthService();
