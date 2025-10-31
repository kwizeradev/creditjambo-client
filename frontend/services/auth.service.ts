import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { getRefreshToken, saveTokens, clearTokens } from './storage.service';
import { isValidTokenFormat } from '@/lib/utils/token';

interface RefreshTokenResponse {
  status: string;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  async refreshTokens(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    try {
      this.isRefreshing = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken || !isValidTokenFormat(refreshToken)) {
        throw new Error('No valid refresh token available');
      }

      const response = await axios.post<RefreshTokenResponse>(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      if (!accessToken || !newRefreshToken) {
        throw new Error('Invalid token response from server');
      }

      await saveTokens(accessToken, newRefreshToken);
      this.processQueue(null, accessToken);

      return accessToken;
    } catch (error) {
      this.processQueue(error, null);
      await clearTokens();

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error('No token available'));
      }
    });

    this.failedQueue = [];
  }

  async shouldRefreshTokens(): Promise<boolean> {
    const refreshToken = await getRefreshToken();
    return !!(refreshToken && isValidTokenFormat(refreshToken));
  }

  async clearSession(): Promise<void> {
    await clearTokens();
    this.isRefreshing = false;
    this.failedQueue = [];
  }
}

export default new AuthService();