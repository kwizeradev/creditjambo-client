import authController from '@/controllers/auth.controller';
import { RefreshTokenSchema } from '@/dtos';
import { LoginUserSchema, RegisterUserSchema } from '@/dtos/user.dto';
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

export default router;
