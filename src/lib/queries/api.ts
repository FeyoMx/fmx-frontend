import axios, { AxiosError, AxiosInstance } from "axios";

import { getToken, TOKEN_ID } from "./token";
import { getAuthToken, getTenantId, refreshAuthToken, getRefreshToken, clearAuthTokens } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// API instance for instance-scoped requests (with apikey header)
export const api: AxiosInstance = axios.create({
  timeout: 30000,
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  async (config) => {
    // Support legacy API URL
    const apiUrl = getToken(TOKEN_ID.API_URL);
    if (apiUrl) {
      config.baseURL = apiUrl.toString();
    }

    // Attach instance token if available
    if (!config.headers.apiKey || config.headers.apiKey === "") {
      const token = getToken(TOKEN_ID.INSTANCE_TOKEN);
      if (token) {
        config.headers.apikey = `${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// API instance for global/tenant requests (with JWT)
export const apiGlobal: AxiosInstance = axios.create({
  timeout: 30000,
  baseURL: API_BASE_URL,
});

apiGlobal.interceptors.request.use(
  async (config) => {
    let token = getAuthToken();

    // Refresh token if needed
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000;
      if (Date.now() >= expirationTime - 5 * 60 * 1000) {
        // Refresh if less than 5 minutes left
        const newToken = await refreshAuthToken();
        if (newToken) {
          token = newToken;
        }
      }
    }

    // Attach JWT token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach tenant ID as header
    const tenantId = getTenantId();
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
apiGlobal.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const newToken = await refreshAuthToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiGlobal(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        clearAuthTokens();
        window.location.href = "/manager/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
