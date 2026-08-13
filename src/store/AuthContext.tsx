import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import { getAccessToken } from "@/api/session";
import { onAuthFailure } from "@/api/client";
import type { PublicUser } from "@/types/api";

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        setUser(await authApi.me());
      } catch {
        // token geçersiz/süresi dolmuş — kullanıcı giriş ekranına düşer
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Access + refresh token ikisi de gecersiz hale geldiginde (30 gunluk
  // refresh suresi doldu, sunucuda oturum silindi vb.) api/client.ts bunu
  // bildirir; kullanici burada oturumdan dusurulup Login ekranina yonlenir.
  useEffect(() => onAuthFailure(() => setUser(null)), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email, password) => setUser(await authApi.login(email, password)),
      register: async (input) => setUser(await authApi.register(input)),
      logout: async () => {
        await authApi.logout();
        setUser(null);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı.");
  return ctx;
}
