import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/config/database';
import {
  DepositInput,
  formatCurrency,
  PaginatedTransactionResponse,
  toTransactionResponse,
  TransactionQuery,
  WithdrawInput,
} from '@/dtos';
import { AppError } from '@/middlewares/error.middleware';

export class AccountService {
  async getAccountBalance(userId: string) {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: {
        id: true,
        balance: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    return {
      balance: account.balance.toString(),
      lastUpdated: account.updatedAt,
    };
  }

  async getTransactionHistory(
    userId: string,
    query: TransactionQuery,
  ): Promise<PaginatedTransactionResponse> {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    const { limit = 20, page = 1, type, startDate, endDate } = query;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const offset = (pageNum - 1) * limitNum;

    const where: Prisma.TransactionClient = {
      accountId: account.id,
    };

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const total = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    });

    return {
      transactions: transactions.map(toTransactionResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async deposit(userId: string, data: DepositInput) {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true, balance: true },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          type: 'DEPOSIT',
          amount: new Decimal(data.amount),
          description: data.description || 'Deposit',
        },
      });

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: new Decimal(data.amount),
          },
        },
      });

      return {
        transaction,
        newBalance: updatedAccount.balance,
      };
    });

    return {
      transaction: toTransactionResponse(result.transaction),
      balance: result.newBalance.toString(),
      message: 'Deposit successful',
    };
  }

  async withdraw(userId: string, data: WithdrawInput) {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true, balance: true },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    const withdrawAmount = new Decimal(data.amount);
    if (account.balance.lessThan(withdrawAmount)) {
      throw new AppError(
        409,
        `Insufficient funds. Available balance: ${formatCurrency(account.balance)}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          type: 'WITHDRAW',
          amount: withdrawAmount,
          description: data.description || 'Withdrawal',
        },
      });

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            decrement: withdrawAmount,
          },
        },
      });

      return {
        transaction,
        newBalance: updatedAccount.balance,
      };
    });

    return {
      transaction: toTransactionResponse(result.transaction),
      balance: result.newBalance.toString(),
      message: 'Withdrawal successful',
    };
  }
}

export default new AccountService();
