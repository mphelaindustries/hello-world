import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, FileStack, PlayCircle, Plus, Send, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageHeader";
import { DeadlinePill, MatchScore, StatusBadge } from "@/components/app/StatusBadge";
import { daysUntil, formatDate, tenders } from "@/data/mock";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard | Tender OS" },
      { name: "description", content: "Track discovered tenders, deadlines and submission progress in one workspace." },
      { property: "og:title", content: "Dashboard | Tender OS" },
      { property: "og:description", content: "Track discovered tenders, deadlines and submission progress in one workspace." },
    ],
  }),
});

const stats = [
  { label: "New Tenders", value: "127", trend: "+18 this week", icon: Sparkles },
  { label: "Relevant Tenders", value: "34", trend: "+7 this week", icon: Target },
  { label: "Active Tenders", value: "8", trend: "3 closing this week", icon: FileStack },
  { label: "Submitted", value: "21", trend: "+4 this month", icon: Send },
];

function Dashboard() {
  const upcoming = tenders
    .filter((t) => daysUntil(t.closingDate) >= 0)
    .sort((a, b) => daysUntil(a.closingDate) - daysUntil(b.closingDate))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Good morning, Lufuno"
        subtitle="Here's what's happening with your tenders today."
        actions={
          <>
            <Button onClick={() => toast.success("Tender added successfully.")}>
              <Plus className="size-4" /> Add Tender
            </Button>
            <Button variant="outline" asChild>
              <Link to="/scraper">
                <PlayCircle className="size-4" /> Run Scraper
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-success">{s.trend}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((t) => (
              <Link
                key={t.id}
                to="/tenders/$tenderId"
                params={{ tenderId: t.id }}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.closingDate)}</p>
                </div>
                <DeadlinePill days={daysUntil(t.closingDate)} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent tenders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tenders">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Tender</th>
                  <th className="pb-2 font-medium">Organisation</th>
                  <th className="pb-2 font-medium">Closing</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Match</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenders.slice(0, 6).map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 pr-3">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} · {t.location}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{t.organisation}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(t.closingDate)}</td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 pr-3">
                      <MatchScore value={t.match} />
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/tenders/$tenderId" params={{ tenderId: t.id }}>
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
