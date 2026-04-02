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
}

export interface CreateBroadcastInput {
  instance_id: string;
  message: string;
  rate_per_hour?: number;
  delay_sec?: number;
  max_attempts?: number;
  scheduled_at?: string | null;
}
