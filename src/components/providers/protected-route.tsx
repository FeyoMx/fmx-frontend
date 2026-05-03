import React from "react";
import { Navigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { getAuthToken } from "@/lib/auth";
import { RouteFallback } from "@/components/route-fallback";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoading, token } = useTenant();
  const jwtToken = getAuthToken();

  if (isLoading) {
    return <RouteFallback title="Checking session" description="Confirming your operator session before opening the workspace." />;
  }

  // Check if JWT token exists and is valid
  if (!jwtToken && !token) {
    return <Navigate to="/manager/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
