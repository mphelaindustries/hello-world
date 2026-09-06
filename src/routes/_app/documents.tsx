import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/PageHeader";
import { companyDocuments as mockDocuments } from "@/data/mock";
import { getCompanyDocuments, useLive } from "@/lib/live-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/documents")({
  component: Documents,
  head: () => ({
    meta: [
      { title: "Document Vault | Tender OS" },
      { name: "description", content: "Store, categorise and attach company compliance documents to tenders." },
      { property: "og:title", content: "Document Vault | Tender OS" },
      { property: "og:description", content: "Store, categorise and attach company compliance documents to tenders." },
    ],
  }),
});

function Documents() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const { data: companyDocuments } = useLive("documents", getCompanyDocuments, mockDocuments);
  const categories = useMemo(() => ["All", ...new Set(companyDocuments.map((d) => d.category))], [companyDocuments]);

  const docs = companyDocuments.filter(
    (d) =>
      (category === "All" || d.category === category) &&
      d.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Document Vault"
        subtitle="All reusable company documents in one place."
        actions={
          <Button onClick={() => toast.success("Document uploaded.")}>
            <Upload className="size-4" /> Upload Document
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {docs.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No documents found. Try changing your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.category} · {d.size}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uploaded {d.uploaded}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-medium",
                      d.status === "Valid" && "border-success/30 bg-success/10 text-success",
                      d.status === "Expiring soon" && "border-warning/40 bg-warning/15 text-warning-foreground",
                      d.status === "Expired" && "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                  >
                    {d.status}
                  </span>
                </div>
                {d.expires ? <p className="text-xs text-muted-foreground">Expires {d.expires}</p> : null}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("Opening preview.")}>Preview</Button>
                  <Button size="sm" className="flex-1" onClick={() => toast.success("Document attached to tender.")}>Attach</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
