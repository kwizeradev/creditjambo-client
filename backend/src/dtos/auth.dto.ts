import { z } from 'zod';
import { UserResponse } from './user.dto';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginSuccessResponse {
  user: UserResponse;
  tokens: TokenResponse;
}

export interface LoginPendingResponse {
  devicePending: true;
  deviceId: string;
  message: string;
}

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
