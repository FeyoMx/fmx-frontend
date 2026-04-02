// CRM Types
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  pipelineStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

// Broadcast Types
export interface Broadcast {
  id: string;
  title: string;
  message: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAt?: string;
  sentAt?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  template?: string;
  delay?: number;
}

// AI Settings Types
export interface AISettings {
  tenantEnabled: boolean;
  apiKey: string;
  model: "gpt-4" | "gpt-3.5-turbo" | "claude-3-opus" | "claude-3-sonnet";
  maxTokens: number;
  temperature: number;
}

export interface InstanceAISettings {
  instanceId: string;
  instanceName: string;
  enabled: boolean;
  model: string;
}

// API Key Types
export interface APIKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  scopes: string[];
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalInstances: number;
  totalMessages: number;
  aiUsagePercentage: number;
  activeInstances: number;
}
