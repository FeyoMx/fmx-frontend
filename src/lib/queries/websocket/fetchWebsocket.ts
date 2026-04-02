import { useQuery } from "@tanstack/react-query";

import { apiGlobal } from "../api";
import { UseQueryParams } from "../types";
import { FetchWebsocketResponse } from "./types";

interface IParams {
  instanceId: string | null;
}

const queryKey = (params: Partial<IParams>) => ["websocket", "fetchWebsocket", JSON.stringify(params)];

export const fetchWebsocket = async ({ instanceId }: IParams) => {
  const response = await apiGlobal.get(`/instance/${instanceId}/websocket`);
  return response.data;
};

export const useFetchWebsocket = (props: UseQueryParams<FetchWebsocketResponse> & Partial<IParams>) => {
  const { instanceId, ...rest } = props;
  return useQuery<FetchWebsocketResponse>({
    ...rest,
    queryKey: queryKey({ instanceId }),
    queryFn: () => fetchWebsocket({ instanceId: instanceId! }),
    enabled: !!instanceId,
  });
};
