import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { getDevicePendingState } from '@/services/storage.service';
import { COLORS } from '@/lib/constants';
import { Redirect, Tabs } from 'expo-router';

interface DeviceState {
  devicePending: boolean;
  deviceId: string | null;
}

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [isReady, setIsReady] = useState(false);

  const checkDeviceState = useCallback(async () => {
    try {
      const pendingState = await getDevicePendingState();
      setDeviceState(pendingState);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    checkDeviceState();
  }, [checkDeviceState]);

  if (deviceState?.devicePending) {
    return <Redirect href="/device-pending" />;
  }

  if (isLoading || !isReady) {
    return null;
  }

  if (!user) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: `${COLORS.text}10`,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
