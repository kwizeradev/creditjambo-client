import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import TransactionItem from '@/components/TransactionItem';
import { SPACING, FONT_SIZE, FONT_WEIGHT, ICON_SIZE } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/useTheme';
import type { Transaction } from '@/types';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onTransactionPress: (transaction: Transaction) => void;
  onViewAll: () => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  isLoading,
  onTransactionPress,
  onViewAll,
}) => {
  const { theme } = useTheme();
  const hasTransactions = transactions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Recent Transactions</Text>
        {hasTransactions && (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingState />
      ) : hasTransactions ? (
        <View style={styles.transactionsContainer}>
          <TransactionItems transactions={transactions} onPress={onTransactionPress} />
        </View>
      ) : (
        <Card style={styles.emptyCard} padding="medium">
          <EmptyState />
        </Card>
      )}
    </View>
  );
};

const LoadingState: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading transactions...</Text>
    </View>
  );
};

const EmptyState: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.colors.textSecondary}10` }]}>
        <Ionicons name="receipt-outline" size={ICON_SIZE.xxl} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No transactions yet</Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
        Your transaction history will appear here once you make your first deposit or withdrawal.
      </Text>
    </View>
  );
};

interface TransactionItemsProps {
  transactions: Transaction[];
  onPress: (transaction: Transaction) => void;
}

const TransactionItems: React.FC<TransactionItemsProps> = ({ transactions, onPress }) => (
  <>
    {transactions.map((transaction) => (
      <TransactionItem key={transaction.id} transaction={transaction} onPress={onPress} />
    ))}
  </>
);

export default TransactionsList;

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  viewAllText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  transactionsContainer: {
    gap: 0,
  },
  emptyCard: {
    overflow: 'hidden',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm + 1,
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg + 1,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: FONT_SIZE.sm + 1,
    textAlign: 'center',
    lineHeight: 20,
  },
});
