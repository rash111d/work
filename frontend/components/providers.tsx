"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import type { User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    university: string;
    course: number;
    skills: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const theme = window.localStorage.getItem("edumatch.theme");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await api.me();
    setUser(profile);
  }, []);

  useEffect(() => {
    if (!api.hasSession()) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {
        api.clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const response = await api.login(input);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      university: string;
      course: number;
      skills: string[];
    }) => {
      const response = await api.register(input);
      setUser(response.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within Providers");
  }
  return value;
}
