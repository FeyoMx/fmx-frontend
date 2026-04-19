import { Activity, AlertTriangle, CheckCircle2, ChevronsUpDown, CircleUser, Cog, MessageCircle, MessageSquare, RadioTower, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import { InstanceStatus } from "@/components/instance-status";
import { InstanceToken } from "@/components/instance-token";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TooltipWrapper } from "@/components/ui/tooltip";

import { useTenant } from "@/contexts/TenantContext";
import { getDashboardMetrics } from "@/lib/queries/dashboard/getMetrics";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { useFetchInstances } from "@/lib/queries/instance/fetchInstances";
import { useManageInstance } from "@/lib/queries/instance/manageInstance";
import { formatCompactTimestamp, formatRelativeTime, truncateOperatorText } from "@/lib/operator-format";
import { Instance } from "@/types/evolution.types";

import { NewInstance } from "./NewInstance";

interface DashboardMetrics {
  totalInstances: number;
  totalMessages: number;
  totalContacts: number;
  totalBroadcasts: number;
  activeInstances: number;
  inactiveInstances: number;
}

type HealthBucket = "healthy" | "degraded" | "disconnected" | "other";

const statusChartConfig = {
  count: {
    label: "Instances",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const dashboardMetricsMeta = [
  {
    key: "totalInstances",
    label: "Total instances",
    description: "Tenant-scoped inventory count.",
    caveat: "Trusted now",
    icon: CircleUser,
  },
  {
    key: "totalMessages",
    label: "Messages",
    description: "Aggregate message counter from dashboard metrics.",
    caveat: "Backend-limited",
    icon: MessageSquare,
  },
  {
    key: "totalContacts",
    label: "Contacts",
    description: "Helpful as a rough snapshot only.",
    caveat: "Backend-limited",
    icon: Users,
  },
  {
    key: "totalBroadcasts",
    label: "Broadcast jobs",
    description: "Reflects queue snapshots, not final delivery analytics.",
    caveat: "Queue snapshot",
    icon: RadioTower,
  },
] as const;

function getInstanceHealthBucket(status: string): HealthBucket {
  if (status === "open") {
    return "healthy";
  }

  if (status === "connecting" || status === "qrcode") {
    return "degraded";
  }

  if (status === "close" || status === "closed" || status === "disconnected" || status === "logout") {
    return "disconnected";
  }

  return "other";
}

function getInstanceHealthCopy(bucket: HealthBucket): { label: string; detail: string; badge: "default" | "warning" | "destructive" | "secondary" } {
  switch (bucket) {
    case "healthy":
      return {
        label: "Healthy",
        detail: "Connected and ready for operator work.",
        badge: "default",
      };
    case "degraded":
      return {
        label: "Needs attention",
        detail: "Waiting on QR scan, reconnect, or pairing progress.",
        badge: "warning",
      };
    case "disconnected":
      return {
        label: "Disconnected",
        detail: "Messaging actions depend on restoring runtime connectivity.",
        badge: "destructive",
      };
    default:
      return {
        label: "Observed",
        detail: "Reported by backend, but outside the main lifecycle buckets.",
        badge: "secondary",
      };
  }
}

function Dashboard() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInstances: 0,
    totalMessages: 0,
    totalContacts: 0,
    totalBroadcasts: 0,
    activeInstances: 0,
    inactiveInstances: 0,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState("all");
  const [nameSearch, setNameSearch] = useState("");

  const { deleteInstance, logout } = useManageInstance();
  const { data: instances, refetch } = useFetchInstances();

  useEffect(() => {
    void fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setMetrics(await getDashboardMetrics());
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error(getApiErrorMessage(error, "Failed to fetch dashboard metrics"));
    }
  };

  const resetTable = async () => {
    await refetch();
    await fetchMetrics();
  };

  const handleDelete = async (instance: { id: string; name: string }) => {
    setDeleteConfirmation(null);
    setDeleting((current) => [...current, instance.name]);

    try {
      try {
        await logout(instance.id);
      } catch (error) {
        console.error("Error logout:", error);
      }

      await deleteInstance(instance.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await resetTable();
    } catch (error) {
      console.error("Error instance delete:", error);
      toast.error(getApiErrorMessage(error, "Failed to delete instance"));
    } finally {
      setDeleting((current) => current.filter((item) => item !== instance.name));
    }
  };

  const filteredInstances = useMemo(() => {
    let instancesList = instances ? [...instances] : [];
    if (searchStatus !== "all") {
      instancesList = instancesList.filter((instance) => instance.connectionStatus === searchStatus);
    }

    if (nameSearch.trim()) {
      instancesList = instancesList.filter((instance) => instance.name.toLowerCase().includes(nameSearch.toLowerCase()));
    }

    return instancesList.sort((left, right) => {
      const priorityMap: Record<HealthBucket, number> = {
        degraded: 0,
        disconnected: 1,
        healthy: 2,
        other: 3,
      };

      const bucketDiff = priorityMap[getInstanceHealthBucket(left.connectionStatus)] - priorityMap[getInstanceHealthBucket(right.connectionStatus)];
      if (bucketDiff !== 0) {
        return bucketDiff;
      }

      return left.name.localeCompare(right.name);
    });
  }, [instances, nameSearch, searchStatus]);

  const statusBreakdown = useMemo(() => {
    const summary = {
      healthy: 0,
      degraded: 0,
      disconnected: 0,
      other: 0,
    };

    (instances ?? []).forEach((instance) => {
      summary[getInstanceHealthBucket(instance.connectionStatus)] += 1;
    });

    return [
      { key: "healthy", label: "Healthy", count: summary.healthy, color: "#15803d" },
      { key: "degraded", label: "Needs attention", count: summary.degraded, color: "#d97706" },
      { key: "disconnected", label: "Disconnected", count: summary.disconnected, color: "#dc2626" },
      { key: "other", label: "Other", count: summary.other, color: "#475569" },
    ];
  }, [instances]);

  const operationalSummary = useMemo(() => {
    const healthy = statusBreakdown.find((item) => item.key === "healthy")?.count ?? 0;
    const degraded = statusBreakdown.find((item) => item.key === "degraded")?.count ?? 0;
    const disconnected = statusBreakdown.find((item) => item.key === "disconnected")?.count ?? 0;
    const total = instances?.length ?? 0;

    const operatorMessage =
      total === 0
        ? "No instances are connected to this tenant yet. Create one to begin pairing and runtime monitoring."
        : disconnected > 0
          ? `${disconnected} instance${disconnected === 1 ? " is" : "s are"} offline. Broadcast and direct-send flows depend on restoring runtime connectivity first.`
          : degraded > 0
            ? `${degraded} instance${degraded === 1 ? " is" : "s are"} waiting on QR or reconnect work. Active sends may still be blocked until the runtime settles.`
            : "All surfaced instances are healthy. Operator focus can stay on queue review, chats, and day-to-day runtime monitoring.";

    const alertVariant = total === 0 ? "info" : disconnected > 0 ? "warning" : degraded > 0 ? "info" : "success";

    return {
      healthy,
      degraded,
      disconnected,
      total,
      operatorMessage,
      alertVariant: alertVariant as "info" | "warning" | "success",
    };
  }, [instances, statusBreakdown]);

  const instanceStatus = [
    { value: "all", label: t("status.all") },
    { value: "close", label: t("status.closed") },
    { value: "connecting", label: t("status.connecting") },
    { value: "open", label: t("status.open") },
  ];

  return (
    <div className="space-y-6 p-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="border-border/70 bg-gradient-to-br from-background via-background to-muted/35">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit gap-2 border-primary/20 bg-primary/5 text-primary">
                  <Activity className="h-3.5 w-3.5" />
                  Operator dashboard
                </Badge>
                <div>
                  <CardTitle className="text-3xl tracking-tight">{t("dashboard.welcome") || "Welcome back"}</CardTitle>
                  <CardDescription className="mt-2 max-w-2xl text-sm leading-6">
                    {tenant?.name || "Current tenant"} is using the tenant-safe MVP surface. Instance health, queue visibility, chat list/detail, and runtime actions are live; aggregate analytics still stay intentionally conservative.
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => void resetTable()}>
                  <RefreshCw size={18} />
                </Button>
                <NewInstance resetTable={resetTable} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Healthy",
                  value: operationalSummary.healthy,
                  detail: "Ready for operator actions",
                  icon: CheckCircle2,
                  tone: "text-emerald-600",
                },
                {
                  label: "Needs attention",
                  value: operationalSummary.degraded,
                  detail: "QR or reconnect follow-up",
                  icon: AlertTriangle,
                  tone: "text-amber-600",
                },
                {
                  label: "Disconnected",
                  value: operationalSummary.disconnected,
                  detail: "Delivery currently at risk",
                  icon: ShieldAlert,
                  tone: "text-rose-600",
                },
                {
                  label: "Surfaced instances",
                  value: operationalSummary.total,
                  detail: "Tenant inventory in scope",
                  icon: CircleUser,
                  tone: "text-slate-600",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-muted-foreground">{item.label}</div>
                    <item.icon className={`h-4 w-4 ${item.tone}`} />
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operator guidance</CardTitle>
            <CardDescription>Clearer messaging for sparse data and runtime-dependent work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={operationalSummary.alertVariant}>
              <Activity className="h-4 w-4" />
              <AlertTitle>Current tenant posture</AlertTitle>
              <AlertDescription>{operationalSummary.operatorMessage}</AlertDescription>
            </Alert>
            <Alert>
              <RadioTower className="h-4 w-4" />
              <AlertTitle>Analytics are intentionally conservative</AlertTitle>
              <AlertDescription>
                Instance health and status distribution are the trustworthy operator signals today. Message, contact, and broadcast totals can stay sparse until backend aggregation grows beyond the current snapshot routes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Instance health overview</CardTitle>
            <CardDescription>Live distribution from tenant-scoped instance lifecycle snapshots.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[280px] w-full">
              <BarChart accessibilityLayer data={statusBreakdown} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={130} />
                <XAxis dataKey="count" type="number" allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={10}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                  <LabelList dataKey="count" position="right" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metric confidence</CardTitle>
            <CardDescription>Use these cards as operator cues, not full analytics parity.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {dashboardMetricsMeta.map((metric) => {
              const Icon = metric.icon;
              const value = metrics[metric.key];

              return (
                <div key={metric.key} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{metric.label}</div>
                      <div className="text-2xl font-semibold">{(value ?? 0).toLocaleString()}</div>
                    </div>
                    <Icon className="mt-1 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{metric.description}</p>
                  <Badge variant={metric.caveat === "Trusted now" ? "default" : "outline"} className="mt-3">
                    {metric.caveat}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("dashboard.title")}</h2>
            <p className="text-sm text-muted-foreground">The list below favors items that need operator attention first.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full min-w-[240px] flex-1 md:w-auto">
              <Input placeholder={t("dashboard.search")} value={nameSearch} onChange={(event) => setNameSearch(event.target.value)} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  {t("dashboard.status")}
                  <ChevronsUpDown size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {instanceStatus.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.value}
                    checked={searchStatus === status.value}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSearchStatus(status.value);
                      }
                    }}>
                    {status.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {filteredInstances.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
              <CircleUser className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{instances?.length ? "No instances match this filter" : "No instances yet"}</h3>
                <p className="max-w-xl text-sm text-muted-foreground">
                  {instances?.length
                    ? "Try a different search or status filter. The dashboard stays focused on supported operator surfaces only, so hidden legacy routes will not appear here."
                    : "Create the first instance to start pairing, runtime monitoring, chats, broadcasts, and outbound send workflows."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <main className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredInstances.map((instance: Instance) => {
              const bucket = getInstanceHealthBucket(instance.connectionStatus);
              const health = getInstanceHealthCopy(bucket);

              return (
                <Card key={instance.id} className="border-border/70">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <Link to={`/manager/instance/${instance.id}/dashboard`} className="block">
                          <TooltipWrapper content={instance.name} side="top">
                            <CardTitle className="truncate text-lg">{instance.name}</CardTitle>
                          </TooltipWrapper>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <InstanceStatus status={instance.connectionStatus} />
                          <Badge variant={health.badge}>{health.label}</Badge>
                        </div>
                      </div>
                      <TooltipWrapper content={t("dashboard.settings")} side="top">
                        <Button asChild variant="ghost" size="icon">
                          <Link to={`/manager/instance/${instance.id}/settings`}>
                            <Cog className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipWrapper>
                    </div>
                    <p className="text-sm text-muted-foreground">{health.detail}</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <InstanceToken token={instance.token} />

                    <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={instance.profilePicUrl} alt={instance.profileName || instance.name} />
                        <AvatarFallback>{(instance.profileName || instance.name).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="truncate font-medium">{instance.profileName || "Profile not reported yet"}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {instance.ownerJid ? instance.ownerJid.split("@")[0] : "Owner JID not surfaced"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {formatRelativeTime(instance.updatedAt || instance.createdAt, "Not observed yet")}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CircleUser className="h-3.5 w-3.5" />
                          Contacts
                        </div>
                        <div className="mt-2 text-xl font-semibold">
                          {instance.stats.contacts === null ? (t("common.notAvailable") || "N/A") : new Intl.NumberFormat("pt-BR").format(instance.stats.contacts)}
                        </div>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Messages
                        </div>
                        <div className="mt-2 text-xl font-semibold">
                          {instance.stats.messages === null ? (t("common.notAvailable") || "N/A") : new Intl.NumberFormat("pt-BR").format(instance.stats.messages)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                      {truncateOperatorText(
                        bucket === "healthy"
                          ? "This instance is the best candidate for active sends, chats, and queue-backed work."
                          : bucket === "degraded"
                            ? "Pairing or reconnect work is still in progress. Delivery-dependent actions may remain blocked until the runtime settles."
                            : bucket === "disconnected"
                              ? "Operator actions that depend on runtime connectivity should wait until this instance is brought back online."
                              : "This instance is surfaced honestly, but the backend status does not map cleanly into the main operator lifecycle buckets yet.",
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">Seen {formatCompactTimestamp(instance.updatedAt || instance.createdAt, "Recently unavailable")}</div>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmation({ id: instance.id, name: instance.name })} disabled={deleting.includes(instance.name)}>
                      {deleting.includes(instance.name) ? <span>{t("button.deleting")}</span> : <span>{t("button.delete")}</span>}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </main>
        )}
      </section>

      {!!deleteConfirmation && (
        <Dialog onOpenChange={() => setDeleteConfirmation(null)} open>
          <DialogContent>
            <DialogClose />
            <DialogHeader>{t("modal.delete.title")}</DialogHeader>
            <p>{t("modal.delete.message", { instanceName: deleteConfirmation.name })}</p>
            <DialogFooter>
              <div className="flex items-center gap-4">
                <Button onClick={() => setDeleteConfirmation(null)} size="sm" variant="outline">
                  {t("button.cancel")}
                </Button>
                <Button onClick={() => void handleDelete(deleteConfirmation)} variant="destructive">
                  {t("button.delete")}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default Dashboard;
