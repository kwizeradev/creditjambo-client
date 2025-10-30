import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/lib/constants';
import {
  getAccessToken,
  getDevicePendingState,
} from '@/services/storage.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

const ANIMATION_DURATION = 600;
const FADE_IN_OPACITY = 1;

const LOADING_DELAYS = {
  INITIALIZE: 1200,
  DEVICE_CHECK: 700,
  DEVICE_PENDING: 800,
  AUTH_CHECK: 800,
  WELCOME: 800,
  GETTING_STARTED: 800,
  ERROR_REDIRECT: 500,
} as const;

const STATUS_MESSAGES = {
  INITIALIZING: 'Initializing...',
  CHECKING_DEVICE: 'Checking device status...',
  DEVICE_PENDING: 'Device verification pending...',
  CHECKING_AUTH: 'Checking authentication...',
  WELCOME_BACK: 'Welcome back!',
  GETTING_STARTED: 'Getting started...',
  REDIRECTING: 'Redirecting...',
} as const;

const ROUTES = {
  DEVICE_PENDING: '/device-pending',
  APP: '/(app)',
  SIGN_IN: '/auth/sign-in',
} as const;

SplashScreen.preventAutoHideAsync();

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export default function Index() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // clearAllStorage();

  const startFadeInAnimation = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: FADE_IN_OPACITY,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleDevicePendingFlow = useCallback(
    async (deviceId: string | null) => {
      setStatus(STATUS_MESSAGES.DEVICE_PENDING);
      await delay(LOADING_DELAYS.DEVICE_PENDING);
      setIsReady(true);
      router.replace({
        pathname: ROUTES.DEVICE_PENDING,
        params: { deviceId: deviceId || '' },
      });
    },
    [router]
  );

  const handleAuthenticatedFlow = useCallback(async () => {
    setStatus(STATUS_MESSAGES.WELCOME_BACK);
    await delay(LOADING_DELAYS.WELCOME);
    setIsReady(true);
    router.replace(ROUTES.APP);
  }, [router]);

  const handleUnauthenticatedFlow = useCallback(async () => {
    setStatus(STATUS_MESSAGES.GETTING_STARTED);
    await delay(LOADING_DELAYS.GETTING_STARTED);
    setIsReady(true);
    router.replace(ROUTES.SIGN_IN);
  }, [router]);

  const handleInitializationError = useCallback(async () => {
    setStatus(STATUS_MESSAGES.REDIRECTING);
    await delay(LOADING_DELAYS.ERROR_REDIRECT);
    setIsReady(true);
    router.replace(ROUTES.SIGN_IN);
  }, [router]);

  const startLoadingSequence = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
      startFadeInAnimation();

      setStatus(STATUS_MESSAGES.INITIALIZING);
      await delay(LOADING_DELAYS.INITIALIZE);

      setStatus(STATUS_MESSAGES.CHECKING_DEVICE);
      await delay(LOADING_DELAYS.DEVICE_CHECK);

      const { devicePending, deviceId } = await getDevicePendingState();

      if (devicePending) {
        await handleDevicePendingFlow(deviceId);
        return;
      }

      setStatus(STATUS_MESSAGES.CHECKING_AUTH);
      await delay(LOADING_DELAYS.AUTH_CHECK);

      const token = await getAccessToken();

      if (token) {
        await handleAuthenticatedFlow();
      } else {
        await handleUnauthenticatedFlow();
      }
    } catch {
      await handleInitializationError();
    }
  }, [
    startFadeInAnimation,
    handleDevicePendingFlow,
    handleAuthenticatedFlow,
    handleUnauthenticatedFlow,
    handleInitializationError,
  ]);

  useEffect(() => {
    startLoadingSequence();
  }, [startLoadingSequence]);

  if (isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={64} color="#ffffff" />
        </View>

        <Text style={styles.title}>Credit Jambo</Text>
        <Text style={styles.subtitle}>Savings Management</Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
  },
});
