import { apiGlobal } from "../api";
import { BroadcastJobResponse, BroadcastRecipientAnalyticsResponse, BroadcastRecipientAnalyticsView, BroadcastView, CreateBroadcastInput } from "./types";

function normalizeCount(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function normalizeRecipientAnalytics(job: BroadcastJobResponse): BroadcastRecipientAnalyticsView {
  const candidate: BroadcastRecipientAnalyticsResponse | null | undefined = job.analytics ?? job.recipients ?? job.recipient_totals;
  const total = normalizeCount(candidate?.total ?? job.recipient_total);
  const sent = normalizeCount(candidate?.sent ?? job.sent_count);
  const failed = normalizeCount(candidate?.failed ?? job.failed_count);
  const pending = normalizeCount(candidate?.pending ?? job.pending_count);
  const analyticsAvailable = [total, sent, failed, pending].some((value) => value !== null);

  let progressPercent: number | null = null;
  if (total && total > 0) {
    const completed = (sent ?? 0) + (failed ?? 0);
    progressPercent = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  }

  return {
    total,
    sent,
    failed,
    pending,
    progressPercent,
    analyticsAvailable,
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
  completedAt: job.completed_at ?? null,
  failedAt: job.failed_at ?? null,
  createdAt: job.created_at ?? "",
  recipientAnalytics: normalizeRecipientAnalytics(job),
});

export const getBroadcastJobs = async (): Promise<BroadcastView[]> => {
  const response = await apiGlobal.get<BroadcastJobResponse[]>("/broadcast");
  return (response.data ?? []).map(normalizeJob);
};

export const createBroadcastJob = async (input: CreateBroadcastInput): Promise<BroadcastView> => {
  const response = await apiGlobal.post<BroadcastJobResponse>("/broadcast", input);
  return normalizeJob(response.data);
};
