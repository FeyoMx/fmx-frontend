import { AlertCircle, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function OperatorErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <Alert variant="warning" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{description}</p>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function OperatorLoadingBlock({
  title = "Loading",
  description = "Keeping the layout steady while the backend responds.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        <div className="space-y-1">
          <div className="font-medium">{title}</div>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-3 rounded-full bg-muted/80", className)} />;
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 rounded-2xl border p-4", className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="w-2/3" />
          <SkeletonLine className="w-1/2" />
        </div>
      </div>
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-5/6" />
    </div>
  );
}

function SkeletonTableRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="p-4">
              <SkeletonLine className={columnIndex === 0 ? "w-4/5" : "w-2/3"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export { OperatorErrorState, OperatorLoadingBlock, SkeletonCard, SkeletonLine, SkeletonTableRows };
