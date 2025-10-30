import React, { useState, useCallback, forwardRef, useRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/configs';

interface InputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  required?: boolean;
  helperText?: string;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      icon,
      isPassword = false,
      required = false,
      helperText,
      style,
      onBlur,
      onFocus,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => inputRef.current!, []);

    const togglePasswordVisibility = useCallback(() => {
      setIsPasswordVisible(prev => !prev);
    }, []);

    const handleContainerPress = useCallback(() => {
      inputRef.current?.focus();
    }, []);

    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    const getInputContainerStyle = () => [
      styles.inputContainer,
      isFocused && styles.inputFocused,
      error && styles.inputError,
    ];

    const getIconColor = () => {
      if (error) return COLORS.error;
      if (isFocused) return COLORS.primary;
      return COLORS.textSecondary;
    };

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <Pressable style={getInputContainerStyle()} onPress={handleContainerPress}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={getIconColor()}
              style={styles.icon}
            />
          )}

          <TextInput
            ref={inputRef}
            style={[styles.input, style]}
            secureTextEntry={isPassword && !isPasswordVisible}
            placeholderTextColor={COLORS.textSecondary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessibilityLabel={label}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            {...props}
          />

          {isPassword && (
            <Pressable
              onPress={togglePasswordVisibility}
              style={styles.eyeIcon}
              accessibilityLabel={
                isPasswordVisible ? 'Hide password' : 'Show password'
              }
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.textSecondary}
              />
            </Pressable>
          )}
        </Pressable>

        {error && (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        {helperText && !error && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  inputError: {
    borderColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
    paddingVertical: 2,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  eyeIcon: {
    padding: 10,
    marginRight: -6,
    borderRadius: 20,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginLeft: 4,
  },
});
