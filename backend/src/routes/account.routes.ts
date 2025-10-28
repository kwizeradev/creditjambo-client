import { transactionLimiter } from '@/config/security';
import accountController from '@/controllers/account.controller';
import { DepositSchema, TransactionQuerySchema } from '@/dtos';
import {
  asyncHandler,
  authenticate,
  ensureDeviceVerified,
  validateBody,
  validateQuery,
} from '@/middlewares';

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

router.post(
  '/deposit',
  authenticate,
  ensureDeviceVerified,
  transactionLimiter,
  validateBody(DepositSchema),
  asyncHandler(accountController.deposit.bind(accountController)),
);

export default router;
