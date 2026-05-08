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
import { createDefaultTenantAISettings, getTenantAISettings, getInstanceAISettings, updateInstanceAISettings, updateTenantAISettings } from "@/lib/queries/ai/settings";
import { InstanceAISettingsView, TenantAISettingsView } from "@/lib/queries/ai/types";
import { useFetchInstances } from "@/lib/queries/instance/fetchInstances";

type AISettingsStatus = {
  label: "Sin configurar" | "Desactivada" | "Activa" | "Error de configuración";
  variant: "outline" | "secondary" | "default" | "warning";
  title: string;
  description: string;
};

function getAISettingsStatus(settings: TenantAISettingsView): AISettingsStatus {
  const hasProvider = settings.provider.trim().length > 0;
  const hasModel = settings.model.trim().length > 0;

  if (!settings.configured) {
    return {
      label: "Sin configurar",
      variant: "outline",
      title: "IA aún no configurada",
      description: "Configura un proveedor y guarda para activarla.",
    };
  }

  if (settings.enabled && (!hasProvider || !hasModel)) {
    return {
      label: "Error de configuración",
      variant: "warning",
      title: "Configuración incompleta",
      description: "Completa proveedor y modelo antes de depender de respuestas automáticas.",
    };
  }

  if (!settings.enabled) {
    return {
      label: "Desactivada",
      variant: "secondary",
      title: "IA desactivada",
      description: "Los valores del tenant están guardados, pero la IA no está activa.",
    };
  }

  return {
    label: "Activa",
    variant: "default",
    title: "IA activa",
    description: "Las instancias habilitadas pueden usar la configuración guardada del tenant.",
  };
}

export function AISettings() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [aiSettings, setAISettings] = useState<TenantAISettingsView>(createDefaultTenantAISettings);

  const [instanceSettings, setInstanceSettings] = useState<InstanceAISettingsView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { data: instances } = useFetchInstances();
  const settingsStatus = getAISettingsStatus(aiSettings);

  useEffect(() => {
    void fetchSettings();
  }, [instances]);

  const fetchSettings = async () => {
    setIsLoading(true);
    setLoadError(null);
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
      const message = getApiErrorMessage(error, "No se pudieron cargar los ajustes de IA");
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const savedSettings = await updateTenantAISettings({
        ...aiSettings,
        provider: aiSettings.provider.trim(),
        model: aiSettings.model.trim(),
        baseUrl: aiSettings.baseUrl.trim(),
      });
      setAISettings(savedSettings);
      toast.success("Ajustes de IA guardados");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudieron guardar los ajustes de IA"));
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
      toast.error(getApiErrorMessage(error, "No se pudo actualizar la instancia"));
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
        <AlertTitle className="flex flex-wrap items-center gap-2">
          {settingsStatus.title}
          <OperatorStatusBadge variant={settingsStatus.variant}>{settingsStatus.label}</OperatorStatusBadge>
        </AlertTitle>
        <AlertDescription>{settingsStatus.description}</AlertDescription>
      </Alert>

      {loadError ? (
        <Alert variant="warning">
          <AlertTitle>Error de configuración</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{t("aiSettings.tenant.title") || "Tenant AI Configuration"}</CardTitle>
              <CardDescription>{t("aiSettings.tenant.description") || "Configure AI settings for your entire tenant"}</CardDescription>
            </div>
            <OperatorStatusBadge variant={settingsStatus.variant}>{settingsStatus.label}</OperatorStatusBadge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <label className="font-medium">{t("aiSettings.enableAI") || "Enable AI"}</label>
              <p className="text-sm text-muted-foreground">Configura un proveedor y guarda para activarla.</p>
            </div>
            <Switch checked={aiSettings.enabled} onCheckedChange={(checked) => setAISettings({ ...aiSettings, enabled: checked })} disabled={isLoading || isSaving} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Proveedor</label>
              <Input value={aiSettings.provider} onChange={(e) => setAISettings({ ...aiSettings, provider: e.target.value })} placeholder="openai" disabled={isLoading || isSaving} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Modelo</label>
              <Input value={aiSettings.model} onChange={(e) => setAISettings({ ...aiSettings, model: e.target.value })} placeholder="gpt-4o-mini" disabled={isLoading || isSaving} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Base URL</label>
              <Input value={aiSettings.baseUrl} onChange={(e) => setAISettings({ ...aiSettings, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" disabled={isLoading || isSaving} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Respuesta automática del tenant</label>
              <div className="flex h-10 items-center rounded border px-3">
                <Switch checked={aiSettings.autoReply} onCheckedChange={(checked) => setAISettings({ ...aiSettings, autoReply: checked })} disabled={isLoading || isSaving} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prompt del sistema</label>
            <Input value={aiSettings.systemPrompt} onChange={(e) => setAISettings({ ...aiSettings, systemPrompt: e.target.value })} placeholder="Prompt del sistema opcional" disabled={isLoading || isSaving} />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving || isLoading}>
              <Save size={20} className="mr-2" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
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
                        <OperatorStatusBadge variant={aiSettings.configured ? "outline" : "secondary"}>{aiSettings.configured ? instance.model || "Predeterminado del tenant" : "Sin configurar"}</OperatorStatusBadge>
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
