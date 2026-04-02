import { refreshTokenAPI, logout as logoutAPI } from "@/lib/queries/auth/login";
import { User } from "@/types/auth.types";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TENANT_ID_KEY = "tenant_id";
const USER_ID_KEY = "user_id";
const USER_ROLE_KEY = "user_role";

export const saveAuthTokens = (
  accessToken: string,
  refreshToken: string,
  tenantId: string,
  userId: string,
  role: string
) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(TENANT_ID_KEY, tenantId);
  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.setItem(USER_ROLE_KEY, role);
};

export const saveUserData = (userData: User) => {
  localStorage.setItem("user_data", JSON.stringify(userData));
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getTenantId = (): string | null => {
  return localStorage.getItem(TENANT_ID_KEY);
};

export const getUserId = (): string | null => {
  return localStorage.getItem(USER_ID_KEY);
};

export const getUserRole = (): string | null => {
  return localStorage.getItem(USER_ROLE_KEY);
};

export const getUserData = (): User | null => {
  const data = localStorage.getItem("user_data");
  return data ? JSON.parse(data) : null;
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TENANT_ID_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem("user_data");
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    return Date.now() >= expirationTime;
  } catch {
    return true;
  }
};

export const shouldRefreshToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    const fiveMinutes = 5 * 60 * 1000;

    return timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0;
  } catch {
    return false;
  }
};

export const refreshAuthToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  try {
    const response = await refreshTokenAPI(refreshToken);
    saveAuthTokens(
      response.access_token,
      response.refresh_token,
      response.tenant_id,
      response.user_id,
      response.role
    );
    return response.access_token;
  } catch (error) {
    clearAuthTokens();
    return null;
  }
};

export const performLogout = async (): Promise<void> => {
  const token = getAuthToken();
  if (token) {
    try {
      await logoutAPI(token);
    } catch (error) {
      // Ignore logout API errors, just clear local session
      console.warn("Logout API call failed:", error);
    }
  }
  clearAuthTokens();
  localStorage.removeItem("accessToken");
};
