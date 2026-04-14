import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { DemoRole, DemoAccount } from "@/types/api";
import { DEMO_ACCOUNTS } from "@/types/api";

interface AuthState {
  actorEmail: string;
  role: DemoRole;
  isAdmin: boolean;
  accounts: DemoAccount[];
  switchAccount: (role: DemoRole) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<DemoRole>(() => {
    const stored = sessionStorage.getItem("hr_actor_role") || localStorage.getItem("hr_actor_role");
    return (stored === "admin" || stored === "employee") ? stored : "admin";
  });

  const actorEmail = DEMO_ACCOUNTS.find(a => a.role === role)!.email;

  useEffect(() => {
    sessionStorage.setItem("hr_actor_email", actorEmail);
    sessionStorage.setItem("hr_actor_role", role);
    localStorage.setItem("hr_actor_email", actorEmail);
    localStorage.setItem("hr_actor_role", role);
  }, [actorEmail, role]);

  const switchAccount = useCallback((newRole: DemoRole) => setRole(newRole), []);

  return (
    <AuthContext.Provider value={{ actorEmail, role, isAdmin: role === "admin", accounts: DEMO_ACCOUNTS, switchAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
