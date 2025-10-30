import { Alert } from 'react-native';

import type { AuthError } from '@/types/auth';
import { z } from 'zod';

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred';
const VALIDATION_ERROR_MESSAGE = 'Validation error';
const ALERT_BUTTON_TEXT = 'OK';

function extractZodErrorDetails(zodError: z.ZodError): AuthError {
  const firstError = zodError.errors[0];

  return {
    message: firstError?.message || VALIDATION_ERROR_MESSAGE,
    field: firstError?.path[0]?.toString(),
  };
}

function createAuthError(message: string, field?: string): AuthError {
  return { message, field };
}

export function handleAuthError(error: unknown): AuthError {
  if (error instanceof z.ZodError) {
    return extractZodErrorDetails(error);
  }

  if (error instanceof Error) {
    return createAuthError(error.message);
  }

  return createAuthError(DEFAULT_ERROR_MESSAGE);
}

export function showErrorAlert(title: string, message: string): void {
  Alert.alert(title, message, [{ text: ALERT_BUTTON_TEXT }]);
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return DEFAULT_ERROR_MESSAGE;
}
