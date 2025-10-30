import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

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
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 65 + insets.bottom : 65,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
