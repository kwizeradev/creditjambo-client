import React, { useCallback, useState } from 'react';
import { StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { SPACING } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/lib/hooks/useTheme';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import GradientBackground from '@/components/GradientBackground';
import BalanceCard from '@/components/BalanceCard';
import LowBalanceAlert from '@/components/LowBalanceAlert';
import {
  DashboardHeader,
  ActionButtons,
  TransactionsList,
  TransactionDetailModal,
} from '@/components/dashboard';
import type { Transaction } from '@/types';

export default function Dashboard(): React.ReactElement {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const {
    balance: balanceData,
    transactions: transactionsData,
    isLoadingBalance,
    isLoadingTransactions,
    refetchBalance,
    refetchTransactions,
    isRefreshing,
  } = useDashboardData();

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchBalance(), refetchTransactions()]);
  }, [refetchBalance, refetchTransactions]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
          router.replace('/auth/sign-in');
        },
      },
    ]);
  }, [logout, router]);

  const handleDeposit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/deposit');
  }, [router]);

  const handleWithdraw = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/withdraw');
  }, [router]);

  const handleViewAllTransactions = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/transactions');
  }, [router]);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTransaction(transaction);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  const balance = balanceData?.balance || '0';
  const transactions = transactionsData?.transactions || [];
  const userName = user?.name || 'User';

  return (
    <GradientBackground style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <DashboardHeader userName={userName} onLogout={handleLogout} />

          <BalanceCard
            balance={balance}
            isLoading={isLoadingBalance}
            lastUpdated={balanceData?.lastUpdated}
          />

          <LowBalanceAlert balance={balance} />

          <ActionButtons onDeposit={handleDeposit} onWithdraw={handleWithdraw} />

          <TransactionsList
            transactions={transactions}
            isLoading={isLoadingTransactions}
            onTransactionPress={handleTransactionPress}
            onViewAll={handleViewAllTransactions}
          />
        </ScrollView>

        <TransactionDetailModal
          transaction={selectedTransaction}
          visible={!!selectedTransaction}
          onClose={closeTransactionModal}
        />
      </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xxl,
    paddingTop: 60,
    paddingBottom: 100,
  },
});
