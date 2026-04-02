import { useQuery } from "@tanstack/react-query";

import { apiGlobal } from "../api";
import { UseQueryParams } from "../types";
import { AdvancedSettings } from "@/types/evolution.types";

interface IParams {
  instanceId: string | null;
}

const queryKey = (params: Partial<IParams>) => ["instance", "fetchAdvancedSettings", JSON.stringify(params)];

export const fetchAdvancedSettings = async ({ instanceId }: IParams) => {
  const response = await apiGlobal.get(`/instance/id/${instanceId}/advanced-settings`);
  const payload = response?.data?.data ?? response?.data;

  if (!payload) {
    return {
      alwaysOnline: false,
      rejectCall: false,
      msgRejectCall: "",
      readMessages: false,
      ignoreGroups: false,
      ignoreStatus: false,
    } as AdvancedSettings;
  }

  return payload as AdvancedSettings;
};

export const useFetchAdvancedSettings = (props: UseQueryParams<AdvancedSettings> & Partial<IParams>) => {
  const { instanceId, ...rest } = props;
  return useQuery<AdvancedSettings>({
    ...rest,
    queryKey: queryKey({ instanceId }),
    queryFn: () => fetchAdvancedSettings({ instanceId: instanceId! }),
    enabled: !!instanceId,
  });
};
