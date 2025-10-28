import crypto from 'crypto';

export function hashPassword(
  password: string,
  salt?: string,
): { salt: string; passwordHash: string } {
  const saltBytes = parseInt(process.env.PASSWORD_SALT_BYTES || '16');
  const iterations = parseInt(process.env.PASSWORD_HASH_ITERATIONS || '100000');
  const keyLength = parseInt(process.env.PASSWORD_HASH_LENGTH || '64');

  const usedSalt = salt ?? crypto.randomBytes(saltBytes).toString('hex');
  const passwordHash = crypto
    .pbkdf2Sync(password, usedSalt, iterations, keyLength, 'sha512')
    .toString('hex');

  return { salt: usedSalt, passwordHash };
}

export function verifyPassword(password: string, salt: string, passwordHash: string): boolean {
  const { passwordHash: computedHash } = hashPassword(password, salt);

  if (computedHash.length !== passwordHash.length) {
    return false;
  }

  try {
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(passwordHash, 'hex');

    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch (error) {
    console.error(
      'Password verification error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return false;
  }
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
