import { Activity, ChevronsUpDown, CircleAlert, CircleUser, Cog, MessageCircle, RefreshCw, Users, Zap, MessageSquare } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import { InstanceStatus } from "@/components/instance-status";
import { InstanceToken } from "@/components/instance-token";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { useFetchInstances } from "@/lib/queries/instance/fetchInstances";
import { useManageInstance } from "@/lib/queries/instance/manageInstance";
import { useTenant } from "@/contexts/TenantContext";
import { getDashboardMetrics } from "@/lib/queries/dashboard/getMetrics";
import { getApiErrorMessage } from "@/lib/queries/errors";

import { Instance } from "@/types/evolution.types";

import { NewInstance } from "./NewInstance";
import { TooltipWrapper } from "@/components/ui/tooltip";

interface DashboardMetrics {
  totalInstances: number;
  totalMessages: number;
  totalContacts: number;
  totalBroadcasts: number;
  activeInstances: number;
  inactiveInstances: number;
}

const statusChartConfig = {
  count: {
    label: "Instances",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

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

  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);
  const { deleteInstance, logout } = useManageInstance();
  const { data: instances, refetch } = useFetchInstances();
  const [deleting, setDeleting] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState("all");
  const [nameSearch, setNameSearch] = useState("");

  useEffect(() => {
    fetchMetrics();
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
    fetchMetrics();
  };

  const handleDelete = async (instance: {id: string, name: string}) => {
    setDeleteConfirmation(null);
    setDeleting([...deleting, instance.name]);
    try {
      try {
        await logout(instance.id);
      } catch (error) {
        console.error("Error logout:", error);
      }
      await deleteInstance(instance.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      resetTable();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error instance delete:", error);
      toast.error(getApiErrorMessage(error, "Failed to delete instance"));
    } finally {
      setDeleting(deleting.filter((item) => item !== instance.name));
    }
  };

  const filteredInstances = useMemo(() => {
    let instancesList = instances ? [...instances] : [];
    if (searchStatus !== "all") {
      instancesList = instancesList.filter((instance) => instance.connectionStatus === searchStatus);
    }

    if (nameSearch !== "") {
      instancesList = instancesList.filter((instance) => instance.name.toLowerCase().includes(nameSearch.toLowerCase()));
    }

    return instancesList;
  }, [instances, nameSearch, searchStatus]);

  const statusBreakdown = useMemo(() => {
    const summary = {
      open: 0,
      attention: 0,
      disconnected: 0,
      other: 0,
    };

    (instances ?? []).forEach((instance) => {
      const status = instance.connectionStatus;

      if (status === "open") {
        summary.open += 1;
        return;
      }

      if (status === "connecting" || status === "qrcode") {
        summary.attention += 1;
        return;
      }

      if (status === "close" || status === "disconnected") {
        summary.disconnected += 1;
        return;
      }

      summary.other += 1;
    });

    return [
      { key: "open", label: "Open", count: summary.open, color: "#15803d" },
      { key: "attention", label: "Connecting / QR", count: summary.attention, color: "#d97706" },
      { key: "disconnected", label: "Disconnected", count: summary.disconnected, color: "#dc2626" },
      { key: "other", label: "Other", count: summary.other, color: "#475569" },
    ];
  }, [instances]);

  const operationalSummary = useMemo(() => {
    const needsAction = statusBreakdown.find((item) => item.key === "attention")?.count ?? 0;
    const disconnected = statusBreakdown.find((item) => item.key === "disconnected")?.count ?? 0;
    const active = statusBreakdown.find((item) => item.key === "open")?.count ?? 0;

    return {
      active,
      needsAction,
      disconnected,
    };
  }, [statusBreakdown]);

  const instanceStatus = [
    { value: "all", label: t("status.all") },
    { value: "close", label: t("status.closed") },
    { value: "connecting", label: t("status.connecting") },
    { value: "open", label: t("status.open") },
  ];

  return (
    <div className="my-4 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">{t("dashboard.welcome") || "Welcome back"}</h1>
        <p className="text-gray-600">{tenant?.name}</p>
      </div>

      <Alert className="mb-6">
        <CircleAlert className="h-4 w-4" />
        <AlertTitle>Operator metrics are live; aggregate counters are still backend-limited.</AlertTitle>
        <AlertDescription>
          Instance totals and status distribution are trustworthy today. Message, contact, and broadcast counters still depend on backend aggregation work and may stay at zero or look sparse until that lands.
        </AlertDescription>
      </Alert>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">{t("dashboard.metrics.instances") || "Total Instances"}</h3>
            <CircleUser className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInstances}</div>
            <p className="text-xs text-gray-600">{metrics.activeInstances} {t("dashboard.metrics.active") || "active"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">{t("dashboard.metrics.messages") || "Total Messages"}</h3>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.totalMessages ?? 0).toLocaleString()}</div>
            <p className="text-xs text-gray-600">Backend aggregation pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">{t("dashboard.metrics.contacts") || "Contacts"}</h3>
            <Zap className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.totalContacts ?? 0).toLocaleString()}</div>
            <p className="text-xs text-gray-600">Currently backend-limited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">{t("dashboard.metrics.broadcasts") || "Broadcasts"}</h3>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.totalBroadcasts ?? 0).toLocaleString()}</div>
            <p className="text-xs text-gray-600">Job-level snapshot only</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">Instance status overview</h3>
                <p className="text-xs text-muted-foreground">Live distribution from tenant-scoped instance status snapshots</p>
              </div>
              <Activity className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[240px] w-full">
              <BarChart accessibilityLayer data={statusBreakdown} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={110} />
                <XAxis dataKey="count" type="number" allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={8}>
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
            <h3 className="text-sm font-medium">Operator focus</h3>
            <p className="text-xs text-muted-foreground">What needs attention right now in this tenant</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Active</div>
                <div className="text-2xl font-semibold">{operationalSummary.active}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Needs QR / reconnect</div>
                <div className="text-2xl font-semibold">{operationalSummary.needsAction}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Disconnected</div>
                <div className="text-2xl font-semibold">{operationalSummary.disconnected}</div>
              </div>
            </div>

            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              The current SaaS MVP supports auth, instance lifecycle, runtime observability, contacts, broadcast jobs, chat list/detail handling, and outbound text, media, and audio sends on supported routes. Legacy integration suites remain gated until their tenant-safe APIs are complete.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instances Section */}
      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg">{t("dashboard.title")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw onClick={resetTable} size="20" />
          </Button>
          <NewInstance resetTable={resetTable} />
        </div>
      </div>
      <div className="my-4 flex items-center justify-between gap-3 px-4">
        <div className="flex-1">
          <Input placeholder={t("dashboard.search")} value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              {t("dashboard.status")} <ChevronsUpDown size="15" />
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
      <main className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredInstances.length > 0 &&
          Array.isArray(filteredInstances) ? (
          filteredInstances.map((instance: Instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <Link to={`/manager/instance/${instance.id}/dashboard`} className="flex w-full flex-row items-center justify-between gap-4">
                  <TooltipWrapper content={instance.name} side="top">
                    <h3 className="text-wrap font-semibold truncate">{instance.name}</h3>
                  </TooltipWrapper>

                  <TooltipWrapper content={t("dashboard.settings")} side="top">
                    <Button variant="ghost" size="icon">
                      <Cog className="card-icon" size="20" />
                    </Button>
                  </TooltipWrapper>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <InstanceToken token={instance.token} />
                <div className="flex w-full flex-wrap">
                  <div className="flex flex-1 gap-2">
                    {instance.profileName && (
                      <>
                        <Avatar>
                          <AvatarImage src={instance.profilePicUrl} alt="" />
                        </Avatar>
                        <div className="space-y-1">
                          <strong>{instance.profileName}</strong>
                          <p className="text-sm text-muted-foreground">{instance.ownerJid && instance.ownerJid.split("@")[0]}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-4 text-sm">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <CircleUser className="text-muted-foreground" size="20" />
                      <span>{instance.stats.contacts === null ? (t("common.notAvailable") || "N/A") : new Intl.NumberFormat("pt-BR").format(instance.stats.contacts)}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <MessageCircle className="text-muted-foreground" size="20" />
                      <span>{instance.stats.messages === null ? (t("common.notAvailable") || "N/A") : new Intl.NumberFormat("pt-BR").format(instance.stats.messages)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <InstanceStatus status={instance.connectionStatus} />
                <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmation({id: instance.id, name: instance.name})} disabled={deleting.includes(instance.name)}>
                  {deleting.includes(instance.name) ? <span>{t("button.deleting")}</span> : <span>{t("button.delete")}</span>}
                </Button>
              </CardFooter>
            </Card>
          ))) :(
          <p>{t("dashboard.instancesNotFound")}</p>
          )}
      </main>

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
                <Button onClick={() => handleDelete(deleteConfirmation)} variant="destructive">
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
