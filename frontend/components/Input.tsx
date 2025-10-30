import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/hooks/useTheme';

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
    const { theme } = useTheme();
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
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      },
      isFocused && {
        borderColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
      },
      error && {
        borderColor: theme.colors.error,
        shadowColor: theme.colors.error,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    ];

    const getIconColor = () => {
      if (error) return theme.colors.error;
      if (isFocused) return theme.colors.primary;
      return theme.colors.textSecondary;
    };

    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {label}
            {required && <Text style={{ color: theme.colors.error }}> *</Text>}
          </Text>
        )}

        <Pressable
          style={getInputContainerStyle()}
          onPress={handleContainerPress}
        >
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
            style={[styles.input, { color: theme.colors.text }, style]}
            secureTextEntry={isPassword && !isPasswordVisible}
            placeholderTextColor={theme.colors.textSecondary}
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
                color={theme.colors.textSecondary}
              />
            </Pressable>
          )}
        </Pressable>

        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        {helperText && !error && (
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>{helperText}</Text>
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
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  icon: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
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
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
