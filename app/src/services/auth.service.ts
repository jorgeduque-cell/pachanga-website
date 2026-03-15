import { apiClient } from '@/lib/api';
import type { LoginCredentials, AuthResponse, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', credentials);
    console.log('Login response:', response.data);
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  saveAuthData(data: AuthResponse): void {
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem('auth_user');
    if (!stored) return null;

    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem('auth_user');
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};
