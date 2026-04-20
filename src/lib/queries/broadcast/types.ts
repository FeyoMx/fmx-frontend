export type BroadcastJobStatus = "queued" | "processing" | "completed" | "completed_with_failures" | "failed" | string;

export type BroadcastRecipientStatus = "pending" | "sent" | "failed" | string;

export interface BroadcastRecipientAnalyticsResponse {
  tracked_broadcasts?: number | null;
  total?: number | null;
  total_recipients?: number | null;
  attempted?: number | null;
  sent?: number | null;
  failed?: number | null;
  pending?: number | null;
  partial?: boolean | null;
}

export interface BroadcastRecipientProgressResponse {
  id: string;
  broadcast_id: string;
  contact_id?: string | null;
  phone: string;
  delivery_status: BroadcastRecipientStatus;
  attempt_count?: number | null;
  last_error?: string | null;
  last_attempt_at?: string | null;
  sent_at?: string | null;
  failed_at?: string | null;
  message_id?: string | null;
  server_id?: number | null;
  chat_jid?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BroadcastRecipientFiltersResponse {
  status?: string | null;
  query?: string | null;
}

export interface BroadcastRecipientListResponse {
  broadcast_id: string;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  filters?: BroadcastRecipientFiltersResponse | null;
  summary?: BroadcastRecipientAnalyticsResponse | null;
  partial?: boolean | null;
  items?: BroadcastRecipientProgressResponse[] | null;
}

export interface BroadcastJobResponse {
  id: string;
  instance_id: string;
  status: BroadcastJobStatus;
  message: string;
  rate_per_hour?: number;
  delay_sec?: number;
  attempts?: number;
  max_attempts?: number;
  scheduled_at?: string | null;
  available_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  last_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  analytics?: BroadcastRecipientAnalyticsResponse | null;
  recipients?: BroadcastRecipientAnalyticsResponse | BroadcastRecipientProgressResponse[] | null;
  recipient_totals?: BroadcastRecipientAnalyticsResponse | null;
  recipient_total?: number | null;
  recipient_attempted?: number | null;
  recipient_sent?: number | null;
  recipient_failed?: number | null;
  recipient_pending?: number | null;
  recipient_partial?: boolean | null;
  sent_count?: number | null;
  failed_count?: number | null;
  pending_count?: number | null;
  recipient_analytics?: BroadcastRecipientAnalyticsResponse | null;
}

export interface BroadcastRecipientAnalyticsView {
  trackedBroadcasts: number | null;
  total: number | null;
  attempted: number | null;
  sent: number | null;
  failed: number | null;
  pending: number | null;
  partial: boolean;
  progressPercent: number | null;
  analyticsAvailable: boolean;
}

export interface BroadcastRecipientProgressView {
  id: string;
  broadcastId: string;
  contactId: string | null;
  phone: string;
  status: BroadcastRecipientStatus;
  attemptCount: number;
  lastError: string | null;
  lastAttemptAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  messageId: string | null;
  serverId: number | null;
  chatJid: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BroadcastRecipientListView {
  broadcastId: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filters: {
    status: string;
    query: string;
  };
  summary: BroadcastRecipientAnalyticsView;
  partial: boolean;
  items: BroadcastRecipientProgressView[];
}

export interface BroadcastView {
  id: string;
  instanceId: string;
  message: string;
  status: BroadcastJobStatus;
  ratePerHour: number;
  delaySec: number;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string | null;
  availableAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string | null;
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
