import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import api from '@/services/api';
import { handleApiError } from '@/services/api';
import { getDeviceId, getDeviceInfo } from '@/services/device.service';
import {
  clearDevicePendingState,
  clearTokens,
  getAccessToken,
  getDevicePendingState,
  getUser,
  saveDevicePendingState,
  saveTokens,
  saveUser,
} from '@/services/storage.service';
import type { LoginResponse, User } from '@/types';
import { useRouter } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const { devicePending } = await getDevicePendingState();

      if (devicePending) {
        setUser(null);
        return;
      }

      const [token, savedUser] = await Promise.all([
        getAccessToken(),
        getUser(),
      ]);

      if (token && savedUser) {
        setUser(savedUser);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      try {
        const deviceId = await getDeviceId();

        const response = await api.post('/auth/login', {
          email,
          password,
          deviceId,
        });

        const data = response.data.data as LoginResponse;

        if (data.devicePending) {
          await Promise.all([
            clearTokens(),
            saveDevicePendingState(true, data.deviceId),
          ]);
          setUser(null);
          return data;
        }

        if (data.tokens && data.user) {
          await Promise.all([
            saveTokens(data.tokens.accessToken, data.tokens.refreshToken),
            saveUser(data.user),
            clearDevicePendingState(),
          ]);
          setUser(data.user);
        }

        return data;
      } catch (error) {
        await clearDevicePendingState();
        throw new Error(handleApiError(error));
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      try {
        const [deviceId, deviceInfo] = await Promise.all([
          getDeviceId(),
          getDeviceInfo(),
        ]);

        await api.post('/auth/register', {
          name,
          email,
          password,
          deviceId,
          deviceInfo,
        });
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      await clearTokens();
      setUser(null);
      router.replace('/auth/sign-in');
    }
  }, [router]);

  const refreshAuth = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
