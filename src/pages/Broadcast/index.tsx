import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Clock3, PauseCircle, RadioTower, RefreshCw, Search, Send, TimerReset, Users, XCircle } from "lucide-react";
import { toast } from "react-toastify";

import { OperatorPageHeader } from "@/components/operator-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { useTenant } from "@/contexts/TenantContext";
import { createBroadcastJob, getBroadcastJobs } from "@/lib/queries/broadcast/jobs";
import { BroadcastRecipientAnalyticsView, BroadcastView } from "@/lib/queries/broadcast/types";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { useFetchInstances } from "@/lib/queries/instance/fetchInstances";
import { formatCompactTimestamp, formatOperatorStatusLabel, formatOperatorTimestamp, truncateOperatorText } from "@/lib/operator-format";
import { useIncrementalList } from "@/lib/use-incremental-list";

type FormState = {
  instanceId: string;
  message: string;
  ratePerHour: number;
  delaySec: number;
  maxAttempts: number;
  scheduledTime: string;
};

type ValidationState = {
  title: string;
  detail: string;
} | null;

const initialFormState: FormState = {
  instanceId: "",
  message: "",
  ratePerHour: 60,
  delaySec: 0,
  maxAttempts: 3,
  scheduledTime: "",
};

function getStatusBadgeVariant(status: BroadcastView["status"]): "default" | "secondary" | "destructive" | "warning" {
  switch (status) {
    case "completed":
      return "default";
    case "processing":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "warning";
  }
}

function getStatusIcon(status: BroadcastView["status"]) {
  switch (status) {
    case "completed":
      return CheckCircle2;
    case "processing":
      return TimerReset;
    case "failed":
      return XCircle;
    default:
      return PauseCircle;
  }
}

function BroadcastRecipientSummary({ analytics }: { analytics: BroadcastRecipientAnalyticsView }) {
  if (!analytics.analyticsAvailable) {
    return <span className="text-xs text-muted-foreground">Recipient analytics not yet reported by backend</span>;
  }

  return (
    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
      <div>Total: {analytics.total ?? "-"}</div>
      <div>Sent: {analytics.sent ?? "-"}</div>
      <div>Failed: {analytics.failed ?? "-"}</div>
      <div>Pending: {analytics.pending ?? "-"}</div>
    </div>
  );
}

function Broadcast() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const { data: instances } = useFetchInstances();

  const [broadcasts, setBroadcasts] = useState<BroadcastView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [validationState, setValidationState] = useState<ValidationState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const deferredHistorySearch = useDeferredValue(historySearch);

  useEffect(() => {
    void fetchBroadcasts();
  }, []);

  useEffect(() => {
    if (!formData.instanceId && instances && instances.length > 0) {
      setFormData((current) => ({ ...current, instanceId: instances[0].id }));
    }
  }, [formData.instanceId, instances]);

  const fetchBroadcasts = async () => {
    setIsLoading(true);
    try {
      setBroadcasts(await getBroadcastJobs());
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("broadcast.error.fetch") || "Failed to fetch broadcasts"));
    } finally {
      setIsLoading(false);
    }
  };

  const queueSummary = useMemo(() => {
    return broadcasts.reduce(
      (summary, item) => {
        summary.total += 1;
        summary[item.status] += 1;
        if (item.recipientAnalytics.analyticsAvailable) {
          summary.analyticsReady += 1;
        }
        return summary;
      },
      {
        total: 0,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        analyticsReady: 0,
      },
    );
  }, [broadcasts]);

  const sortedBroadcasts = useMemo(() => {
    return [...broadcasts].sort((left, right) => {
      const leftTime = new Date(left.createdAt || left.scheduledAt || 0).getTime();
      const rightTime = new Date(right.createdAt || right.scheduledAt || 0).getTime();
      return rightTime - leftTime;
    });
  }, [broadcasts]);

  const filteredBroadcasts = useMemo(() => {
    const normalizedSearch = deferredHistorySearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return sortedBroadcasts;
    }

    return sortedBroadcasts.filter((broadcast) => {
      const instanceName = instances?.find((instance) => instance.id === broadcast.instanceId)?.name ?? broadcast.instanceId;
      return (
        broadcast.message.toLowerCase().includes(normalizedSearch) ||
        instanceName.toLowerCase().includes(normalizedSearch) ||
        broadcast.status.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [deferredHistorySearch, instances, sortedBroadcasts]);

  const visibleBroadcasts = useIncrementalList(filteredBroadcasts, {
    initialCount: 50,
    step: 50,
  });

  const validateForm = (): ValidationState => {
    if (!formData.instanceId) {
      return {
        title: "Choose an instance",
        detail: "Broadcast jobs must be attached to one specific runtime-capable instance.",
      };
    }

    if (!formData.message.trim()) {
      return {
        title: "Message is required",
        detail: "Queue creation is blocked until the outbound message body is provided.",
      };
    }

    if (formData.message.trim().length < 3) {
      return {
        title: "Message is too short",
        detail: "Use enough content that operators can recognize the job in queue history later.",
      };
    }

    if (!Number.isFinite(formData.ratePerHour) || formData.ratePerHour < 1) {
      return {
        title: "Rate per hour must be greater than 0",
        detail: "A zero or invalid rate would create a misleading job configuration.",
      };
    }

    if (!Number.isFinite(formData.maxAttempts) || formData.maxAttempts < 1) {
      return {
        title: "Max attempts must be greater than 0",
        detail: "Queue retries depend on a positive retry ceiling.",
      };
    }

    if (scheduleMode === "later") {
      if (!formData.scheduledTime) {
        return {
          title: "Scheduled time is required",
          detail: "Pick a specific future time before creating a scheduled job.",
        };
      }

      const scheduledAt = new Date(formData.scheduledTime);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
        return {
          title: "Scheduled time must be in the future",
          detail: "Past timestamps are likely to confuse queue processing and operator expectations.",
        };
      }
    } else if (!Number.isFinite(formData.delaySec) || formData.delaySec < 0) {
      return {
        title: "Delay must be 0 or greater",
        detail: "Immediate queue jobs can still use a non-negative delay, but never a negative value.",
      };
    }

    return null;
  };

  const resetComposer = () => {
    setFormData({
      ...initialFormState,
      instanceId: instances?.[0]?.id ?? "",
    });
    setValidationState(null);
  };

  const handleSendBroadcast = async () => {
    const nextValidation = validateForm();
    setValidationState(nextValidation);
    if (nextValidation) {
      toast.error(nextValidation.title);
      return;
    }

    try {
      setSubmitting(true);
      await createBroadcastJob({
        instance_id: formData.instanceId,
        message: formData.message.trim(),
        rate_per_hour: formData.ratePerHour,
        delay_sec: scheduleMode === "now" ? formData.delaySec : 0,
        max_attempts: formData.maxAttempts,
        scheduled_at: scheduleMode === "later" ? formData.scheduledTime : null,
      });
      toast.success(t("broadcast.message.sent") || "Broadcast queued successfully");
      setShowForm(false);
      resetComposer();
      await fetchBroadcasts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("broadcast.error.send") || "Failed to send broadcast"));
    } finally {
      setSubmitting(false);
    }
  };

  const instanceNameById = (instanceId: string) => instances?.find((instance) => instance.id === instanceId)?.name || instanceId;

  return (
    <div className="space-y-6 p-4">
      <OperatorPageHeader
        title={t("broadcast.title") || "Broadcast"}
        description={tenant?.name}
        actions={
          <>
            <Button onClick={() => void fetchBroadcasts()} variant="outline" size="icon">
              <RefreshCw size={18} />
            </Button>
            <Button onClick={() => setShowForm((current) => !current)}>
              <Send size={18} className="mr-2" />
              {showForm ? "Hide composer" : t("broadcast.button.new") || "New Broadcast"}
            </Button>
          </>
        }
      />

      <Alert variant="info">
        <RadioTower className="h-4 w-4" />
        <AlertTitle>Broadcast queueing is supported; delivery still depends on runtime health.</AlertTitle>
        <AlertDescription>
          Jobs can be created and reviewed here, but actual dispatch still depends on the selected instance being connected and the backend queue/runtime pipeline remaining healthy. Recipient-level analytics will appear here only when the backend returns them.
        </AlertDescription>
      </Alert>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Queued", value: queueSummary.queued, icon: Clock3, tone: "text-amber-600" },
          { label: "Processing", value: queueSummary.processing, icon: TimerReset, tone: "text-sky-600" },
          { label: "Completed", value: queueSummary.completed, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Failed", value: queueSummary.failed, icon: AlertTriangle, tone: "text-rose-600" },
          { label: "Analytics-ready", value: queueSummary.analyticsReady, icon: Users, tone: "text-violet-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="text-sm font-medium text-muted-foreground">{item.label}</div>
                <div className="mt-2 text-3xl font-semibold">{item.value}</div>
              </div>
              <item.icon className={`h-5 w-5 ${item.tone}`} />
            </CardContent>
          </Card>
        ))}
      </section>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcast.form.title") || "Create Broadcast"}</CardTitle>
            <CardDescription>Queue a tenant-safe outbound job and keep the operator caveats explicit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {validationState ? (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{validationState.title}</AlertTitle>
                <AlertDescription>{validationState.detail}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <div className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="broadcast-instance">Instance</Label>
                  <select
                    id="broadcast-instance"
                    value={formData.instanceId}
                    onChange={(event) => setFormData({ ...formData, instanceId: event.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">Select an instance</option>
                    {(instances ?? []).map((instance) => (
                      <option key={instance.id} value={instance.id}>
                        {instance.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="broadcast-message">{t("broadcast.form.message") || "Message"}</Label>
                  <Textarea
                    id="broadcast-message"
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    placeholder={t("broadcast.form.messagePlaceholder") || "Your message here..."}
                    rows={6}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Queue history uses this content as the primary preview.</span>
                    <span>{formData.message.trim().length} characters</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="broadcast-schedule-mode">{t("broadcast.form.schedule") || "Schedule"}</Label>
                  <select
                    id="broadcast-schedule-mode"
                    value={scheduleMode}
                    onChange={(event) => setScheduleMode(event.target.value as "now" | "later")}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="now">{t("broadcast.schedule.now") || "Now"}</option>
                    <option value="later">{t("broadcast.schedule.later") || "Later"}</option>
                  </select>
                </div>

                {scheduleMode === "later" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-scheduled-time">{t("broadcast.form.scheduledTime") || "Scheduled Time"}</Label>
                    <Input id="broadcast-scheduled-time" type="datetime-local" value={formData.scheduledTime} onChange={(event) => setFormData({ ...formData, scheduledTime: event.target.value })} />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-delay">{t("broadcast.form.delay") || "Delay (seconds)"}</Label>
                    <Input id="broadcast-delay" type="number" value={formData.delaySec} onChange={(event) => setFormData({ ...formData, delaySec: Number.parseInt(event.target.value, 10) || 0 })} min={0} />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-rate">Rate per hour</Label>
                    <Input id="broadcast-rate" type="number" value={formData.ratePerHour} onChange={(event) => setFormData({ ...formData, ratePerHour: Number.parseInt(event.target.value, 10) || 0 })} min={1} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-attempts">Max attempts</Label>
                    <Input id="broadcast-attempts" type="number" value={formData.maxAttempts} onChange={(event) => setFormData({ ...formData, maxAttempts: Number.parseInt(event.target.value, 10) || 0 })} min={1} />
                  </div>
                </div>

                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  This page creates queue jobs, not guaranteed deliveries. If the instance disconnects, runtime workers stall, or backend queue conditions degrade, the status history here will reflect that limitation honestly. Recipient totals will render automatically when the backend starts exposing them.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowForm(false);
                  resetComposer();
                }}
                variant="outline">
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button onClick={() => void handleSendBroadcast()} disabled={submitting}>
                <Send size={18} className="mr-2" />
                {submitting ? "Queueing..." : t("broadcast.button.send") || "Queue Broadcast"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("broadcast.history") || "Broadcast History"}</CardTitle>
          <CardDescription>
            {filteredBroadcasts.length} total job{filteredBroadcasts.length === 1 ? "" : "s"} surfaced in the current tenant queue.
            {visibleBroadcasts.hasMore ? ` Showing first ${visibleBroadcasts.visibleCount}.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search broadcast message, instance, or status" className="pl-9" />
          </div>

          {filteredBroadcasts.length === 0 && !isLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
              <RadioTower className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{historySearch.trim() ? "No jobs match this search" : "No broadcast jobs yet"}</h3>
                <p className="max-w-xl text-sm text-muted-foreground">
                  {historySearch.trim()
                    ? "Try a different message, instance, or status term. This page only shows tenant-safe queue jobs returned by the backend."
                    : "Queue history will appear here after the first job is created. Until backend delivery analytics exist, this surface stays focused on honest job state, schedule, and retry visibility."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Recipient analytics</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          {t("common.loading") || "Loading..."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleBroadcasts.visibleItems.map((broadcast) => {
                        const StatusIcon = getStatusIcon(broadcast.status);

                        return (
                          <TableRow key={broadcast.id}>
                            <TableCell className="min-w-[280px]">
                              <div className="space-y-1">
                                <div className="font-medium">{instanceNameById(broadcast.instanceId)}</div>
                                <div className="text-xs text-muted-foreground">{truncateOperatorText(broadcast.message, 90)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(broadcast.status)} className="gap-1.5">
                                <StatusIcon className="h-3.5 w-3.5" />
                                {formatOperatorStatusLabel(broadcast.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div>{broadcast.scheduledAt ? formatOperatorTimestamp(broadcast.scheduledAt) : "Immediate queueing"}</div>
                                <div className="text-xs text-muted-foreground">{broadcast.scheduledAt ? "Scheduled job" : `Delay: ${broadcast.delaySec || 0}s`}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div>
                                  {broadcast.attempts}/{broadcast.maxAttempts}
                                </div>
                                <div className="text-xs text-muted-foreground">Rate {broadcast.ratePerHour || 0}/hr</div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[220px]">
                              {broadcast.recipientAnalytics.analyticsAvailable ? (
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>Total {broadcast.recipientAnalytics.total ?? "-"}</div>
                                  <div>
                                    Sent {broadcast.recipientAnalytics.sent ?? "-"} · Failed {broadcast.recipientAnalytics.failed ?? "-"} · Pending {broadcast.recipientAnalytics.pending ?? "-"}
                                  </div>
                                  <div>Progress {broadcast.recipientAnalytics.progressPercent ?? 0}%</div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Pending backend analytics</span>
                              )}
                            </TableCell>
                            <TableCell>{formatCompactTimestamp(broadcast.createdAt)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {visibleBroadcasts.visibleItems.slice(0, Math.min(6, visibleBroadcasts.visibleItems.length)).map((broadcast) => {
                  const StatusIcon = getStatusIcon(broadcast.status);
                  return (
                    <div key={`summary-${broadcast.id}`} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-medium">{instanceNameById(broadcast.instanceId)}</div>
                          <div className="text-xs text-muted-foreground">{truncateOperatorText(broadcast.message, 120)}</div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(broadcast.status)} className="gap-1.5">
                          <StatusIcon className="h-3.5 w-3.5" />
                          {formatOperatorStatusLabel(broadcast.status)}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                          <div>Created: {formatCompactTimestamp(broadcast.createdAt)}</div>
                          <div>Schedule: {broadcast.scheduledAt ? formatCompactTimestamp(broadcast.scheduledAt) : "Immediate"}</div>
                          <div>Attempts: {broadcast.attempts}/{broadcast.maxAttempts}</div>
                        </div>
                        <div className="rounded-lg border border-dashed p-3">
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recipient analytics readiness</div>
                          <BroadcastRecipientSummary analytics={broadcast.recipientAnalytics} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visibleBroadcasts.hasMore ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {visibleBroadcasts.visibleCount} of {visibleBroadcasts.totalCount} filtered jobs to keep queue history responsive on larger datasets.
                  </div>
                  <Button variant="outline" onClick={visibleBroadcasts.showMore}>
                    Show 50 more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { Broadcast };
