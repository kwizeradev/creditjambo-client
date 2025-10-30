import { useEffect, useRef } from 'react';

import { Animated } from 'react-native';

import { ANIMATION_CONFIG, TIMING_CONFIG } from '@/lib/constants/devicePending';

interface AnimationRefs {
  successScaleAnim: Animated.Value;
  checkmarkOpacityAnim: Animated.Value;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  progressAnim: Animated.Value;
  breatheAnim: Animated.Value;
  shimmerAnim: Animated.Value;
}

export function useDeviceAnimations(
  isVerified: boolean,
  countdown: number
): AnimationRefs {
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const checkmarkOpacityAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_CONFIG.FADE_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: ANIMATION_CONFIG.SLIDE_TENSION,
        friction: ANIMATION_CONFIG.SLIDE_FRICTION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (!isVerified) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: ANIMATION_CONFIG.BREATHE_SCALE,
            duration: ANIMATION_CONFIG.BREATHE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: ANIMATION_CONFIG.BREATHE_DURATION,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isVerified, breatheAnim]);

  useEffect(() => {
    if (!isVerified) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.SHIMMER_DURATION,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isVerified, shimmerAnim]);

  useEffect(() => {
    if (!isVerified) {
      const progress =
        (TIMING_CONFIG.COUNTDOWN_INITIAL - countdown) /
        TIMING_CONFIG.COUNTDOWN_INITIAL;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: ANIMATION_CONFIG.PROGRESS_DURATION,
        useNativeDriver: false,
      }).start();
    }
  }, [countdown, isVerified, progressAnim]);

  return {
    successScaleAnim,
    checkmarkOpacityAnim,
    fadeAnim,
    slideAnim,
    progressAnim,
    breatheAnim,
    shimmerAnim,
  };
}

export function playSuccessAnimation(
  successScaleAnim: Animated.Value,
  checkmarkOpacityAnim: Animated.Value
): void {
  Animated.sequence([
    Animated.parallel([
      Animated.spring(successScaleAnim, {
        toValue: ANIMATION_CONFIG.SUCCESS_SCALE,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkOpacityAnim, {
        toValue: 1,
        duration: ANIMATION_CONFIG.SUCCESS_DURATION,
        useNativeDriver: true,
      }),
    ]),
    Animated.spring(successScaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }),
  ]).start();
}
