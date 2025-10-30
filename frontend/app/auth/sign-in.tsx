import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { COLORS } from '@/constants/configs';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useForm } from '@/lib/hooks/useForm';
import { signInSchema } from '@/lib/validations/auth';
import type { SignInForm } from '@/types/auth';

const INITIAL_VALUES: SignInForm = {
  email: '',
  password: '',
};

export default function SignIn() {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [rememberDevice, setRememberDevice] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));

  const handleSubmit = async (values: SignInForm) => {
    try {
      const response = await login(values.email, values.password);

      if (response.devicePending) {
        showNotification(
          'warning',
          'Device Verification Required',
          'Your device is pending admin verification. You will be notified once approved.',
          5000
        );

        setTimeout(() => {
          router.replace({
            pathname: '/device-pending',
            params: { deviceId: response.deviceId },
          });
        }, 1500);
      } else {
        showNotification(
          'success',
          'Welcome Back!',
          'You have successfully signed in to your account.',
          3000
        );

        setTimeout(() => {
          router.replace('/(app)');
        }, 1000);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      if (
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('credentials') ||
        errorMessage.toLowerCase().includes('password')
      ) {
        showNotification(
          'error',
          'Sign In Failed',
          'Invalid email or password',
          4000
        );
      } else if (
        errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('connection')
      ) {
        showNotification('error', 'Connection Error', errorMessage, 5000);
      } else {
        showNotification('error', 'Sign In Failed', errorMessage, 4000);
      }
      throw error;
    }
  };

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

  const handleFieldChange = (field: keyof SignInForm, value: string) => {
    setValue(field, value);
  };

  const handleFieldBlur = (field: keyof SignInForm) => {
    validateField(field);
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const toggleRememberDevice = () => {
    setRememberDevice(!rememberDevice);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.appTitle}>Credit Jambo</Text>
              <Text style={styles.appSubtitle}>Savings Management</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
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

              {/* Remember Device Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={toggleRememberDevice}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberDevice }}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberDevice && styles.checkboxChecked,
                  ]}
                >
                  {rememberDevice && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember this device</Text>
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

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              <View style={styles.signUpLink}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <Link href="/auth/sign-up" asChild>
                  <TouchableOpacity accessibilityRole="button">
                    <Text style={styles.signUpLinkText}>Sign Up</Text>
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
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    color: COLORS.primary,
    fontWeight: '500',
  },
  signUpLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  signUpLinkText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
