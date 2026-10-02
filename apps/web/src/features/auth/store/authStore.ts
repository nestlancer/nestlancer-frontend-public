import { create } from 'zustand';

interface AuthUiState {
  loginRedirect: string | null;
  setLoginRedirect: (path: string | null) => void;
}

export const useAuthUiStore = create<AuthUiState>((set) => ({
  loginRedirect: null,
  setLoginRedirect: (path) => set({ loginRedirect: path }),
}));
