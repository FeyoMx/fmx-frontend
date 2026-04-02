import { useQuery } from "@tanstack/react-query";

import { apiGlobal } from "../api";
import { UseQueryParams } from "../types";
import { FetchRabbitmqResponse } from "./types";

interface IParams {
  instanceId: string | null;
}

const queryKey = (params: Partial<IParams>) => ["rabbitmq", "fetchRabbitmq", JSON.stringify(params)];

export const fetchRabbitmq = async ({ instanceId }: IParams) => {
  const response = await apiGlobal.get(`/instance/${instanceId}/rabbitmq`);
  return response.data;
};

export const useFetchRabbitmq = (props: UseQueryParams<FetchRabbitmqResponse> & Partial<IParams>) => {
  const { instanceId, ...rest } = props;
  return useQuery<FetchRabbitmqResponse>({
    ...rest,
    queryKey: queryKey({ instanceId }),
    queryFn: () => fetchRabbitmq({ instanceId: instanceId! }),
    enabled: !!instanceId,
  });
};
