import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { companyProfile, documents, emailTemplates, scraperSources, tenders } from "@/data/mock";

const MODEL = "anthropic/claude-3.5-sonnet";

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

export type AssistantAction = {
  id: string;
  name: string;
  label: string;
  args: Record<string, unknown>;
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "run_scraper",
      description: "Start a tender scraping run across the configured South African sources.",
      parameters: {
        type: "object",
        properties: {
          sources: { type: "array", items: { type: "string" }, description: "Optional source ids to scan." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email from the connected company Gmail account.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
          tenderId: { type: "string" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_tender_status",
      description: "Change the workflow status of a tender.",
      parameters: {
        type: "object",
        properties: {
          tenderId: { type: "string" },
          status: { type: "string" },
        },
        required: ["tenderId", "status"],
      },
    },
  },
];

function systemPrompt() {
  const tenderLines = tenders
    .map(
      (t) =>
        `- ${t.id} | ${t.name} | ref ${t.reference} | ${t.organisation} | ${t.location} | closes ${t.closingDate} | status ${t.status} | match ${t.match}%`,
    )
    .join("\n");

  const docLines = documents.map((d) => `- ${d.name} (${d.category}, ${d.status})`).join("\n");
  const sourceLines = scraperSources.map((s) => `- ${s.id}: ${s.name}`).join("\n");
  const templateLines = emailTemplates.map((t) => `- ${t.id}: ${t.name}`).join("\n");

  return `You are the Tender OS assistant for ${companyProfile.name}, a South African company that bids on public tenders.

You know the whole system: tender pipeline, document vault, company profile, email templates, scraper sources and reports. Answer briefly and practically, in plain business English. Use markdown for lists and tables.

You can take actions with the provided tools. Never claim an action is done — every action must be confirmed by the user first, so describe what you are proposing.

COMPANY
${companyProfile.name} · CIDB ${companyProfile.cidbGrading} · B-BBEE Level ${companyProfile.bbbeeLevel} · ${companyProfile.province}

TENDERS
${tenderLines}

DOCUMENTS
${docLines}

SCRAPER SOURCES
${sourceLines}

EMAIL TEMPLATES
${templateLines}`;
}

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["OPENROUTER_API_KEY"];
    if (!key) {
      return {
        content: "The assistant is not connected yet — an OpenRouter API key still needs to be saved.",
        actions: [] as AssistantAction[],
      };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt() }, ...data.messages],
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Assistant unavailable (${res.status}): ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
      }>;
    };

    const message = json.choices?.[0]?.message;
    const actions: AssistantAction[] = (message?.tool_calls ?? []).map((call) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      return {
        id: call.id,
        name: call.function.name,
        label: describeAction(call.function.name, args),
        args,
      };
    });

    return {
      content: message?.content?.trim() || (actions.length ? "I can do that — confirm below." : "I did not get a reply."),
      actions,
    };
  });

function describeAction(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "run_scraper":
      return Array.isArray(args.sources) && args.sources.length
        ? `Run the scraper on ${(args.sources as string[]).join(", ")}`
        : "Run the scraper on all sources";
    case "send_email":
      return `Send an email to ${String(args.to ?? "")} — "${String(args.subject ?? "")}"`;
    case "update_tender_status":
      return `Set ${String(args.tenderId ?? "")} status to ${String(args.status ?? "")}`;
    default:
      return name;
  }
}

const ActionInput = z.object({
  name: z.string(),
  args: z.record(z.string(), z.unknown()).default({}),
});

export const runAssistantAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ActionInput.parse(input))
  .handler(async ({ data }) => {
    // Actions run against the demo data until the Firebase backend is connected.
    switch (data.name) {
      case "run_scraper":
        return { ok: true, message: "Scraper run started. New tenders will appear on the Tenders page." };
      case "send_email":
        return { ok: true, message: `Email queued to ${String(data.args.to ?? "")}.` };
      case "update_tender_status":
        return { ok: true, message: `Status updated to ${String(data.args.status ?? "")}.` };
      default:
        return { ok: false, message: `Unknown action: ${data.name}` };
    }
  });
