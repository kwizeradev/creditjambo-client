import { transactionLimiter } from '@/config/security';
import accountController from '@/controllers/account.controller';
import { DepositSchema, TransactionQuerySchema, WithdrawSchema } from '@/dtos';
import {
  asyncHandler,
  authenticate,
  ensureDeviceVerified,
  validateBody,
  validateQuery,
} from '@/middlewares';

import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/account/balance:
 *   get:
 *     summary: Get account balance
 *     description: Retrieve the current balance of the authenticated user's account
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       format: float
 *                       example: 1500.50
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/balance',
  authenticate,
  ensureDeviceVerified,
  asyncHandler(accountController.getBalance.bind(accountController)),
);

/**
 * @swagger
 * /api/account/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Retrieve the transaction history for the authenticated user's account
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, WITHDRAW]
 *         description: Filter transactions by type
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/transactions',
  authenticate,
  ensureDeviceVerified,
  validateQuery(TransactionQuerySchema),
  asyncHandler(accountController.getTransactions.bind(accountController)),
);

/**
 * @swagger
 * /api/account/deposit:
 *   post:
 *     summary: Make a deposit
 *     description: Deposit funds into the authenticated user's account
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Amount to deposit
 *               description:
 *                 type: string
 *                 description: Optional description for the deposit
 *     responses:
 *       200:
 *         description: Deposit successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Deposit successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     balance:
 *                       type: number
 *                       format: float
 *                       example: 1500.50
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/deposit',
  authenticate,
  ensureDeviceVerified,
  transactionLimiter,
  validateBody(DepositSchema),
  asyncHandler(accountController.deposit.bind(accountController)),
);

/**
 * @swagger
 * /api/account/withdraw:
 *   post:
 *     summary: Make a withdrawal
 *     description: Withdraw funds from the authenticated user's account
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Amount to withdraw
 *               description:
 *                 type: string
 *                 description: Optional description for the withdrawal
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Withdrawal successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     balance:
 *                       type: number
 *                       format: float
 *                       example: 1500.50
 *       400:
 *         description: Validation error or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/withdraw',
  authenticate,
  ensureDeviceVerified,
  transactionLimiter,
  validateBody(WithdrawSchema),
  asyncHandler(accountController.withdraw.bind(accountController)),
);

export default router;