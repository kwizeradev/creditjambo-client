import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
});

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  const response: ApiResponse<T> = {
    status: 'success',
    data,
  };

  if (message !== undefined) {
    response.message = message;
  }

  return response;
}

export function errorResponse(message: string, errors?: ValidationError[]): ApiResponse {
  const response: ApiResponse = {
    status: 'error',
    message,
  };

  if (errors !== undefined) {
    response.errors = errors;
  }

  return response;
}

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
