import pushController from '@/controllers/push.controller';
import { DeletePushTokenSchema, SavePushTokenSchema } from '@/dtos';
import { asyncHandler, authenticate, ensureDeviceVerified, validateBody } from '@/middlewares';
import { Router } from 'express';

const router = Router();

router.post(
  '/push-token',
  authenticate,
  ensureDeviceVerified,
  validateBody(SavePushTokenSchema),
  asyncHandler(pushController.savePushToken.bind(pushController)),
);

router.delete(
  '/push-token',
  authenticate,
  validateBody(DeletePushTokenSchema),
  asyncHandler(pushController.deletePushToken.bind(pushController)),
);

router.get(
  '/push-tokens',
  authenticate,
  asyncHandler(pushController.getPushTokens.bind(pushController)),
);

export default router;
