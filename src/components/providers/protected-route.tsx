import React from "react";
import { Navigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { getAuthToken } from "@/lib/auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoading, token } = useTenant();
  const jwtToken = getAuthToken();

  // While loading, don't render anything
  if (isLoading) {
    return null;
  }

  // Check if JWT token exists and is valid
  if (!jwtToken && !token) {
    return <Navigate to="/manager/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
