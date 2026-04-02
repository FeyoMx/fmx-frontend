import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { apiGlobal } from "@/lib/queries/api";
import { useTenant } from "@/contexts/TenantContext";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  status: "draft" | "scheduled" | "sent";
  scheduledAt?: string;
  sentAt?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

export function Broadcast() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    template: "default",
    delay: 0, // in seconds
    scheduledTime: "",
  });

  const fetchBroadcasts = async () => {
    setIsLoading(true);
    try {
      const response = await apiGlobal.get("/broadcast");
      setBroadcasts(response.data || []);
    } catch (error) {
      toast.error(t("broadcast.error.fetch") || "Failed to fetch broadcasts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!formData.title || !formData.message) {
      toast.error(t("broadcast.validation.requiredFields") || "Title and message are required");
      return;
    }

    try {
      const payload = {
        ...formData,
        scheduledAt: scheduleMode === "later" ? formData.scheduledTime : null,
        delay: formData.delay,
      };

      await apiGlobal.post("/broadcast", payload);
      toast.success(t("broadcast.message.sent") || "Broadcast sent successfully");
      setShowForm(false);
      setFormData({ title: "", message: "", template: "default", delay: 0, scheduledTime: "" });
      fetchBroadcasts();
    } catch (error) {
      toast.error(t("broadcast.error.send") || "Failed to send broadcast");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("broadcast.title") || "Broadcast"}</h1>
          <p className="text-gray-600">{tenant?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBroadcasts} variant="outline" size="icon">
            <RefreshCw size={20} />
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Send size={20} className="mr-2" />
            {t("broadcast.button.new") || "New Broadcast"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcast.form.title") || "Create Broadcast"}</CardTitle>
            <CardDescription>{t("broadcast.form.description") || "Send a message to all contacts"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("broadcast.form.title") || "Title"}</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("broadcast.form.titlePlaceholder") || "Broadcast title"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("broadcast.form.message") || "Message"}</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t("broadcast.form.messagePlaceholder") || "Your message here..."}
                rows={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("broadcast.form.template") || "Template"}</label>
              <select
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="w-full rounded border p-2"
              >
                <option value="default">{t("broadcast.template.default") || "Default"}</option>
                <option value="greeting">{t("broadcast.template.greeting") || "Greeting"}</option>
                <option value="promotional">{t("broadcast.template.promotional") || "Promotional"}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("broadcast.form.schedule") || "Schedule"}</label>
                <select
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value as "now" | "later")}
                  className="w-full rounded border p-2"
                >
                  <option value="now">{t("broadcast.schedule.now") || "Now"}</option>
                  <option value="later">{t("broadcast.schedule.later") || "Later"}</option>
                </select>
              </div>

              {scheduleMode === "later" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("broadcast.form.scheduledTime") || "Scheduled Time"}</label>
                    <Input type="datetime-local" value={formData.scheduledTime} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })} />
                  </div>
                </>
              )}

              {scheduleMode === "now" && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t("broadcast.form.delay") || "Delay (seconds)"}</label>
                  <Input
                    type="number"
                    value={formData.delay}
                    onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowForm(false)} variant="outline">
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button onClick={handleSendBroadcast}>
                <Send size={20} className="mr-2" />
                {t("broadcast.button.send") || "Send"}
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
                  <TableHead>{t("broadcast.table.title") || "Title"}</TableHead>
                  <TableHead>{t("broadcast.table.status") || "Status"}</TableHead>
                  <TableHead>{t("broadcast.table.sent") || "Sent"}</TableHead>
                  <TableHead>{t("broadcast.table.failed") || "Failed"}</TableHead>
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
                      <TableCell className="font-medium">{broadcast.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
                      </TableCell>
                      <TableCell>{broadcast.successCount}</TableCell>
                      <TableCell>{broadcast.failureCount}</TableCell>
                      <TableCell>{new Date(broadcast.createdAt).toLocaleDateString()}</TableCell>
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
