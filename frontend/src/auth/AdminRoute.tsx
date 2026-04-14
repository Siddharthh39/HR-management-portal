import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
