import { useInfiniteQuery } from '@tanstack/react-query';
import accountService from '@/services/account.service';
import { QUERY_CONFIG } from '@/lib/constants';
import type { PaginatedTransactions } from '@/types';

export type TransactionFilter = 'ALL' | 'DEPOSIT' | 'WITHDRAW';

interface UseTransactionHistoryOptions {
  filter: TransactionFilter;
  limit?: number;
}

export function useTransactionHistory({ filter, limit = 20 }: UseTransactionHistoryOptions) {
  const query = useInfiniteQuery({
    queryKey: ['transactions-history', filter, limit],
    queryFn: ({ pageParam = 1 }) => 
      accountService.getTransactions(limit, pageParam, filter !== 'ALL' ? filter : undefined),
    getNextPageParam: (lastPage: PaginatedTransactions) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: QUERY_CONFIG.AUTO_REFRESH_INTERVAL,
  });

  const allTransactions = query.data?.pages.flatMap(page => page.transactions) || [];
  const hasMore = query.hasNextPage;
  const totalCount = query.data?.pages[0]?.pagination.total || 0;

  return {
    transactions: allTransactions,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore,
    totalCount,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
