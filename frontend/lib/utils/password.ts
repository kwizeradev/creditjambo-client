import { COLORS } from '@/constants/configs';
import type { PasswordStrength, PasswordRequirement } from '@/types/auth';

const PASSWORD_REQUIREMENTS = [
  {
    text: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    text: 'One lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    text: 'One uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    text: 'One number',
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    text: 'One special character',
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

export const calculatePasswordStrength = (
  password: string
): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      label: '',
      color: COLORS.border,
      requirements: PASSWORD_REQUIREMENTS.map(req => ({
        text: req.text,
        met: false,
      })),
    };
  }

  const requirements: PasswordRequirement[] = PASSWORD_REQUIREMENTS.map(
    req => ({
      text: req.text,
      met: req.test(password),
    })
  );

  const score = requirements.filter(req => req.met).length;

  const getStrengthInfo = (score: number) => {
    if (score <= 2) return { label: 'Weak', color: COLORS.error };
    if (score <= 3) return { label: 'Fair', color: COLORS.warning };
    if (score <= 4) return { label: 'Good', color: COLORS.primary };
    return { label: 'Strong', color: COLORS.success };
  };

  const { label, color } = getStrengthInfo(score);

  return {
    score,
    label,
    color,
    requirements,
  };
};

export const isPasswordStrong = (password: string): boolean => {
  const strength = calculatePasswordStrength(password);
  return strength.score >= 4;
};
