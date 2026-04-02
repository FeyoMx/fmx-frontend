import { Instance } from "@/types/evolution.types";
import { BackendInstanceResponse } from "./types";

const normalizeMetric = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const normalizeInstance = (raw: BackendInstanceResponse | null | undefined): Instance => {
  const ownerJid = raw?.ownerJid ?? raw?.owner ?? raw?.jid ?? "";
  const rawCounts = raw?._count;

  return {
    id: raw?.id ?? raw?.instance_id ?? "",
    name: raw?.name ?? raw?.instanceName ?? "",
    connectionStatus: raw?.connectionStatus ?? raw?.status ?? "close",
    ownerJid,
    profileName: raw?.profileName ?? "",
    profilePicUrl: raw?.profilePicUrl ?? "",
    integration: raw?.integration ?? raw?.engine_instance_id ?? "",
    number: raw?.number ?? "",
    businessId: raw?.businessId ?? "",
    token: raw?.token ?? raw?.apiKey ?? raw?.apikey ?? "",
    clientName: raw?.clientName ?? "",
    createdAt: raw?.createdAt ?? raw?.created_at ?? "",
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? "",
    Setting: raw?.Setting ?? {
      rejectCall: false,
      groupsIgnore: false,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
    },
    stats: {
      messages: normalizeMetric(rawCounts?.Message ?? raw?.Message),
      contacts: normalizeMetric(rawCounts?.Contact ?? raw?.Contact),
      chats: normalizeMetric(rawCounts?.Chat ?? raw?.Chat),
    },
  };
};

export const normalizeInstances = (payload: unknown): Instance[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => normalizeInstance(item as BackendInstanceResponse));
};
