import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

import { OperatorPageHeader } from "@/components/operator-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useTenant } from "@/contexts/TenantContext";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { getTenantAISettings, getInstanceAISettings, updateInstanceAISettings, updateTenantAISettings } from "@/lib/queries/ai/settings";
import { InstanceAISettingsView, TenantAISettingsView } from "@/lib/queries/ai/types";
import { useFetchInstances } from "@/lib/queries/instance/fetchInstances";

export function AISettings() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [aiSettings, setAISettings] = useState<TenantAISettingsView>({
    enabled: false,
    autoReply: false,
    provider: "openai",
    model: "",
    baseUrl: "",
    systemPrompt: "",
  });

  const [instanceSettings, setInstanceSettings] = useState<InstanceAISettingsView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { data: instances } = useFetchInstances();

  useEffect(() => {
    void fetchSettings();
  }, [instances]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const tenantSettings = await getTenantAISettings();
      const perInstance = await Promise.all(
        (instances ?? []).map(async (instance) => {
          const settings = await getInstanceAISettings(instance.id);
          return {
            instanceId: instance.id,
            instanceName: instance.name,
            enabled: settings.enabled,
            autoReply: settings.auto_reply,
            model: tenantSettings.model || "tenant default",
          } satisfies InstanceAISettingsView;
        }),
      );

      setAISettings(tenantSettings);
      setInstanceSettings(perInstance);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("aiSettings.error.fetch") || "Failed to fetch AI settings"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateTenantAISettings(aiSettings);
      toast.success(t("aiSettings.message.saved") || "AI settings saved successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("aiSettings.error.save") || "Failed to save AI settings"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleInstance = async (instanceId: string, enabled: boolean, autoReply: boolean) => {
    try {
      await updateInstanceAISettings(instanceId, enabled, autoReply);
      setInstanceSettings((prev) =>
        prev.map((inst) =>
          inst.instanceId === instanceId
            ? { ...inst, enabled }
            : inst
        )
      );
      toast.success(t("aiSettings.message.updated") || "Instance settings updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("aiSettings.error.updateInstance") || "Failed to update instance settings"));
    }
  };

  return (
    <div className="space-y-4 p-4">
      <OperatorPageHeader
        title={t("aiSettings.title") || "AI Settings"}
        description={tenant?.name}
        actions={
          <Button onClick={() => void fetchSettings()} variant="outline" size="icon">
            <RefreshCw size={20} />
          </Button>
        }
      />

      <Alert variant="info">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Tenant AI controls are active</AlertTitle>
        <AlertDescription>
          Use this page for tenant defaults and per-instance enablement. Legacy bot and integration CRUD flows remain intentionally outside the primary MVP operator path.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t("aiSettings.tenant.title") || "Tenant AI Configuration"}</CardTitle>
          <CardDescription>{t("aiSettings.tenant.description") || "Configure AI settings for your entire tenant"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div>
              <label className="font-medium">{t("aiSettings.enableAI") || "Enable AI"}</label>
              <p className="text-sm text-gray-600">{t("aiSettings.enableAIDescription") || "Enable AI features for this tenant"}</p>
            </div>
            <Switch checked={aiSettings.enabled} onCheckedChange={(checked) => setAISettings({ ...aiSettings, enabled: checked })} />
          </div>

          {aiSettings.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <Input value={aiSettings.provider} onChange={(e) => setAISettings({ ...aiSettings, provider: e.target.value })} placeholder="openai" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <Input value={aiSettings.model} onChange={(e) => setAISettings({ ...aiSettings, model: e.target.value })} placeholder="gpt-4o-mini" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Base URL</label>
                  <Input value={aiSettings.baseUrl} onChange={(e) => setAISettings({ ...aiSettings, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tenant auto reply</label>
                  <div className="flex h-10 items-center rounded border px-3">
                    <Switch checked={aiSettings.autoReply} onCheckedChange={(checked) => setAISettings({ ...aiSettings, autoReply: checked })} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">System prompt</label>
                <Input value={aiSettings.systemPrompt} onChange={(e) => setAISettings({ ...aiSettings, systemPrompt: e.target.value })} placeholder="Optional system prompt" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  <Save size={20} className="mr-2" />
                  {isSaving ? t("common.saving") || "Saving..." : t("common.save") || "Save"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("aiSettings.instances.title") || "Instance AI Settings"}</CardTitle>
          <CardDescription>{t("aiSettings.instances.description") || "Enable or disable AI for individual instances"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("aiSettings.table.instance") || "Instance"}</TableHead>
                  <TableHead>{t("aiSettings.table.model") || "Model"}</TableHead>
                  <TableHead>{t("aiSettings.table.enabled") || "Enabled"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("common.loading") || "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : instanceSettings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("aiSettings.noInstances") || "No instances found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  instanceSettings.map((instance) => (
                    <TableRow key={instance.instanceId}>
                      <TableCell className="font-medium">{instance.instanceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{instance.model || "Tenant default"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={instance.enabled} onCheckedChange={(checked) => handleToggleInstance(instance.instanceId, checked, instance.autoReply)} />
                      </TableCell>
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
