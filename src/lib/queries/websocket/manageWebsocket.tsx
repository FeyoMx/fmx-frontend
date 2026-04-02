import { Websocket } from "@/types/evolution.types";

import { apiGlobal } from "../api";
import { useManageMutation } from "../mutateQuery";

interface IParams {
  instanceId: string;
  data: Websocket;
}

const createWebsocket = async ({ instanceId, data }: IParams) => {
  const response = await apiGlobal.put(`/instance/${instanceId}/websocket`, data);
  return response.data;
};

export function useManageWebsocket() {
  const createWebsocketMutation = useManageMutation(createWebsocket, {
    invalidateKeys: [["websocket", "fetchWebsocket"]],
  });

  return {
    createWebsocket: createWebsocketMutation,
  };
}
