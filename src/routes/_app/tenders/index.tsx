import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter, PlayCircle, Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageHeader";
import { MatchScore, StatusBadge } from "@/components/app/StatusBadge";
import { daysUntil, formatDate, tenders, type TenderStatus } from "@/data/mock";

export const Route = createFileRoute("/_app/tenders/")({
  component: TendersPage,
  head: () => ({
    meta: [
      { title: "Tenders | Tender OS" },
      { name: "description", content: "Search, filter and track every tender opportunity your business is pursuing." },
      { property: "og:title", content: "Tenders | Tender OS" },
      { property: "og:description", content: "Search, filter and track every tender opportunity your business is pursuing." },
    ],
  }),
});

const statuses: (TenderStatus | "ALL")[] = [
  "ALL",
  "NEW",
  "REVIEWING",
  "RELEVANT",
  "IN PROGRESS",
  "READY",
  "SUBMITTED",
  "WON",
  "LOST",
  "ARCHIVED",
];

function TendersPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [province, setProvince] = useState<string>("ALL");
  const [sort, setSort] = useState<string>("closing");

  const categories = useMemo(() => ["ALL", ...new Set(tenders.map((t) => t.category))], []);
  const provinces = useMemo(() => ["ALL", ...new Set(tenders.map((t) => t.location))], []);

  const rows = useMemo(() => {
    const filtered = tenders.filter(
      (t) =>
        (status === "ALL" || t.status === status) &&
        (category === "ALL" || t.category === category) &&
        (province === "ALL" || t.location === province) &&
        (query.trim() === "" ||
          `${t.name} ${t.reference} ${t.organisation}`.toLowerCase().includes(query.toLowerCase())),
    );
    const sorted = [...filtered];
    if (sort === "closing") sorted.sort((a, b) => a.closingDate.localeCompare(b.closingDate));
    if (sort === "newest") sorted.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
    if (sort === "oldest") sorted.sort((a, b) => a.publishedDate.localeCompare(b.publishedDate));
    if (sort === "match") sorted.sort((a, b) => b.match - a.match);
    if (sort === "organisation") sorted.sort((a, b) => a.organisation.localeCompare(b.organisation));
    if (sort === "status") sorted.sort((a, b) => a.status.localeCompare(b.status));
    return sorted;
  }, [query, status, category, province, sort]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Tenders"
        subtitle="Manage and track your tender opportunities."
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

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-6">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenders..." className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s === "ALL" ? "All statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c === "ALL" ? "All categories" : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Province" /></SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>{p === "ALL" ? "All provinces" : p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="size-4" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="closing">Closing date</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="match">Match score</SelectItem>
              <SelectItem value="organisation">Organisation</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.success("Advanced filters applied.")}>
            <Filter className="size-4" /> Filters
          </Button>
          <Button variant="outline" onClick={() => toast.success("Tender list exported.")}>
            <Download className="size-4" /> Export
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium">No tenders found.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try changing your filters or run the scraper.</p>
            </div>
          ) : (
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Tender</th>
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Organisation</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Closing</th>
                  <th className="pb-2 font-medium">Match</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-accent/40">
                    <td className="py-3 pr-3 font-medium">{t.name}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{t.reference}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{t.organisation}</td>
                    <td className="py-3 pr-3">{t.category}</td>
                    <td className="py-3 pr-3">{t.location}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      {formatDate(t.closingDate)}
                      <span className="block text-xs text-muted-foreground">
                        {daysUntil(t.closingDate) >= 0 ? `${daysUntil(t.closingDate)} days left` : "Closed"}
                      </span>
                    </td>
                    <td className="py-3 pr-3"><MatchScore value={t.match} /></td>
                    <td className="py-3 pr-3"><StatusBadge status={t.status} /></td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/tenders/$tenderId" params={{ tenderId: t.id }}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Showing {rows.length} of {tenders.length} tenders</p>
    </div>
  );
}
