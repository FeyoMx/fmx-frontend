import { useQuery } from "@tanstack/react-query";

import { apiGlobal } from "../api";
import { UseQueryParams } from "../types";
import { FetchWebhookResponse } from "./types";

interface IParams {
  instanceName: string | null;
}

const queryKey = (params: Partial<IParams>) => ["webhook", "fetchWebhook", JSON.stringify(params)];

export const fetchWebhook = async ({ instanceName }: IParams) => {
  const response = await apiGlobal.get(`/webhook`, {
    params: { instanceName },
  });

  const payload = response?.data?.data ?? response?.data;
  if (!payload) {
    return {
      enabled: false,
      instanceName: instanceName ?? "",
      url: "",
      webhook: "",
      webhook_url: "",
      events: [],
      webhookBase64: false,
      webhookByEvents: false,
    };
  }

  return payload;
};

export const useFetchWebhook = (props: UseQueryParams<FetchWebhookResponse> & Partial<IParams>) => {
  const { instanceName, ...rest } = props;
  return useQuery<FetchWebhookResponse>({
    ...rest,
    queryKey: queryKey({ instanceName }),
    queryFn: () => fetchWebhook({ instanceName: instanceName! }),
    enabled: !!instanceName,
  });
};
