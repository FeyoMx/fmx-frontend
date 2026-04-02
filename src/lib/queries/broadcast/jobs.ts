import { apiGlobal } from "../api";
import { BroadcastJobResponse, BroadcastView, CreateBroadcastInput } from "./types";

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
});

export const getBroadcastJobs = async (): Promise<BroadcastView[]> => {
  const response = await apiGlobal.get<BroadcastJobResponse[]>("/broadcast");
  return (response.data ?? []).map(normalizeJob);
};

export const createBroadcastJob = async (input: CreateBroadcastInput): Promise<BroadcastView> => {
  const response = await apiGlobal.post<BroadcastJobResponse>("/broadcast", input);
  return normalizeJob(response.data);
};
