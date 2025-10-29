import prisma from '../../src/config/database';

type ModelName = 'user' | 'account' | 'transaction' | 'pushToken';

interface TestRecord {
  id: string;
  model: ModelName;
}

export class TestDbHelper {
  private records: TestRecord[] = [];
  private static instance: TestDbHelper | null = null;

  static create(): TestDbHelper {
    return new TestDbHelper();
  }

  static getInstance(): TestDbHelper {
    if (!TestDbHelper.instance) {
      TestDbHelper.instance = new TestDbHelper();
    }
    return TestDbHelper.instance;
  }

  track(id: string, model: ModelName): void {
    this.records.push({ id, model });
  }

  trackMultiple(ids: string[], model: ModelName): void {
    ids.forEach((id) => this.track(id, model));
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash?: string;
    salt?: string;
    role?: 'USER' | 'ADMIN';
  }) {
    const user = await prisma.user.create({
      data: {
        passwordHash: 'hash',
        salt: 'salt',
        role: 'USER',
        ...data,
      },
    });
    this.track(user.id, 'user');
    return user;
  }

  async createAccount(data: { userId: string; balance?: number }) {
    const account = await prisma.account.create({
      data: {
        balance: 0,
        ...data,
      },
    });
    this.track(account.id, 'account');
    return account;
  }

  async createTransaction(data: {
    accountId: string;
    type: 'DEPOSIT' | 'WITHDRAW';
    amount: number;
    description?: string;
    createdAt?: Date;
  }) {
    const transaction = await prisma.transaction.create({
      data: {
        description: data.description || `${data.type.toLowerCase()}`,
        ...data,
      },
    });
    this.track(transaction.id, 'transaction');
    return transaction;
  }

  async createPushToken(data: { userId: string; token: string; platform: 'ios' | 'android' }) {
    const pushToken = await prisma.pushToken.create({
      data,
    });
    this.track(pushToken.id, 'pushToken');
    return pushToken;
  }

  async cleanup(): Promise<void> {
    const modelOrder: ModelName[] = ['transaction', 'pushToken', 'account', 'user'];

    for (const model of modelOrder) {
      const recordsForModel = this.records
        .filter((record) => record.model === model)
        .map((record) => record.id);

      if (recordsForModel.length === 0) continue;

      try {
        switch (model) {
          case 'transaction':
            await prisma.transaction.deleteMany({
              where: { id: { in: recordsForModel } },
            });
            break;
          case 'pushToken':
            await prisma.pushToken.deleteMany({
              where: { id: { in: recordsForModel } },
            });
            break;
          case 'account':
            await prisma.account.deleteMany({
              where: { id: { in: recordsForModel } },
            });
            break;
          case 'user':
            await prisma.user.deleteMany({
              where: { id: { in: recordsForModel } },
            });
            break;
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${model} records:`, error);
      }
    }

    this.records = [];
  }

  getRecordCount(model?: ModelName): number {
    if (model) {
      return this.records.filter((record) => record.model === model).length;
    }
    return this.records.length;
  }

  getAllRecords(): TestRecord[] {
    return [...this.records];
  }

  clear(): void {
    this.records = [];
  }
}

export function useTestDb() {
  const helper = TestDbHelper.create();

  return {
    helper,
    cleanup: () => helper.cleanup(),
    track: (id: string, model: ModelName) => helper.track(id, model),
    trackMultiple: (ids: string[], model: ModelName) => helper.trackMultiple(ids, model),
    createUser: (data: Parameters<typeof helper.createUser>[0]) => helper.createUser(data),
    createAccount: (data: Parameters<typeof helper.createAccount>[0]) => helper.createAccount(data),
    createTransaction: (data: Parameters<typeof helper.createTransaction>[0]) =>
      helper.createTransaction(data),
    createPushToken: (data: Parameters<typeof helper.createPushToken>[0]) =>
      helper.createPushToken(data),
  };
}
