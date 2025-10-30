export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,
} as const;

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const ICON_SIZE = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  xxxl: 80,
} as const;

export const OPACITY = {
  subtle: '02',
  light: '08',
  medium: '15',
  strong: '25',
} as const;

export const QUERY_CONFIG = {
  AUTO_REFRESH_INTERVAL: 60000, // 60 seconds
  TRANSACTION_LIMIT: 10,
  RETRY_COUNT: 2,
} as const;

export const ANIMATION = {
  DURATION_SHORT: 200,
  DURATION_MEDIUM: 300,
  DURATION_LONG: 500,
} as const;
