import { cn } from "@/lib/utils";
import type { RequirementStatus, TenderStatus } from "@/data/mock";

const tenderTone: Record<TenderStatus, string> = {
  NEW: "bg-info/10 text-info border-info/30",
  REVIEWING: "bg-muted text-muted-foreground border-border",
  RELEVANT: "bg-primary/10 text-primary border-primary/30",
  "IN PROGRESS": "bg-warning/15 text-warning-foreground border-warning/40",
  READY: "bg-success/10 text-success border-success/30",
  SUBMITTED: "bg-primary/15 text-primary border-primary/40",
  WON: "bg-success/15 text-success border-success/40",
  LOST: "bg-destructive/10 text-destructive border-destructive/30",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

const reqTone: Record<RequirementStatus, string> = {
  COMPLETED: "bg-success/10 text-success border-success/30",
  MISSING: "bg-destructive/10 text-destructive border-destructive/30",
  REVIEW: "bg-warning/15 text-warning-foreground border-warning/40",
  "NOT REQUIRED": "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  status,
  className,
}: {
  status: TenderStatus | RequirementStatus;
  className?: string;
}) {
  const tone =
    (tenderTone as Record<string, string>)[status] ??
    (reqTone as Record<string, string>)[status] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
        tone,
        className,
      )}
    >
      {status}
    </span>
  );
}

export function DeadlinePill({ days }: { days: number }) {
  const tone =
    days < 3
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : days <= 7
        ? "bg-warning/15 text-warning-foreground border-warning/40"
        : "bg-success/10 text-success border-success/30";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", tone)}>
      {days < 0 ? "Closed" : days === 0 ? "Today" : `${days} days`}
    </span>
  );
}

export function MatchScore({ value }: { value: number }) {
  const tone = value >= 85 ? "text-success" : value >= 70 ? "text-warning-foreground" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", value >= 85 ? "bg-success" : value >= 70 ? "bg-warning" : "bg-muted-foreground")}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", tone)}>{value}%</span>
    </div>
  );
}
