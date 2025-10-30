import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { isToday, isYesterday, isThisWeek, format, parseISO } from 'date-fns';

import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, ICON_SIZE } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/useTheme';
import GradientBackground from '@/components/GradientBackground';
import FilterTabs, { FilterOption } from '@/components/FilterTabs';
import TransactionItem from '@/components/TransactionItem';
import { TransactionDetailModal } from '@/components/dashboard';
import { useTransactionHistory, TransactionFilter } from '@/lib/hooks/useTransactionHistory';
import type { Transaction } from '@/types';

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'ALL', label: 'All' },
  { id: 'DEPOSIT', label: 'Deposits' },
  { id: 'WITHDRAW', label: 'Withdrawals' },
];

interface GroupedTransactions {
  title: string;
  data: Transaction[];
}

function getDateGroupTitle(dateString: string): string {
  const date = parseISO(dateString);
  
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return 'This Week';
  return format(date, 'MMMM yyyy');
}

function groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions[] {
  const groups = new Map<string, Transaction[]>();
  
  transactions.forEach(transaction => {
    const groupTitle = getDateGroupTitle(transaction.createdAt);
    const existing = groups.get(groupTitle) || [];
    groups.set(groupTitle, [...existing, transaction]);
  });
  
  const result: GroupedTransactions[] = [];
  const order = ['Today', 'Yesterday', 'This Week'];
  
  order.forEach(title => {
    if (groups.has(title)) {
      result.push({ title, data: groups.get(title)! });
      groups.delete(title);
    }
  });
  
  Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([title, data]) => {
      result.push({ title, data });
    });
  
  return result;
}

export default function TransactionHistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<TransactionFilter>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const {
    transactions,
    isLoading,
    isFetchingNextPage,
    hasMore,
    totalCount,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useTransactionHistory({ filter });

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions]
  );

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleFilterChange = useCallback((filterId: string) => {
    setFilter(filterId as TransactionFilter);
  }, []);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  const renderSectionHeader = useCallback(({ section }: { section: GroupedTransactions }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  ), []);

  const renderTransaction = useCallback(({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} onPress={handleTransactionPress} />
  ), [handleTransactionPress]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Loading more...</Text>
      </View>
    );
  }, [isFetchingNextPage, theme]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.colors.textSecondary}10` }]}>
          <Ionicons name="receipt-outline" size={ICON_SIZE.xxl} color={theme.colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No transactions found</Text>
        <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
          {filter === 'ALL'
            ? 'Your transaction history will appear here once you make your first deposit or withdrawal.'
            : `No ${filter.toLowerCase()} transactions found.`}
        </Text>
      </View>
    );
  }, [isLoading, filter, theme]);

  const flatListData = useMemo(() => {
    return groupedTransactions.flatMap(group => [
      { type: 'header', title: group.title, id: `header-${group.title}` },
      ...group.data.map(transaction => ({ type: 'transaction', transaction, id: transaction.id })),
    ]);
  }, [groupedTransactions]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{item.title}</Text>
        </View>
      );
    }
    return <TransactionItem transaction={item.transaction} onPress={handleTransactionPress} />;
  }, [handleTransactionPress, theme]);

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={[styles.backButton, { backgroundColor: theme.colors.surface }]} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Transaction History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.filterContainer}>
          <FilterTabs
            options={FILTER_OPTIONS}
            selectedId={filter}
            onSelect={handleFilterChange}
          />
        </View>

        <FlatList
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      </View>

      <TransactionDetailModal
        transaction={selectedTransaction}
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  filterContainer: {
    marginBottom: SPACING.lg,
  },
  countText: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontWeight: FONT_WEIGHT.medium,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  emptyState: {
    paddingVertical: 80,
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
