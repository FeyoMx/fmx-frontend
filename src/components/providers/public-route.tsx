import React from "react";
import { Navigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { getAuthToken } from "@/lib/auth";

type PublicRouteProps = {
  children: React.ReactNode;
};

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isLoading, token } = useTenant();
  const jwtToken = getAuthToken();

  // While loading, don't render anything
  if (isLoading) {
    return null;
  }

  // If user is already authenticated, redirect to dashboard
  if (jwtToken || token) {
    return <Navigate to="/manager/" replace />;
  }

  return children;
};

export default PublicRoute;
