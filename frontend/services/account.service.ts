import api from './api';
import type { AccountBalance, ApiResponse, PaginatedTransactions, DepositInput, DepositResponse, WithdrawInput, WithdrawResponse } from '@/types';

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

  async deposit(data: DepositInput): Promise<DepositResponse> {
    const response = await api.post<ApiResponse<DepositResponse>>('/account/deposit', data);
    return response.data.data!;
  },

  async withdraw(data: WithdrawInput): Promise<WithdrawResponse> {
    const response = await api.post<ApiResponse<WithdrawResponse>>('/account/withdraw', data);
    return response.data.data!;
  },
};

export default accountService;
