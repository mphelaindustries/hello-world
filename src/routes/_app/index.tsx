import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, FileStack, PlayCircle, Plus, Send, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageHeader";
import { MobileDetailDialog } from "@/components/app/MobileDetailDialog";
import { DeadlinePill, MatchScore, StatusBadge } from "@/components/app/StatusBadge";
import { daysUntil, formatDate, tenders as mockTenders } from "@/data/mock";
import { getTenders, useLive } from "@/lib/live-data";

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

function Dashboard() {
  const { data: tenders } = useLive("tenders", getTenders, mockTenders);

  const stats = [
    { label: "New Tenders", value: String(tenders.filter((t) => t.status === "NEW").length), trend: "waiting for review", icon: Sparkles },
    { label: "Relevant Tenders", value: String(tenders.filter((t) => t.status === "RELEVANT" || t.status === "REVIEWING").length), trend: "worth pursuing", icon: Target },
    { label: "Active Tenders", value: String(tenders.filter((t) => t.status === "IN PROGRESS" || t.status === "READY").length), trend: "in preparation", icon: FileStack },
    { label: "Submitted", value: String(tenders.filter((t) => t.status === "SUBMITTED" || t.status === "WON").length), trend: "sent to clients", icon: Send },
  ];

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
          <CardContent>
            <div className="divide-y divide-border md:hidden">
              {tenders.slice(0, 6).map((t) => (
                <MobileDetailDialog
                  key={t.id}
                  title={t.name}
                  subtitle={`${t.category} · ${t.location}`}
                  summary={<><StatusBadge status={t.status} /><DeadlinePill days={daysUntil(t.closingDate)} /></>}
                  details={[
                    { label: "Organisation", value: t.organisation },
                    { label: "Closing date", value: formatDate(t.closingDate) },
                    { label: "Status", value: <StatusBadge status={t.status} /> },
                    { label: "Match", value: `${t.match}%` },
                  ]}
                  actions={<Button asChild><Link to="/tenders/$tenderId" params={{ tenderId: t.id }}>Open tender</Link></Button>}
                />
              ))}
            </div>
            <table className="hidden w-full text-sm md:table">
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
