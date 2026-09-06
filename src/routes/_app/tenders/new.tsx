import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageHeader";
import { MatchScore } from "@/components/app/StatusBadge";
import { formatDate, tenders as mockTenders } from "@/data/mock";
import { getTenders, isFirebaseConfigured, setTenderStatus, useLive } from "@/lib/live-data";

export const Route = createFileRoute("/_app/tenders/new")({
  component: NewTenders,
  head: () => ({
    meta: [
      { title: "New Tenders | Tender OS" },
      { name: "description", content: "Review newly discovered tenders and mark them as relevant or ignore them." },
      { property: "og:title", content: "New Tenders | Tender OS" },
      { property: "og:description", content: "Review newly discovered tenders and mark them as relevant or ignore them." },
    ],
  }),
});

function NewTenders() {
  const [handled, setHandled] = useState<Record<string, string>>({});
  const { data: tenders, refresh } = useLive("tenders", getTenders, mockTenders);
  const list = tenders.filter((t) => t.status === "NEW");

  const mark = (id: string, status: "RELEVANT" | "ARCHIVED", message: string) => {
    setHandled((h) => ({ ...h, [id]: message }));
    if (isFirebaseConfigured) {
      setTenderStatus(id, status)
        .then(() => refresh())
        .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Could not update the tender."));
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader title="New Tenders" subtitle="Review tenders discovered by the scraper." />
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new tenders. Try running the scraper.</p>
      ) : (
        list.map((t) => (
          <Card key={t.id}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{t.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t.reference} · {t.organisation} · {t.location} · Closes {formatDate(t.closingDate)}
                  </p>
                </div>
                <MatchScore value={t.match} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this matches</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {t.matchReasons.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-success" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {handled[t.id] ? (
                  <span className="text-sm font-medium text-muted-foreground">{handled[t.id]}</span>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        mark(t.id, "RELEVANT", "Added to relevant tenders.");
                        toast.success("Tender marked as relevant.");
                      }}
                    >
                      <Check className="size-4" /> Add to Relevant
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        mark(t.id, "ARCHIVED", "Ignored.");
                        toast.success("Tender ignored.");
                      }}
                    >
                      <X className="size-4" /> Ignore
                    </Button>
                  </>
                )}
                <Button variant="ghost" asChild>
                  <Link to="/tenders/$tenderId" params={{ tenderId: t.id }}>View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
