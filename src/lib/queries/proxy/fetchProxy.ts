import { useQuery } from "@tanstack/react-query";

import { apiGlobal } from "../api";
import { UseQueryParams } from "../types";
import { FetchProxyResponse } from "./types";

interface IParams {
  instanceId: string | null;
}

const queryKey = (params: Partial<IParams>) => ["proxy", "fetchProxy", JSON.stringify(params)];

export const fetchProxy = async ({ instanceId }: IParams) => {
  const response = await apiGlobal.get(`/instance/${instanceId}/proxy`);
  return response.data;
};

export const useFetchProxy = (props: UseQueryParams<FetchProxyResponse> & Partial<IParams>) => {
  const { instanceId, ...rest } = props;
  return useQuery<FetchProxyResponse>({
    ...rest,
    queryKey: queryKey({ instanceId }),
    queryFn: () => fetchProxy({ instanceId: instanceId! }),
    enabled: !!instanceId,
  });
};
