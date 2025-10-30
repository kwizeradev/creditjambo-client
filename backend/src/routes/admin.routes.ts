import { Router } from 'express';
import adminController from '@/controllers/admin.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/devices', asyncHandler(adminController.getDevices.bind(adminController)));

router.get(
  '/devices/unverified',
  asyncHandler(adminController.getUnverifiedDevices.bind(adminController)),
);

router.patch(
  '/devices/:deviceId/verify',
  asyncHandler(adminController.verifyDevice.bind(adminController)),
);

router.patch(
  '/devices/:deviceId/unverify',
  asyncHandler(adminController.unverifyDevice.bind(adminController)),
);

router.get('/customers', asyncHandler(adminController.getCustomers.bind(adminController)));

router.get(
  '/customers/:userId',
  asyncHandler(adminController.getCustomerDetails.bind(adminController)),
);

router.get('/transactions', asyncHandler(adminController.getTransactions.bind(adminController)));

router.get('/analytics', asyncHandler(adminController.getAnalytics.bind(adminController)));

export default router;
