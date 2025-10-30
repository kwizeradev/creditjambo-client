import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import React, { useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Button from '@/components/Button';
import Card from '@/components/Card';

import {
  COLORS,
  NOTIFICATION_MESSAGES,
  NOTIFICATION_DURATIONS,
  STATUS_INFO,
} from '@/lib/constants';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useDeviceVerification } from '@/lib/hooks/useDeviceVerification';

import {
  useDeviceAnimations,
  playSuccessAnimation,
} from '@/lib/hooks/useDeviceAnimations';

export default function DevicePending(): React.ReactElement | null {
  const router = useRouter();
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const { refreshAuth } = useAuth();
  const { showNotification } = useNotification();

  const verification = useDeviceVerification({
    deviceId,
    refreshAuth,
    showNotification,
  });

  const animations = useDeviceAnimations(
    verification.isVerified,
    verification.countdown
  );

  React.useEffect(() => {
    if (verification.isVerified) {
      playSuccessAnimation(
        animations.successScaleAnim,
        animations.checkmarkOpacityAnim
      );
    }
  }, [
    verification.isVerified,
    animations.successScaleAnim,
    animations.checkmarkOpacityAnim,
  ]);

  const handleCopyDeviceId = useCallback(async () => {
    if (deviceId) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        showNotification(
          'info',
          'Device ID',
          `ID: ${deviceId}`,
          NOTIFICATION_DURATIONS.DEVICE_INFO
        );
      } catch {
        return;
      }
    }
  }, [deviceId, showNotification]);

  const handleBackToLogin = useCallback(() => {
    Alert.alert(
      'Return to Sign In',
      'Your device verification is still pending. You can sign in again later once approved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Back',
          style: 'default',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  }, [router]);

  const getStatusInfo = useCallback(() => {
    if (verification.isManualChecking) {
      return {
        ...STATUS_INFO.MANUAL_CHECKING,
        color: COLORS.warning,
      };
    }
    if (verification.isAutoChecking || verification.isFetching) {
      return {
        ...STATUS_INFO.AUTO_CHECKING,
        color: COLORS.primary,
      };
    }
    return {
      text: `Next check in ${verification.countdown}s`,
      color: COLORS.textSecondary,
      icon: STATUS_INFO.WAITING.icon,
    };
  }, [
    verification.isManualChecking,
    verification.isAutoChecking,
    verification.isFetching,
    verification.countdown,
  ]);

  const statusInfo = getStatusInfo();

  if (verification.isVerified) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.success, `${COLORS.success}dd`]}
          style={styles.successGradient}
        >
          <Animated.View
            style={[
              styles.successContainer,
              {
                opacity: animations.fadeAnim,
                transform: [
                  { scale: animations.successScaleAnim },
                  { translateY: animations.slideAnim },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.successIconContainer,
                { opacity: animations.checkmarkOpacityAnim },
              ]}
            >
              <View style={styles.successIconWrapper}>
                <Ionicons
                  name="checkmark-circle"
                  size={80}
                  color="#ffffff"
                />
              </View>
            </Animated.View>

            <Text style={styles.successTitle}>Device Verified!</Text>
            <Text style={styles.successMessage}>
              Welcome back. Redirecting to your dashboard...
            </Text>

            <View style={styles.successLoader}>
              <View style={styles.loadingDots}>
                {[0, 1, 2].map(index => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        opacity: animations.shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                        transform: [
                          {
                            scale: animations.shimmerAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.3, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={styles.gradient}
      >
        <View style={styles.safeArea}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: animations.fadeAnim,
                transform: [{ translateY: animations.slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.deviceIconContainer,
                  {
                    transform: [
                      { scale: animations.breatheAnim },
                      { rotate: '0deg' },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
                  style={styles.deviceIconGradient}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={48}
                    color={COLORS.primary}
                  />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.title}>Device Verification</Text>
              <Text style={styles.subtitle}>Security Review in Progress</Text>
            </View>

            <Card style={styles.progressCard} variant="elevated">
              <View style={styles.progressHeader}>
                <View style={styles.statusIndicator}>
                  <Animated.View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: statusInfo.color,
                        transform: [{ scale: animations.breatheAnim }],
                      },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: statusInfo.color }]}
                  >
                    {statusInfo.text}
                  </Text>
                </View>
              </View>

              <View style={styles.countdownContainer}>
                <View style={styles.countdownCircle}>
                  <Animated.View
                    style={[
                      styles.progressRing,
                      {
                        transform: [
                          {
                            rotate: animations.progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <View style={styles.countdownContent}>
                    <Text style={styles.countdownNumber}>
                      {verification.countdown}
                    </Text>
                    <Text style={styles.countdownLabel}>seconds</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.description}>
                Our security team is reviewing your device to ensure your
                account stays safe. You'll be automatically logged in once
                approved.
              </Text>

              {deviceId && (
                <TouchableOpacity
                  style={styles.deviceIdCard}
                  onPress={handleCopyDeviceId}
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceIdHeader}>
                    <Ionicons
                      name="phone-portrait"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.deviceIdLabel}>Device ID</Text>
                  </View>
                  <Text style={styles.deviceId}>{deviceId}</Text>
                  <View style={styles.deviceIdAction}>
                    <Ionicons
                      name="information-circle"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.deviceIdHint}>Tap to view</Text>
                  </View>
                </TouchableOpacity>
              )}
            </Card>

            <View style={styles.actionContainer}>
              <Button
                title={
                  verification.isManualChecking ? 'Checking...' : 'Check Now'
                }
                onPress={verification.handleManualCheck}
                loading={verification.isManualChecking}
                icon="refresh-circle"
                variant="outline"
                size="large"
                style={styles.checkButton}
              />

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToLogin}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.backText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Verification usually takes 1-2 minutes
              </Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceIconContainer: {
    marginBottom: 12,
  },
  deviceIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressCard: {
    marginBottom: 20,
    padding: 0,
  },
  progressHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdownContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  countdownCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  progressRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: `${COLORS.primary}30`,
    borderTopColor: COLORS.primary,
  },
  countdownContent: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  countdownLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deviceIdCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  deviceIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deviceIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  deviceId: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS.text,
    marginBottom: 6,
  },
  deviceIdAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIdHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  actionContainer: {
    gap: 12,
  },
  checkButton: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: `${COLORS.textSecondary}10`,
  },
  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
  successGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successLoader: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
