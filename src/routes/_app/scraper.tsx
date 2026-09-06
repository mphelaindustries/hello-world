import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/app/PageHeader";
import { scraperRuns, scraperSources } from "@/data/mock";

export const Route = createFileRoute("/_app/scraper")({
  component: Scraper,
  head: () => ({
    meta: [
      { title: "Scraper | Tender OS" },
      { name: "description", content: "Monitor tender discovery sources and run a scan for newly published opportunities." },
      { property: "og:title", content: "Scraper | Tender OS" },
      { property: "og:description", content: "Monitor tender discovery sources and run a scan for new opportunities." },
    ],
  }),
});

function Scraper() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const run = () => {
    setRunning(true);
    setDone(false);
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (timer.current) clearInterval(timer.current);
          setRunning(false);
          setDone(true);
          toast.success("Scraping complete — 31 new tenders discovered.");
          return 100;
        }
        return p + 5;
      });
    }, 180);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeader
        title="Scraper"
        subtitle="Tender discovery sources and run history."
        actions={<Button onClick={run} disabled={running}><PlayCircle className="size-4" /> {running ? "Running..." : "Run Scraper"}</Button>}
      />

      {(running || done) && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{running ? "Scanning sources..." : "Scraping complete — 31 new tenders discovered."}</span>
              <span className="tabular-nums text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
            {done && <Button variant="outline" asChild><Link to="/tenders/new">View New Tenders</Link></Button>}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Sources</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {scraperSources.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Last run {s.lastRun} · {s.found} tenders</p>
                </div>
                <span className={s.status === "Active" ? "text-xs font-medium text-success" : "text-xs font-medium text-muted-foreground"}>
                  {s.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Run history</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {scraperRuns.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{r.date}</p>
                  <p className="text-xs text-muted-foreground">{r.duration} · {r.found} found · {r.relevant} relevant</p>
                </div>
                <span className="text-xs font-medium text-success">{r.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
