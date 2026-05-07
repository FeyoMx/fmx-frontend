import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_FEEDBACK_URL = "mailto:soporte@feyomx.com?subject=Feedback%20piloto%20FMX";

function getPilotFeedbackUrl() {
  return import.meta.env.VITE_PILOT_FEEDBACK_URL || DEFAULT_FEEDBACK_URL;
}

type PilotFeedbackCardProps = {
  compact?: boolean;
};

function PilotFeedbackCard({ compact = false }: PilotFeedbackCardProps) {
  return (
    <Card className="border-dashed bg-muted/10">
      <CardContent className={compact ? "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" : "space-y-3 p-4"}>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Ayuda para piloto
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Si algo no coincide con tu operación diaria, comparte pantalla, instancia y qué esperabas ver. Ese feedback ayuda a priorizar el siguiente ajuste.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a href={getPilotFeedbackUrl()} target="_blank" rel="noreferrer">
            Enviar feedback
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export { PilotFeedbackCard, getPilotFeedbackUrl };
