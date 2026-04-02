import { apiGlobal } from "../api";
import { TenantResponse } from "./types";

export const getTenant = async (): Promise<TenantResponse> => {
  const response = await apiGlobal.get("/tenant");
  return response.data;
};
