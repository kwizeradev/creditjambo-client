import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
} from '../../src/utils/auth.utils';

describe('Auth Utility', () => {
  describe('hashPassword', () => {
    it('should generate a hash and salt for a password', () => {
      const password = 'TestPassword123!';
      const result = hashPassword(password);

      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('passwordHash');
      expect(result.salt).toHaveLength(32);
      expect(result.passwordHash).toHaveLength(128);
    });

    it('should generate different salts for same password', () => {
      const password = 'TestPassword123!';
      const result1 = hashPassword(password);
      const result2 = hashPassword(password);

      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.passwordHash).not.toBe(result2.passwordHash);
    });

    it('should use provided salt if given', () => {
      const password = 'TestPassword123!';
      const customSalt = 'a'.repeat(32);
      const result = hashPassword(password, customSalt);

      expect(result.salt).toBe(customSalt);
    });

    it('should generate consistent hash for same password and salt', () => {
      const password = 'TestPassword123!';
      const salt = 'fixedsalt123456789012345678901';
      const result1 = hashPassword(password, salt);
      const result2 = hashPassword(password, salt);

      expect(result1.passwordHash).toBe(result2.passwordHash);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', () => {
      const password = 'CorrectPassword123!';
      const { salt, passwordHash } = hashPassword(password);

      const isValid = verifyPassword(password, salt, passwordHash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const password = 'CorrectPassword123!';
      const { salt, passwordHash } = hashPassword(password);

      const isValid = verifyPassword('WrongPassword123!', salt, passwordHash);

      expect(isValid).toBe(false);
    });

    it('should return false for incorrect salt', () => {
      const password = 'TestPassword123!';
      const { passwordHash } = hashPassword(password);
      const wrongSalt = 'b'.repeat(32);

      const isValid = verifyPassword(password, wrongSalt, passwordHash);

      expect(isValid).toBe(false);
    });

    it('should handle empty password', () => {
      const { salt, passwordHash } = hashPassword('');

      const isValid = verifyPassword('', salt, passwordHash);

      expect(isValid).toBe(true);
    });

    it('should be case-sensitive', () => {
      const password = 'TestPassword';
      const { salt, passwordHash } = hashPassword(password);

      const isValid = verifyPassword('testpassword', salt, passwordHash);

      expect(isValid).toBe(false);
    });

    it('should return false for malformed hash (different length)', () => {
      const password = 'TestPassword123!';
      const { salt } = hashPassword(password);
      const malformedHash = 'shortHash';

      const isValid = verifyPassword(password, salt, malformedHash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a random token', () => {
      const token = generateSecureToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
    });

    it('should generate different tokens each time', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should accept custom length', () => {
      const token = generateSecureToken(16);

      expect(token).toHaveLength(32);
    });

    it('should only contain hex characters', () => {
      const token = generateSecureToken();
      const hexPattern = /^[0-9a-f]+$/;

      expect(hexPattern.test(token)).toBe(true);
    });
  });

  describe('hashToken', () => {
    it('should hash a token', () => {
      const token = 'sample-token-12345';
      const hash = hashToken(token);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
    });

    it('should generate consistent hash for same token', () => {
      const token = 'sample-token-12345';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different tokens', () => {
      const token1 = 'sample-token-1';
      const token2 = 'sample-token-2';

      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it('should only contain hex characters', () => {
      const token = 'test-token';
      const hash = hashToken(token);
      const hexPattern = /^[0-9a-f]+$/;

      expect(hexPattern.test(hash)).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('should take reasonable time to hash (computational cost)', () => {
      const password = 'TestPassword123!';
      const startTime = Date.now();

      hashPassword(password);

      const duration = Date.now() - startTime;

      // Should take at least 10ms due to 100,000 iterations
      expect(duration).toBeGreaterThan(10);
    });

    it('should produce hash that looks random', () => {
      const password = 'SimplePassword';
      const { passwordHash } = hashPassword(password);

      expect(passwordHash.toLowerCase()).not.toContain('password');
      expect(passwordHash.toLowerCase()).not.toContain('simple');
    });
  });
});
