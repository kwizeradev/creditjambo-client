import { describe, expect, it } from 'vitest';
import { withTransaction } from './utils/transaction-test';
import { createTestDbHelper } from './utils/test-db-helper-v2';
import prisma from '../src/config/database';

describe('Transaction Safety Check', () => {
  it('should not persist data after transaction rollback', withTransaction(async ({ prisma: txPrisma }) => {
    const db = createTestDbHelper(txPrisma);
    
    const initialUserCount = await prisma.user.count();
    
    const testUser = await db.createUser({
      name: 'Safety Check User',
      email: `safety-check-${Date.now()}@example.com`,
    });
    
    const userInTransaction = await txPrisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(userInTransaction).toBeTruthy();
    expect(userInTransaction?.name).toBe('Safety Check User');
  }));
  
  it('should verify data was rolled back', async () => {
    // This test runs AFTER the transaction rollback
    // Check that no test users were persisted
    const testUsers = await prisma.user.findMany({
      where: {
        email: { contains: 'safety-check-' }
      }
    });
    
    // Should be empty - all test data rolled back
    expect(testUsers).toHaveLength(0);
  });
  
  it('should not affect existing real data', async () => {
    // Count users before and after to ensure real data is untouched
    const beforeCount = await prisma.user.count();
    
    // Run a transaction test that creates and then rolls back data
    await withTransaction(async ({ prisma: txPrisma }) => {
      const db = createTestDbHelper(txPrisma);
      
      // Create multiple test records
      for (let i = 0; i < 5; i++) {
        await db.createUser({
          name: `Temp User ${i}`,
          email: `temp${i}@example.com`,
        });
      }
      
      // Verify they exist in transaction
      const tempUsers = await txPrisma.user.findMany({
        where: { email: { contains: 'temp' } }
      });
      expect(tempUsers).toHaveLength(5);
    })();
    
    // Check that the count is unchanged after rollback
    const afterCount = await prisma.user.count();
    expect(afterCount).toBe(beforeCount);
    
    // Double-check no temp users persisted
    const persistedTempUsers = await prisma.user.findMany({
      where: { email: { contains: 'temp' } }
    });
    expect(persistedTempUsers).toHaveLength(0);
  });
});