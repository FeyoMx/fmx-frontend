import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, PauseCircle, RadioTower, RefreshCw, Search, Send, TimerReset, Users, XCircle } from "lucide-react";
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
import { createBroadcastJob, getBroadcastJob, getBroadcastJobs, getBroadcastRecipients } from "@/lib/queries/broadcast/jobs";
import { BroadcastJobStatus, BroadcastRecipientAnalyticsView, BroadcastRecipientListView, BroadcastView } from "@/lib/queries/broadcast/types";
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

const recipientStatusFilters = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

function getStatusBadgeVariant(status: BroadcastJobStatus): "default" | "secondary" | "destructive" | "warning" {
  switch (status) {
    case "completed":
      return "default";
    case "completed_with_failures":
      return "warning";
    case "processing":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "warning";
  }
}

function getStatusIcon(status: BroadcastJobStatus) {
  switch (status) {
    case "completed":
      return CheckCircle2;
    case "completed_with_failures":
      return AlertTriangle;
    case "processing":
      return TimerReset;
    case "failed":
      return XCircle;
    default:
      return PauseCircle;
  }
}

function getRecipientStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "warning" {
  switch (status) {
    case "sent":
      return "default";
    case "failed":
      return "destructive";
    case "pending":
      return "warning";
    default:
      return "secondary";
  }
}

function BroadcastRecipientSummary({ analytics }: { analytics: BroadcastRecipientAnalyticsView }) {
  if (!analytics.analyticsAvailable) {
    return <span className="text-xs text-muted-foreground">Recipient analytics not yet reported by backend</span>;
  }

  return (
    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 xl:grid-cols-6">
      <div>Total: {analytics.total ?? "-"}</div>
      <div>Attempted: {analytics.attempted ?? "-"}</div>
      <div>Sent: {analytics.sent ?? "-"}</div>
      <div>Failed: {analytics.failed ?? "-"}</div>
      <div>Pending: {analytics.pending ?? "-"}</div>
      <div>{analytics.partial ? "Partial analytics" : "Complete analytics"}</div>
    </div>
  );
}

function BroadcastRecipientDetailPanel({
  broadcast,
  instanceName,
}: {
  broadcast: BroadcastView;
  instanceName: string;
}) {
  const [recipientData, setRecipientData] = useState<BroadcastRecipientListView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [recipientQuery, setRecipientQuery] = useState("");
  const deferredRecipientQuery = useDeferredValue(recipientQuery);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, deferredRecipientQuery, broadcast.id]);

  useEffect(() => {
    let cancelled = false;

    const loadRecipients = async () => {
      setIsLoading(true);
      setRecipientsError(null);
      try {
        const data = await getBroadcastRecipients({
          broadcastId: broadcast.id,
          page,
          limit: 50,
          status: statusFilter || undefined,
          query: deferredRecipientQuery || undefined,
        });

        if (!cancelled) {
          setRecipientData(data);
        }
      } catch (error) {
        if (!cancelled) {
          setRecipientsError(getApiErrorMessage(error, "Unable to load recipient progress for this broadcast."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRecipients();

    return () => {
      cancelled = true;
    };
  }, [broadcast.id, deferredRecipientQuery, page, statusFilter]);

  const summary = recipientData?.summary ?? broadcast.recipientAnalytics;

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">Campaign detail</CardTitle>
            <CardDescription>{instanceName}</CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(broadcast.status)}>{formatOperatorStatusLabel(broadcast.status)}</Badge>
        </div>
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="font-medium">{truncateOperatorText(broadcast.message, 240)}</div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
            <div>Created: {formatOperatorTimestamp(broadcast.createdAt)}</div>
            <div>Available: {formatOperatorTimestamp(broadcast.availableAt, "Not reported")}</div>
            <div>Started: {formatOperatorTimestamp(broadcast.startedAt, "Not started")}</div>
            <div>Completed: {formatOperatorTimestamp(broadcast.completedAt || broadcast.failedAt, "Not finished")}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Total", value: summary.total, tone: "text-foreground" },
            { label: "Attempted", value: summary.attempted, tone: "text-sky-600" },
            { label: "Sent", value: summary.sent, tone: "text-emerald-600" },
            { label: "Failed", value: summary.failed, tone: "text-rose-600" },
            { label: "Pending", value: summary.pending, tone: "text-amber-600" },
            { label: "Partial", value: summary.partial ? "Yes" : "No", tone: summary.partial ? "text-amber-600" : "text-muted-foreground" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value ?? "-"}</div>
            </div>
          ))}
        </div>

        <Alert variant="info">
          <RadioTower className="h-4 w-4" />
          <AlertTitle>Recipient detail tracks send attempts and queue outcomes.</AlertTitle>
          <AlertDescription>
            This panel shows attempt and queue-result data returned by the backend. It does not claim WhatsApp delivery or read receipts unless those states are explicitly exposed in the API, which they are not today.
          </AlertDescription>
        </Alert>

        {broadcast.lastError ? (
          <Alert variant="warning">
            <AlertTitle>Last job-level error</AlertTitle>
            <AlertDescription>{broadcast.lastError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="grid gap-2">
            <Label htmlFor="broadcast-recipient-status">Recipient status</Label>
            <select
              id="broadcast-recipient-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {recipientStatusFilters.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="broadcast-recipient-search">Recipient search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="broadcast-recipient-search"
                value={recipientQuery}
                onChange={(event) => setRecipientQuery(event.target.value)}
                placeholder="Search by phone or contact ID"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {recipientsError ? (
          <Alert variant="warning">
            <AlertTitle>Recipient detail unavailable</AlertTitle>
            <AlertDescription>{recipientsError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Attempt/result timing</TableHead>
                <TableHead>Last error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading recipient detail...
                  </TableCell>
                </TableRow>
              ) : recipientData && recipientData.items.length > 0 ? (
                recipientData.items.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="min-w-[220px]">
                      <div className="space-y-1">
                        <div className="font-medium">{recipient.phone}</div>
                        <div className="text-xs text-muted-foreground">
                          {recipient.chatJid || recipient.contactId || "No chat/contact identifier reported"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRecipientStatusBadgeVariant(recipient.status)}>{formatOperatorStatusLabel(recipient.status)}</Badge>
                    </TableCell>
                    <TableCell>{recipient.attemptCount}</TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Last attempt: {formatOperatorTimestamp(recipient.lastAttemptAt, "Not attempted")}</div>
                        <div>Sent at: {formatOperatorTimestamp(recipient.sentAt, "Not sent")}</div>
                        <div>Failed at: {formatOperatorTimestamp(recipient.failedAt, "Not failed")}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>{recipient.lastError || "No error reported"}</div>
                        {recipient.messageId ? <div>Message ID: {recipient.messageId}</div> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No recipients match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {recipientData ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Page {recipientData.page} of {Math.max(1, recipientData.totalPages || 1)} · {recipientData.total} recipient row{recipientData.total === 1 ? "" : "s"}
              {recipientData.partial ? " · Summary is marked partial by backend." : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={isLoading || !recipientData.totalPages || page >= recipientData.totalPages}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Broadcast() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const { data: instances } = useFetchInstances();

  const [broadcasts, setBroadcasts] = useState<BroadcastView[]>([]);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastView | null>(null);
  const [selectedBroadcastLoading, setSelectedBroadcastLoading] = useState(false);
  const [selectedBroadcastError, setSelectedBroadcastError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!selectedBroadcastId) {
      setSelectedBroadcast(null);
      setSelectedBroadcastError(null);
      return;
    }

    let cancelled = false;

    const loadBroadcast = async () => {
      setSelectedBroadcastLoading(true);
      setSelectedBroadcastError(null);
      try {
        const detail = await getBroadcastJob(selectedBroadcastId);
        if (!cancelled) {
          setSelectedBroadcast(detail);
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedBroadcastError(getApiErrorMessage(error, "Unable to load campaign detail."));
        }
      } finally {
        if (!cancelled) {
          setSelectedBroadcastLoading(false);
        }
      }
    };

    void loadBroadcast();

    return () => {
      cancelled = true;
    };
  }, [selectedBroadcastId]);

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
        if (item.status === "queued") summary.queued += 1;
        if (item.status === "processing") summary.processing += 1;
        if (item.status === "completed") summary.completed += 1;
        if (item.status === "completed_with_failures") summary.completedWithFailures += 1;
        if (item.status === "failed") summary.failed += 1;
        if (item.recipientAnalytics.analyticsAvailable) summary.analyticsReady += 1;
        return summary;
      },
      {
        total: 0,
        queued: 0,
        processing: 0,
        completed: 0,
        completedWithFailures: 0,
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
        String(broadcast.status).toLowerCase().includes(normalizedSearch)
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
      const created = await createBroadcastJob({
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
      setSelectedBroadcastId(created.id);
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
          Jobs can be created and reviewed here, but actual dispatch still depends on the selected instance being connected and the backend queue/runtime pipeline remaining healthy. Recipient analytics below represent send attempts and queue outcomes, not WhatsApp delivery/read receipts.
        </AlertDescription>
      </Alert>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Queued", value: queueSummary.queued, icon: Clock3, tone: "text-amber-600" },
          { label: "Processing", value: queueSummary.processing, icon: TimerReset, tone: "text-sky-600" },
          { label: "Completed", value: queueSummary.completed, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Completed w/ failures", value: queueSummary.completedWithFailures, icon: AlertTriangle, tone: "text-amber-600" },
          { label: "Failed", value: queueSummary.failed, icon: XCircle, tone: "text-rose-600" },
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
                  This page creates queue jobs, not guaranteed deliveries. Recipient detail below will only show real attempt/outcome data returned by the backend; it will not invent delivery or read receipts.
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
                      <TableHead>Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          {t("common.loading") || "Loading..."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleBroadcasts.visibleItems.map((broadcast) => {
                        const StatusIcon = getStatusIcon(broadcast.status);
                        const isSelected = selectedBroadcastId === broadcast.id;

                        return (
                          <TableRow key={broadcast.id} className={isSelected ? "bg-muted/40" : undefined}>
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
                            <TableCell className="min-w-[240px]">
                              <BroadcastRecipientSummary analytics={broadcast.recipientAnalytics} />
                            </TableCell>
                            <TableCell>{formatCompactTimestamp(broadcast.createdAt)}</TableCell>
                            <TableCell>
                              <Button variant={isSelected ? "secondary" : "outline"} size="sm" onClick={() => setSelectedBroadcastId(isSelected ? null : broadcast.id)}>
                                {isSelected ? "Hide detail" : "Inspect"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
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

      {selectedBroadcastId ? (
        selectedBroadcastLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading campaign detail...</CardContent>
          </Card>
        ) : selectedBroadcastError ? (
          <Alert variant="warning">
            <AlertTitle>Campaign detail unavailable</AlertTitle>
            <AlertDescription>{selectedBroadcastError}</AlertDescription>
          </Alert>
        ) : selectedBroadcast ? (
          <BroadcastRecipientDetailPanel broadcast={selectedBroadcast} instanceName={instanceNameById(selectedBroadcast.instanceId)} />
        ) : null
      ) : null}
    </div>
  );
}

export { Broadcast };
