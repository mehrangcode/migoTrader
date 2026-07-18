import { create } from "zustand";
import { authApi } from "@/lib/api/auth";
import { setAuthFailureHandler } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { tokenStorage } from "@/lib/tokenStorage";

interface AuthState {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  login: async (email, password) => {
    const { user, accessToken, refreshToken } = await authApi.login(email, password);
    tokenStorage.set(accessToken, refreshToken);
    set({ user, status: "authenticated" });
  },

  register: async (email, password) => {
    const { user, accessToken, refreshToken } = await authApi.register(email, password);
    tokenStorage.set(accessToken, refreshToken);
    set({ user, status: "authenticated" });
  },

  logout: async () => {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
    tokenStorage.clear();
    set({ user: null, status: "unauthenticated" });
  },

  hydrate: async () => {
    if (!tokenStorage.getAccess()) {
      set({ status: "unauthenticated" });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, status: "authenticated" });
    } catch {
      tokenStorage.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },
}));

// When a token refresh fails deep in the API layer, force the store to unauthenticated.
setAuthFailureHandler(() => {
  useAuthStore.setState({ user: null, status: "unauthenticated" });
});
