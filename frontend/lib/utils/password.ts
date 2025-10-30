import { COLORS } from '@/lib/constants';
import type { PasswordRequirement, PasswordStrength } from '@/types/auth';

const MIN_PASSWORD_LENGTH = 8;
const STRONG_PASSWORD_THRESHOLD = 4;

const PASSWORD_PATTERNS = {
  LOWERCASE: /[a-z]/,
  UPPERCASE: /[A-Z]/,
  NUMBER: /[0-9]/,
  SPECIAL: /[^A-Za-z0-9]/,
} as const;

interface RequirementRule {
  text: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: readonly RequirementRule[] = [
  {
    text: 'At least 8 characters',
    test: (password: string) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    text: 'One lowercase letter',
    test: (password: string) => PASSWORD_PATTERNS.LOWERCASE.test(password),
  },
  {
    text: 'One uppercase letter',
    test: (password: string) => PASSWORD_PATTERNS.UPPERCASE.test(password),
  },
  {
    text: 'One number',
    test: (password: string) => PASSWORD_PATTERNS.NUMBER.test(password),
  },
  {
    text: 'One special character',
    test: (password: string) => PASSWORD_PATTERNS.SPECIAL.test(password),
  },
] as const;

interface StrengthInfo {
  label: string;
  color: string;
}

function getStrengthInfo(score: number): StrengthInfo {
  if (score <= 2) {
    return { label: 'Weak', color: COLORS.error };
  }

  if (score <= 3) {
    return { label: 'Fair', color: COLORS.warning };
  }

  if (score <= 4) {
    return { label: 'Good', color: COLORS.primary };
  }

  return { label: 'Strong', color: COLORS.success };
}

function createEmptyRequirements(): PasswordRequirement[] {
  return PASSWORD_REQUIREMENTS.map(requirement => ({
    text: requirement.text,
    met: false,
  }));
}

function evaluateRequirements(password: string): PasswordRequirement[] {
  return PASSWORD_REQUIREMENTS.map(requirement => ({
    text: requirement.text,
    met: requirement.test(password),
  }));
}

function calculateScore(requirements: PasswordRequirement[]): number {
  return requirements.filter(requirement => requirement.met).length;
}

function createEmptyStrength(): PasswordStrength {
  return {
    score: 0,
    label: '',
    color: COLORS.border,
    requirements: createEmptyRequirements(),
  };
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return createEmptyStrength();
  }

  const requirements = evaluateRequirements(password);
  const score = calculateScore(requirements);
  const { label, color } = getStrengthInfo(score);

  return {
    score,
    label,
    color,
    requirements,
  };
}

export function isPasswordStrong(password: string): boolean {
  const strength = calculatePasswordStrength(password);
  return strength.score >= STRONG_PASSWORD_THRESHOLD;
}
