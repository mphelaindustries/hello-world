import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="grid grid-cols-1 gap-2 min-[420px]:flex min-[420px]:flex-wrap sm:justify-end [&>*]:w-full min-[420px]:[&>*]:w-auto">{actions}</div> : null}
    </div>
  );
}
