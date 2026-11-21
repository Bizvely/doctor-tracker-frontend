"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { UNAUTHORIZED_EVENT, api } from "@/lib/api";
import type { AuthUser } from "@/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthResponse {
  success: boolean;
  user: AuthUser;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Login অবস্থা পুরো app-এ জানানোর ব্যবস্থা। টিকিট (token) JavaScript-এ রাখা হয় না, শুধু httpOnly cookie-তে থাকে।
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  // পাতা খুললে একবার জিজ্ঞেস করা: আমি কি login আছি?
  useEffect(() => {
    const controller = new AbortController();

    api
      .get<AuthResponse>("/api/auth/me", { signal: controller.signal, skipUnauthorizedEvent: true })
      .then((response) => setState({ status: "authenticated", user: response.user }))
      .catch(() => {
        if (controller.signal.aborted) return;
        // 401 (login নেই) বা সংযোগ সমস্যা: দুই ক্ষেত্রেই login পাতা দেখানো হবে
        setState({ status: "unauthenticated", user: null });
      });

    return () => controller.abort();
  }, []);

  // কোনো request-এ 401 এলে (session শেষ) সাথে সাথে logout অবস্থায় নেওয়া
  useEffect(() => {
    const handleUnauthorized = (): void => {
      queryClient.clear();
      setState({ status: "unauthenticated", user: null });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      // ভুল password-এও 401 আসে, সেটা "session শেষ" নয়, তাই event বন্ধ
      const response = await api.post<AuthResponse>(
        "/api/auth/login",
        { email, password },
        { skipUnauthorizedEvent: true }
      );
      queryClient.clear();
      setState({ status: "authenticated", user: response.user });
    },
    [queryClient]
  );

  const logout = useCallback(async (): Promise<void> => {
    await api.post("/api/auth/logout", undefined, { skipUnauthorizedEvent: true });
    // আগের user-এর cache করা data যেন পরের জনকে না দেখায়
    queryClient.clear();
    setState({ status: "unauthenticated", user: null });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
