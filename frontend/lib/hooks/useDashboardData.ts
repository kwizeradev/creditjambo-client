import { useQuery } from '@tanstack/react-query';
import accountService from '@/services/account.service';
import { QUERY_CONFIG } from '@/lib/constants';
import type { AccountBalance, PaginatedTransactions } from '@/types';

interface UseDashboardDataReturn {
  balance: AccountBalance | undefined;
  transactions: PaginatedTransactions | undefined;
  isLoadingBalance: boolean;
  isLoadingTransactions: boolean;
  isRefetchingBalance: boolean;
  isRefetchingTransactions: boolean;
  refetchBalance: () => Promise<any>;
  refetchTransactions: () => Promise<any>;
  isRefreshing: boolean;
}

export function useDashboardData(): UseDashboardDataReturn {
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
    isRefetching: isRefetchingBalance,
  } = useQuery({
    queryKey: ['balance'],
    queryFn: accountService.getBalance,
    refetchInterval: QUERY_CONFIG.AUTO_REFRESH_INTERVAL,
  });

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
    isRefetching: isRefetchingTransactions,
  } = useQuery({
    queryKey: ['transactions', 5],
    queryFn: () => accountService.getTransactions(5, 1),
  });

  const isRefreshing = isRefetchingBalance || isRefetchingTransactions;

  return {
    balance,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    isRefetchingBalance,
    isRefetchingTransactions,
    refetchBalance,
    refetchTransactions,
    isRefreshing,
  };
}
