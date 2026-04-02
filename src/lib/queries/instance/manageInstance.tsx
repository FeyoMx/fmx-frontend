import { AdvancedSettings, NewInstance } from "@/types/evolution.types";

import { apiGlobal } from "../api";
import { useManageMutation } from "../mutateQuery";
import { useQuery } from "@tanstack/react-query";

/**
 * Instance Management API Functions
 *
 * All operations now use ID-based routes with JWT authentication:
 *
 * ID-based routes:
 * - POST /instance/id/{id}/connect
 * - POST /instance/id/{id}/disconnect
 * - GET /instance/id/{id}/qrcode
 * - GET /instance/id/{id}/status
 * - POST /instance/id/{id}/restart
 * - POST /instance/id/{id}/logout
 * - PUT /instance/id/{id}/settings
 * - DELETE /instance/id/{id}
 */

const createInstance = async (instance: NewInstance) => {
  const response = await apiGlobal.post("/instance", instance);
  return response.data;
};

const restart = async (instanceId: string) => {
  const response = await apiGlobal.post(`/instance/id/${instanceId}/restart`);
  return response.data;
};

const logout = async (instanceId: string) => {
  const response = await apiGlobal.post(`/instance/id/${instanceId}/logout`);
  return response.data;
};

const deleteInstance = async (instanceId: string) => {
  const response = await apiGlobal.delete(`/instance/id/${instanceId}`);
  return response.data;
};

interface ConnectParams {
  instanceId: string;
  token: string;
  number?: string;
}

const connect = async ({ instanceId, token, number }: ConnectParams) => {
  const response = await apiGlobal.post(`/instance/id/${instanceId}/connect`, { number }, {
    headers: { apikey: token },
  });
  return response.data;
};


const disconnect = async (instanceId: string) => {
  const response = await apiGlobal.post(`/instance/id/${instanceId}/disconnect`);
  return response.data;
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
  token: string;
  data: Partial<AdvancedSettings>;
}

const updateSettings = async ({ instanceId, token, data }: UpdateSettingsParams) => {
  const response = await apiGlobal.put(`/instance/id/${instanceId}/advanced-settings`, data, {
    headers: {
      apikey: token,
    },
  });
  return response.data;
};

export function useManageInstance() {
  const connectMutation = useManageMutation(connect, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
    ],
  });
  const disconnectMutation = useManageMutation(disconnect, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
    ],
  });
  const updateSettingsMutation = useManageMutation(updateSettings, {
    invalidateKeys: [["instance", "fetchAdvancedSettings"]],
  });
  const deleteInstanceMutation = useManageMutation(deleteInstance, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
    ],
  });
  const logoutMutation = useManageMutation(logout, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
    ],
  });
  const restartMutation = useManageMutation(restart, {
    invalidateKeys: [
      ["instance", "fetchInstance"],
      ["instance", "fetchInstances"],
    ],
  });
  const createInstanceMutation = useManageMutation(createInstance, {
    invalidateKeys: [["instance", "fetchInstances"]],
  });

  return {
    connect: connectMutation,
    disconnect: disconnectMutation,
    updateSettings: updateSettingsMutation,
    deleteInstance: deleteInstanceMutation,
    logout: logoutMutation,
    restart: restartMutation,
    createInstance: createInstanceMutation,
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

/*
Usage Examples:

// All operations now use ID-based routes with JWT authentication
const { connect, disconnect, restart, logout, deleteInstance } = useManageInstance();

// Connect instance
await connect.mutateAsync({ instanceId: "123", token: "apiKey" });

// Disconnect instance
await disconnect.mutateAsync("123");

// Restart instance
await restart.mutateAsync("123");

// Logout instance
await logout.mutateAsync("123");

// Delete instance
await deleteInstance.mutateAsync("123");

// Using query hooks for status and QR code
const { data: qrCode } = useInstanceQRCode("123");
const { data: status } = useInstanceStatus("123");
*/
