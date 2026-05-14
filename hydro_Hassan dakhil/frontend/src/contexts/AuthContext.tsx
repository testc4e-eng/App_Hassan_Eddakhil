import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, ChangePasswordPayload } from "@/types/auth";
import {
  AUTH_LOGOUT_EVENT,
  AUTH_TOKEN_KEY,
  clearStoredToken,
  emitLogoutEvent,
  fetchMeApi,
  loginApi,
  setStoredToken,
  changePasswordApi,
} from "@/api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<AuthUser>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncLogout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetchMeApi();
      setUser(response.user);
      return response.user;
    } catch {
      syncLogout();
      return null;
    }
  }, [syncLogout]);

  useEffect(() => {
    const boot = async () => {
      try {
        if (typeof window === "undefined" || !window.localStorage.getItem(AUTH_TOKEN_KEY)) {
          setUser(null);
          return;
        }
        await refreshUser();
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, [refreshUser]);

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (!event.key || event.key === AUTH_TOKEN_KEY) {
        syncLogout();
      }
    };
    const logoutHandler = () => syncLogout();
    window.addEventListener(AUTH_LOGOUT_EVENT, logoutHandler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, logoutHandler);
      window.removeEventListener("storage", handler);
    };
  }, [syncLogout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi(email, password);
    setStoredToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    syncLogout();
    emitLogoutEvent();
  }, [syncLogout]);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    const response = await changePasswordApi(payload);
    setUser(response.user);
    return response.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
      login,
      logout,
      changePassword,
      refreshUser,
    }),
    [user, loading, login, logout, changePassword, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
