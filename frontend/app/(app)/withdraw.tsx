import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, LOW_BALANCE_THRESHOLD } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/useTheme';
import { formatCurrency } from '@/lib/utils/date';
import { useNotification } from '@/contexts/NotificationContext';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import accountService from '@/services/account.service';
import {
  showWithdrawalNotification,
  showLowBalanceNotification,
  showInsufficientFundsNotification,
} from '@/services/notifications.service';
import GradientBackground from '@/components/GradientBackground';
import AmountInput from '@/components/AmountInput';
import QuickAmountButton from '@/components/QuickAmountButton';
import ConfirmationModal from '@/components/ConfirmationModal';
import Input from '@/components/Input';
import type { WithdrawInput } from '@/types';

const MAX_AMOUNT = 1000000;
const MIN_AMOUNT = 100;
const LARGE_WITHDRAWAL_THRESHOLD = 0.5;

export default function WithdrawScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const { balance: balanceData } = useDashboardData();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  const currentBalance = parseFloat(balanceData?.balance || '0');

  const quickAmounts = useMemo(() => {
    const amounts = [5000, 10000, 20000, 50000];
    return amounts.filter(amt => amt <= currentBalance);
  }, [currentBalance]);

  const withdrawMutation = useMutation({
    mutationFn: (data: WithdrawInput) => accountService.withdraw(data),
    onSuccess: async (data) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await queryClient.invalidateQueries({ queryKey: ['balance'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });

      const newBalance = data?.newBalance || (parseFloat(currentBalance.toString()) - parseFloat(amount)).toString();
      await showWithdrawalNotification(amount, newBalance);
      
      const newBalanceNum = parseFloat(newBalance);
      if (newBalanceNum < LOW_BALANCE_THRESHOLD) {
        await showLowBalanceNotification(newBalance);
      }
      
      showNotification(
        'success',
        'Withdrawal Successful',
        `${formatCurrency(amount)} has been withdrawn from your account`
      );

      setShowConfirmation(false);
      
      setTimeout(() => {
        router.back();
      }, 300);
    },
    onError: async (error: any) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || 'Failed to process withdrawal';
      
      if (status === 409) {
        await showInsufficientFundsNotification(amount, currentBalance.toString());
        showNotification('error', 'Insufficient Funds', errorMessage);
      } else {
        showNotification('error', 'Withdrawal Failed', errorMessage);
      }
      
      setShowConfirmation(false);
    },
  });

  const validateAmount = useCallback((value: string): string => {
    if (!value || parseFloat(value) === 0) {
      return 'Please enter an amount';
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return 'Invalid amount';
    }

    if (numValue < MIN_AMOUNT) {
      return `Minimum withdrawal is ${formatCurrency(MIN_AMOUNT)}`;
    }

    if (numValue > MAX_AMOUNT) {
      return `Maximum withdrawal is ${formatCurrency(MAX_AMOUNT)}`;
    }

    if (numValue > currentBalance) {
      return `Insufficient funds. Available: ${formatCurrency(currentBalance)}`;
    }

    const decimalPlaces = (value.split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return 'Amount can only have up to 2 decimal places';
    }

    return '';
  }, [currentBalance]);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    if (error) {
      const validationError = validateAmount(value);
      setError(validationError);
    }
  }, [error, validateAmount]);

  const handleQuickAmount = useCallback((quickAmount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(quickAmount.toString());
    setError('');
  }, []);

  const handleWithdrawAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(currentBalance.toString());
    setError('');
  }, [currentBalance]);

  const handleContinue = useCallback(() => {
    const validationError = validateAmount(amount);
    
    if (validationError) {
      setError(validationError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirmation(true);
  }, [amount, validateAmount]);

  const handleConfirmWithdraw = useCallback(() => {
    const numAmount = parseFloat(amount);
    
    withdrawMutation.mutate({
      amount: numAmount,
      description: description.trim() || undefined,
    });
  }, [amount, description, withdrawMutation]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const isValidAmount = amount && parseFloat(amount) >= MIN_AMOUNT && parseFloat(amount) <= currentBalance && !error;
  const isLargeWithdrawal = parseFloat(amount || '0') > currentBalance * LARGE_WITHDRAWAL_THRESHOLD;

  return (
    <GradientBackground style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={[styles.backButton, { backgroundColor: theme.colors.surface }]} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Withdraw Money</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.balanceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Available Balance</Text>
            <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>{formatCurrency(currentBalance)}</Text>
            <Text style={[styles.balanceHint, { color: theme.colors.textSecondary }]}>Maximum withdrawal limit</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Enter Amount</Text>
            <AmountInput
              value={amount}
              onChangeText={handleAmountChange}
              error={error}
              maxAmount={currentBalance}
              variant="withdraw"
            />
          </View>

          {quickAmounts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Quick Select</Text>
              <View style={styles.quickAmountsGrid}>
                {quickAmounts.map((quickAmount) => (
                  <View key={quickAmount} style={styles.quickAmountItem}>
                    <QuickAmountButton
                      amount={quickAmount}
                      onPress={handleQuickAmount}
                      isSelected={parseFloat(amount) === quickAmount}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {currentBalance >= MIN_AMOUNT && (
            <View style={styles.section}>
              <Pressable onPress={handleWithdrawAll} style={[
                styles.withdrawAllButton, 
                { 
                  backgroundColor: `${theme.colors.error}10`, 
                  borderColor: `${theme.colors.error}20` 
                }
              ]}>
                <Ionicons name="wallet-outline" size={20} color={theme.colors.error} />
                <Text style={[styles.withdrawAllText, { color: theme.colors.error }]}>Withdraw All ({formatCurrency(currentBalance)})</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.section}>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note (optional)"
              maxLength={255}
              multiline
              numberOfLines={3}
              style={styles.descriptionInput}
              icon="text-outline"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
          <Pressable
            onPress={handleContinue}
            style={[
              styles.withdrawButton, 
              { backgroundColor: isValidAmount ? theme.colors.error : theme.colors.disabled },
              !isValidAmount && styles.withdrawButtonDisabled
            ]}
            disabled={!isValidAmount}
          >
            <Text style={styles.withdrawButtonText}>
              {isValidAmount ? `Withdraw ${formatCurrency(amount)}` : 'Enter Amount'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#ffffff"
              style={styles.buttonIcon}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirmation}
        title="Confirm Withdrawal"
        amount={amount}
        currentBalance={currentBalance.toString()}
        description={description}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setShowConfirmation(false)}
        isLoading={withdrawMutation.isPending}
        variant="withdraw"
        showWarning={isLargeWithdrawal}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  balanceCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  balanceHint: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.sm + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickAmountItem: {
    width: `${(100 - 4) / 2}%`,
  },
  withdrawAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  withdrawAllText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  descriptionInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  withdrawButton: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  withdrawButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  withdrawButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: '#ffffff',
  },
  buttonIcon: {
    marginLeft: SPACING.sm,
  },
});
