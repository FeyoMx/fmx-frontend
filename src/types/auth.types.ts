export interface LoginRequest {
  tenant_slug: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  tenant_id: string;
  user_id: string;
  role: "owner" | "admin" | "manager" | "user";
  expires_in: number;
}

export interface AuthMeResponse {
  user_id: string;
  tenant_id: string;
  email: string;
  role: "owner" | "admin" | "manager" | "user";
  api_key: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string; // Optional display name
  role: "owner" | "admin" | "manager" | "user";
  tenantId: string;
  apiKey?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  instancesCount: number;
  messagesCount: number;
  aiUsage: {
    tokensUsed: number;
    tokensLimit: number;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  refreshToken?: string | null;
}
