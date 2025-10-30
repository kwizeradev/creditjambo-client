import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import api from './api';

const DEVICE_ID_STORAGE_KEY = 'cjsm_device_id';
const UNKNOWN_DEVICE = 'Unknown Device';
const UNKNOWN_OS = 'Unknown OS';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = (Math.random() * 16) | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function retrieveStoredDeviceId(): Promise<string | null> {
  return await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
}

async function storeDeviceId(deviceId: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_ID_STORAGE_KEY, deviceId);
}

function createDeviceId(): string {
  return Device.osInternalBuildId || generateUUID();
}

export async function getDeviceId(): Promise<string> {
  try {
    const storedDeviceId = await retrieveStoredDeviceId();

    if (storedDeviceId) {
      return storedDeviceId;
    }

    const newDeviceId = createDeviceId();
    await storeDeviceId(newDeviceId);
    return newDeviceId;
  } catch {
    return generateUUID();
  }
}

function formatDeviceInfo(model: string, os: string, version: string): string {
  return `${model} (${os} ${version})`;
}

export async function getDeviceInfo(): Promise<string> {
  const modelName = Device.modelName || UNKNOWN_DEVICE;
  const osName = Device.osName || UNKNOWN_OS;
  const osVersion = Device.osVersion || '';

  return formatDeviceInfo(modelName, osName, osVersion);
}

export async function clearDeviceId(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_ID_STORAGE_KEY);
}

export interface DeviceVerificationResponse {
  verified: boolean;
  deviceId: string;
}

export async function checkDeviceVerification(
  deviceId: string
): Promise<DeviceVerificationResponse> {
  const response = await api.post('/auth/check-device-verification', {
    deviceId,
  });
  return response.data.data;
}
