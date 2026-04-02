import React, { createContext, useContext, useEffect, useState } from "react";
import { Tenant, User } from "@/types/auth.types";
import { apiGlobal } from "@/lib/queries/api";
import { getAuthToken, getTenantId, getUserData, refreshAuthToken, shouldRefreshToken } from "@/lib/auth";

interface TenantContextType {
  tenant: Tenant | null;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setTenant: (tenant: Tenant | null) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize from localStorage
    const storedToken = getAuthToken();
    const storedTenantId = getTenantId();
    const storedUserData = getUserData();

    if (storedToken && storedTenantId && storedUserData) {
      setToken(storedToken);
      setUser(storedUserData);

      const fetchUserData = async () => {
        try {
          const response = await apiGlobal.get("/auth/me");
          const userData = response.data;

          // Update user data with fresh info from API
          const updatedUser = {
            ...userData,
            id: userData.user_id,
            email: userData.email,
            role: userData.role,
            tenantId: userData.tenant_id,
            apiKey: userData.api_key,
          };
          setUser(updatedUser);

          // For now, keep existing tenant data or create basic tenant
          // TODO: Add separate endpoint for full tenant data if needed
          setTenant((currentTenant) => currentTenant || {
            id: userData.tenant_id,
            name: "FMX Tenant",
            plan: "pro" as const,
            instancesCount: 0,
            messagesCount: 0,
            aiUsage: { tokensUsed: 0, tokensLimit: 10000 },
          });
        } catch (error) {
          console.warn("Unable to fetch user data from /auth/me API, using stored data.", error);
          // Keep stored user data if API fails
        }
      };

      void fetchUserData();
    }

    setIsLoading(false);

    // Set up token refresh interval
    if (storedToken && shouldRefreshToken(storedToken)) {
      refreshAuthToken();
    }

    const refreshInterval = setInterval(() => {
      const currentToken = getAuthToken();
      if (currentToken && shouldRefreshToken(currentToken)) {
        refreshAuthToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, user, token, isLoading, setTenant, setUser, setToken }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};
