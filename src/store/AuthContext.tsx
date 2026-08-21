import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import { getAccessToken } from "@/api/session";
import { onAuthFailure } from "@/api/client";
import type { PublicUser } from "@/types/api";

type AuthContextValue = {
  user: PublicUser | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
  updateUser: (user: PublicUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
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
      isGuest,
      isLoading,
      login: async (email, password) => {
        setUser(await authApi.login(email, password));
        setIsGuest(false);
      },
      register: async (input) => {
        setUser(await authApi.register(input));
        setIsGuest(false);
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
        setIsGuest(false);
      },
      continueAsGuest: () => setIsGuest(true),
      exitGuest: () => setIsGuest(false),
      updateUser: (updated) => setUser(updated),
    }),
    [user, isGuest, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı.");
  return ctx;
}
