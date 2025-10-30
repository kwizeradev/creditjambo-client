import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/configs';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled,
  onPress,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const handlePress = useCallback(
    (event: any) => {
      if (!isDisabled && onPress) {
        onPress(event);
      }
    },
    [isDisabled, onPress]
  );

  const getButtonStyles = () => {
    const baseStyles: any[] = [styles.button];

    // Add size styles
    if (size === 'small') baseStyles.push(styles.smallButton);
    else if (size === 'large') baseStyles.push(styles.largeButton);
    else baseStyles.push(styles.mediumButton);

    // Add variant styles
    if (variant === 'secondary') baseStyles.push(styles.secondaryButton);
    else if (variant === 'outline') baseStyles.push(styles.outlineButton);
    else if (variant === 'ghost') baseStyles.push(styles.ghostButton);
    else baseStyles.push(styles.primaryButton);

    // Add modifier styles
    if (fullWidth) baseStyles.push(styles.fullWidth);
    if (isDisabled) baseStyles.push(styles.disabledButton);

    return [...baseStyles, style];
  };

  const getTextStyles = () => {
    const baseStyles: any[] = [styles.buttonText];

    // Add size styles
    if (size === 'small') baseStyles.push(styles.smallText);
    else if (size === 'large') baseStyles.push(styles.largeText);
    else baseStyles.push(styles.mediumText);

    // Add variant styles
    if (variant === 'outline' || variant === 'ghost') {
      baseStyles.push(styles.outlineButtonText);
    } else {
      baseStyles.push(styles.primaryButtonText);
    }

    // Add modifier styles
    if (isDisabled) baseStyles.push(styles.disabledText);

    return baseStyles;
  };

  const getIconColor = (): string => {
    if (isDisabled) return COLORS.textSecondary;
    if (variant === 'outline' || variant === 'ghost') return COLORS.primary;
    return '#ffffff';
  };

  const getLoadingColor = (): string => {
    if (variant === 'outline' || variant === 'ghost') return COLORS.primary;
    return '#ffffff';
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getLoadingColor()} size="small" />;
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={18}
            color={getIconColor()}
            style={styles.iconLeft}
          />
        )}

        <Text style={getTextStyles()}>{title}</Text>

        {icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={18}
            color={getIconColor()}
            style={styles.iconRight}
          />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Size variants
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 60,
  },

  // Color variants
  primaryButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },

  // Icon styles
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
