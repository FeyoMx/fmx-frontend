export interface DashboardMetricsResponse {
  totalInstances?: number;
  activeInstances?: number;
  inactiveInstances?: number;
  totalMessages?: number;
  totalContacts?: number;
  totalBroadcasts?: number;
  instances_total?: number;
  instances_active?: number;
  instances_inactive?: number;
  messages_total?: number;
  contacts_total?: number;
  broadcast_total?: number;
}

export interface DashboardMetricsView {
  totalInstances: number;
  totalMessages: number;
  totalContacts: number;
  totalBroadcasts: number;
  activeInstances: number;
  inactiveInstances: number;
}
