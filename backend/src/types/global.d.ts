import { PrismaClient } from '../generated/prisma';

declare global {
  var __TEST_PRISMA_INSTANCE__: PrismaClient | undefined;
}

export {};