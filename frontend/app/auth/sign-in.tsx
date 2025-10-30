import React, { useCallback, useState } from 'react';

import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/lib/hooks/useTheme';
import { useForm } from '@/lib/hooks/useForm';
import { signInSchema } from '@/lib/validations/auth';
import type { SignInForm } from '@/types/auth';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_VALUES: SignInForm = {
  email: '',
  password: '',
};

const DEVICE_PENDING_DELAY = 1500;
const SUCCESS_REDIRECT_DELAY = 1000;
const BUTTON_SCALE_PRESSED = 0.98;
const BUTTON_SCALE_NORMAL = 1;

function isAuthenticationError(message: string): boolean {
  const errorKeywords = ['invalid', 'credentials', 'password'];
  const lowerMessage = message.toLowerCase();
  return errorKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isNetworkError(message: string): boolean {
  const networkKeywords = ['network', 'connection'];
  const lowerMessage = message.toLowerCase();
  return networkKeywords.some(keyword => lowerMessage.includes(keyword));
}

export default function SignIn() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [rememberDevice, setRememberDevice] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));

  const handleDevicePendingResponse = useCallback(
    (deviceId?: string) => {
      showNotification(
        'warning',
        'Device Verification Required',
        'Your device is pending admin verification. You will be notified once approved.',
        5000
      );

      setTimeout(() => {
        router.replace({
          pathname: '/device-pending',
          params: { deviceId: deviceId || '' },
        });
      }, DEVICE_PENDING_DELAY);
    },
    [router, showNotification]
  );

  const handleSuccessfulLogin = useCallback(() => {
    showNotification(
      'success',
      'Welcome Back!',
      'You have successfully signed in to your account.',
      3000
    );

    setTimeout(() => {
      router.replace('/(app)');
    }, SUCCESS_REDIRECT_DELAY);
  }, [router, showNotification]);

  const handleLoginError = useCallback(
    (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      if (isAuthenticationError(errorMessage)) {
        showNotification(
          'error',
          'Sign In Failed',
          'Invalid email or password',
          4000
        );
      } else if (isNetworkError(errorMessage)) {
        showNotification('error', 'Connection Error', errorMessage, 5000);
      } else {
        showNotification('error', 'Sign In Failed', errorMessage, 4000);
      }
    },
    [showNotification]
  );

  const handleSubmit = useCallback(
    async (values: SignInForm) => {
      try {
        const response = await login(values.email, values.password);

        if (response.devicePending) {
          handleDevicePendingResponse(response.deviceId);
        } else {
          handleSuccessfulLogin();
        }
      } catch (error) {
        handleLoginError(error);
        throw error;
      }
    },
    [
      login,
      handleDevicePendingResponse,
      handleSuccessfulLogin,
      handleLoginError,
    ]
  );

  const {
    values,
    errors,
    loading,
    isValid,
    setValue,
    validateField,
    handleSubmit: onSubmit,
  } = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: signInSchema,
    onSubmit: handleSubmit,
  });

  const handleFieldChange = useCallback(
    (field: keyof SignInForm, value: string) => {
      setValue(field, value);
    },
    [setValue]
  );

  const handleFieldBlur = useCallback(
    (field: keyof SignInForm) => {
      validateField(field);
    },
    [validateField]
  );

  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: BUTTON_SCALE_PRESSED,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: BUTTON_SCALE_NORMAL,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const toggleRememberDevice = useCallback(() => {
    setRememberDevice(previous => !previous);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.headerContent}>
              <Text style={styles.appTitle}>Credit Jambo</Text>
              <Text style={styles.appSubtitle}>Savings Management</Text>
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Sign in to your Credit Jambo account
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={values.email}
                onChangeText={value => handleFieldChange('email', value)}
                onBlur={() => handleFieldBlur('email')}
                error={errors.email}
                icon="mail"
                keyboardType="email-address"
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={values.password}
                onChangeText={value => handleFieldChange('password', value)}
                onBlur={() => handleFieldBlur('password')}
                error={errors.password}
                icon="lock-closed"
                isPassword
                autoComplete="current-password"
                required
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={toggleRememberDevice}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberDevice }}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                    rememberDevice && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                >
                  {rememberDevice && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, { color: theme.colors.textSecondary }]}>Remember this device</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Button
                  title="Sign In"
                  onPress={onSubmit}
                  loading={loading}
                  disabled={!isValid || loading}
                  fullWidth
                  style={styles.submitButton}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                />
              </Animated.View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              <View style={styles.signUpLink}>
                <Text style={[styles.signUpText, { color: theme.colors.textSecondary }]}>Don't have an account? </Text>
                <Link href="/auth/sign-up" asChild>
                  <TouchableOpacity accessibilityRole="button">
                    <Text style={[styles.signUpLinkText, { color: theme.colors.primary }]}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  formCard: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signUpLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
  },
  signUpLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
