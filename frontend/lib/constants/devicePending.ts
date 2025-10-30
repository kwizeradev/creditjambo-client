export const ANIMATION_CONFIG = {
  FADE_DURATION: 800,
  SLIDE_TENSION: 50,
  SLIDE_FRICTION: 8,
  BREATHE_DURATION: 2000,
  BREATHE_SCALE: 1.08,
  SHIMMER_DURATION: 1500,
  PROGRESS_DURATION: 500,
  SUCCESS_SCALE: 1.2,
  SUCCESS_DURATION: 600,
} as const;

export const TIMING_CONFIG = {
  COUNTDOWN_INITIAL: 30,
  COUNTDOWN_RESET: 30,
  REFETCH_INTERVAL: 30000,
  VERIFICATION_REDIRECT_DELAY: 2000,
  INITIAL_VERIFICATION_DELAY: 1000,
  MAX_RETRY_COUNT: 3,
} as const;

export const NOTIFICATION_MESSAGES = {
  STATUS_REFRESHED_TITLE: 'Status Refreshed',
  STATUS_REFRESHED_MESSAGE: 'Checking verification status...',
  CHECK_FAILED_TITLE: 'Check Failed',
  CHECK_FAILED_MESSAGE: 'Unable to refresh status. Will retry automatically.',
  SIGN_OUT_TITLE: 'Sign Out',
  SIGN_OUT_MESSAGE:
    "Return to sign in? You'll need to verify your device again.",
} as const;

export const NOTIFICATION_DURATIONS = {
  SUCCESS: 3000,
  STATUS_REFRESH: 2000,
  ERROR: 3000,
  DEVICE_INFO: 4000,
} as const;

export const STORAGE_KEYS = {
  USER_EMAIL: 'userEmail',
  USER_PASSWORD: 'userPassword',
} as const;

export const ROUTES = {
  APP: '/(app)/',
  SIGN_IN: '/auth/sign-in',
} as const;

export const STATUS_INFO = {
  MANUAL_CHECKING: {
    text: 'Checking now...',
    icon: 'refresh' as const,
  },
  AUTO_CHECKING: {
    text: 'Auto-checking...',
    icon: 'search' as const,
  },
  WAITING: {
    icon: 'time' as const,
  },
} as const;
