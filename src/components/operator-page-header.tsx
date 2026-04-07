import { ReactNode } from "react";

type OperatorPageHeaderProps = {
  title: string;
  description?: string | null;
  actions?: ReactNode;
};

export function OperatorPageHeader({ title, description, actions }: OperatorPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
