import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
  head: () => ({
    meta: [
      { title: "Settings | Tender OS" },
      { name: "description", content: "Manage your profile, notification preferences and scraper schedule." },
      { property: "og:title", content: "Settings | Tender OS" },
      { property: "og:description", content: "Manage your profile, notification preferences and scraper schedule." },
    ],
  }),
});

function Settings() {
  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <PageHeader title="Settings" subtitle="Preferences for your Tender OS workspace." />
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue="Lufuno Mphela" /></div>
          <div className="space-y-1.5"><Label>Role</Label><Input defaultValue="Administrator" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input defaultValue="lufuno@mphelaindustries.co.za" /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input defaultValue="+27 82 554 1120" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {["Tender deadline reminders", "New tender discoveries", "Missing document alerts", "Email replies"].map((n, i) => (
            <div key={n} className="flex items-center justify-between">
              <Label>{n}</Label>
              <Switch defaultChecked={i !== 3} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Scraper</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Run daily at 06:00</Label>
            <Switch defaultChecked />
          </div>
          <div className="space-y-1.5"><Label>Minimum match score</Label><Input defaultValue="60" /></div>
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("Settings saved successfully.")}>Save Changes</Button>
    </div>
  );
}
