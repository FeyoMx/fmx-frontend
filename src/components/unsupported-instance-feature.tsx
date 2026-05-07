import { Link, useLocation, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { NOT_IMPLEMENTED_MESSAGE } from "@/lib/queries/errors";

const formatFeatureName = (path: string) =>
  path
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[-:]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (match) => match.toUpperCase()) ?? "This feature";

type UnsupportedInstanceFeatureProps = {
  description?: string;
  title?: string;
};

function UnsupportedInstanceFeature({
  description,
  title = "No disponible en esta versión",
}: UnsupportedInstanceFeatureProps) {
  const { instanceId } = useParams<{ instanceId: string }>();
  const location = useLocation();
  const featureName = formatFeatureName(location.pathname);
  const safePath = instanceId ? `/manager/instance/${instanceId}/dashboard` : "/manager";
  const primaryCta = instanceId ? "Volver al panel de la instancia" : "Volver al panel principal";
  const resolvedDescription =
    description ?? `${featureName} no está disponible para operación diaria en esta versión.`;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {description
              ? NOT_IMPLEMENTED_MESSAGE
              : "Conservamos este acceso directo para que marcadores antiguos terminen en una pantalla segura."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={safePath}>{primaryCta}</Link>
            </Button>
            {instanceId ? (
              <Button asChild variant="outline">
                <Link to="/manager">Panel principal</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { UnsupportedInstanceFeature };
