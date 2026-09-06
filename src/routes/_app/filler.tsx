import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageHeader";
import { company as mockCompany, companyDocuments as mockDocuments, experience as mockExperience, tenders as mockTenders } from "@/data/mock";
import {
  getCompanyDocuments, getCompanyProfile, getTenderDraft, isFirebaseConfigured,
  saveTenderDraft, useLive,
} from "@/lib/live-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/filler")({
  component: TenderFiller,
  validateSearch: (search: Record<string, unknown>) => ({
    tender: typeof search["tender"] === "string" ? (search["tender"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tender Filler | Tender OS" },
      { name: "description", content: "Complete a tender step by step: company info, compliance, experience, pricing and declarations." },
      { property: "og:title", content: "Tender Filler | Tender OS" },
      { property: "og:description", content: "Complete a tender step by step, from company info to final review." },
    ],
  }),
});

const steps = ["Company Information", "Compliance", "Experience", "Technical", "Pricing", "Declarations", "Final Review"];

function TenderFiller() {
  const { tender: tenderParam } = Route.useSearch();
  const tenderId = tenderParam ?? mockTenders[0]!.id;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { data: profile } = useLive("company", getCompanyProfile, {
    company: mockCompany,
    directors: [],
    certifications: [],
    experience: mockExperience,
  });
  const { data: documents } = useLive("documents", getCompanyDocuments, mockDocuments);
  const company = profile.company;
  const experience = profile.experience;
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    [experience[0]?.id, experience[2]?.id].filter(Boolean) as string[],
  );

  useEffect(() => {
    let active = true;
    void getTenderDraft(tenderId).then((draft) => {
      if (!active || !draft) return;
      if (Array.isArray(draft["selectedProjects"])) setSelectedProjects(draft["selectedProjects"] as string[]);
      if (typeof draft["step"] === "number") setStep(draft["step"] as number);
      if (draft["answers"] && typeof draft["answers"] === "object") {
        setAnswers(draft["answers"] as Record<string, string>);
      }
    });
    return () => { active = false; };
  }, [tenderId]);

  const answer = (key: string, fallback: string) => answers[key] ?? fallback;
  const setAnswer = (key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value }));

  const saveDraft = async (nextStep = step) => {
    if (!isFirebaseConfigured) {
      toast.error("Not saved — connect the backend first so answers can be stored.");
      return;
    }
    setSaving(true);
    try {
      await saveTenderDraft(tenderId, { step: nextStep, selectedProjects, answers });
      toast.success("Tender progress saved.");
    } catch {
      toast.error("Could not save your progress.");
    } finally {
      setSaving(false);
    }
  };

  const compliance = [
    { name: "CIPC Registration", doc: documents.find((d) => d.name.toLowerCase().includes("cipc"))?.name ?? "CIPC.pdf", ok: true },
    { name: "Tax Compliance", doc: documents.find((d) => d.name.toLowerCase().includes("tax"))?.name ?? "Tax-Compliance.pdf", ok: true },
    { name: "B-BBEE", doc: documents.find((d) => d.name.toLowerCase().includes("bbbee"))?.name ?? "B-BBEE.pdf", ok: true },
    { name: "Bank Confirmation", doc: documents.find((d) => d.name.toLowerCase().includes("bank"))?.name ?? "Bank-Confirmation.pdf", ok: true },
    { name: "COIDA", doc: documents.find((d) => d.name.toLowerCase().includes("coida"))?.name ?? "Missing", ok: false },
  ];

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader
        title="Tender Filler"
        subtitle="Construction of Community Hall — DPW-2026-001"
        actions={<Button variant="outline" disabled={saving} onClick={() => void saveDraft()}>{saving ? "Saving…" : "Save Progress"}</Button>}
      />

      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              i === step ? "border-primary bg-primary text-primary-foreground" : i < step ? "border-success/40 bg-success/10 text-success" : "border-border hover:bg-accent",
            )}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{steps[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
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
                  <div key={k} className="space-y-1.5"><Label>{k}</Label><Input value={answer(k!, v!)} onChange={(e) => setAnswer(k!, e.target.value)} /></div>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-2">
              {compliance.map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={c.ok ? "text-success" : "text-warning-foreground"}>{c.ok ? "✓" : "⚠"}</span>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">— {c.doc}</span>
                  </div>
                  {!c.ok && (
                    <Button size="sm" variant="outline" onClick={() => toast.success("Document uploaded.")}>
                      <Upload className="size-4" /> Upload Document
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              {experience.map((x) => (
                <label key={x.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                  <Checkbox
                    checked={selectedProjects.includes(x.id)}
                    onCheckedChange={(v) =>
                      setSelectedProjects((p) => (v ? [...p, x.id] : p.filter((id) => id !== x.id)))
                    }
                  />
                  <div>
                    <p className="text-sm font-medium">{x.project}</p>
                    <p className="text-xs text-muted-foreground">{x.client} · {x.value} · {x.year}</p>
                  </div>
                </label>
              ))}
              <p className="text-xs text-muted-foreground">{selectedProjects.length} projects selected</p>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <div className="space-y-1.5"><Label>Proposed methodology</Label><Textarea rows={5} value={answer("methodology", "Works will be executed in three phases: site establishment, structural works, and finishes with external works running in parallel.")} onChange={(e) => setAnswer("methodology", e.target.value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Programme duration (months)</Label><Input value={answer("duration", "11")} onChange={(e) => setAnswer("duration", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Site supervisor</Label><Input value={answer("supervisor", "Sipho Radebe")} onChange={(e) => setAnswer("supervisor", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>CIDB grading</Label><Input value={answer("cidb", "6GB PE")} onChange={(e) => setAnswer("cidb", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Local labour commitment</Label><Input value={answer("localLabour", "30%")} onChange={(e) => setAnswer("localLabour", e.target.value)} /></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="space-y-3 sm:hidden">
                {[
                  ["Site establishment", "1", "R 420 000", "R 420 000"],
                  ["Earthworks", "1 800", "R 240", "R 432 000"],
                  ["Structural works", "1", "R 6 100 000", "R 6 100 000"],
                  ["Finishes", "600", "R 2 400", "R 1 440 000"],
                  ["External works", "1", "R 1 980 000", "R 1 980 000"],
                ].map((r) => (
                  <div key={r[0]} className="space-y-3 rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{r[0]}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label>Quantity</Label><Input value={answer(`qty:${r[0]}`, r[1]!)} onChange={(e) => setAnswer(`qty:${r[0]}`, e.target.value)} /></div>
                      <div className="space-y-1"><Label>Rate</Label><Input value={answer(`rate:${r[0]}`, r[2]!)} onChange={(e) => setAnswer(`rate:${r[0]}`, e.target.value)} /></div>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{r[3]}</span></div>
                  </div>
                ))}
                <div className="flex justify-between rounded-lg bg-muted p-3 text-sm font-semibold"><span>Total (excl. VAT)</span><span>R 10 372 000</span></div>
              </div>
              <table className="hidden w-full text-sm sm:table">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Rate</th>
                    <th className="pb-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Site establishment", "1", "R 420 000", "R 420 000"],
                    ["Earthworks", "1 800", "R 240", "R 432 000"],
                    ["Structural works", "1", "R 6 100 000", "R 6 100 000"],
                    ["Finishes", "600", "R 2 400", "R 1 440 000"],
                    ["External works", "1", "R 1 980 000", "R 1 980 000"],
                  ].map((r) => (
                    <tr key={r[0]}>
                      <td className="py-3 pr-3 font-medium">{r[0]}</td>
                      <td className="py-3 pr-3"><Input value={answer(`qty:${r[0]}`, r[1]!)} onChange={(e) => setAnswer(`qty:${r[0]}`, e.target.value)} className="h-8 w-24" /></td>
                      <td className="py-3 pr-3"><Input value={answer(`rate:${r[0]}`, r[2]!)} onChange={(e) => setAnswer(`rate:${r[0]}`, e.target.value)} className="h-8 w-32" /></td>
                      <td className="py-3 tabular-nums">{r[3]}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-3" colSpan={3}>Total (excl. VAT)</td>
                    <td className="py-3 tabular-nums">R 10 372 000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {step === 5 && <Declarations onSave={() => void saveDraft()} />}

          {step === 6 && (
            <div className="space-y-3">
              {["Company Information", "Compliance Documents", "Project Experience", "Technical Information", "Pricing", "Declarations"].map((s) => (
                <div key={s} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span>{s}</span>
                  <span className="text-success">✓</span>
                </div>
              ))}
              <div className="rounded-lg border border-success/40 bg-success/10 p-4">
                <p className="text-sm font-semibold text-success">50 / 50 requirements completed — READY FOR SUBMISSION</p>
              </div>
              <Button onClick={() => toast.success("Submission package prepared.")}>Generate submission package</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button
          disabled={step === steps.length - 1}
          onClick={() => {
            const next = step + 1;
            setStep(next);
            void saveDraft(next);
          }}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Declarations({ onSave }: { onSave: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div className="space-y-4">
      {[
        "Declaration of Accuracy — I confirm the information provided is accurate.",
        "Conflict of Interest — I confirm that no conflict of interest exists.",
        "Tax Compliance — I confirm the company is tax compliant.",
      ].map((d) => (
        <label key={d} className="flex items-start gap-3 rounded-lg border border-border p-3">
          <Checkbox defaultChecked />
          <span className="text-sm">{d}</span>
        </label>
      ))}
      <div className="space-y-1.5">
        <Label>Declaration of Interest</Label>
        <Textarea rows={3} placeholder="Provide details if applicable..." />
      </div>
      <div className="space-y-2">
        <Label>Authorized Signatory: Lufuno Mphela</Label>
        <canvas
          ref={canvasRef}
          width={520}
          height={160}
          className="w-full max-w-lg touch-none rounded-lg border border-dashed border-border bg-card"
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = canvasRef.current?.getContext("2d");
            const p = pos(e);
            ctx?.beginPath();
            ctx?.moveTo(p.x, p.y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            const p = pos(e);
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#1f2937";
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }}
          onPointerUp={() => { drawing.current = false; }}
          onPointerLeave={() => { drawing.current = false; }}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const c = canvasRef.current;
              c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
            }}
          >
            Clear
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.success("Signature uploaded.")}>
            <Upload className="size-4" /> Upload Signature
          </Button>
          <Button size="sm" onClick={onSave}><Check className="size-4" /> Save</Button>
        </div>
      </div>
    </div>
  );
}
