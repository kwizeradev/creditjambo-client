import prisma from '@/config/database';
import { AppError } from '@/middlewares/error.middleware';

export async function findOrCreateDevice(
  userId: string,
  deviceId: string,
  deviceInfo = 'Unknown device',
) {
  const existingDevice = await findDevice(deviceId);

  if (existingDevice) {
    validateDeviceOwner(existingDevice.userId, userId);
    return existingDevice;
  }

  return createNewDevice(userId, deviceId, deviceInfo);
}

async function findDevice(deviceId: string) {
  return prisma.device.findUnique({
    where: { deviceId },
  });
}

function validateDeviceOwner(deviceUserId: string, requestUserId: string): void {
  if (deviceUserId !== requestUserId) {
    throw new AppError(403, 'Device registered to different user');
  }
}

async function createNewDevice(userId: string, deviceId: string, deviceInfo: string) {
  return prisma.device.create({
    data: {
      userId,
      deviceId,
      deviceInfo,
      verified: false,
    },
  });
}

export async function validateDeviceOwnership(userId: string, deviceId: string) {
  const device = await findDeviceForValidation(deviceId);

  if (!device) {
    throw new AppError(404, 'Device not found');
  }

  validateDeviceOwner(device.userId, userId);
  return device;
}

async function findDeviceForValidation(deviceId: string) {
  return prisma.device.findUnique({
    where: { deviceId },
    select: { userId: true, verified: true },
  });
}
