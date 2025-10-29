import { z } from 'zod';

export const SavePushTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required').max(500, 'Push token too long'),
  platform: z
    .enum(['ios', 'android', 'web'])
    .refine((val) => ['ios', 'android', 'web'].includes(val), {
      message: 'Platform must be ios, android, or web',
    }),
});

export type SavePushTokenInput = z.infer<typeof SavePushTokenSchema>;

export const DeletePushTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required'),
});

export type DeletePushTokenInput = z.infer<typeof DeletePushTokenSchema>;

export interface PushTokenResponse {
  id: string;
  token: string;
  platform: string;
  createdAt: Date;
  updatedAt: Date;
}
