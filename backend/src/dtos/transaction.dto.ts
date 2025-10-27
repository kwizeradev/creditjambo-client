import { z } from 'zod';
import type { Transaction, Account } from '../generated/prisma';

export const DepositSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount cannot exceed 1,000,000 RWF')
    .refine((val) => Number(val.toFixed(2)) === val, 'Amount can only have up to 2 decimal places'),
  description: z.string().max(255, 'Description must not exceed 255 characters').trim().optional(),
});

export const WithdrawSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount cannot exceed 1,000,000 RWF')
    .refine((val) => Number(val.toFixed(2)) === val, 'Amount can only have up to 2 decimal places'),
  description: z.string().max(255, 'Description must not exceed 255 characters').trim().optional(),
});

export const TransactionResponseSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  type: z.enum(['DEPOSIT', 'WITHDRAW']),
  amount: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
});

export const TransactionQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1)),
  type: z.enum(['DEPOSIT', 'WITHDRAW', 'ALL']).optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

export type DepositInput = z.infer<typeof DepositSchema>;
export type WithdrawInput = z.infer<typeof WithdrawSchema>;
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;

export interface PaginatedTransactionResponse {
  transactions: TransactionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function toTransactionResponse(transaction: Transaction): TransactionResponse {
  return {
    id: transaction.id,
    accountId: transaction.accountId,
    type: transaction.type,
    amount: transaction.amount.toString(),
    description: transaction.description,
    createdAt: transaction.createdAt,
  };
}

export function toTransactionWithAccountResponse(transaction: Transaction & { account?: Account }) {
  return {
    ...toTransactionResponse(transaction),
    account: transaction.account
      ? {
          id: transaction.account.id,
          userId: transaction.account.userId,
        }
      : undefined,
  };
}
