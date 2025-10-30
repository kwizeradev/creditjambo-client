import { z } from 'zod';
import type { Device, User } from '../generated/prisma';

export const DeviceResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceId: z.string(),
  deviceInfo: z.string().nullable(),
  verified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DeviceVerificationSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  verified: z.boolean(),
});

export const DeviceVerificationCheckSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

export type DeviceResponse = z.infer<typeof DeviceResponseSchema>;
export type DeviceVerificationInput = z.infer<typeof DeviceVerificationSchema>;
export type DeviceVerificationCheckInput = z.infer<typeof DeviceVerificationCheckSchema>;

export function toDeviceResponse(device: Device): DeviceResponse {
  return {
    id: device.id,
    userId: device.userId,
    deviceId: device.deviceId,
    deviceInfo: device.deviceInfo,
    verified: device.verified,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

export function toDeviceWithUserResponse(
  device: Device & { user?: User },
): DeviceResponse & { user?: Pick<User, 'id' | 'name' | 'email'> | undefined } {
  return {
    ...toDeviceResponse(device),
    user: device.user
      ? {
          id: device.user.id,
          name: device.user.name,
          email: device.user.email,
        }
      : undefined,
  };
}
