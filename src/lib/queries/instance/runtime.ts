import { useQuery } from "@tanstack/react-query";

import { apiGlobal } from "../api";
import { UseQueryParams } from "../types";
import { FetchInstanceRuntimeHistoryResponse, FetchInstanceRuntimeResponse, InstanceRuntimeHistoryEvent, InstanceRuntimeState } from "./types";
import { normalizeBridgeUnavailableError } from "./bridgeAvailability";

type RuntimeParams = {
  instanceId: string | null;
};

const runtimeKey = (instanceId?: string | null) => ["instance", "runtime", instanceId ?? ""];
const runtimeHistoryKey = (instanceId?: string | null) => ["instance", "runtime-history", instanceId ?? ""];

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
};

const readString = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

const readBoolean = (value: unknown): boolean | undefined => {
  return typeof value === "boolean" ? value : undefined;
};

const normalizeTimestamp = (value: unknown): string => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? new Date(value).toISOString() : new Date(value * 1000).toISOString();
  }

  const record = asRecord(value);
  if (record) {
    const seconds = typeof record.seconds === "number" ? record.seconds : typeof record.low === "number" ? record.low : null;
    if (seconds !== null) {
      return new Date(seconds * 1000).toISOString();
    }
  }

  return "";
};

const normalizeRuntimeState = (payload: unknown): InstanceRuntimeState => {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const lastObserved = asRecord(data.lastObserved) ?? asRecord(data.last_observed) ?? {};
  const bridge = asRecord(data.bridge) ?? {};

  return {
    state:
      readString(data.state) ||
      readString(data.runtimeState) ||
      readString(data.runtime_status) ||
      readString(data.status) ||
      "unknown",
    lastObservedStatus:
      readString(data.lastObservedStatus) ||
      readString(data.last_observed_status) ||
      readString(lastObserved.status) ||
      readString(lastObserved.connectionStatus) ||
      undefined,
    lastUpdatedAt:
      normalizeTimestamp(data.lastUpdatedAt) ||
      normalizeTimestamp(data.last_updated_at) ||
      normalizeTimestamp(data.updatedAt) ||
      normalizeTimestamp(data.updated_at) ||
      normalizeTimestamp(lastObserved.updatedAt) ||
      undefined,
    bridgeHealthy: readBoolean(data.bridgeHealthy) ?? readBoolean(data.bridge_healthy) ?? readBoolean(bridge.healthy),
    raw: payload,
  };
};

const normalizeRuntimeEvent = (entry: unknown, index: number): InstanceRuntimeHistoryEvent => {
  const record = asRecord(entry) ?? {};

  return {
    id: readString(record.id) || `runtime-event-${index}`,
    event: readString(record.event) || readString(record.type) || readString(record.name) || "status_observed",
    status: readString(record.status) || readString(record.connectionStatus) || undefined,
    timestamp:
      normalizeTimestamp(record.timestamp) ||
      normalizeTimestamp(record.createdAt) ||
      normalizeTimestamp(record.created_at) ||
      normalizeTimestamp(record.observedAt) ||
      normalizeTimestamp(record.updatedAt),
    detail: readString(record.detail) || readString(record.reason) || readString(record.message) || undefined,
    raw: entry,
  };
};

const normalizeRuntimeHistory = (payload: unknown): FetchInstanceRuntimeHistoryResponse => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeRuntimeEvent).sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }

  const root = asRecord(payload) ?? {};
  const data = root.data;
  if (Array.isArray(data)) {
    return data.map(normalizeRuntimeEvent).sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }

  const history = root.history;
  if (Array.isArray(history)) {
    return history.map(normalizeRuntimeEvent).sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }

  return [];
};

const fetchInstanceRuntime = async ({ instanceId }: RuntimeParams): Promise<FetchInstanceRuntimeResponse> => {
  try {
    const response = await apiGlobal.get(`/instance/id/${instanceId}/runtime`);
    return normalizeRuntimeState(response.data);
  } catch (error) {
    throw normalizeBridgeUnavailableError(error, "runtime");
  }
};

const fetchInstanceRuntimeHistory = async ({ instanceId }: RuntimeParams): Promise<FetchInstanceRuntimeHistoryResponse> => {
  try {
    const response = await apiGlobal.get(`/instance/id/${instanceId}/runtime/history`);
    return normalizeRuntimeHistory(response.data);
  } catch (error) {
    throw normalizeBridgeUnavailableError(error, "runtime-history");
  }
};

export const useInstanceRuntime = (props: UseQueryParams<FetchInstanceRuntimeResponse> & Partial<RuntimeParams>) => {
  const { instanceId, ...rest } = props;

  return useQuery<FetchInstanceRuntimeResponse>({
    ...rest,
    queryKey: runtimeKey(instanceId),
    queryFn: () => fetchInstanceRuntime({ instanceId: instanceId! }),
    enabled: !!instanceId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
};

export const useInstanceRuntimeHistory = (props: UseQueryParams<FetchInstanceRuntimeHistoryResponse> & Partial<RuntimeParams>) => {
  const { instanceId, ...rest } = props;

  return useQuery<FetchInstanceRuntimeHistoryResponse>({
    ...rest,
    queryKey: runtimeHistoryKey(instanceId),
    queryFn: () => fetchInstanceRuntimeHistory({ instanceId: instanceId! }),
    enabled: !!instanceId,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
};

export { runtimeHistoryKey, runtimeKey };
