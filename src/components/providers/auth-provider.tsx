"use client";

import * as React from "react";
import { useAuth, type AuthUser, type UserRole } from "@/hooks/use-auth";

export type { AuthUser, UserRole };
export { useAuth };

type AuthContextValue = ReturnType<typeof useAuth>;

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
