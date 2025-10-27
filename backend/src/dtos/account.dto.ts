import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import type { Account } from '../generated/prisma';

export const AccountResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountResponse = z.infer<typeof AccountResponseSchema>;

export function toAccountResponse(account: Account): AccountResponse {
  return {
    id: account.id,
    userId: account.userId,
    balance: account.balance.toString(),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export function toDecimal(value: string | number): Decimal {
  return new Decimal(value);
}

export function formatCurrency(amount: string | Decimal): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount.toNumber();
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
  }).format(numAmount);
}
