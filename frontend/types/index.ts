export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user?: User;
  tokens?: AuthTokens;
  devicePending?: boolean;
  deviceId?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: string;
  description?: string;
  createdAt: string;
}

export interface AccountBalance {
  balance: string;
  lastUpdated: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  status: 'error';
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface DepositInput {
  amount: number;
  description?: string;
}

export interface DepositResponse {
  transaction: Transaction;
  newBalance: string;
}

export interface WithdrawInput {
  amount: number;
  description?: string;
}

export interface WithdrawResponse {
  transaction: Transaction;
  newBalance: string;
}
