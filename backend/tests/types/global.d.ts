import { PrismaClient } from '../../src/generated/prisma';

declare global {
  var __TEST_PRISMA_INSTANCE__: PrismaClient | undefined;
  var prisma: PrismaClient | undefined;
}

export {};