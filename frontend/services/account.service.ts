import api from './api';
import type { AccountBalance, ApiResponse, PaginatedTransactions } from '@/types';

export const accountService = {
  async getBalance(): Promise<AccountBalance> {
    const response = await api.get<ApiResponse<AccountBalance>>('/account/balance');
    return response.data.data!;
  },

  async getTransactions(limit: number = 10, page: number = 1): Promise<PaginatedTransactions> {
    const response = await api.get<ApiResponse<PaginatedTransactions>>(
      `/account/transactions?limit=${limit}&page=${page}`
    );
    return response.data.data!;
  },
};

export default accountService;
