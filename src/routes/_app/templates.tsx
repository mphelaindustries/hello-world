import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageHeader";
import { emailTemplates as mockEmailTemplates } from "@/data/mock";
import { getEmailTemplates, useLive } from "@/lib/live-data";

export const Route = createFileRoute("/_app/templates")({
  component: Templates,
  head: () => ({
    meta: [
      { title: "Email Templates | Tender OS" },
      { name: "description", content: "Reusable email templates for tender submissions, clarifications and follow-ups." },
      { property: "og:title", content: "Email Templates | Tender OS" },
      { property: "og:description", content: "Reusable email templates for tender submissions, clarifications and follow-ups." },
    ],
  }),
});

function Templates() {
  const { data: emailTemplates } = useLive("templates", getEmailTemplates, mockEmailTemplates);
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeader
        title="Templates"
        subtitle="Standard messages used across tender correspondence."
        actions={<Button onClick={() => toast.success("Template created.")}><Plus className="size-4" /> New Template</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {emailTemplates.map((t) => (
          <Card key={t.id}>
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.subject}</p>
              <Button size="sm" variant="outline" onClick={() => toast.success("Template updated.")}>Edit</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
