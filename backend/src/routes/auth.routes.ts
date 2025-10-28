import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { validateBody } from '@/middlewares/validation.middleware';
import { RegisterUserSchema } from '@/dtos/user.dto';
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

export default router;
