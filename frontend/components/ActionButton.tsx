import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/lib/constants';
import * as Haptics from 'expo-haptics';

interface ActionButtonProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  icon,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  const handlePress = async () => {
    if (!disabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const isPrimary = variant === 'primary';
  const backgroundColor = disabled
    ? COLORS.disabled
    : isPrimary
      ? COLORS.primary
      : COLORS.secondary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#ffffff" />
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

export default ActionButton;

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 68,
  },
  iconContainer: {
    marginRight: SPACING.sm + 2,
  },
  title: {
    fontSize: FONT_SIZE.lg - 1,
    fontWeight: FONT_WEIGHT.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
