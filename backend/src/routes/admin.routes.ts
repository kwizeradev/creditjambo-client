import { Router } from 'express';
import adminController from '@/controllers/admin.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';
import { authLimiter } from '@/config/security';

const router = Router();

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate an admin user with email and password
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - deviceId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin's password
 *               deviceId:
 *                 type: string
 *                 description: Admin device identifier
 *     responses:
 *       200:
 *         description: Admin login successful
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
 *                   example: Admin login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/login', authLimiter, asyncHandler(adminController.login.bind(adminController)));

/**
 * @swagger
 * /api/admin/auth/refresh:
 *   post:
 *     summary: Refresh admin access token
 *     description: Obtain a new access token for admin using a refresh token
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Validation error or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/refresh', asyncHandler(adminController.refreshToken.bind(adminController)));

// All routes after this point require authentication and admin role
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * @swagger
 * /api/admin/auth/logout:
 *   post:
 *     summary: Admin logout
 *     description: Invalidate admin's current session
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logout successful
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/logout', asyncHandler(adminController.logout.bind(adminController)));

/**
 * @swagger
 * /api/admin/auth/profile:
 *   get:
 *     summary: Get admin profile
 *     description: Retrieve the profile information of the authenticated admin
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/auth/profile', asyncHandler(adminController.getProfile.bind(adminController)));

/**
 * @swagger
 * /api/admin/devices:
 *   get:
 *     summary: Get all devices
 *     description: Retrieve a list of all devices with optional filtering
 *     tags: [Admin Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [verified, unverified, all]
 *         description: Filter devices by verification status
 *     responses:
 *       200:
 *         description: Devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/devices', asyncHandler(adminController.getDevices.bind(adminController)));

/**
 * @swagger
 * /api/admin/devices/unverified:
 *   get:
 *     summary: Get unverified devices
 *     description: Retrieve a list of all unverified devices
 *     tags: [Admin Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unverified devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/devices/unverified',
  asyncHandler(adminController.getUnverifiedDevices.bind(adminController)),
);

/**
 * @swagger
 * /api/admin/devices/{deviceId}/verify:
 *   patch:
 *     summary: Verify a device
 *     description: Mark a device as verified
 *     tags: [Admin Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the device to verify
 *     responses:
 *       200:
 *         description: Device verified successfully
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
 *                   example: Device verified successfully
 *                 data:
 *                   $ref: '#/components/schemas/Device'
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
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/devices/:deviceId/verify',
  asyncHandler(adminController.verifyDevice.bind(adminController)),
);

/**
 * @swagger
 * /api/admin/devices/{deviceId}/unverify:
 *   patch:
 *     summary: Unverify a device
 *     description: Mark a device as unverified
 *     tags: [Admin Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the device to unverify
 *     responses:
 *       200:
 *         description: Device unverified successfully
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
 *                   example: Device unverified successfully
 *                 data:
 *                   $ref: '#/components/schemas/Device'
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
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/devices/:deviceId/unverify',
  asyncHandler(adminController.unverifyDevice.bind(adminController)),
);

/**
 * @swagger
 * /api/admin/customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a paginated list of all customers with optional search
 *     tags: [Admin Customers]
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
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter customers by name or email
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
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
router.get('/customers', asyncHandler(adminController.getCustomers.bind(adminController)));

/**
 * @swagger
 * /api/admin/customers/{userId}:
 *   get:
 *     summary: Get customer details
 *     description: Retrieve detailed information about a specific customer
 *     tags: [Admin Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 *                     devices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Device'
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
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
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/customers/:userId',
  asyncHandler(adminController.getCustomerDetails.bind(adminController)),
);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve a paginated list of all transactions with optional filtering
 *     tags: [Admin Transactions]
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
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter transactions by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, WITHDRAW]
 *         description: Filter transactions by type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions to this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
router.get('/transactions', asyncHandler(adminController.getTransactions.bind(adminController)));

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get dashboard analytics
 *     description: Retrieve analytics data for the admin dashboard
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                     totalCustomers:
 *                       type: integer
 *                     totalDevices:
 *                       type: integer
 *                     verifiedDevices:
 *                       type: integer
 *                     totalTransactions:
 *                       type: integer
 *                     totalDeposits:
 *                       type: number
 *                       format: float
 *                     totalWithdrawals:
 *                       type: number
 *                       format: float
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/analytics', asyncHandler(adminController.getAnalytics.bind(adminController)));

export default router;