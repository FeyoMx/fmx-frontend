export interface BroadcastRecipientAnalyticsResponse {
  total?: number | null;
  sent?: number | null;
  failed?: number | null;
  pending?: number | null;
}

export interface BroadcastJobResponse {
  id: string;
  instance_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  message: string;
  rate_per_hour?: number;
  delay_sec?: number;
  attempts?: number;
  max_attempts?: number;
  scheduled_at?: string | null;
  available_at?: string;
  completed_at?: string | null;
  failed_at?: string | null;
  created_at?: string;
  analytics?: BroadcastRecipientAnalyticsResponse | null;
  recipients?: BroadcastRecipientAnalyticsResponse | null;
  recipient_totals?: BroadcastRecipientAnalyticsResponse | null;
  recipient_total?: number | null;
  sent_count?: number | null;
  failed_count?: number | null;
  pending_count?: number | null;
}

export interface BroadcastRecipientAnalyticsView {
  total: number | null;
  sent: number | null;
  failed: number | null;
  pending: number | null;
  progressPercent: number | null;
  analyticsAvailable: boolean;
}

export interface BroadcastView {
  id: string;
  instanceId: string;
  message: string;
  status: "queued" | "processing" | "completed" | "failed";
  ratePerHour: number;
  delaySec: number;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  recipientAnalytics: BroadcastRecipientAnalyticsView;
}

export interface CreateBroadcastInput {
  instance_id: string;
  message: string;
  rate_per_hour?: number;
  delay_sec?: number;
  max_attempts?: number;
  scheduled_at?: string | null;
}
