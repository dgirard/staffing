import { create } from 'zustand';
import { api } from '../services/api';
import type { User, LoginCredentials, RegisterData } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });

    const response = await api.login(credentials);

    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      set({
        token: response.data.token,
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } else {
      set({
        error: response.message || 'Login failed',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });

    const response = await api.register(data);

    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      set({
        token: response.data.token,
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } else {
      set({
        error: response.message || 'Registration failed',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    const response = await api.me();

    if (response.success && response.data) {
      set({
        user: response.data,
        isAuthenticated: true,
      });
    } else {
      // Token invalid, logout
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));
