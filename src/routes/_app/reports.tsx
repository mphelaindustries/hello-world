import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_app/reports")({
  component: Reports,
  head: () => ({
    meta: [
      { title: "Reports | Tender OS" },
      { name: "description", content: "Tender pipeline performance: discovered, submitted, won and lost with success rate." },
      { property: "og:title", content: "Reports | Tender OS" },
      { property: "og:description", content: "Tender pipeline performance: discovered, submitted, won and lost." },
    ],
  }),
});

const stats = [
  { label: "Tenders Found", value: "127" },
  { label: "Relevant", value: "34" },
  { label: "Submitted", value: "21" },
  { label: "Won", value: "8" },
  { label: "Lost", value: "5" },
  { label: "Success Rate", value: "38%" },
];

const monthly = [
  { month: "Apr", found: 82, submitted: 12 },
  { month: "May", found: 96, submitted: 15 },
  { month: "Jun", found: 104, submitted: 14 },
  { month: "Jul", found: 118, submitted: 19 },
  { month: "Aug", found: 121, submitted: 18 },
  { month: "Sep", found: 127, submitted: 21 },
];

const categories = [
  { name: "Construction", share: 42 },
  { name: "Civil Engineering", share: 26 },
  { name: "Maintenance", share: 18 },
  { name: "Electrical", share: 9 },
  { name: "Security", share: 5 },
];

function Reports() {
  const max = Math.max(...monthly.map((m) => m.found));
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeader title="Reports" subtitle="How your tender pipeline is performing." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tenders found vs submitted</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-4">
              {monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end justify-center gap-1">
                    <div className="w-1/3 rounded-t bg-primary" style={{ height: `${(m.found / max) * 100}%` }} />
                    <div className="w-1/3 rounded-t bg-success" style={{ height: `${(m.submitted / max) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Found</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" /> Submitted</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tenders by category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {categories.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">{c.share}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.share}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
