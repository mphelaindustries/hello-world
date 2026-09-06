import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageHeader";
import { emailThreads } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/emails")({
  component: Emails,
  head: () => ({
    meta: [
      { title: "Emails | Tender OS" },
      { name: "description", content: "Read and compose tender correspondence linked to each opportunity." },
      { property: "og:title", content: "Emails | Tender OS" },
      { property: "og:description", content: "Read and compose tender correspondence linked to each opportunity." },
    ],
  }),
});

function Emails() {
  const [selected, setSelected] = useState(emailThreads[0]!.id);
  const active = emailThreads.find((m) => m.id === selected)!;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title="Emails" subtitle="Tender correspondence in one inbox." />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardContent className="divide-y divide-border p-0">
            {emailThreads.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={cn("block w-full px-4 py-3 text-left transition-colors hover:bg-accent", selected === m.id && "bg-accent")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("truncate text-sm", m.unread ? "font-semibold" : "font-medium")}>{m.from}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{m.date}</span>
                </div>
                <p className="mt-0.5 truncate text-sm">{m.subject}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{m.preview}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{active.subject}</CardTitle>
            <p className="text-xs text-muted-foreground">{active.from} · {active.date} · Linked to {active.tender}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{active.preview}</p>
            <div className="space-y-3 border-t border-border pt-4">
              <Input placeholder="To" defaultValue="tenders@dpw.gov.za" />
              <Input placeholder="Subject" defaultValue={`Re: ${active.subject}`} />
              <Textarea rows={8} defaultValue={"Dear Sir/Madam,\n\nThank you for your correspondence.\n\nKind regards,\nLufuno Mphela\nMphela Industries"} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast.success("Email sent successfully.")}><Send className="size-4" /> Send</Button>
                <Button variant="outline" onClick={() => toast.success("Email saved as draft.")}>Save Draft</Button>
                <Button variant="outline" onClick={() => toast.success("Submission package attached.")}>
                  <Paperclip className="size-4" /> Attach package
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
