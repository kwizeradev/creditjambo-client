import { DepositInput, TransactionQuery } from '@/dtos/transaction.dto';
import accountService from '@/services/account.service';
import { Request, Response } from 'express';

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

  async deposit(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const data: DepositInput = req.body;

    const result = await accountService.deposit(req.user.userId, data);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        transaction: result.transaction,
        balance: result.balance,
      },
    });
  }
}

export default new AccountController();
