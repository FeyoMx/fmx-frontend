import { ReactNode } from "react";

type OperatorPageHeaderProps = {
  title: string;
  description?: string | null;
  actions?: ReactNode;
};

export function OperatorPageHeader({ title, description, actions }: OperatorPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">{actions}</div> : null}
    </div>
  );
}
