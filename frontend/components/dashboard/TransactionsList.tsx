import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import TransactionItem from '@/components/TransactionItem';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, ICON_SIZE } from '@/lib/constants';
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
  const hasTransactions = transactions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        {hasTransactions && (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
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

const LoadingState: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>Loading transactions...</Text>
  </View>
);

const EmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="receipt-outline" size={ICON_SIZE.xxl} color={COLORS.textSecondary} />
    </View>
    <Text style={styles.emptyTitle}>No transactions yet</Text>
    <Text style={styles.emptyMessage}>
      Your transaction history will appear here once you make your first deposit or withdrawal.
    </Text>
  </View>
);

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
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
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
    color: COLORS.textSecondary,
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
    backgroundColor: `${COLORS.textSecondary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg + 1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: FONT_SIZE.sm + 1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
