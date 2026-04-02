import axios from "axios";
import { LoginRequest, LoginResponse, AuthMeResponse } from "@/types/auth.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
    timeout: 30000,
  });
  return response.data;
};

export const refreshTokenAPI = async (refreshToken: string): Promise<LoginResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    {
      timeout: 30000,
    },
  );
  return response.data;
};

export const getCurrentUser = async (token: string): Promise<AuthMeResponse> => {
  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 30000,
  });
  return response.data;
};

export const logout = async (token: string): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}/auth/logout`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    },
  );
};
