import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();

  return (
    <ProtectedRoute>
      {isAdmin ? children : <Navigate to="/dashboard" replace />}
    </ProtectedRoute>
  );
}
