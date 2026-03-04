import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  roles: ('ADMIN' | 'LEADER' | 'PART_LEADER' | 'MEMBER')[];
  teamId: string | null;
  teamName: string | null;
  mustChangePassword?: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  isAuthenticated: () => boolean;
  clearMustChangePassword: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set: (partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void, get: () => AuthState) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      login: (accessToken: string, refreshToken: string, user: User) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken, user });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ accessToken: null, refreshToken: null, user: null });
      },

      setTokens: (accessToken: string, refreshToken?: string) => {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        set((state: AuthState) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        }));
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,

      clearMustChangePassword: () => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, mustChangePassword: false } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
