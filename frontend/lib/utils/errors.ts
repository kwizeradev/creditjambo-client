import { Alert } from 'react-native';
import { z } from 'zod';
import type { AuthError } from '@/types/auth';

export const handleAuthError = (error: unknown): AuthError => {
  if (error instanceof z.ZodError) {
    return {
      message: error.errors[0]?.message || 'Validation error',
      field: error.errors[0]?.path[0]?.toString(),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
};

export const showErrorAlert = (title: string, message: string): void => {
  Alert.alert(title, message, [{ text: 'OK' }]);
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};
