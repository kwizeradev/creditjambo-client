import crypto from 'crypto';

/**
 * Hash password using SHA-512 with PBKDF2 (100,000 iterations).
 * PBKDF2 adds computational cost to defend against brute-force attacks.
 *
 * @param password - Plain text password
 * @param salt - Optional salt (generates random 16-byte salt if not provided)
 * @returns Object containing salt and hashed password
 */
export function hashPassword(
  password: string,
  salt?: string,
): { salt: string; passwordHash: string } {
  const usedSalt = salt ?? crypto.randomBytes(16).toString('hex');

  const passwordHash = crypto.pbkdf2Sync(password, usedSalt, 100000, 64, 'sha512').toString('hex');

  return { salt: usedSalt, passwordHash };
}

/**
 * Verify password against stored hash using constant-time comparison.
 * Protects against timing attacks.
 *
 * @param password - Plain text password to verify
 * @param salt - Salt used during hashing
 * @param passwordHash - Stored password hash
 * @returns true if password matches, false otherwise
 */
export function verifyPassword(password: string, salt: string, passwordHash: string): boolean {
  const { passwordHash: computedHash } = hashPassword(password, salt);

  if (computedHash.length !== passwordHash.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(passwordHash, 'hex'),
    );
  } catch (e) {
    console.error('Error during password verification:', e);
    return false;
  }
}

/**
 * Generate a cryptographically secure random token.
 * Useful for refresh tokens, verification codes, etc.
 *
 * @param length - Number of random bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token (like refresh token) for storage.
 *
 * @param token - Token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
