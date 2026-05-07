import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, PauseCircle, RadioTower, RefreshCw, Search, Send, TimerReset, Users, XCircle } from "lucide-react";
import { toast } from "react-toastify";

import { OperatorPageHeader } from "@/components/operator-page-header";
import { OperatorErrorState, SkeletonTableRows } from "@/components/operator-state";
import { OperatorEmptyState, OperatorStatTile, OperatorStatusBadge } from "@/components/operator-surface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

type BroadcastHistoryFilter = "all" | "active" | "attention" | "completed";

const initialFormState: FormState = {
  instanceId: "",
  message: "",
  ratePerHour: 60,
  delaySec: 0,
  maxAttempts: 3,
  scheduledTime: "",
};

const recipientStatusFilters = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "sent", label: "Enviados" },
  { value: "failed", label: "Fallidos" },
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
    return <span className="text-xs text-muted-foreground">Detalle de destinatarios pendiente</span>;
  }

  const total = analytics.total ?? 0;
  const attempted = analytics.attempted ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((attempted / total) * 100)) : null;

  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      {progress !== null ? (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span>Progreso de intentos</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
      <div className="grid gap-1.5 sm:grid-cols-2">
        <div>Total: {analytics.total ?? "-"}</div>
        <div>Intentados: {analytics.attempted ?? "-"}</div>
        <div>Enviados: {analytics.sent ?? "-"}</div>
        <div>Fallidos: {analytics.failed ?? "-"}</div>
        <div>Pendientes: {analytics.pending ?? "-"}</div>
        <div className={analytics.partial ? "text-amber-700" : undefined}>{analytics.partial ? "Historial parcial" : "Resumen completo"}</div>
      </div>
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
    if (recipientData?.totalPages && page > recipientData.totalPages) {
      setPage(Math.max(1, recipientData.totalPages));
    }
  }, [page, recipientData?.totalPages]);

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
          setRecipientsError(getApiErrorMessage(error, "No se pudo cargar el progreso de destinatarios."));
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
            <CardTitle className="text-xl">Detalle de campaña</CardTitle>
            <CardDescription>{instanceName}</CardDescription>
          </div>
          <OperatorStatusBadge variant={getStatusBadgeVariant(broadcast.status)}>{formatOperatorStatusLabel(broadcast.status)}</OperatorStatusBadge>
        </div>
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="whitespace-pre-wrap break-words font-medium">{truncateOperatorText(broadcast.message, 240)}</div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
            <div>Creado: {formatOperatorTimestamp(broadcast.createdAt)}</div>
            <div>Disponible: {formatOperatorTimestamp(broadcast.availableAt, "No reportado")}</div>
            <div>Iniciado: {formatOperatorTimestamp(broadcast.startedAt, "Sin iniciar")}</div>
            <div>Finalizado: {formatOperatorTimestamp(broadcast.completedAt || broadcast.failedAt, "En proceso")}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Destinatarios", value: summary.total, detail: "En alcance", tone: "text-foreground" },
            { label: "Intentados", value: summary.attempted, detail: "Intentos iniciados", tone: "text-sky-600" },
            { label: "Enviados", value: summary.sent, detail: "Aceptados por cola", tone: "text-emerald-600" },
            { label: "Fallidos", value: summary.failed, detail: "Requieren revisión", tone: "text-rose-600" },
            { label: "Pendientes", value: summary.pending, detail: "En espera", tone: "text-amber-600" },
            { label: "Alcance", value: summary.partial ? "Parcial" : "Completo", detail: "Resumen disponible", tone: summary.partial ? "text-amber-600" : "text-muted-foreground" },
          ].map((item) => (
            <OperatorStatTile key={item.label} label={item.label} value={item.value ?? "-"} detail={item.detail} className={item.tone} />
          ))}
        </div>

        <Alert variant="info">
          <RadioTower className="h-4 w-4" />
          <AlertTitle>Detalle de destinatarios por intentos y resultado.</AlertTitle>
          <AlertDescription>
            Este panel muestra intentos y resultados de cola. No muestra entregas ni lecturas de WhatsApp cuando esos estados no están disponibles.
          </AlertDescription>
        </Alert>

        {summary.partial ? (
          <Alert variant="warning">
            <AlertTitle>Historial parcial</AlertTitle>
            <AlertDescription>
              Usa estos conteos como snapshot actual de la campaña. Filtros y paginación siguen disponibles, pero el resumen puede no incluir todos los resultados finales.
            </AlertDescription>
          </Alert>
        ) : null}

        {broadcast.lastError ? (
          <Alert variant="warning">
            <AlertTitle>Último error del trabajo</AlertTitle>
            <AlertDescription className="break-words">{broadcast.lastError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="grid gap-2">
            <Label htmlFor="broadcast-recipient-status">Estado del destinatario</Label>
            <select
              id="broadcast-recipient-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={isLoading && !recipientData}>
              {recipientStatusFilters.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="broadcast-recipient-search">Buscar destinatario</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="broadcast-recipient-search"
                value={recipientQuery}
                onChange={(event) => setRecipientQuery(event.target.value)}
                placeholder="Buscar por teléfono o contacto"
                className="pl-9"
                disabled={isLoading && !recipientData}
              />
            </div>
          </div>
        </div>

        {recipientsError ? (
          <Alert variant="warning">
            <AlertTitle>Detalle de destinatarios no disponible</AlertTitle>
            <AlertDescription>{recipientsError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Destinatario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Intentos</TableHead>
                <TableHead>Tiempos</TableHead>
                <TableHead>Último error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !recipientData ? (
                <SkeletonTableRows rows={5} columns={5} />
              ) : recipientData && recipientData.items.length > 0 ? (
                recipientData.items.map((recipient) => (
                  <TableRow key={recipient.id} className="align-top">
                    <TableCell className="min-w-[220px] align-top">
                      <div className="space-y-1">
                        <div className="break-all font-mono text-xs font-medium">{recipient.phone}</div>
                        <div className="break-all text-xs text-muted-foreground">
                          {recipient.chatJid || recipient.contactId || "Sin identificador de chat/contacto"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <OperatorStatusBadge variant={getRecipientStatusBadgeVariant(recipient.status)}>{formatOperatorStatusLabel(recipient.status)}</OperatorStatusBadge>
                    </TableCell>
                    <TableCell className="align-top">{recipient.attemptCount}</TableCell>
                    <TableCell className="min-w-[220px] align-top">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Último intento: {formatOperatorTimestamp(recipient.lastAttemptAt, "Sin intento")}</div>
                        <div>Enviado: {formatOperatorTimestamp(recipient.sentAt, "Sin envío")}</div>
                        <div>Falló: {formatOperatorTimestamp(recipient.failedAt, "Sin fallo")}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[260px] align-top">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className={recipient.lastError ? "break-words text-rose-700" : undefined}>{recipient.lastError || "Sin error reportado"}</div>
                        {recipient.messageId ? <div className="break-all">ID de mensaje: {recipient.messageId}</div> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No hay destinatarios con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {recipientData ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
            <div className="min-w-0 break-words text-sm text-muted-foreground">
              Página {recipientData.page} de {Math.max(1, recipientData.totalPages || 1)} - {recipientData.total} destinatario{recipientData.total === 1 ? "" : "s"}
              {statusFilter ? ` - estado: ${formatOperatorStatusLabel(statusFilter)}` : " - todos los estados"}
              {deferredRecipientQuery ? ` - búsqueda: ${deferredRecipientQuery}` : ""}
              {recipientData.partial ? " - historial parcial" : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={isLoading || !recipientData.totalPages || page >= recipientData.totalPages}>
                Siguiente
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
  const [broadcastsError, setBroadcastsError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [validationState, setValidationState] = useState<ValidationState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmBroadcastOpen, setConfirmBroadcastOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<BroadcastHistoryFilter>("all");
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
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setBroadcastsError(null);
    try {
      setBroadcasts(await getBroadcastJobs());
    } catch (error) {
      const message = getApiErrorMessage(error, t("broadcast.error.fetch") || "No se pudo cargar el historial de broadcasts");
      setBroadcastsError(message);
      toast.error(message);
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
    return sortedBroadcasts.filter((broadcast) => {
      const matchesFilter =
        historyFilter === "all" ||
        (historyFilter === "active" && (broadcast.status === "queued" || broadcast.status === "processing")) ||
        (historyFilter === "attention" && (broadcast.status === "failed" || broadcast.status === "completed_with_failures")) ||
        (historyFilter === "completed" && broadcast.status === "completed");

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const instanceName = instances?.find((instance) => instance.id === broadcast.instanceId)?.name ?? broadcast.instanceId;
      return (
        broadcast.message.toLowerCase().includes(normalizedSearch) ||
        instanceName.toLowerCase().includes(normalizedSearch) ||
        String(broadcast.status).toLowerCase().includes(normalizedSearch)
      );
    });
  }, [deferredHistorySearch, historyFilter, instances, sortedBroadcasts]);

  const visibleBroadcasts = useIncrementalList(filteredBroadcasts, {
    initialCount: 50,
    step: 50,
  });

  const validateForm = (): ValidationState => {
    if (!formData.instanceId) {
      return {
        title: "Elige una instancia",
        detail: "El trabajo debe quedar asociado a una instancia con runtime disponible.",
      };
    }

    if (!formData.message.trim()) {
      return {
        title: "Mensaje requerido",
        detail: "Agrega el contenido antes de crear el trabajo de cola.",
      };
    }

    if (formData.message.trim().length < 3) {
      return {
        title: "Mensaje demasiado corto",
        detail: "Usa contenido suficiente para reconocer el trabajo en el historial.",
      };
    }

    if (!Number.isFinite(formData.ratePerHour) || formData.ratePerHour < 1) {
      return {
        title: "La tasa por hora debe ser mayor que 0",
        detail: "La configuración necesita una tasa válida para la cola.",
      };
    }

    if (!Number.isFinite(formData.maxAttempts) || formData.maxAttempts < 1) {
      return {
        title: "Los intentos máximos deben ser mayores que 0",
        detail: "Los reintentos requieren un límite positivo.",
      };
    }

    if (scheduleMode === "later") {
      if (!formData.scheduledTime) {
        return {
          title: "Fecha programada requerida",
          detail: "Selecciona un horario futuro antes de crear el trabajo.",
        };
      }

      const scheduledAt = new Date(formData.scheduledTime);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
        return {
          title: "La fecha debe estar en el futuro",
          detail: "Un horario pasado no es válido para la cola.",
        };
      }
    } else if (!Number.isFinite(formData.delaySec) || formData.delaySec < 0) {
      return {
        title: "El retraso debe ser 0 o mayor",
        detail: "Usa un retraso válido para trabajos inmediatos.",
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

  const requestBroadcastConfirmation = () => {
    if (submitting) {
      return;
    }

    const nextValidation = validateForm();
    setValidationState(nextValidation);
    if (nextValidation) {
      toast.error(nextValidation.title);
      return;
    }

    setConfirmBroadcastOpen(true);
  };

  const handleSendBroadcast = async () => {
    if (submitting) {
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
      toast.success("Trabajo de broadcast creado. Revisa destinatarios para ver resultados de cola.");
      setConfirmBroadcastOpen(false);
      setShowForm(false);
      resetComposer();
      await fetchBroadcasts();
      setSelectedBroadcastId(created.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo crear el trabajo de broadcast."));
    } finally {
      setSubmitting(false);
    }
  };

  const instanceNameById = (instanceId: string) => instances?.find((instance) => instance.id === instanceId)?.name || instanceId;

  const historyFilters: Array<{ value: BroadcastHistoryFilter; label: string; count: number }> = [
    { value: "all", label: "Todos", count: queueSummary.total },
    { value: "active", label: "Activos", count: queueSummary.queued + queueSummary.processing },
    { value: "attention", label: "Requieren atención", count: queueSummary.failed + queueSummary.completedWithFailures },
    { value: "completed", label: "Completados", count: queueSummary.completed },
  ];

  return (
    <div className="space-y-6 p-4">
      <OperatorPageHeader
        title={t("broadcast.title") || "Broadcast"}
        description={tenant?.name}
        actions={
          <>
            <Button onClick={() => void fetchBroadcasts()} variant="outline" size="icon" disabled={isLoading || submitting}>
              <RefreshCw size={18} className={isLoading ? "animate-spin" : undefined} />
            </Button>
            <Button onClick={() => setShowForm((current) => !current)} disabled={submitting}>
              <Send size={18} className="mr-2" />
              {showForm ? "Ocultar formulario" : "Nuevo broadcast"}
            </Button>
          </>
        }
      />

      <Alert variant="info">
        <RadioTower className="h-4 w-4" />
        <AlertTitle>La cola de broadcast está disponible; el envío depende del runtime.</AlertTitle>
        <AlertDescription>
          Puedes crear y revisar trabajos aquí. El envío real requiere una instancia conectada y cola saludable. El detalle de destinatarios representa intentos y resultados de cola, no lecturas de WhatsApp.
        </AlertDescription>
      </Alert>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "En cola", value: queueSummary.queued, icon: Clock3, tone: "text-amber-600" },
          { label: "En proceso", value: queueSummary.processing, icon: TimerReset, tone: "text-sky-600" },
          { label: "Completados", value: queueSummary.completed, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Con fallos", value: queueSummary.completedWithFailures, icon: AlertTriangle, tone: "text-amber-600" },
          { label: "Fallidos", value: queueSummary.failed, icon: XCircle, tone: "text-rose-600" },
          { label: "Con detalle", value: queueSummary.analyticsReady, icon: Users, tone: "text-violet-600" },
        ].map((item) => <OperatorStatTile key={item.label} label={item.label} value={item.value} icon={item.icon} tone={item.tone} />)}
      </section>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear trabajo de broadcast</CardTitle>
            <CardDescription>Crea un trabajo de salida por cola. El envío requiere conexión activa de la instancia.</CardDescription>
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
                  <Label htmlFor="broadcast-instance">Instancia</Label>
                  <select
                    id="broadcast-instance"
                    value={formData.instanceId}
                    onChange={(event) => setFormData({ ...formData, instanceId: event.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    disabled={submitting}>
                    <option value="">Selecciona una instancia</option>
                    {(instances ?? []).map((instance) => (
                      <option key={instance.id} value={instance.id}>
                        {instance.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="broadcast-message">{t("broadcast.form.message") || "Mensaje"}</Label>
                  <Textarea
                    id="broadcast-message"
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    placeholder={t("broadcast.form.messagePlaceholder") || "Escribe el mensaje"}
                    rows={6}
                    disabled={submitting}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>El historial usa este contenido como vista previa.</span>
                    <span>{formData.message.trim().length} caracteres</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="broadcast-schedule-mode">{t("broadcast.form.schedule") || "Programación"}</Label>
                  <select
                    id="broadcast-schedule-mode"
                    value={scheduleMode}
                    onChange={(event) => setScheduleMode(event.target.value as "now" | "later")}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    disabled={submitting}>
                    <option value="now">{t("broadcast.schedule.now") || "Ahora"}</option>
                    <option value="later">{t("broadcast.schedule.later") || "Más tarde"}</option>
                  </select>
                </div>

                {scheduleMode === "later" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-scheduled-time">{t("broadcast.form.scheduledTime") || "Horario programado"}</Label>
                    <Input id="broadcast-scheduled-time" type="datetime-local" value={formData.scheduledTime} onChange={(event) => setFormData({ ...formData, scheduledTime: event.target.value })} disabled={submitting} />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-delay">{t("broadcast.form.delay") || "Retraso (segundos)"}</Label>
                    <Input id="broadcast-delay" type="number" value={formData.delaySec} onChange={(event) => setFormData({ ...formData, delaySec: Number.parseInt(event.target.value, 10) || 0 })} min={0} disabled={submitting} />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-rate">Tasa por hora</Label>
                    <Input id="broadcast-rate" type="number" value={formData.ratePerHour} onChange={(event) => setFormData({ ...formData, ratePerHour: Number.parseInt(event.target.value, 10) || 0 })} min={1} disabled={submitting} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="broadcast-attempts">Intentos máximos</Label>
                    <Input id="broadcast-attempts" type="number" value={formData.maxAttempts} onChange={(event) => setFormData({ ...formData, maxAttempts: Number.parseInt(event.target.value, 10) || 0 })} min={1} disabled={submitting} />
                  </div>
                </div>

                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Esta pantalla crea trabajos de cola, no entregas garantizadas. El detalle mostrará solo intentos y resultados disponibles.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowForm(false);
                  resetComposer();
                }}
                variant="outline"
                disabled={submitting}>
                {t("common.cancel") || "Cancelar"}
              </Button>
              <Button onClick={requestBroadcastConfirmation} disabled={submitting}>
                <Send size={18} className="mr-2" />
                {submitting ? "Creando trabajo..." : "Crear trabajo de cola"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmBroadcastOpen} onOpenChange={setConfirmBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Crear este trabajo de broadcast?</DialogTitle>
            <DialogDescription>
              Esto creará un trabajo de cola para {instanceNameById(formData.instanceId)}. No garantiza entrega; conexión, límites, reintentos y estado de cola determinan el resultado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4 text-sm">
            <div>
              <span className="font-medium">Programación:</span> {scheduleMode === "later" ? formatOperatorTimestamp(formData.scheduledTime, "Horario pendiente") : `Inmediato, retraso ${formData.delaySec || 0}s`}
            </div>
            <div>
              <span className="font-medium">Tasa:</span> {formData.ratePerHour}/hora · <span className="font-medium">Intentos máximos:</span> {formData.maxAttempts}
            </div>
            <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
              <span className="font-medium">Mensaje:</span> {truncateOperatorText(formData.message.trim(), 280)}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmBroadcastOpen(false)} disabled={submitting}>
              Revisar
            </Button>
            <Button type="button" onClick={() => void handleSendBroadcast()} disabled={submitting}>
              {submitting ? "Creando trabajo..." : "Confirmar trabajo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t("broadcast.history") || "Historial de broadcasts"}</CardTitle>
          <CardDescription>
            {filteredBroadcasts.length} trabajo{filteredBroadcasts.length === 1 ? "" : "s"} visible{filteredBroadcasts.length === 1 ? "" : "s"} con los filtros actuales.
            {visibleBroadcasts.hasMore ? ` Mostrando primeros ${visibleBroadcasts.visibleCount}.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar mensaje, instancia o estado" className="pl-9" disabled={isLoading && broadcasts.length === 0} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {historyFilters.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant={historyFilter === filter.value ? "secondary" : "outline"}
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => setHistoryFilter(filter.value)}>
                {filter.label}
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">{filter.count}</span>
              </Button>
            ))}
          </div>
          {broadcastsError ? (
            <OperatorErrorState
              title="Historial de broadcasts no disponible"
              description={broadcastsError}
              onRetry={() => void fetchBroadcasts()}
            />
          ) : null}

          {filteredBroadcasts.length === 0 && !isLoading ? (
            <OperatorEmptyState
              icon={RadioTower}
              title={historySearch.trim() || historyFilter !== "all" ? "No hay trabajos con este filtro" : "Aún no hay broadcasts"}
              description={
                historySearch.trim()
                  ? "Prueba otro mensaje, instancia o estado. Esta pantalla muestra trabajos de cola disponibles para el tenant."
                  : historyFilter === "active"
                    ? "No hay trabajos en cola o en proceso ahora."
                    : historyFilter === "attention"
                      ? "No hay trabajos fallidos o completados con fallos en este momento."
                      : historyFilter === "completed"
                        ? "Todavía no hay trabajos completados con este filtro."
                        : "El historial aparecerá después de crear el primer trabajo. La pantalla se enfoca en estado, programación y reintentos disponibles."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trabajo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Programación</TableHead>
                      <TableHead>Intentos</TableHead>
                      <TableHead>Destinatarios</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && broadcasts.length === 0 ? (
                      <SkeletonTableRows rows={6} columns={7} />
                    ) : (
                      visibleBroadcasts.visibleItems.map((broadcast) => {
                        const StatusIcon = getStatusIcon(broadcast.status);
                        const isSelected = selectedBroadcastId === broadcast.id;

                        return (
                          <TableRow key={broadcast.id} className={isSelected ? "bg-muted/40" : undefined}>
                            <TableCell className="min-w-[280px] align-top">
                              <div className="space-y-1">
                                <div className="break-words font-medium">{instanceNameById(broadcast.instanceId)}</div>
                                <div className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{truncateOperatorText(broadcast.message, 90)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <OperatorStatusBadge variant={getStatusBadgeVariant(broadcast.status)} icon={StatusIcon}>{formatOperatorStatusLabel(broadcast.status)}</OperatorStatusBadge>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1 text-sm">
                                <div>{broadcast.scheduledAt ? formatOperatorTimestamp(broadcast.scheduledAt) : "Cola inmediata"}</div>
                                <div className="text-xs text-muted-foreground">{broadcast.scheduledAt ? "Programado" : `Retraso: ${broadcast.delaySec || 0}s`}</div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1 text-sm">
                                <div>
                                  {broadcast.attempts}/{broadcast.maxAttempts}
                                </div>
                                <div className="text-xs text-muted-foreground">Tasa {broadcast.ratePerHour || 0}/h</div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[240px] align-top">
                              <BroadcastRecipientSummary analytics={broadcast.recipientAnalytics} />
                            </TableCell>
                            <TableCell className="align-top">{formatCompactTimestamp(broadcast.createdAt)}</TableCell>
                            <TableCell className="align-top">
                              <Button variant={isSelected ? "secondary" : "outline"} size="sm" onClick={() => setSelectedBroadcastId(isSelected ? null : broadcast.id)}>
                                {isSelected ? "Ocultar detalle" : "Ver destinatarios"}
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
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
                  <div className="min-w-0 text-sm text-muted-foreground">
                    Mostrando {visibleBroadcasts.visibleCount} de {visibleBroadcasts.totalCount} trabajos filtrados para mantener ágil el historial.
                  </div>
                  <Button variant="outline" onClick={visibleBroadcasts.showMore} disabled={isLoading}>
                    Mostrar 50 más
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
            <CardContent className="py-10 text-center text-sm text-muted-foreground">Cargando detalle de campaña...</CardContent>
          </Card>
        ) : selectedBroadcastError ? (
          <Alert variant="warning">
            <AlertTitle>Detalle de campaña no disponible</AlertTitle>
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
