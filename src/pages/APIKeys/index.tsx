import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Eye, EyeOff, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { apiGlobal } from "@/lib/queries/api";
import { useTenant } from "@/contexts/TenantContext";

interface APIKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
  scopes: string[];
}

export function APIKeys() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    setIsLoading(true);
    try {
      const response = await apiGlobal.get("/apikey");
      setApiKeys(response.data || []);
    } catch (error) {
      toast.error(t("apiKeys.error.fetch") || "Failed to fetch API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error(t("apiKeys.validation.nameRequired") || "Key name is required");
      return;
    }

    try {
      const response = await apiGlobal.post("/apikey", { name: newKeyName });
      setGeneratedKey(response.data.key);
      setNewKeyName("");
      fetchAPIKeys();
      toast.success(t("apiKeys.message.created") || "API key created successfully");
    } catch (error) {
      toast.error(t("apiKeys.error.create") || "Failed to create API key");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!window.confirm(t("apiKeys.confirmation.revoke") || "Are you sure you want to revoke this key?")) {
      return;
    }

    try {
      await apiGlobal.delete(`/apikey/${keyId}`);
      toast.success(t("apiKeys.message.revoked") || "API key revoked successfully");
      fetchAPIKeys();
    } catch (error) {
      toast.error(t("apiKeys.error.revoke") || "Failed to revoke API key");
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copied") || "Copied to clipboard");
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("apiKeys.title") || "API Keys"}</h1>
          <p className="text-gray-600">{tenant?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAPIKeys} variant="outline" size="icon">
            <RefreshCw size={20} />
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={20} className="mr-2" />
            {t("apiKeys.button.create") || "Create Key"}
          </Button>
        </div>
      </div>

      {generatedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">{t("apiKeys.newKey.title") || "Your API Key"}</CardTitle>
            <CardDescription>{t("apiKeys.newKey.description") || "Save this key securely. You won't be able to see it again."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 break-all font-mono text-sm bg-white p-3 rounded border border-green-200">
              {generatedKey}
              <Button
                onClick={() => copyToClipboard(generatedKey)}
                variant="ghost"
                size="sm"
              >
                <Copy size={16} />
              </Button>
            </div>
            <Button
              onClick={() => setGeneratedKey(null)}
              variant="outline"
              className="w-full"
            >
              {t("apiKeys.button.dismiss") || "Dismiss"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("apiKeys.list.title") || "API Keys"}</CardTitle>
          <CardDescription>{apiKeys.length} keys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("apiKeys.table.name") || "Name"}</TableHead>
                  <TableHead>{t("apiKeys.table.key") || "Key"}</TableHead>
                  <TableHead>{t("apiKeys.table.created") || "Created"}</TableHead>
                  <TableHead>{t("apiKeys.table.lastUsed") || "Last Used"}</TableHead>
                  <TableHead>{t("apiKeys.table.actions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t("common.loading") || "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t("apiKeys.noKeys") || "No API keys yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <Button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            variant="ghost"
                            size="sm"
                          >
                            {visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(apiKey.key)}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy size={16} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleRevokeKey(apiKey.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("apiKeys.dialog.create") || "Create API Key"}</DialogTitle>
            <DialogDescription>{t("apiKeys.dialog.description") || "Create a new API key for your application"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("apiKeys.form.name") || "Key Name"}</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={t("apiKeys.form.namePlaceholder") || "e.g., Production API Key"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)} variant="outline">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleCreateKey}>
              {t("apiKeys.button.create") || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
