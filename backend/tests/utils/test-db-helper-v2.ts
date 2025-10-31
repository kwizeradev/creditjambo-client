import { PrismaClient } from '../../src/generated/prisma';

export class TransactionTestDbHelper {
  private prisma: PrismaClient;
  private createdRecords: Array<{ type: string; id: string }> = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash?: string;
    salt?: string;
    role?: 'USER' | 'ADMIN';
  }) {
    const user = await this.prisma.user.create({
      data: {
        passwordHash: 'test-hash',
        salt: 'test-salt',
        role: 'USER',
        ...data,
      },
    });
    
    this.trackRecord('user', user.id);
    return user;
  }

  async createAccount(data: { userId: string; balance?: number }) {
    const account = await this.prisma.account.create({
      data: {
        balance: 0,
        ...data,
      },
    });
    
    this.trackRecord('account', account.id);
    return account;
  }

  async createTransaction(data: {
    accountId: string;
    type: 'DEPOSIT' | 'WITHDRAW';
    amount: number;
    description?: string;
    createdAt?: Date;
  }) {
    const transaction = await this.prisma.transaction.create({
      data: {
        description: data.description || `Test ${data.type.toLowerCase()}`,
        ...data,
      },
    });
    
    this.trackRecord('transaction', transaction.id);
    return transaction;
  }

  async createDevice(data: {
    userId: string;
    deviceId?: string;
    deviceInfo?: string;
    verified?: boolean;
  }) {
    const device = await this.prisma.device.create({
      data: {
        deviceId: data.deviceId || `test-device-${Date.now()}-${Math.random()}`,
        deviceInfo: data.deviceInfo || 'Test Device',
        verified: data.verified ?? false,
        userId: data.userId,
      },
    });
    
    this.trackRecord('device', device.id);
    return device;
  }

  async createSession(data: {
    userId: string;
    deviceId: string;
    refreshTokenHash?: string;
    expiresAt?: Date;
  }) {
    const session = await this.prisma.session.create({
      data: {
        refreshTokenHash: data.refreshTokenHash || `test-token-${Date.now()}`,
        expiresAt: data.expiresAt || new Date(Date.now() + 86400000),
        userId: data.userId,
        deviceId: data.deviceId,
      },
    });
    
    this.trackRecord('session', session.id);
    return session;
  }

  async createPushToken(data: { 
    userId: string; 
    token: string; 
    platform: 'ios' | 'android' 
  }) {
    const pushToken = await this.prisma.pushToken.create({
      data,
    });
    
    this.trackRecord('pushToken', pushToken.id);
    return pushToken;
  }

  private trackRecord(type: string, id: string): void {
    this.createdRecords.push({ type, id });
  }

  getCreatedCount(type?: string): number {
    if (type) {
      return this.createdRecords.filter(record => record.type === type).length;
    }
    return this.createdRecords.length;
  }

  getCreatedRecords(): Array<{ type: string; id: string }> {
    return [...this.createdRecords];
  }

  clearTracking(): void {
    this.createdRecords = [];
  }
}

export function createTestDbHelper(prisma: PrismaClient): TransactionTestDbHelper {
  return new TransactionTestDbHelper(prisma);
}

export function useTestDbV2() {
  const globalPrisma = new PrismaClient();
  const helper = new TransactionTestDbHelper(globalPrisma);
  
  return {
    helper,
    createUser: (data: Parameters<typeof helper.createUser>[0]) => helper.createUser(data),
    createAccount: (data: Parameters<typeof helper.createAccount>[0]) => helper.createAccount(data),
    createTransaction: (data: Parameters<typeof helper.createTransaction>[0]) => helper.createTransaction(data),
    createDevice: (data: Parameters<typeof helper.createDevice>[0]) => helper.createDevice(data),
    createSession: (data: Parameters<typeof helper.createSession>[0]) => helper.createSession(data),
    createPushToken: (data: Parameters<typeof helper.createPushToken>[0]) => helper.createPushToken(data),
    cleanup: async () => {
      await globalPrisma.$disconnect();
    },
  };
}