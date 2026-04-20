import { apiGlobal } from "../api";
import {
  BroadcastJobResponse,
  BroadcastRecipientAnalyticsResponse,
  BroadcastRecipientAnalyticsView,
  BroadcastRecipientListResponse,
  BroadcastRecipientListView,
  BroadcastRecipientProgressResponse,
  BroadcastRecipientProgressView,
  BroadcastView,
  CreateBroadcastInput,
} from "./types";

function normalizeCount(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function normalizeRecipientAnalytics(source: BroadcastRecipientAnalyticsResponse | null | undefined): BroadcastRecipientAnalyticsView {
  const trackedBroadcasts = normalizeCount(source?.tracked_broadcasts);
  const total = normalizeCount(source?.total_recipients ?? source?.total);
  const attempted = normalizeCount(source?.attempted);
  const sent = normalizeCount(source?.sent);
  const failed = normalizeCount(source?.failed);
  const pending = normalizeCount(source?.pending);
  const partial = source?.partial === true;
  const analyticsAvailable = [total, attempted, sent, failed, pending].some((value) => value !== null) || partial;

  let progressPercent: number | null = null;
  if (total && total > 0 && attempted !== null) {
    progressPercent = Math.max(0, Math.min(100, Math.round((attempted / total) * 100)));
  }

  return {
    trackedBroadcasts,
    total,
    attempted,
    sent,
    failed,
    pending,
    partial,
    progressPercent,
    analyticsAvailable,
  };
}

function normalizeRecipientAnalyticsFromJob(job: BroadcastJobResponse): BroadcastRecipientAnalyticsView {
  const candidate = [
    job.recipient_analytics,
    job.analytics,
    typeof job.recipients === "object" && !Array.isArray(job.recipients) ? job.recipients : null,
    job.recipient_totals,
    {
      total_recipients: job.recipient_total,
      attempted: job.recipient_attempted,
      sent: job.recipient_sent ?? job.sent_count,
      failed: job.recipient_failed ?? job.failed_count,
      pending: job.recipient_pending ?? job.pending_count,
      partial: job.recipient_partial,
    } satisfies BroadcastRecipientAnalyticsResponse,
  ].find((entry) => entry !== null && entry !== undefined);

  return normalizeRecipientAnalytics(candidate ?? null);
}

function normalizeRecipientProgress(item: BroadcastRecipientProgressResponse): BroadcastRecipientProgressView {
  return {
    id: item.id,
    broadcastId: item.broadcast_id,
    contactId: item.contact_id ?? null,
    phone: item.phone,
    status: item.delivery_status,
    attemptCount: normalizeCount(item.attempt_count) ?? 0,
    lastError: item.last_error ?? null,
    lastAttemptAt: item.last_attempt_at ?? null,
    sentAt: item.sent_at ?? null,
    failedAt: item.failed_at ?? null,
    messageId: item.message_id ?? null,
    serverId: typeof item.server_id === "number" ? item.server_id : null,
    chatJid: item.chat_jid ?? null,
    createdAt: item.created_at ?? null,
    updatedAt: item.updated_at ?? null,
  };
}

const normalizeJob = (job: BroadcastJobResponse): BroadcastView => ({
  id: job.id,
  instanceId: job.instance_id,
  message: job.message,
  status: job.status,
  ratePerHour: job.rate_per_hour ?? 0,
  delaySec: job.delay_sec ?? 0,
  attempts: job.attempts ?? 0,
  maxAttempts: job.max_attempts ?? 0,
  scheduledAt: job.scheduled_at ?? null,
  availableAt: job.available_at ?? null,
  startedAt: job.started_at ?? null,
  completedAt: job.completed_at ?? null,
  failedAt: job.failed_at ?? null,
  lastError: job.last_error ?? null,
  createdAt: job.created_at ?? "",
  updatedAt: job.updated_at ?? null,
  recipientAnalytics: normalizeRecipientAnalyticsFromJob(job),
});

export const getBroadcastJobs = async (): Promise<BroadcastView[]> => {
  const response = await apiGlobal.get<BroadcastJobResponse[]>("/broadcast");
  return (response.data ?? []).map(normalizeJob);
};

export const getBroadcastJob = async (broadcastId: string): Promise<BroadcastView> => {
  const response = await apiGlobal.get<BroadcastJobResponse>(`/broadcast/${broadcastId}`);
  return normalizeJob(response.data);
};

export const getBroadcastRecipients = async ({
  broadcastId,
  page,
  limit,
  status,
  query,
}: {
  broadcastId: string;
  page: number;
  limit: number;
  status?: string;
  query?: string;
}): Promise<BroadcastRecipientListView> => {
  const response = await apiGlobal.get<BroadcastRecipientListResponse>(`/broadcast/${broadcastId}/recipients`, {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(query?.trim() ? { query: query.trim() } : {}),
    },
  });

  const payload = response.data;
  return {
    broadcastId: payload.broadcast_id,
    page: payload.page,
    limit: payload.limit,
    total: payload.total,
    totalPages: payload.total_pages,
    filters: {
      status: payload.filters?.status ?? "",
      query: payload.filters?.query ?? "",
    },
    summary: normalizeRecipientAnalytics(payload.summary),
    partial: payload.partial === true,
    items: (payload.items ?? []).map(normalizeRecipientProgress),
  };
};

export const createBroadcastJob = async (input: CreateBroadcastInput): Promise<BroadcastView> => {
  const response = await apiGlobal.post<BroadcastJobResponse>("/broadcast", input);
  return normalizeJob(response.data);
};
