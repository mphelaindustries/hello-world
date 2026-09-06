import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MobileDetailDialog({
  title,
  subtitle,
  summary,
  details,
  actions,
}: {
  title: string;
  subtitle?: string;
  summary?: ReactNode;
  details: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start rounded-none px-4 py-4 text-left">
          <span className="min-w-0 flex-1">
            <span className="block whitespace-normal text-sm font-medium leading-snug">{title}</span>
            {subtitle ? <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">{subtitle}</span> : null}
            {summary ? <span className="mt-2 flex flex-wrap items-center gap-2">{summary}</span> : null}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg p-5 sm:max-w-md">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="leading-snug">{title}</DialogTitle>
          {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
        </DialogHeader>
        <dl className="divide-y divide-border border-y border-border">
          {details.map((detail) => (
            <div key={detail.label} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 py-3 text-sm">
              <dt className="text-muted-foreground">{detail.label}</dt>
              <dd className="min-w-0 break-words text-right font-medium">{detail.value}</dd>
            </div>
          ))}
        </dl>
        {actions ? <div className="flex flex-col gap-2 [&>*]:w-full">{actions}</div> : null}
      </DialogContent>
    </Dialog>
  );
}