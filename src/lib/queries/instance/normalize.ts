import { Instance } from "@/types/evolution.types";

type RawInstance = Partial<Instance> & {
  instance_id?: string;
  instanceName?: string;
  status?: string;
  engine_instance_id?: string;
  owner?: string;
  jid?: string;
  apikey?: string;
  apiKey?: string;
  created_at?: string;
  updated_at?: string;
};

const emptyCounts = {
  Message: 0,
  Contact: 0,
  Chat: 0,
};

export const normalizeInstance = (raw: RawInstance | null | undefined): Instance => {
  const ownerJid = raw?.ownerJid ?? raw?.owner ?? raw?.jid ?? "";

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
    _count: {
      ...emptyCounts,
      ...raw?._count,
    },
  };
};

export const normalizeInstances = (payload: unknown): Instance[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => normalizeInstance(item as RawInstance));
};
