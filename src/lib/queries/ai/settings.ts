import { apiGlobal } from "../api";
import { TenantAISettingsResponse, TenantAISettingsView, InstanceAISettingsResponse } from "./types";

export const getTenantAISettings = async (): Promise<TenantAISettingsView> => {
  const response = await apiGlobal.get<TenantAISettingsResponse>("/ai/settings");
  const payload = response.data;

  return {
    enabled: payload?.enabled ?? false,
    autoReply: payload?.auto_reply ?? false,
    provider: payload?.provider ?? "openai",
    model: payload?.model ?? "",
    baseUrl: payload?.base_url ?? "",
    systemPrompt: payload?.system_prompt ?? "",
  };
};

export const updateTenantAISettings = async (settings: TenantAISettingsView): Promise<TenantAISettingsView> => {
  await apiGlobal.put("/ai/settings", {
    enabled: settings.enabled,
    auto_reply: settings.autoReply,
    provider: settings.provider,
    model: settings.model,
    base_url: settings.baseUrl,
    system_prompt: settings.systemPrompt,
  });

  return settings;
};

export const getInstanceAISettings = async (instanceId: string): Promise<InstanceAISettingsResponse> => {
  const response = await apiGlobal.get<InstanceAISettingsResponse>(`/ai/instances/${instanceId}`);
  return response.data;
};

export const updateInstanceAISettings = async (instanceId: string, enabled: boolean, autoReply: boolean) => {
  const response = await apiGlobal.put<InstanceAISettingsResponse>(`/ai/instances/${instanceId}`, {
    enabled,
    auto_reply: autoReply,
  });
  return response.data;
};
