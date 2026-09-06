import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_app/help")({
  component: Help,
  head: () => ({
    meta: [
      { title: "Help | Tender OS" },
      { name: "description", content: "How to move a tender from discovery through to a prepared submission package." },
      { property: "og:title", content: "Help | Tender OS" },
      { property: "og:description", content: "How to move a tender from discovery through to a prepared submission package." },
    ],
  }),
});

const steps = [
  "Run the scraper or add a tender manually.",
  "Review new tenders and mark the ones worth pursuing as relevant.",
  "Open the tender workspace and read the requirements.",
  "Attach company documents from the Document Vault.",
  "Use the Tender Filler to complete company info, experience, pricing and declarations.",
  "Prepare the submission package and send it from the Emails screen.",
];

function Help() {
  return (
    <div className="mx-auto max-w-[800px] space-y-6">
      <PageHeader title="Help" subtitle="The core tender workflow, step by step." />
      <Card>
        <CardContent className="space-y-3 pt-6">
          {steps.map((s, i) => (
            <div key={s} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <p className="text-sm">{s}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
