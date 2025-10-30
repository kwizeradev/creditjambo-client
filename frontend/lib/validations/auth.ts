import { z } from 'zod';

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;

const VALIDATION_MESSAGES = {
  NAME_TOO_SHORT: 'Name must be at least 2 characters',
  NAME_TOO_LONG: 'Name must not exceed 100 characters',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number',
  PASSWORD_MISSING_UPPERCASE:
    'Password must contain at least one uppercase letter',
  PASSWORD_REQUIRED: 'Password is required',
  VALIDATION_ERROR: 'Validation error',
} as const;

const PASSWORD_PATTERNS = {
  NUMBER: /[0-9]/,
  UPPERCASE: /[A-Z]/,
} as const;

export const signUpSchema = z.object({
  name: z
    .string()
    .min(NAME_MIN_LENGTH, VALIDATION_MESSAGES.NAME_TOO_SHORT)
    .max(NAME_MAX_LENGTH, VALIDATION_MESSAGES.NAME_TOO_LONG)
    .trim(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(VALIDATION_MESSAGES.INVALID_EMAIL),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_TOO_SHORT)
    .regex(
      PASSWORD_PATTERNS.NUMBER,
      VALIDATION_MESSAGES.PASSWORD_MISSING_NUMBER
    )
    .regex(
      PASSWORD_PATTERNS.UPPERCASE,
      VALIDATION_MESSAGES.PASSWORD_MISSING_UPPERCASE
    ),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(VALIDATION_MESSAGES.INVALID_EMAIL),
  password: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

function extractFirstErrorMessage(error: z.ZodError): string {
  return error.errors[0]?.message || VALIDATION_MESSAGES.VALIDATION_ERROR;
}

export function validateField<T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>,
  field: keyof T,
  value: unknown
): string | undefined {
  try {
    const fieldValidation = schema.shape[field as string];

    if (!fieldValidation) {
      return undefined;
    }

    fieldValidation.parse(value);
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return extractFirstErrorMessage(error);
    }
    return VALIDATION_MESSAGES.VALIDATION_ERROR;
  }
}
