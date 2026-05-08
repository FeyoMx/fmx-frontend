import { apiGlobal } from "../api";
import { isApiStatus } from "../errors";
import { TenantAISettingsResponse, TenantAISettingsView, InstanceAISettingsResponse } from "./types";

export const createDefaultTenantAISettings = (): TenantAISettingsView => ({
  enabled: false,
  autoReply: false,
  provider: "openai",
  model: "",
  baseUrl: "",
  systemPrompt: "",
  configured: false,
});

export const getTenantAISettings = async (): Promise<TenantAISettingsView> => {
  try {
    const response = await apiGlobal.get<TenantAISettingsResponse>("/ai/settings");
    const payload = response.data;

    return {
      enabled: payload?.enabled ?? false,
      autoReply: payload?.auto_reply ?? false,
      provider: payload?.provider ?? "openai",
      model: payload?.model ?? "",
      baseUrl: payload?.base_url ?? "",
      systemPrompt: payload?.system_prompt ?? "",
      configured: true,
    };
  } catch (error) {
    if (isApiStatus(error, 404)) {
      return createDefaultTenantAISettings();
    }

    throw error;
  }
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

  return {
    ...settings,
    configured: true,
  };
};

export const getInstanceAISettings = async (instanceId: string): Promise<InstanceAISettingsResponse> => {
  try {
    const response = await apiGlobal.get<InstanceAISettingsResponse>(`/ai/instances/${instanceId}`);
    return response.data;
  } catch (error) {
    if (isApiStatus(error, 404)) {
      return {
        instance_id: instanceId,
        enabled: false,
        auto_reply: false,
      };
    }

    throw error;
  }
};

export const updateInstanceAISettings = async (instanceId: string, enabled: boolean, autoReply: boolean) => {
  const response = await apiGlobal.put<InstanceAISettingsResponse>(`/ai/instances/${instanceId}`, {
    enabled,
    auto_reply: autoReply,
  });
  return response.data;
};
