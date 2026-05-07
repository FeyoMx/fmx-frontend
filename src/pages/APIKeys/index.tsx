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
    toast.info("Gestión de llaves API: próximamente.");
  };

  return (
    <div className="space-y-4 p-4">
      <OperatorPageHeader
        title={t("apiKeys.title") || "API Keys"}
        description={tenant?.name ? `${tenant.name} - Próximamente` : "Próximamente"}
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
            <Badge variant="outline">Próximamente</Badge>
          </div>
          <CardDescription>Esta pantalla queda disponible solo como referencia. La creación y rotación de llaves no está disponible en esta versión.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <KeyRound className="h-4 w-4" />
            <AlertTitle>No disponible en esta versión</AlertTitle>
            <AlertDescription>
              Las sesiones de operador funcionan con inicio de sesión. La administración de llaves API se habilitará cuando el producto la exponga de forma completa.
            </AlertDescription>
          </Alert>

          <div className="rounded border p-4 text-sm text-muted-foreground">
            <p>Disponible: inicio de sesión y sesión de operador.</p>
            <p>En proceso: listar, crear, rotar o revocar llaves API desde FMX.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
