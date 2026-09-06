import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Building2, CalendarDays, Download, FileText, MapPin, Paperclip, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/PageHeader";
import { MobileDetailDialog } from "@/components/app/MobileDetailDialog";
import { DeadlinePill, MatchScore, StatusBadge } from "@/components/app/StatusBadge";
import { company, companyDocuments, daysUntil, experience, formatDate, tenders } from "@/data/mock";

export const Route = createFileRoute("/_app/tenders/$tenderId")({
  component: TenderWorkspace,
  loader: ({ params }) => {
    const tender = tenders.find((t) => t.id === params.tenderId);
    if (!tender) throw notFound();
    return tender;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Tender"} | Tender OS` },
      { name: "description", content: `Tender workspace for ${loaderData?.name ?? "this tender"} — requirements, documents, pricing and submission.` },
      { property: "og:title", content: `${loaderData?.name ?? "Tender"} | Tender OS` },
      { property: "og:description", content: `Tender workspace for ${loaderData?.name ?? "this tender"}.` },
    ],
  }),
});

function TenderWorkspace() {
  const tender = Route.useLoaderData();
  const completed = tender.requirements.filter((r) => r.status === "COMPLETED").length;
  const total = tender.requirements.length;
  const pct = Math.round((completed / total) * 100);
  const missing = tender.requirements.filter((r) => r.status !== "COMPLETED");

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/tenders"><ArrowLeft className="size-4" /> Back to tenders</Link>
      </Button>

      <PageHeader
        title={tender.name}
        subtitle={`${tender.reference} · ${tender.organisation}`}
        actions={
          <>
            <StatusBadge status={tender.status} />
            <Button variant="outline" onClick={() => toast.success("Tender progress saved.")}>Save Progress</Button>
            <Button asChild><Link to="/filler">Open Tender Filler</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile icon={<CalendarDays className="size-4" />} label="Closing date" value={formatDate(tender.closingDate)} extra={<DeadlinePill days={daysUntil(tender.closingDate)} />} />
        <InfoTile icon={<Building2 className="size-4" />} label="Organisation" value={tender.organisation} />
        <InfoTile icon={<MapPin className="size-4" />} label="Location" value={tender.location} />
        <InfoTile icon={<FileText className="size-4" />} label="Estimated value" value={tender.value} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tender completion — {pct}%</span>
              <span className="text-muted-foreground">{completed} of {total} requirements completed</span>
            </div>
            <Progress value={pct} className="mt-2" />
          </div>
          <MatchScore value={tender.match} />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid h-auto w-full grid-cols-2 justify-start sm:flex sm:flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="company">Company Information</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="submission">Submission</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Tender information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{tender.description}</p>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Reference", tender.reference],
                  ["Organisation", tender.organisation],
                  ["Category", tender.category],
                  ["Location", tender.location],
                  ["Published", formatDate(tender.publishedDate)],
                  ["Closing", formatDate(tender.closingDate)],
                  ["Contact person", tender.contact],
                  ["Contact email", tender.contactEmail],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border p-3">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Why this matches</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tender.matchReasons.map((r) => (
                <p key={r} className="text-sm">✓ {r}</p>
              ))}
              <div className="pt-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</p>
                <p className="mt-1 text-sm">{missing.length} requirements still open</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardContent className="pt-2 md:pt-6">
              <div className="divide-y divide-border md:hidden">
                {tender.requirements.map((r) => (
                  <MobileDetailDialog
                    key={r.id}
                    title={r.name}
                    subtitle={r.category}
                    summary={<StatusBadge status={r.status} />}
                    details={[
                      { label: "Category", value: r.category },
                      { label: "Document", value: r.attachedDocument ?? "Not attached" },
                      { label: "Status", value: <StatusBadge status={r.status} /> },
                    ]}
                    actions={<Button onClick={() => toast.success("Document attached to tender.")}><Paperclip className="size-4" /> {r.attachedDocument ? "Replace document" : "Attach document"}</Button>}
                  />
                ))}
              </div>
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Requirement</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Attached document</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tender.requirements.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-3 font-medium">{r.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{r.category}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{r.attachedDocument ?? "—"}</td>
                      <td className="py-3 pr-3"><StatusBadge status={r.status} /></td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toast.success("Document attached to tender.")}>
                          <Paperclip className="size-4" /> {r.attachedDocument ? "Replace" : "Attach"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tender documents</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tender.tenderDocuments.map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.size}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toast.success("Download started.")}>
                    <Download className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Attached company documents</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {companyDocuments.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.category} · {d.size}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toast.success("Document removed.")}>Remove</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/documents"><Upload className="size-4" /> Attach from Document Vault</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="mt-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              {["SBD 1 — Invitation to Bid", "SBD 4 — Declaration of Interest", "SBD 6.1 — Preference Points Claim", "Pricing Schedule"].map((f) => (
                <div key={f} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{f}</p>
                  <Button size="sm" variant="outline" asChild><Link to="/filler">Fill in</Link></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Company information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">✓ Information pulled from Company Profile</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Company Name", company.name],
                  ["Registration Number", company.registrationNumber],
                  ["VAT Number", company.vatNumber],
                  ["Address", company.physicalAddress],
                  ["Contact Person", company.contactPerson],
                  ["Email", company.email],
                ].map(([k, v]) => (
                  <div key={k} className="space-y-1.5">
                    <Label>{k}</Label>
                    <Input defaultValue={v} />
                  </div>
                ))}
              </div>
              <Button onClick={() => toast.success("Tender progress saved.")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardContent className="pt-2 md:pt-6">
              <div className="divide-y divide-border md:hidden">
                {[
                  ["Site establishment", "1", "Sum", "R 420 000", "R 420 000"],
                  ["Earthworks", "1 800", "m³", "R 240", "R 432 000"],
                  ["Structural works", "1", "Sum", "R 6 100 000", "R 6 100 000"],
                  ["Finishes", "600", "m²", "R 2 400", "R 1 440 000"],
                  ["External works", "1", "Sum", "R 1 980 000", "R 1 980 000"],
                ].map((row) => (
                  <MobileDetailDialog
                    key={row[0]}
                    title={row[0]}
                    subtitle={row[4]}
                    details={[
                      { label: "Quantity", value: row[1] },
                      { label: "Unit", value: row[2] },
                      { label: "Rate", value: row[3] },
                      { label: "Amount", value: row[4] },
                    ]}
                  />
                ))}
                <div className="flex justify-between px-4 py-4 text-sm font-semibold"><span>Total (excl. VAT)</span><span>R 10 372 000</span></div>
              </div>
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Unit</th>
                    <th className="pb-2 font-medium">Rate</th>
                    <th className="pb-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Site establishment", "1", "Sum", "R 420 000", "R 420 000"],
                    ["Earthworks", "1 800", "m³", "R 240", "R 432 000"],
                    ["Structural works", "1", "Sum", "R 6 100 000", "R 6 100 000"],
                    ["Finishes", "600", "m²", "R 2 400", "R 1 440 000"],
                    ["External works", "1", "Sum", "R 1 980 000", "R 1 980 000"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) => (
                        <td key={i} className={i === 0 ? "py-3 pr-3 font-medium" : "py-3 pr-3 tabular-nums"}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-3">Total (excl. VAT)</td>
                    <td colSpan={3} />
                    <td className="py-3 tabular-nums">R 10 372 000</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Email timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tender.emails.length === 0 ? (
                <p className="text-sm text-muted-foreground">No emails yet for this tender.</p>
              ) : (
                tender.emails.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{e.subject}</p>
                    <p className="text-xs text-muted-foreground">{e.date} — {e.from} — {e.time}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Quick reply</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input defaultValue={tender.contactEmail} />
              <Input defaultValue={`Tender Submission — ${tender.reference}`} />
              <Textarea rows={6} defaultValue={`Dear ${tender.contact},\n\nPlease find attached our submission for ${tender.reference}.\n\nKind regards,\nLufuno Mphela`} />
              <Button onClick={() => toast.success("Email sent successfully.")}><Send className="size-4" /> Send</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submission" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-sm font-semibold">Submission checklist</h3>
              <ul className="space-y-2">
                {["Company Information", "Compliance Documents", "Project Experience", "Technical Information", "Pricing", "Declarations"].map((item, i) => (
                  <li key={item} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <span>{item}</span>
                    <span className={i < 4 ? "text-success" : "text-warning-foreground"}>{i < 4 ? "✓ Complete" : "In progress"}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">{completed} / {total} requirements completed</p>
              <Button onClick={() => toast.success("Submission package prepared.")}>Prepare submission package</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              {tender.activity.map((a) => (
                <div key={a.text} className="flex gap-3 border-l-2 border-primary/30 pl-3">
                  <span className="text-xs text-muted-foreground">{a.date}</span>
                  <span className="text-sm">{a.text}</span>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                Reusable experience on file: {experience.length} projects
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoTile({ icon, label, value, extra }: { icon: React.ReactNode; label: string; value: string; extra?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {icon} {label}
        </div>
        <p className="mt-1 text-sm font-semibold">{value}</p>
        {extra ? <div className="mt-2">{extra}</div> : null}
      </CardContent>
    </Card>
  );
}
