import accountController from '@/controllers/account.controller';
import { TransactionQuerySchema } from '@/dtos/transaction.dto';
import { authenticate, ensureDeviceVerified } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';
import { validateQuery } from '@/middlewares/validation.middleware';
import { Router } from 'express';

const router = Router();

router.get(
  '/balance',
  authenticate,
  ensureDeviceVerified,
  asyncHandler(accountController.getBalance.bind(accountController)),
);

router.get(
  '/transactions',
  authenticate,
  ensureDeviceVerified,
  validateQuery(TransactionQuerySchema),
  asyncHandler(accountController.getTransactions.bind(accountController)),
);

export default router;
