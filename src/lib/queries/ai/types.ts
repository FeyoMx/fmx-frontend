export interface TenantAISettingsResponse {
  id?: string;
  tenant_id?: string;
  enabled: boolean;
  auto_reply: boolean;
  provider: string;
  model: string;
  base_url: string;
  system_prompt: string;
}

export interface InstanceAISettingsResponse {
  instance_id: string;
  enabled: boolean;
  auto_reply: boolean;
}

export interface TenantAISettingsView {
  enabled: boolean;
  autoReply: boolean;
  provider: string;
  model: string;
  baseUrl: string;
  systemPrompt: string;
}

export interface InstanceAISettingsView {
  instanceId: string;
  instanceName: string;
  enabled: boolean;
  autoReply: boolean;
  model: string;
}
