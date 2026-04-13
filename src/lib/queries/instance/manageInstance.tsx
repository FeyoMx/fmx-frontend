import { AdvancedSettings, InstanceTextMessageInput, InstanceTextMessageJobStatus, InstanceTextMessageResult, NewInstance } from "@/types/evolution.types";
import { InstanceHistoryBackfillResult } from "./types";

import { apiGlobal } from "../api";
import { useManageMutation } from "../mutateQuery";
import { useQuery } from "@tanstack/react-query";
import { normalizeBridgeUnavailableError } from "./bridgeAvailability";

/**
 * Instance Management API Functions
 *
 * All operations now use ID-based routes with JWT authentication:
 *
 * ID-based routes:
 * - POST /instance/id/{id}/reconnect
 * - POST /instance/id/{id}/pair
 * - GET /instance/id/{id}/qrcode
 * - GET /instance/id/{id}/status
 * - DELETE /instance/id/{id}/logout
 * - POST /instance/id/{id}/history/backfill
 * - PUT /instance/id/{id}/settings
 * - DELETE /instance/id/{id}
 */

const createInstance = async (instance: NewInstance) => {
  const response = await apiGlobal.post("/instance", instance);
  return response.data;
};

const reconnect = async (instanceId: string) => {
  try {
    const response = await apiGlobal.post(`/instance/id/${instanceId}/reconnect`);
    return response.data;
  } catch (error) {
    throw normalizeBridgeUnavailableError(error, "reconnect");
  }
};

const logout = async (instanceId: string) => {
  try {
    const response = await apiGlobal.delete(`/instance/id/${instanceId}/logout`);
    return response.data;
  } catch (error) {
    throw normalizeBridgeUnavailableError(error, "logout");
  }
};

const deleteInstance = async (instanceId: string) => {
  const response = await apiGlobal.delete(`/instance/id/${instanceId}`);
  return response.data;
};

interface PairParams {
  instanceId: string;
  phone: string;
}

const pair = async ({ instanceId, phone }: PairParams) => {
  try {
    const response = await apiGlobal.post(`/instance/id/${instanceId}/pair`, { phone });
    return response.data;
  } catch (error) {
    throw normalizeBridgeUnavailableError(error, "pair");
  }
};

interface HistoryBackfillParams {
  instanceId: string;
  data: {
    chat_jid: string;
    count?: number;
  };
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
};

const readString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.trim() ? value : undefined;
};

const readBoolean = (value: unknown): boolean | undefined => {
  return typeof value === "boolean" ? value : undefined;
};

const readNumber = (value: unknown): number | undefined => {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const normalizeHistoryBackfillResponse = (payload: unknown): InstanceHistoryBackfillResult => {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;

  return {
    accepted: readBoolean(data.accepted) ?? false,
    action: readString(data.action),
    chatJid: readString(data.chat_jid) ?? readString(data.chatJid),
    anchorMessageId: readString(data.anchor_message_id) ?? readString(data.anchorMessageId),
    anchorSource: readString(data.anchor_source) ?? readString(data.anchorSource),
    count: readNumber(data.count),
    bridgeDependent: readBoolean(data.bridge_dependent) ?? readBoolean(data.bridgeDependent),
    historicalIngestion: readString(data.historical_ingestion) ?? readString(data.historicalIngestion),
    operatorMessage: readString(data.operator_message) ?? readString(root.message),
    raw: payload,
  };
};

const backfillHistory = async ({ instanceId, data }: HistoryBackfillParams): Promise<InstanceHistoryBackfillResult> => {
  try {
    const response = await apiGlobal.post(`/instance/id/${instanceId}/history/backfill`, data);
    return normalizeHistoryBackfillResponse(response.data);
  } catch (error) {
    throw normalizeBridgeUnavailableError(error, "history-backfill");
  }
};

const getQRCode = async (instanceId: string) => {
  const response = await apiGlobal.get(`/instance/id/${instanceId}/qrcode`);
  const payload = response?.data?.data ?? response?.data;

  if (!payload) {
    return {
      instance_id: instanceId,
      instanceName: "",
      engine_instance_id: "",
      status: "close",
      connected: false,
      qrcode: "",
      code: "",
    };
  }

  return payload;
};

const getStatus = async (instanceId: string) => {
  const response = await apiGlobal.get(`/instance/id/${instanceId}/status`);
  const payload = response?.data?.data ?? response?.data;

  if (!payload) {
    return {
      instance_id: instanceId,
      instanceName: "",
      engine_instance_id: "",
      status: "close",
      connected: false,
    };
  }

  return payload;
};

interface UpdateSettingsParams {
  instanceId: string;
  data: Partial<AdvancedSettings>;
}

const updateSettings = async ({ instanceId, data }: UpdateSettingsParams) => {
  const response = await apiGlobal.put(`/instance/id/${instanceId}/advanced-settings`, data);
  return response.data;
};

interface SendTextMessageParams {
  instanceId: string;
  data: InstanceTextMessageInput;
}

type SendTextMessageResponse = {
  httpStatus: number;
  message: string;
  instance_id: string;
  instanceName: string;
  engine_instance_id?: string;
} & InstanceTextMessageResult;

const sendTextMessage = async ({ instanceId, data }: SendTextMessageParams) => {
  const payload = {
    number: data.number,
    text: data.text,
    delay: data.delay ?? 0,
  };

  const response = await apiGlobal.post<SendTextMessageResponse>(`/instance/${instanceId}/messages/text`, payload);
  return {
    ...response.data,
    httpStatus: response.status,
  };
};

const getTextMessageJobStatus = async (statusEndpoint: string) => {
  const response = await apiGlobal.get<InstanceTextMessageJobStatus>(statusEndpoint);
  return response.data;
};

export function useManageInstance() {
  const reconnectMutation = useManageMutation(reconnect, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
      ["instance", "status"],
      ["instance", "qrcode"],
      ["instance", "runtime"],
      ["instance", "runtime-history"],
    ],
  });
  const pairMutation = useManageMutation(pair, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
      ["instance", "status"],
      ["instance", "qrcode"],
      ["instance", "runtime"],
      ["instance", "runtime-history"],
    ],
  });
  const updateSettingsMutation = useManageMutation(updateSettings, {
    invalidateKeys: [["instance", "fetchAdvancedSettings"]],
  });
  const deleteInstanceMutation = useManageMutation(deleteInstance, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
      ["instance", "runtime"],
      ["instance", "runtime-history"],
    ],
  });
  const logoutMutation = useManageMutation(logout, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
      ["instance", "status"],
      ["instance", "qrcode"],
      ["instance", "runtime"],
      ["instance", "runtime-history"],
    ],
  });
  const createInstanceMutation = useManageMutation(createInstance, {
    invalidateKeys: [["instance", "fetchInstances"]],
  });
  const backfillHistoryMutation = useManageMutation(backfillHistory, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
      ["instance", "runtime"],
      ["instance", "runtime-history"],
      ["chat", "threads"],
      ["chat", "history"],
    ],
  });
  const sendTextMessageMutation = useManageMutation(sendTextMessage);

  return {
    reconnect: reconnectMutation,
    pair: pairMutation,
    updateSettings: updateSettingsMutation,
    deleteInstance: deleteInstanceMutation,
    logout: logoutMutation,
    backfillHistory: backfillHistoryMutation,
    createInstance: createInstanceMutation,
    sendTextMessage: sendTextMessageMutation,
  };
}

export function useInstanceQRCode(instanceId: string) {
  return useQuery({
    queryKey: ["instance", "qrcode", instanceId],
    queryFn: () => getQRCode(instanceId),
    enabled: !!instanceId,
    refetchInterval: 2500,
    refetchIntervalInBackground: true,
  });
}

export function useInstanceStatus(instanceId: string) {
  return useQuery({
    queryKey: ["instance", "status", instanceId],
    queryFn: () => getStatus(instanceId),
    enabled: !!instanceId,
    refetchInterval: 2500,
    refetchIntervalInBackground: true,
  });
}

export { getTextMessageJobStatus };

/*
Usage Examples:

// All operations now use ID-based routes with JWT authentication
const { reconnect, pair, logout, deleteInstance } = useManageInstance();

// Request reconnect / QR refresh
await reconnect("123");

// Request pairing code
await pair({ instanceId: "123", phone: "15551234567" });

// Logout instance
await logout("123");

// Delete instance
await deleteInstance("123");

// Using query hooks for status and QR code
const { data: qrCode } = useInstanceQRCode("123");
const { data: status } = useInstanceStatus("123");
*/
