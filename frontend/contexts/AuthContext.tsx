import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import api, { handleApiError } from '../services/api';
import {
  saveTokens,
  clearTokens,
  getAccessToken,
  saveUser,
  getUser,
} from '../services/storage.service';

import { getDeviceId, getDeviceInfo } from '../services/device.service';
import { User, LoginResponse } from '../types';

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
  const segments = useSegments();

  useEffect(() => {
    loadUser();
  }, []);


  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [user, segments, isLoading]);

  const loadUser = async () => {
    try {
      const token = await getAccessToken();
      const savedUser = await getUser();

      if (token && savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    try {
      const deviceId = await getDeviceId();

      const response = await api.post('/auth/login', {
        email,
        password,
        deviceId,
      });

      const data = response.data.data as LoginResponse;

      
      if (data.devicePending) {
        return data;
      }

      
      if (data.tokens && data.user) {
        await saveTokens(data.tokens.accessToken, data.tokens.refreshToken);
        await saveUser(data.user);
        setUser(data.user);
      }

      return data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    try {
      const deviceId = await getDeviceId();
      const deviceInfo = await getDeviceInfo();

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
  };

  const logout = async () => {
    try {
      
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      
      await clearTokens();
      setUser(null);
      router.replace('/auth/sign-in');
    }
  };

  const refreshAuth = async () => {
    await loadUser();
  };

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