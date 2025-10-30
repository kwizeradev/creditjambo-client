import { useMemo } from 'react';

import { calculatePasswordStrength } from '@/lib/utils/password';
import type { PasswordStrength } from '@/types/auth';

export const usePasswordStrength = (password: string): PasswordStrength => {
  return useMemo(() => calculatePasswordStrength(password), [password]);
};
