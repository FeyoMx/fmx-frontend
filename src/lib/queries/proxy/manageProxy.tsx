import { Proxy } from "@/types/evolution.types";

import { apiGlobal } from "../api";
import { useManageMutation } from "../mutateQuery";

interface IParams {
  instanceId: string;
  data: Proxy;
}

const createProxy = async ({ instanceId, data }: IParams) => {
  const response = await apiGlobal.put(`/instance/${instanceId}/proxy`, data);
  return response.data;
};

export function useManageProxy() {
  const createProxyMutation = useManageMutation(createProxy, {
    invalidateKeys: [["proxy", "fetchProxy"]],
  });

  return {
    createProxy: createProxyMutation,
  };
}
