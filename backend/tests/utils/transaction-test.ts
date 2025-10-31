import { PrismaClient } from '../../src/generated/prisma';

export interface TransactionTestContext {
  prisma: PrismaClient;
}

export type TransactionTestFn = (ctx: TransactionTestContext) => Promise<void> | void;

export function withTransaction(testFn: TransactionTestFn) {
  return async () => {
    const prisma = new PrismaClient();

    try {
      await prisma.$transaction(async (transactionPrisma) => {
        const originalPrisma = (global as any).__TEST_PRISMA_INSTANCE__;
        (global as any).__TEST_PRISMA_INSTANCE__ = transactionPrisma;

        const context: TransactionTestContext = {
          prisma: transactionPrisma as PrismaClient,
        };

        try {
          await testFn(context);
        } finally {
          (global as any).__TEST_PRISMA_INSTANCE__ = originalPrisma;
        }

        throw new TransactionRollbackError();
      });
    } catch (error) {
      if (error instanceof TransactionRollbackError) {
        return;
      }
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  };
}

class TransactionRollbackError extends Error {
  constructor() {
    super('Transaction rollback for test isolation');
    this.name = 'TransactionRollbackError';
  }
}

export function withTransactionSafety(testFn: () => Promise<void> | void) {
  return withTransaction(async ({ prisma }) => {
    const originalPrisma = (global as any).prisma;
    (global as any).prisma = prisma;

    try {
      await testFn();
    } finally {
      (global as any).prisma = originalPrisma;
    }
  });
}

export function isInTestTransaction(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}
