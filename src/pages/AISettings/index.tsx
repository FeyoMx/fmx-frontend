import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

import { OperatorPageHeader } from "@/components/operator-page-header";
import { OperatorStatusBadge } from "@/components/operator-surface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
        ),
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
          <Button onClick={() => void fetchSettings()} variant="outline" size="icon" disabled={isLoading || isSaving} title="Refresh AI settings">
            <RefreshCw size={20} className={isLoading ? "animate-spin" : undefined} />
          </Button>
        }
      />

      <Alert variant="info">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Tenant AI controls are active</AlertTitle>
        <AlertDescription>
          Usa esta pantalla para valores predeterminados del tenant y activación por instancia. Los editores avanzados de bots no están disponibles en esta versión.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t("aiSettings.tenant.title") || "Tenant AI Configuration"}</CardTitle>
          <CardDescription>{t("aiSettings.tenant.description") || "Configure AI settings for your entire tenant"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <label className="font-medium">{t("aiSettings.enableAI") || "Enable AI"}</label>
              <p className="text-sm text-gray-600">{t("aiSettings.enableAIDescription") || "Enable AI features for this tenant"}</p>
            </div>
            <Switch checked={aiSettings.enabled} onCheckedChange={(checked) => setAISettings({ ...aiSettings, enabled: checked })} disabled={isLoading || isSaving} />
          </div>

          {aiSettings.enabled && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <Input value={aiSettings.provider} onChange={(e) => setAISettings({ ...aiSettings, provider: e.target.value })} placeholder="openai" disabled={isSaving} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <Input value={aiSettings.model} onChange={(e) => setAISettings({ ...aiSettings, model: e.target.value })} placeholder="gpt-4o-mini" disabled={isSaving} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Base URL</label>
                  <Input value={aiSettings.baseUrl} onChange={(e) => setAISettings({ ...aiSettings, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" disabled={isSaving} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tenant auto reply</label>
                  <div className="flex h-10 items-center rounded border px-3">
                    <Switch checked={aiSettings.autoReply} onCheckedChange={(checked) => setAISettings({ ...aiSettings, autoReply: checked })} disabled={isSaving} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">System prompt</label>
                  <Input value={aiSettings.systemPrompt} onChange={(e) => setAISettings({ ...aiSettings, systemPrompt: e.target.value })} placeholder="Prompt del sistema opcional" disabled={isSaving} />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving || isLoading}>
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
                      Cargando ajustes de IA...
                    </TableCell>
                  </TableRow>
                ) : instanceSettings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("aiSettings.noInstances") || "No instances are available for per-instance AI settings yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  instanceSettings.map((instance) => (
                    <TableRow key={instance.instanceId}>
                      <TableCell className="font-medium">{instance.instanceName}</TableCell>
                      <TableCell>
                        <OperatorStatusBadge variant="outline">{instance.model || "Predeterminado del tenant"}</OperatorStatusBadge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={instance.enabled} onCheckedChange={(checked) => handleToggleInstance(instance.instanceId, checked, instance.autoReply)} disabled={isSaving || isLoading} />
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
