import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

const prismaProxy = new Proxy(prisma, {
  get(target, prop, receiver) {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
      const testInstance = (globalThis as any).__TEST_PRISMA_INSTANCE__;
      if (testInstance) {
        return Reflect.get(testInstance, prop, receiver);
      }
    }
    
    return Reflect.get(target, prop, receiver);
  }
});

export default prismaProxy;
