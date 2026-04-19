import { LoaderCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type RouteFallbackProps = {
  title?: string;
  description?: string;
};

function RouteFallback({
  title = "Loading operator surface",
  description = "Preparing the requested page and data-heavy UI modules.",
}: RouteFallbackProps) {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { RouteFallback };
