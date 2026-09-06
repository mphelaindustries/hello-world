import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/PageHeader";
import { certifications, company, directors, experience } from "@/data/mock";

export const Route = createFileRoute("/_app/company")({
  component: CompanyProfile,
  head: () => ({
    meta: [
      { title: "Company Profile | Tender OS" },
      { name: "description", content: "Reusable company details, directors, certifications and project experience for tender submissions." },
      { property: "og:title", content: "Company Profile | Tender OS" },
      { property: "og:description", content: "Reusable company details, directors, certifications and project experience." },
    ],
  }),
});

const fields: [string, string][] = [
  ["Company Name", company.name],
  ["Trading Name", company.tradingName],
  ["Registration Number", company.registrationNumber],
  ["VAT Number", company.vatNumber],
  ["Company Type", company.type],
  ["Year Established", company.yearEstablished],
  ["Physical Address", company.physicalAddress],
  ["Postal Address", company.postalAddress],
  ["Province", company.province],
  ["City", company.city],
  ["Postal Code", company.postalCode],
  ["Website", company.website],
  ["Email", company.email],
  ["Phone", company.phone],
  ["Alternative Phone", company.altPhone],
];

function CompanyProfile() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeader title="Company Profile" subtitle="Information reused across every tender submission." />
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="directors">Directors</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map(([label, value]) => (
                  <div key={label} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input defaultValue={value} />
                  </div>
                ))}
              </div>
              <Button onClick={() => toast.success("Company details saved.")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="directors" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Directors</CardTitle>
              <Button size="sm" onClick={() => toast.success("Director added.")}><Plus className="size-4" /> Add Director</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {directors.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.role} · ID {d.idNumber}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toast.success("Director updated.")}>Edit</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="mt-4">
          <Card>
            <CardContent className="space-y-2 pt-6">
              {certifications.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Expires {c.expires}</p>
                  </div>
                  <span className="text-sm font-semibold">{c.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="mt-4">
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Project</th>
                    <th className="pb-2 font-medium">Client</th>
                    <th className="pb-2 font-medium">Value</th>
                    <th className="pb-2 font-medium">Year</th>
                    <th className="pb-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {experience.map((x) => (
                    <tr key={x.id}>
                      <td className="py-3 pr-3 font-medium">{x.project}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{x.client}</td>
                      <td className="py-3 pr-3 tabular-nums">{x.value}</td>
                      <td className="py-3 pr-3">{x.year}</td>
                      <td className="py-3">{x.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
