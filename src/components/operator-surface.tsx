import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OperatorStatTileProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
  tone?: string;
  className?: string;
};

function OperatorStatTile({ label, value, detail, icon: Icon, tone = "text-muted-foreground", className }: OperatorStatTileProps) {
  return (
    <div className={cn("rounded-xl border bg-background/85 p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-2 break-words text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        {Icon ? <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} /> : null}
      </div>
      {detail ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

type OperatorEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

function OperatorEmptyState({ title, description, icon: Icon, action, className }: OperatorEmptyStateProps) {
  return (
    <Card className={cn("border-dashed bg-muted/10", className)}>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        {Icon ? <Icon className="h-10 w-10 text-muted-foreground" /> : null}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

type OperatorStatusBadgeProps = {
  children: ReactNode;
  variant?: BadgeProps["variant"];
  icon?: LucideIcon;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "className">;

function OperatorStatusBadge({ children, variant = "outline", icon: Icon, className, ...props }: OperatorStatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn("max-w-full gap-1.5 whitespace-normal break-words py-1 leading-4", className)} {...props}>
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="min-w-0">{children}</span>
    </Badge>
  );
}

function OperatorActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>{children}</div>;
}

function OperatorFullWidthButton({ children, className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn("w-full sm:w-auto", className)} {...props}>
      {children}
    </Button>
  );
}

export { OperatorActionBar, OperatorEmptyState, OperatorFullWidthButton, OperatorStatTile, OperatorStatusBadge };
