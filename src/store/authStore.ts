import { create } from 'zustand';
import { setToken, getToken, removeToken } from '../utils/auth';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  login: (userData: { user: User; token: string }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(), // Get token from localStorage on load
  setToken: (token) => {
    setToken(token);
    set({ token });
  },
  login: ({ user, token }) => {
    setToken(token);
    set({ user, token });
  },
  logout: () => {
    removeToken();
    set({ user: null, token: null });
  },
  updateUser: (user) => {
    set({ user });
  },
}));
