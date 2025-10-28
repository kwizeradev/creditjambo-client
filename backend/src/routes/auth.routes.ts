import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { validateBody } from '@/middlewares/validation.middleware';
import { LoginUserSchema, RegisterUserSchema } from '@/dtos/user.dto';
import { asyncHandler } from '@/middlewares/error.middleware';
import { RefreshTokenSchema } from '@/dtos';

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

export default router;
