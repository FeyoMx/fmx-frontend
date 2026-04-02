import { Webhook } from "@/types/evolution.types";

import { apiGlobal } from "../api";
import { useManageMutation } from "../mutateQuery";

interface IParams {
  instanceName: string;
  data: Webhook;
}

const createWebhook = async ({ instanceName, data }: IParams) => {
  const response = await apiGlobal.post(`/webhook`, { instanceName, webhook: data });
  return response.data;
};

export function useManageWebhook() {
  const createWebhookMutation = useManageMutation(createWebhook, {
    invalidateKeys: [["webhook", "fetchWebhook"]],
  });

  return {
    createWebhook: createWebhookMutation,
  };
}
