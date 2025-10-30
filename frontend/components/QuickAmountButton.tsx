import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, Pressable, Animated } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/lib/constants';
import * as Haptics from 'expo-haptics';

interface QuickAmountButtonProps {
  amount: number;
  onPress: (amount: number) => void;
  isSelected?: boolean;
}

const QuickAmountButton: React.FC<QuickAmountButtonProps> = ({
  amount,
  onPress,
  isSelected = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress(amount);
  }, [amount, onPress]);

  const formatAmount = (amt: number) => {
    return amt.toLocaleString('en-US');
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, isSelected && styles.buttonSelected]}
      >
        <Text style={[styles.amount, isSelected && styles.amountSelected]}>
          Rwf {formatAmount(amount)}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default QuickAmountButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  amount: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  amountSelected: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
});
