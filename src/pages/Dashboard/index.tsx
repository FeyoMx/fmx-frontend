import { Activity, AlertTriangle, CheckCircle2, ChevronsUpDown, CircleUser, Cog, MessageCircle, MessageSquare, RadioTower, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import { InstanceStatus } from "@/components/instance-status";
import { InstanceToken } from "@/components/instance-token";
import { OperatorErrorState, SkeletonCard } from "@/components/operator-state";
import { OperatorEmptyState, OperatorStatTile, OperatorStatusBadge } from "@/components/operator-surface";
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
type DashboardQuickFilter = "all" | "attention" | "connected" | "disconnected";

const statusChartConfig = {
  count: {
    label: "Instancias",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const dashboardMetricsMeta = [
  {
    key: "totalInstances",
    label: "Instancias",
    description: "Inventario visible del tenant.",
    caveat: "Disponible",
    icon: CircleUser,
  },
  {
    key: "totalMessages",
    label: "Mensajes",
    description: "Contador agregado desde métricas disponibles.",
    caveat: "Historial parcial",
    icon: MessageSquare,
  },
  {
    key: "totalContacts",
    label: "Contactos",
    description: "Útil como snapshot aproximado.",
    caveat: "Historial parcial",
    icon: Users,
  },
  {
    key: "totalBroadcasts",
    label: "Broadcasts",
    description: "Snapshot de cola, no entrega final.",
    caveat: "Snapshot de cola",
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
        label: "Disponible",
        detail: "Conectada y lista para operar.",
        badge: "default",
      };
    case "degraded":
      return {
        label: "Requiere atención",
        detail: "Espera QR, reconexión o progreso de vinculación.",
        badge: "warning",
      };
    case "disconnected":
      return {
        label: "Sin conexión",
        detail: "Los envíos dependen de recuperar runtime.",
        badge: "destructive",
      };
    default:
      return {
        label: "Observada",
        detail: "Estado observado fuera de las categorías principales.",
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
  const [quickFilter, setQuickFilter] = useState<DashboardQuickFilter>("all");
  const [nameSearch, setNameSearch] = useState("");
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { deleteInstance, logout } = useManageInstance();
  const {
    data: instances,
    error: instancesError,
    isLoading: instancesLoading,
    isFetching: instancesFetching,
    refetch,
  } = useFetchInstances();

  useEffect(() => {
    void fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      setMetrics(await getDashboardMetrics());
    } catch (error) {
      console.error("Error fetching metrics:", error);
      const message = getApiErrorMessage(error, "No se pudieron cargar las métricas del dashboard");
      setMetricsError(message);
      toast.error(message);
    } finally {
      setMetricsLoading(false);
    }
  };

  const resetTable = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    try {
      await refetch();
      await fetchMetrics();
    } finally {
      setRefreshing(false);
    }
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
      toast.error(getApiErrorMessage(error, "No se pudo eliminar la instancia"));
    } finally {
      setDeleting((current) => current.filter((item) => item !== instance.name));
    }
  };

  const filteredInstances = useMemo(() => {
    let instancesList = instances ? [...instances] : [];
    if (searchStatus !== "all") {
      instancesList = instancesList.filter((instance) => instance.connectionStatus === searchStatus);
    }

    if (quickFilter !== "all") {
      instancesList = instancesList.filter((instance) => {
        const bucket = getInstanceHealthBucket(instance.connectionStatus);
        if (quickFilter === "attention") {
          return bucket === "degraded" || bucket === "disconnected";
        }
        if (quickFilter === "connected") {
          return bucket === "healthy";
        }
        return bucket === "disconnected";
      });
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
  }, [instances, nameSearch, quickFilter, searchStatus]);

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
      { key: "healthy", label: "Disponibles", count: summary.healthy, color: "#15803d" },
      { key: "degraded", label: "Requieren atención", count: summary.degraded, color: "#d97706" },
      { key: "disconnected", label: "Sin conexión", count: summary.disconnected, color: "#dc2626" },
      { key: "other", label: "Otros", count: summary.other, color: "#475569" },
    ];
  }, [instances]);

  const operationalSummary = useMemo(() => {
    const healthy = statusBreakdown.find((item) => item.key === "healthy")?.count ?? 0;
    const degraded = statusBreakdown.find((item) => item.key === "degraded")?.count ?? 0;
    const disconnected = statusBreakdown.find((item) => item.key === "disconnected")?.count ?? 0;
    const total = instances?.length ?? 0;

    const operatorMessage =
      total === 0
        ? "Aún no hay instancias conectadas a este tenant. Crea una para iniciar vinculación y monitoreo."
        : disconnected > 0
          ? `${disconnected} instancia${disconnected === 1 ? "" : "s"} sin conexión. Prioriza recuperar runtime antes de enviar mensajes o broadcasts.`
          : degraded > 0
            ? `${degraded} instancia${degraded === 1 ? "" : "s"} requiere revisión de QR o reconexión. Los envíos pueden quedar bloqueados hasta estabilizar runtime.`
            : "Todas las instancias visibles están disponibles. Puedes enfocarte en chats, cola y monitoreo diario.";

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

  const quickFilters: Array<{ value: DashboardQuickFilter; label: string; count: number }> = [
    { value: "all", label: "Todas", count: operationalSummary.total },
    { value: "attention", label: "Requieren atención", count: operationalSummary.degraded + operationalSummary.disconnected },
    { value: "connected", label: "Disponibles", count: operationalSummary.healthy },
    { value: "disconnected", label: "Sin conexión", count: operationalSummary.disconnected },
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
                    {tenant?.name || "Tenant actual"} usa las superficies disponibles del MVP. Salud de instancias, cola, chat, contactos, broadcasts y acciones de runtime están activas; las métricas agregadas se muestran con cautela.
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => void resetTable()} disabled={refreshing || instancesFetching}>
                  <RefreshCw size={18} className={refreshing || instancesFetching ? "animate-spin" : undefined} />
                </Button>
                <NewInstance resetTable={resetTable} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Disponibles",
                  value: operationalSummary.healthy,
                  detail: "Listas para operar",
                  icon: CheckCircle2,
                  tone: "text-emerald-600",
                },
                {
                  label: "Requieren atención",
                  value: operationalSummary.degraded,
                  detail: "QR o reconexión",
                  icon: AlertTriangle,
                  tone: "text-amber-600",
                },
                {
                  label: "Sin conexión",
                  value: operationalSummary.disconnected,
                  detail: "Envíos en riesgo",
                  icon: ShieldAlert,
                  tone: "text-rose-600",
                },
                {
                  label: "Instancias visibles",
                  value: operationalSummary.total,
                  detail: "Inventario visible",
                  icon: CircleUser,
                  tone: "text-slate-600",
                },
              ].map((item) => <OperatorStatTile key={item.label} label={item.label} value={item.value} detail={item.detail} icon={item.icon} tone={item.tone} />)}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operator guidance</CardTitle>
            <CardDescription>Señales operativas para trabajo dependiente de conexión activa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={operationalSummary.alertVariant}>
              <Activity className="h-4 w-4" />
              <AlertTitle>Estado del tenant</AlertTitle>
              <AlertDescription>{operationalSummary.operatorMessage}</AlertDescription>
            </Alert>
            <Alert>
              <RadioTower className="h-4 w-4" />
              <AlertTitle>Métricas conservadoras</AlertTitle>
              <AlertDescription>
                La salud de instancias y la distribución de estados son las señales más confiables hoy. Mensajes, contactos y broadcasts pueden mostrarse como historial parcial.
              </AlertDescription>
            </Alert>
            {instancesError ? (
              <OperatorErrorState
                title="Lista de instancias no disponible"
                description={getApiErrorMessage(instancesError, "No se pudieron cargar las instancias del tenant. Las métricas disponibles se mantienen visibles.")}
                onRetry={() => void resetTable()}
              />
            ) : null}
            {metricsError ? (
              <OperatorErrorState
                title="Métricas no disponibles"
                description={metricsError}
                onRetry={() => void fetchMetrics()}
              />
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Salud de instancias</CardTitle>
            <CardDescription>Distribución actual desde snapshots de ciclo de vida.</CardDescription>
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
            <CardTitle>Confianza de métricas</CardTitle>
            <CardDescription>Úsalas como señales operativas, no como analítica completa.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {dashboardMetricsMeta.map((metric) => {
              const Icon = metric.icon;
              const value = metrics[metric.key];

              return (
                <OperatorStatTile
                  key={metric.key}
                  label={metric.label}
                  value={metricsLoading ? "..." : (value ?? 0).toLocaleString()}
                  detail={
                    <span className="space-y-2">
                      <span className="block">{metric.description}</span>
                      <OperatorStatusBadge variant={metric.caveat === "Disponible" ? "default" : "outline"}>{metric.caveat}</OperatorStatusBadge>
                    </span>
                  }
                  icon={Icon}
                />
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("dashboard.title")}</h2>
            <p className="text-sm text-muted-foreground">La lista prioriza instancias que requieren atención.</p>
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

        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickFilters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              variant={quickFilter === filter.value ? "secondary" : "outline"}
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => setQuickFilter(filter.value)}>
              {filter.label}
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">{filter.count}</span>
            </Button>
          ))}
        </div>

        {instancesLoading && !instances ? (
          <main className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </main>
        ) : filteredInstances.length === 0 ? (
          <OperatorEmptyState
            icon={CircleUser}
            title={instances?.length ? "No hay instancias con este filtro" : "Aún no hay instancias"}
            description={
              instances?.length
                ? "Prueba otra búsqueda o filtro de estado. El panel muestra solo flujos disponibles para operación diaria."
                : "Crea la primera instancia para iniciar vinculación, monitoreo de runtime, chats, broadcasts y envíos salientes."
            }
          />
        ) : (
          <main className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredInstances.map((instance: Instance) => {
              const bucket = getInstanceHealthBucket(instance.connectionStatus);
              const health = getInstanceHealthCopy(bucket);

              return (
                <Card key={instance.id} className="border-border/70">
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <Link to={`/manager/instance/${instance.id}/dashboard`} className="block">
                          <TooltipWrapper content={instance.name} side="top">
                            <CardTitle className="truncate text-lg">{instance.name}</CardTitle>
                          </TooltipWrapper>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <InstanceStatus status={instance.connectionStatus} />
                          <OperatorStatusBadge variant={health.badge}>{health.label}</OperatorStatusBadge>
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
                          {instance.stats.contacts === null ? (t("common.notAvailable") || "No disponible") : new Intl.NumberFormat("pt-BR").format(instance.stats.contacts)}
                        </div>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Messages
                        </div>
                        <div className="mt-2 text-xl font-semibold">
                          {instance.stats.messages === null ? (t("common.notAvailable") || "No disponible") : new Intl.NumberFormat("pt-BR").format(instance.stats.messages)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed bg-muted/10 p-3 text-xs leading-5 text-muted-foreground">
                      {truncateOperatorText(
                        bucket === "healthy"
                          ? "Mejor candidata para envíos activos, chats y trabajo de cola."
                          : bucket === "degraded"
                            ? "Vinculación o reconexión en proceso. Los envíos pueden esperar a que runtime se estabilice."
                            : bucket === "disconnected"
                              ? "Las acciones que dependen de conexión activa deben esperar a que la instancia vuelva en línea."
                              : "Esta instancia está visible, pero su estado no entra en las categorías principales de ciclo de vida.",
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 text-xs text-muted-foreground">Última actualización {formatCompactTimestamp(instance.updatedAt || instance.createdAt, "sin reporte reciente")}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="secondary" size="sm">
                        <Link to={`/manager/instance/${instance.id}/dashboard`}>Panel</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/manager/instance/${instance.id}/chat`}>Chat</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmation({ id: instance.id, name: instance.name })} disabled={deleting.includes(instance.name)}>
                        {deleting.includes(instance.name) ? <span>{t("button.deleting")}</span> : <span>{t("button.delete")}</span>}
                      </Button>
                    </div>
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
