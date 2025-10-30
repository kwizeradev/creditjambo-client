import type { User } from '@/types';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  DEVICE_PENDING: 'device_pending',
  DEVICE_ID: 'device_id',
} as const;

interface DevicePendingState {
  devicePending: boolean;
  deviceId: string | null;
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
  ]);
}

export async function saveUser(user: User): Promise<void> {
  const serializedUser = JSON.stringify(user);
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, serializedUser);
}

export async function getUser(): Promise<User | null> {
  const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

export async function saveDevicePendingState(
  devicePending: boolean,
  deviceId?: string
): Promise<void> {
  const pendingValue = devicePending.toString();
  await SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_PENDING, pendingValue);

  if (deviceId) {
    await SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
}

export async function getDevicePendingState(): Promise<DevicePendingState> {
  const [pendingStr, deviceId] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_PENDING),
    SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_ID),
  ]);

  return {
    devicePending: pendingStr === 'true',
    deviceId,
  };
}

export async function clearDevicePendingState(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.DEVICE_PENDING),
    SecureStore.deleteItemAsync(STORAGE_KEYS.DEVICE_ID),
  ]);
}

export async function clearAllStorage(): Promise<void> {
  await Promise.all([clearTokens(), clearDevicePendingState()]);
}
