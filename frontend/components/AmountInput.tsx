import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, Animated } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/lib/constants';
import { Ionicons } from '@expo/vector-icons';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  maxAmount?: number;
  currency?: string;
  variant?: 'deposit' | 'withdraw';
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeText,
  error,
  maxAmount = 1000000,
  currency = 'Rwf',
  variant = 'deposit',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const handleTextChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) return;
      if (parts[1] && parts[1].length > 2) return;
      
      const numValue = parseFloat(cleaned || '0');
      if (numValue > maxAmount) return;
      
      onChangeText(cleaned);
    },
    [onChangeText, maxAmount]
  );

  const displayValue = formatDisplayValue(value);
  const hasValue = value && parseFloat(value) > 0;
  const accentColor = variant === 'withdraw' ? COLORS.error : COLORS.primary;

  return (
    <View style={styles.container}>
      <Pressable onPress={handleContainerPress}>
        <Animated.View
          style={[
            styles.inputContainer,
            isFocused && (variant === 'withdraw' ? styles.inputFocusedWithdraw : styles.inputFocused),
            error && styles.inputError,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.currencyContainer}>
            <Text style={[styles.currencySymbol, { color: accentColor }]}>{currency}</Text>
          </View>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.border}
            maxLength={10}
            selectTextOnFocus
          />

          {hasValue && (
            <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={12}>
              <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
            </Pressable>
          )}
        </Animated.View>
      </Pressable>

      {displayValue && !error && (
        <Text style={styles.formattedAmount}>{displayValue}</Text>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default AmountInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#ffffff',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2.5,
  },
  inputFocusedWithdraw: {
    borderColor: COLORS.error,
    backgroundColor: '#ffffff',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2.5,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#fef2f2',
  },
  currencyContainer: {
    marginRight: SPACING.sm,
  },
  currencySymbol: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  input: {
    flex: 1,
    fontSize: 40,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.text,
    padding: 0,
    letterSpacing: -1,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  formattedAmount: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
});
