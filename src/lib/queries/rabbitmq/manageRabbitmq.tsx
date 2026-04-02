import { Rabbitmq } from "@/types/evolution.types";

import { apiGlobal } from "../api";
import { useManageMutation } from "../mutateQuery";

interface IParams {
  instanceId: string;
  data: Rabbitmq;
}

const createRabbitmq = async ({ instanceId, data }: IParams) => {
  const response = await apiGlobal.put(`/instance/${instanceId}/rabbitmq`, data);
  return response.data;
};

export function useManageRabbitmq() {
  const createRabbitmqMutation = useManageMutation(createRabbitmq, {
    invalidateKeys: [["rabbitmq", "fetchRabbitmq"]],
  });

  return {
    createRabbitmq: createRabbitmqMutation,
  };
}
