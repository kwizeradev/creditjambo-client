import { useCallback, useEffect } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemedStatusBar from '@/components/ThemedStatusBar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';

const NOTIFICATION_HANDLER_CONFIG = {
  shouldShowAlert: true,
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => NOTIFICATION_HANDLER_CONFIG,
});

const QUERY_RETRY_COUNT = 2;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      refetchOnWindowFocus: false,
    },
  },
});

export const unstable_settings = {
  initialRouteName: 'index',
};

const PERMISSION_GRANTED = 'granted';

async function requestNotificationPermissions(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== PERMISSION_GRANTED) {
    return;
  }
}

export default function RootLayout() {
  const initializeNotifications = useCallback(async () => {
    await requestNotificationPermissions();
  }, []);

  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="device-pending" />
              <Stack.Screen name="(app)" />
            </Stack>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
