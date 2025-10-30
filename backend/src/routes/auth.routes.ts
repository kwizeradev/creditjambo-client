import authController from '@/controllers/auth.controller';
import { LoginUserSchema, RefreshTokenSchema, RegisterUserSchema, DeviceVerificationCheckSchema } from '@/dtos';
import { asyncHandler, authenticate, validateBody } from '@/middlewares';
import { Router } from 'express';

const router = Router();

router.post(
  '/register',
  validateBody(RegisterUserSchema),
  asyncHandler(authController.register.bind(authController)),
);

router.post(
  '/login',
  validateBody(LoginUserSchema),
  asyncHandler(authController.login.bind(authController)),
);

router.post(
  '/refresh',
  validateBody(RefreshTokenSchema),
  asyncHandler(authController.refresh.bind(authController)),
);

router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));

router.post(
  '/check-device-verification',
  validateBody(DeviceVerificationCheckSchema),
  asyncHandler(authController.checkDeviceVerification.bind(authController)),
);

export default router;
