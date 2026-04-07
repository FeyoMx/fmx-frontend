import { useTranslation } from "react-i18next";
import { KeyRound, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import { OperatorPageHeader } from "@/components/operator-page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
      <OperatorPageHeader
        title={t("apiKeys.title") || "API Keys"}
        description={tenant?.name}
        actions={
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw size={20} />
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{t("apiKeys.list.title") || "API Keys"}</CardTitle>
            <Badge variant="outline">Informational</Badge>
          </div>
          <CardDescription>Authentication support is active, but key management is still backend-gated.</CardDescription>
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
            <p>Supported today: `Authorization: Bearer &lt;access_token&gt;` for user sessions.</p>
            <p>Supported today: `X-API-Key` or `apikey` for tenant API key authentication when you already have a key.</p>
            <p>Not supported today: listing, creating, rotating, or revoking API keys from this SaaS frontend.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
