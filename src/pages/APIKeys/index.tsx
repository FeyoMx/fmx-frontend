import { useTranslation } from "react-i18next";
import { KeyRound, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useTenant } from "@/contexts/TenantContext";

export function APIKeys() {
  const { t } = useTranslation();
  const { tenant } = useTenant();

  const handleRefresh = () => {
    toast.info("The current backend supports tenant API key authentication, but it does not expose API key management endpoints.");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("apiKeys.title") || "API Keys"}</h1>
          <p className="text-gray-600">{tenant?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw size={20} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("apiKeys.list.title") || "API Keys"}</CardTitle>
          <CardDescription>Backend capability status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <KeyRound className="h-4 w-4" />
            <AlertTitle>API key management is not exposed</AlertTitle>
            <AlertDescription>
              The current backend accepts tenant API keys for authentication, but it does not expose `/apikey` management routes. This page stays informational until the backend adds that contract.
            </AlertDescription>
          </Alert>

          <div className="rounded border p-4 text-sm text-muted-foreground">
            <p>Supported today:</p>
            <p>`Authorization: Bearer &lt;access_token&gt;` for user sessions.</p>
            <p>`X-API-Key` or `apikey` for tenant API key authentication when you already have a key.</p>
            <p>Not supported today: listing, creating, or revoking API keys from the SaaS frontend.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
