import authController from '@/controllers/auth.controller';
import { LoginUserSchema, RefreshTokenSchema, RegisterUserSchema, DeviceVerificationCheckSchema } from '@/dtos';
import { asyncHandler, authenticate, validateBody } from '@/middlewares';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new customer account with email, name, and password. This will create a user account and associate a device.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *               - deviceId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               name:
 *                 type: string
 *                 description: User's full name
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 8 characters)
 *               deviceId:
 *                 type: string
 *                 description: Unique device identifier
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     device:
 *                       $ref: '#/components/schemas/Device'
 *                     devicePending:
 *                       type: boolean
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  validateBody(RegisterUserSchema),
  asyncHandler(authController.register.bind(authController)),
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password. If device is not verified, returns device pending status.
 *     tags: [Authentication]
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
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *               deviceId:
 *                 type: string
 *                 description: Device identifier
 *     responses:
 *       200:
 *         description: Login successful or device pending verification
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: success
 *                     message:
 *                       type: string
 *                       example: Login successful
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         tokens:
 *                           $ref: '#/components/schemas/TokenResponse'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: success
 *                     message:
 *                       type: string
 *                       example: Device pending verification
 *                     data:
 *                       type: object
 *                       properties:
 *                         devicePending:
 *                           type: boolean
 *                           example: true
 *                         deviceId:
 *                           type: string
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
router.post(
  '/login',
  validateBody(LoginUserSchema),
  asyncHandler(authController.login.bind(authController)),
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Obtain a new access token using a refresh token
 *     tags: [Authentication]
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
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
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
router.post(
  '/refresh',
  validateBody(RefreshTokenSchema),
  asyncHandler(authController.refresh.bind(authController)),
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate user's current session
 *     tags: [Authentication]
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
router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));

/**
 * @swagger
 * /api/auth/check-device-verification:
 *   post:
 *     summary: Check device verification status
 *     description: Check if a device has been verified by an administrator
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Device identifier to check
 *     responses:
 *       200:
 *         description: Device verification status
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
 *                   example: Device verification status retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: boolean
 *                     deviceId:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/check-device-verification',
  validateBody(DeviceVerificationCheckSchema),
  asyncHandler(authController.checkDeviceVerification.bind(authController)),
);

export default router;