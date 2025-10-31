import React, { useCallback } from 'react';

import {
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
import PasswordStrength from '@/components/PasswordStrength';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/lib/hooks/useTheme';
import { COLORS } from '@/lib/constants';
import { useForm } from '@/lib/hooks/useForm';
import { usePasswordStrength } from '@/lib/hooks/usePasswordStrength';
import { signUpSchema } from '@/lib/validations/auth';
import type { SignUpForm } from '@/types/auth';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_VALUES: SignUpForm = {
  name: '',
  email: '',
  password: '',
};

const DEVICE_PENDING_REDIRECT_DELAY = 2000;
const SUCCESS_NOTIFICATION_DURATION = 6000;
const ERROR_NOTIFICATION_DURATION = 6000;

export default function SignUp() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();

  const handleSuccessfulRegistration = useCallback(() => {
    showNotification(
      'success',
      'Account Created Successfully!',
      'Your account has been created. Please wait for admin verification to access your account.',
      SUCCESS_NOTIFICATION_DURATION
    );

    setTimeout(() => {
      router.replace('/device-pending');
    }, DEVICE_PENDING_REDIRECT_DELAY);
  }, [router, showNotification]);

  const handleRegistrationError = useCallback(
    (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      showNotification(
        'error',
        'Sign Up Failed',
        errorMessage,
        ERROR_NOTIFICATION_DURATION
      );
    },
    [showNotification]
  );

  const handleSubmit = useCallback(
    async (values: SignUpForm) => {
      try {
        await register(values.name, values.email, values.password);
        handleSuccessfulRegistration();
      } catch (error) {
        handleRegistrationError(error);
        throw error;
      }
    },
    [register, handleSuccessfulRegistration, handleRegistrationError]
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
    validationSchema: signUpSchema,
    onSubmit: handleSubmit,
  });

  const passwordStrength = usePasswordStrength(values.password);

  const handleFieldChange = useCallback(
    (field: keyof SignUpForm, value: string) => {
      setValue(field, value);
    },
    [setValue]
  );

  const handleFieldBlur = useCallback(
    (field: keyof SignUpForm) => {
      validateField(field);
    },
    [validateField]
  );

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
              <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Join Credit Jambo to start managing your savings
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={values.name}
                onChangeText={value => handleFieldChange('name', value)}
                onBlur={() => handleFieldBlur('name')}
                error={errors.name}
                icon="person"
                autoCapitalize="words"
                autoComplete="name"
                required
              />

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
                placeholder="Create a strong password"
                value={values.password}
                onChangeText={value => handleFieldChange('password', value)}
                onBlur={() => handleFieldBlur('password')}
                error={errors.password}
                icon="lock-closed"
                isPassword
                required
              />

              {values.password.length > 0 && (
                <PasswordStrength strength={passwordStrength} />
              )}

              <Button
                title="Create Account"
                onPress={onSubmit}
                loading={loading}
                disabled={!isValid || loading}
                fullWidth
                style={styles.submitButton}
              />

              <View style={styles.signInLink}>
                <Text style={[styles.signInText, { color: theme.colors.textSecondary }]}>Already have an account? </Text>
                <Link href="/auth/sign-in" asChild>
                  <TouchableOpacity accessibilityRole="button">
                    <Text style={[styles.signInLinkText, { color: theme.colors.primary }]}>Sign In</Text>
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
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  signInLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
  },
  signInLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
