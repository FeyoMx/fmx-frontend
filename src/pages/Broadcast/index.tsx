import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, RefreshCw, RadioTower } from "lucide-react";
import { toast } from "react-toastify";

import { OperatorPageHeader } from "@/components/operator-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useTenant } from "@/contexts/TenantContext";
import { createBroadcastJob, getBroadcastJobs } from "@/lib/queries/broadcast/jobs";
import { BroadcastView } from "@/lib/queries/broadcast/types";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { useFetchInstances } from "@/lib/queries/instance/fetchInstances";

export function Broadcast() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [broadcasts, setBroadcasts] = useState<BroadcastView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const { data: instances } = useFetchInstances();

  const [formData, setFormData] = useState({
    instanceId: "",
    message: "",
    ratePerHour: 60,
    delaySec: 0,
    maxAttempts: 3,
    scheduledTime: "",
  });

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

  const handleSendBroadcast = async () => {
    if (!formData.instanceId || !formData.message) {
      toast.error(t("broadcast.validation.requiredFields") || "Instance and message are required");
      return;
    }

    try {
      await createBroadcastJob({
        instance_id: formData.instanceId,
        message: formData.message,
        rate_per_hour: formData.ratePerHour,
        delay_sec: scheduleMode === "now" ? formData.delaySec : 0,
        max_attempts: formData.maxAttempts,
        scheduled_at: scheduleMode === "later" ? formData.scheduledTime : null,
      });
      toast.success(t("broadcast.message.sent") || "Broadcast queued successfully");
      setShowForm(false);
      setFormData({
        instanceId: instances?.[0]?.id ?? "",
        message: "",
        ratePerHour: 60,
        delaySec: 0,
        maxAttempts: 3,
        scheduledTime: "",
      });
      void fetchBroadcasts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("broadcast.error.send") || "Failed to send broadcast"));
    }
  };

  const getStatusColor = (status: BroadcastView["status"]): "default" | "secondary" | "destructive" | "warning" => {
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
  };

  return (
    <div className="space-y-4 p-4">
      <OperatorPageHeader
        title={t("broadcast.title") || "Broadcast"}
        description={tenant?.name}
        actions={
          <>
          <Button onClick={() => void fetchBroadcasts()} variant="outline" size="icon">
            <RefreshCw size={20} />
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Send size={20} className="mr-2" />
            {t("broadcast.button.new") || "New Broadcast"}
          </Button>
          </>
        }
      />

      <Alert variant="info">
        <RadioTower className="h-4 w-4" />
        <AlertTitle>Broadcast jobs are active</AlertTitle>
        <AlertDescription>
          This MVP supports queueing and reviewing broadcast jobs. Delivery totals and per-recipient analytics are still limited to what the current backend reports.
        </AlertDescription>
      </Alert>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcast.form.title") || "Create Broadcast"}</CardTitle>
            <CardDescription>{t("broadcast.form.description") || "Queue a message for a specific instance"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instance</label>
              <select value={formData.instanceId} onChange={(e) => setFormData({ ...formData, instanceId: e.target.value })} className="w-full rounded border p-2">
                <option value="">Select an instance</option>
                {(instances ?? []).map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("broadcast.form.message") || "Message"}</label>
              <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder={t("broadcast.form.messagePlaceholder") || "Your message here..."} rows={5} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("broadcast.form.schedule") || "Schedule"}</label>
                <select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value as "now" | "later")} className="w-full rounded border p-2">
                  <option value="now">{t("broadcast.schedule.now") || "Now"}</option>
                  <option value="later">{t("broadcast.schedule.later") || "Later"}</option>
                </select>
              </div>

              {scheduleMode === "later" ? (
                <div>
                  <label className="block text-sm font-medium mb-1">{t("broadcast.form.scheduledTime") || "Scheduled Time"}</label>
                  <Input type="datetime-local" value={formData.scheduledTime} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">{t("broadcast.form.delay") || "Delay (seconds)"}</label>
                  <Input type="number" value={formData.delaySec} onChange={(e) => setFormData({ ...formData, delaySec: parseInt(e.target.value) || 0 })} min={0} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rate per hour</label>
                <Input type="number" value={formData.ratePerHour} onChange={(e) => setFormData({ ...formData, ratePerHour: parseInt(e.target.value) || 0 })} min={1} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max attempts</label>
                <Input type="number" value={formData.maxAttempts} onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 0 })} min={1} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowForm(false)} variant="outline">
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button onClick={handleSendBroadcast}>
                <Send size={20} className="mr-2" />
                {t("broadcast.button.send") || "Queue Broadcast"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("broadcast.history") || "Broadcast History"}</CardTitle>
          <CardDescription>{broadcasts.length} broadcasts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instance</TableHead>
                  <TableHead>{t("broadcast.table.status") || "Status"}</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>{t("broadcast.table.date") || "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t("common.loading") || "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : broadcasts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t("broadcast.noBroadcasts") || "No broadcasts yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  broadcasts.map((broadcast) => (
                    <TableRow key={broadcast.id}>
                      <TableCell className="font-medium">{instances?.find((instance) => instance.id === broadcast.instanceId)?.name || broadcast.instanceId}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
                      </TableCell>
                      <TableCell>{broadcast.attempts}/{broadcast.maxAttempts}</TableCell>
                      <TableCell>{broadcast.scheduledAt ? new Date(broadcast.scheduledAt).toLocaleString() : "Immediate"}</TableCell>
                      <TableCell>{broadcast.createdAt ? new Date(broadcast.createdAt).toLocaleDateString() : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
