import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { apiGlobal } from "@/lib/queries/api";
import { useTenant } from "@/contexts/TenantContext";

interface AISettings {
  tenantEnabled: boolean;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface InstanceAISettings {
  instanceId: string;
  instanceName: string;
  enabled: boolean;
  model: string;
}

export function AISettings() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [aiSettings, setAISettings] = useState<AISettings>({
    tenantEnabled: false,
    apiKey: "",
    model: "gpt-4",
    maxTokens: 2000,
    temperature: 0.7,
  });

  const [instanceSettings, setInstanceSettings] = useState<InstanceAISettings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiGlobal.get("/ai/settings");
      setAISettings(response.data.tenant || aiSettings);
      setInstanceSettings(response.data.instances || []);
    } catch (error) {
      toast.error(t("aiSettings.error.fetch") || "Failed to fetch AI settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiGlobal.put("/ai/settings", aiSettings);
      toast.success(t("aiSettings.message.saved") || "AI settings saved successfully");
    } catch (error) {
      toast.error(t("aiSettings.error.save") || "Failed to save AI settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleInstance = async (instanceId: string, enabled: boolean) => {
    try {
      await apiGlobal.put(`/ai/instance/${instanceId}`, { enabled });
      setInstanceSettings((prev) =>
        prev.map((inst) =>
          inst.instanceId === instanceId
            ? { ...inst, enabled }
            : inst
        )
      );
      toast.success(t("aiSettings.message.updated") || "Instance settings updated");
    } catch (error) {
      toast.error(t("aiSettings.error.updateInstance") || "Failed to update instance settings");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("aiSettings.title") || "AI Settings"}</h1>
          <p className="text-gray-600">{tenant?.name}</p>
        </div>
        <Button onClick={fetchSettings} variant="outline" size="icon">
          <RefreshCw size={20} />
        </Button>
      </div>

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
            <Switch checked={aiSettings.tenantEnabled} onCheckedChange={(checked) => setAISettings({ ...aiSettings, tenantEnabled: checked })} />
          </div>

          {aiSettings.tenantEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">{t("aiSettings.apiKey") || "API Key"}</label>
                <Input
                  type="password"
                  value={aiSettings.apiKey}
                  onChange={(e) => setAISettings({ ...aiSettings, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("aiSettings.model") || "Model"}</label>
                <select value={aiSettings.model} onChange={(e) => setAISettings({ ...aiSettings, model: e.target.value })} className="w-full rounded border p-2">
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("aiSettings.maxTokens") || "Max Tokens"}</label>
                  <Input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) => setAISettings({ ...aiSettings, maxTokens: parseInt(e.target.value) || 0 })}
                    min={1}
                    max={4000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("aiSettings.temperature") || "Temperature"}</label>
                  <Input
                    type="number"
                    value={aiSettings.temperature}
                    onChange={(e) => setAISettings({ ...aiSettings, temperature: parseFloat(e.target.value) || 0.7 })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
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
                        <Badge variant="outline">{instance.model || "default"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={instance.enabled}
                          onCheckedChange={(checked) => handleToggleInstance(instance.instanceId, checked)}
                        />
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
