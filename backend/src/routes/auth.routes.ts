import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { validateBody } from '@/middlewares/validation.middleware';
import { LoginUserSchema, RegisterUserSchema } from '@/dtos/user.dto';
import { asyncHandler } from '@/middlewares/error.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with device
 * @access  Public
 *
 * @body {
 *   name: string (min 2 chars),
 *   email: string (valid email),
 *   password: string (min 8 chars, 1 number, 1 uppercase),
 *   deviceId?: string (optional),
 *   deviceInfo?: string (optional)
 * }
 *
 * @returns {
 *   status: 'success',
 *   data: {
 *     user: UserResponse,
 *     device: { id, deviceId, verified },
 *     devicePending: boolean
 *   }
 * }
 *
 * @throws 409 - Email already registered
 * @throws 400 - Validation error
 */

router.post(
  '/register',
  validateBody(RegisterUserSchema),
  asyncHandler(authController.register.bind(authController)),
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with device verification check
 * @access  Public
 *
 * @body {
 *   email: string,
 *   password: string,
 *   deviceId: string
 * }
 *
 * @returns {
 *   devicePending: true  // If device not verified
 * } OR {
 *   user: UserResponse,
 *   tokens: { accessToken, refreshToken }  // If device verified
 * }
 *
 * @throws 401 - Invalid credentials
 * @throws 403 - Device registered to different user
 */

router.post(
  '/login',
  validateBody(LoginUserSchema),
  asyncHandler(authController.login.bind(authController)),
);
export default router;
