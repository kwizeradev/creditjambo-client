import prisma from '@/config/database';
import { AppError } from '@/middlewares/error.middleware';
import { verifyPassword, hashToken } from '@/utils/auth.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt.util';

export class AdminService {
  async getAllDevices(filter?: 'verified' | 'unverified' | 'all') {
    const where: { verified?: boolean } = {};

    if (filter === 'verified') {
      where.verified = true;
    } else if (filter === 'unverified') {
      where.verified = false;
    }

    const devices = await prisma.device.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      devices: devices.map((device) => ({
        id: device.id,
        deviceId: device.deviceId,
        deviceInfo: device.deviceInfo,
        verified: device.verified,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
        user: device.user,
      })),
      total: devices.length,
    };
  }

  async getUnverifiedDevices() {
    const devices = await prisma.device.findMany({
      where: { verified: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      devices: devices.map((device) => ({
        id: device.id,
        deviceId: device.deviceId,
        deviceInfo: device.deviceInfo,
        verified: device.verified,
        createdAt: device.createdAt,
        user: device.user,
      })),
      total: devices.length,
    };
  }

  async verifyDevice(deviceId: string) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { user: true },
    });

    if (!device) {
      throw new AppError(404, 'Device not found');
    }

    if (device.verified) {
      return {
        message: 'Device is already verified',
        device: {
          id: device.id,
          deviceId: device.deviceId,
          verified: true,
        },
      };
    }

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: { verified: true },
    });

    return {
      message: 'Device verified successfully',
      device: {
        id: updatedDevice.id,
        deviceId: updatedDevice.deviceId,
        verified: updatedDevice.verified,
        user: {
          id: device.user.id,
          name: device.user.name,
          email: device.user.email,
        },
      },
    };
  }

  async unverifyDevice(deviceId: string) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { user: true },
    });

    if (!device) {
      throw new AppError(404, 'Device not found');
    }

    if (!device.verified) {
      return {
        message: 'Device is already unverified',
        device: {
          id: device.id,
          deviceId: device.deviceId,
          verified: false,
        },
      };
    }

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: { verified: false },
    });

    await prisma.session.deleteMany({
      where: { deviceId: device.id },
    });

    return {
      message: 'Device unverified successfully. All sessions have been invalidated.',
      device: {
        id: updatedDevice.id,
        deviceId: updatedDevice.deviceId,
        verified: updatedDevice.verified,
        user: {
          id: device.user.id,
          name: device.user.name,
          email: device.user.email,
        },
      },
    };
  }

  async getAllCustomers(page: number = 1, limit: number = 20, search?: string) {
    const offset = (page - 1) * limit;

    const where: {
      role: 'USER';
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      role: 'USER',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          devices: {
            select: {
              id: true,
              verified: true,
            },
          },
          accounts: {
            select: {
              balance: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        createdAt: customer.createdAt,
        balance: customer.accounts[0]?.balance.toString() || '0',
        devicesCount: customer.devices.length,
        verifiedDevicesCount: customer.devices.filter((d) => d.verified).length,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        devices: {
          orderBy: { createdAt: 'desc' },
        },
        accounts: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'Customer not found');
    }

    const account = user.accounts[0];

    return {
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        balance: account?.balance.toString() || '0',
      },
      devices: user.devices.map((device) => ({
        id: device.id,
        deviceId: device.deviceId,
        deviceInfo: device.deviceInfo,
        verified: device.verified,
        createdAt: device.createdAt,
      })),
      recentTransactions:
        account?.transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount.toString(),
          description: tx.description,
          createdAt: tx.createdAt,
        })) || [],
    };
  }

  async getAllTransactions(
    page: number = 1,
    limit: number = 20,
    filters?: {
      userId?: string;
      type?: 'DEPOSIT' | 'WITHDRAW';
      startDate?: string;
      endDate?: string;
    },
  ) {
    const offset = (page - 1) * limit;

    const where: {
      accountId?: string;
      type?: 'DEPOSIT' | 'WITHDRAW';
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (filters?.userId) {
      const account = await prisma.account.findUnique({
        where: { userId: filters.userId },
      });
      if (account) {
        where.accountId = account.id;
      }
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        description: tx.description,
        createdAt: tx.createdAt,
        user: tx.account.user,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboardAnalytics() {
    const [totalCustomers, totalDeposits, totalWithdrawals, pendingDevices, recentTransactions] =
      await Promise.all([
        prisma.user.count({
          where: { role: 'USER' },
        }),

        prisma.transaction.aggregate({
          where: { type: 'DEPOSIT' },
          _sum: { amount: true },
          _count: true,
        }),

        prisma.transaction.aggregate({
          where: { type: 'WITHDRAW' },
          _sum: { amount: true },
          _count: true,
        }),

        prisma.device.count({
          where: { verified: false },
        }),

        prisma.transaction.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            account: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    return {
      analytics: {
        totalCustomers,
        totalDeposits: {
          amount: totalDeposits._sum.amount?.toString() || '0',
          count: totalDeposits._count,
        },
        totalWithdrawals: {
          amount: totalWithdrawals._sum.amount?.toString() || '0',
          count: totalWithdrawals._count,
        },
        pendingDevices,
      },
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        description: tx.description,
        createdAt: tx.createdAt,
        user: tx.account.user,
      })),
    };
  }

  async adminLogin(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'Access denied. Admin privileges required.');
    }

    // Use unique deviceId per admin: admin-web-{userId}
    const adminDeviceId = `admin-web-${user.id}`;
    
    let adminDevice = await prisma.device.findFirst({
      where: {
        userId: user.id,
        deviceId: adminDeviceId,
      },
    });

    if (!adminDevice) {
      adminDevice = await prisma.device.create({
        data: {
          userId: user.id,
          deviceId: adminDeviceId,
          deviceInfo: 'Admin Web Console',
          verified: true,
        },
      });
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId: adminDevice.id,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      deviceId: adminDevice.id,
    });

    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        deviceId: adminDevice.id,
        refreshTokenHash,
        expiresAt,
        lastActivityAt: new Date(),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async adminLogout(userId: string) {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  async adminRefreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashToken(refreshToken);

    const session = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        deviceId: payload.deviceId,
        refreshTokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    if (session.user.role !== 'ADMIN') {
      throw new AppError(403, 'Access denied. Admin privileges required.');
    }

    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      deviceId: session.deviceId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: session.user.id,
      deviceId: session.deviceId,
    });

    const newRefreshTokenHash = hashToken(newRefreshToken);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        lastActivityAt: new Date(),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getAdminProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'Access denied. Admin privileges required.');
    }

    return user;
  }
}

export default new AdminService();
