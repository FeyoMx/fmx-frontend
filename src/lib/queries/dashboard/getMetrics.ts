import { apiGlobal } from "../api";
import { DashboardMetricsResponse, DashboardMetricsView } from "./types";

export const getDashboardMetrics = async (): Promise<DashboardMetricsView> => {
  const response = await apiGlobal.get<DashboardMetricsResponse>("/dashboard/metrics");
  const payload = response.data ?? {};

  return {
    totalInstances: payload.totalInstances ?? payload.instances_total ?? 0,
    totalMessages: payload.totalMessages ?? payload.messages_total ?? 0,
    totalContacts: payload.totalContacts ?? payload.contacts_total ?? 0,
    totalBroadcasts: payload.totalBroadcasts ?? payload.broadcast_total ?? 0,
    activeInstances: payload.activeInstances ?? payload.instances_active ?? 0,
    inactiveInstances: payload.inactiveInstances ?? payload.instances_inactive ?? 0,
  };
};
