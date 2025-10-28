import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import {
  toTransactionResponse,
  PaginatedTransactionResponse,
  TransactionQuery,
} from '../dtos/transaction.dto';
import { Prisma } from '@prisma/client';

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
}

export default new AccountService();
