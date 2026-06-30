"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/auth-types";
import { AccountAuthModal } from "./AccountAuthModal";

type AuthMode = "login" | "register";

type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  setUser: (user: PublicUser | null) => void;
  refreshUser: () => Promise<void>;
  openLogin: () => void;
  openRegister: () => void;
  closeAuth: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openLogin = useCallback(() => {
    setMode("login");
    setOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setMode("register");
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setOpen(false);
    void refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/account");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        refreshUser,
        openLogin,
        openRegister,
        closeAuth,
        logout,
      }}
    >
      {children}
      <AccountAuthModal
        open={open}
        mode={mode}
        onClose={closeAuth}
        onModeChange={setMode}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthModalProvider");
  }
  return context;
}

/** @deprecated Используйте useAuth */
export function useAuthModal() {
  const { openLogin, closeAuth } = useAuth();
  return { openLogin, closeLogin: closeAuth };
}
