import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@/generated/prisma';

let globalPrisma: PrismaClient;

beforeAll(async () => {
  globalPrisma = new PrismaClient({
    log: ['warn', 'error'],
  });

  try {
    await globalPrisma.$connect();
    console.log('✅ Database connection established for tests');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
});

afterAll(async () => {
  if (globalPrisma) {
    await globalPrisma.$disconnect();
    console.log('✅ Database connection closed');
  }
});

export { globalPrisma };

export const testConfig = {
  dbTimeout: 10000,
  logTransactions: process.env.TEST_LOG_TRANSACTIONS === 'true',
  isTestEnvironment: process.env.NODE_ENV === 'test' || process.env.VITEST === 'true',
};

if (!testConfig.isTestEnvironment) {
  console.warn('⚠️  Warning: Tests may be running outside test environment');
}