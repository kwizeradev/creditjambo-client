import { useCallback, useEffect, useState } from 'react';

import type { NotificationType } from '@/components/Notification';
import {
  NOTIFICATION_DURATIONS,
  NOTIFICATION_MESSAGES,
  ROUTES,
  TIMING_CONFIG,
  STORAGE_KEYS,
} from '@/lib/constants/devicePending';
import { checkDeviceVerification } from '@/services/device.service';
import { showDeviceVerifiedNotification } from '@/services/notifications.service';
import { clearDevicePendingState } from '@/services/storage.service';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '@/services/api';

interface UseDeviceVerificationProps {
  deviceId: string | undefined;
  refreshAuth: () => Promise<void>;
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => void;
}

interface UseDeviceVerificationReturn {
  isVerified: boolean;
  isManualChecking: boolean;
  isAutoChecking: boolean;
  countdown: number;
  isFetching: boolean;
  handleManualCheck: () => Promise<void>;
}

export function useDeviceVerification({
  deviceId,
  refreshAuth,
  showNotification,
}: UseDeviceVerificationProps): UseDeviceVerificationReturn {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [countdown, setCountdown] = useState<number>(
    TIMING_CONFIG.COUNTDOWN_INITIAL
  );
  const [isAutoChecking, setIsAutoChecking] = useState(false);

  const handleDeviceVerified = useCallback(async () => {
    setIsVerified(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await showDeviceVerifiedNotification();
    await clearDevicePendingState();

    setTimeout(() => {
      router.replace(ROUTES.APP);
    }, TIMING_CONFIG.VERIFICATION_REDIRECT_DELAY);
  }, [router, showNotification, refreshAuth]);

  const checkIfAlreadyVerified = useCallback(async () => {
    try {
      if (!deviceId) {
        return;
      }

      const data = await checkDeviceVerification(deviceId);

      if (data.verified) {
        setIsVerified(true);
        await refreshAuth();
        setTimeout(() => {
          router.replace(ROUTES.APP);
        }, TIMING_CONFIG.INITIAL_VERIFICATION_DELAY);
      }
    } catch {
      return;
    }
  }, [deviceId, refreshAuth, router]);

  useEffect(() => {
    checkIfAlreadyVerified();
  }, [checkIfAlreadyVerified]);

  const {
    data: verificationData,
    refetch,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['device-status', deviceId],
    queryFn: async () => {
      if (!deviceId) {
        return null;
      }

      setIsAutoChecking(true);

      try {
        const data = await checkDeviceVerification(deviceId);

        setCountdown(TIMING_CONFIG.COUNTDOWN_RESET);
        setIsAutoChecking(false);

        if (data.verified) {
          await handleDeviceVerified();
          return data;
        }

        return data;
      } catch (error) {
        setCountdown(TIMING_CONFIG.COUNTDOWN_RESET);
        setIsAutoChecking(false);
        throw error;
      }
    },
    refetchInterval: isVerified ? false : TIMING_CONFIG.REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
    enabled: !!deviceId && !isVerified,
    retry: (failureCount, error) => {
      if (failureCount >= TIMING_CONFIG.MAX_RETRY_COUNT) {
        return false;
      }
      return true;
    },
    retryDelay: 2000,
  });

  useEffect(() => {
    if (error) {
      setIsAutoChecking(false);
    }
  }, [error]);

  useEffect(() => {
    if (
      verificationData &&
      verificationData.verified &&
      !isVerified
    ) {
      handleDeviceVerified();
    }
  }, [verificationData, isVerified, handleDeviceVerified]);

  useEffect(() => {
    if (isVerified || isAutoChecking || isManualChecking) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown(previousCount => {
        if (previousCount <= 1) {
          // Trigger refetch when countdown reaches 0
          refetch();
          return TIMING_CONFIG.COUNTDOWN_RESET;
        }
        return previousCount - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerified, isAutoChecking, isManualChecking, refetch]);

  const handleManualCheck = useCallback(async () => {
    setIsManualChecking(true);
    setCountdown(TIMING_CONFIG.COUNTDOWN_RESET);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await refetch();

      showNotification(
        'success',
        NOTIFICATION_MESSAGES.STATUS_REFRESHED_TITLE,
        NOTIFICATION_MESSAGES.STATUS_REFRESHED_MESSAGE,
        NOTIFICATION_DURATIONS.STATUS_REFRESH
      );
    } catch {
      showNotification(
        'error',
        NOTIFICATION_MESSAGES.CHECK_FAILED_TITLE,
        NOTIFICATION_MESSAGES.CHECK_FAILED_MESSAGE,
        NOTIFICATION_DURATIONS.ERROR
      );
    } finally {
      setIsManualChecking(false);
    }
  }, [refetch, showNotification]);

  return {
    isVerified,
    isManualChecking,
    isAutoChecking,
    countdown,
    isFetching,
    handleManualCheck,
  };
}
