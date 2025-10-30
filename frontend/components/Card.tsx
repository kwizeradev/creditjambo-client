import React from 'react';

import {
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { useTheme } from '@/lib/hooks/useTheme';

type CardPadding = 'small' | 'medium' | 'large';
type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: CardPadding;
  variant?: CardVariant;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  outlined: {
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  smallPadding: {
    padding: 16,
  },
  mediumPadding: {
    padding: 24,
  },
  largePadding: {
    padding: 32,
  },
});

const PADDING_STYLES: Record<CardPadding, ViewStyle> = {
  small: styles.smallPadding,
  medium: styles.mediumPadding,
  large: styles.largePadding,
};

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: styles.default,
  elevated: styles.elevated,
  outlined: styles.outlined,
};

function getCardStyles(
  padding: CardPadding,
  variant: CardVariant,
  customStyle?: StyleProp<ViewStyle>
): StyleProp<ViewStyle> {
  return [
    styles.card,
    PADDING_STYLES[padding],
    VARIANT_STYLES[variant],
    customStyle,
  ];
}

function Card({
  children,
  style,
  padding = 'medium',
  variant = 'default',
  ...props
}: CardProps): React.ReactElement {
  const { theme } = useTheme();
  const cardStyles = getCardStyles(padding, variant, style);
  
  const themeStyles = {
    backgroundColor: theme.colors.surface,
    ...(variant === 'outlined' && { borderColor: theme.colors.border }),
  };

  return (
    <View style={[cardStyles, themeStyles]} {...props}>
      {children}
    </View>
  );
}

export default Card;
