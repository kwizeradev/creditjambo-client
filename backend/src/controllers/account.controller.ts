import { Request, Response } from 'express';
import { TransactionQuery } from '@/dtos/transaction.dto';
import accountService from '@/services/account.service';

export class AccountController {
  async getBalance(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const result = await accountService.getAccountBalance(req.user.userId);

    res.status(200).json({
      status: 'success',
      data: {
        balance: result.balance,
        lastUpdated: result.lastUpdated,
      },
    });
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const query = req.query as unknown as TransactionQuery;

    const result = await accountService.getTransactionHistory(req.user.userId, query);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
}

export default new AccountController();
