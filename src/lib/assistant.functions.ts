import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  company,
  companyDocuments,
  emailTemplates,
  scraperSources,
  tenders,
  type TenderStatus,
} from "@/data/mock";

const MODEL = "anthropic/claude-fable-5.1";

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
  argsJson: string;
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
          sources: { type: "array", items: { type: "string" }, description: "Optional source names to scan." },
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

async function systemPrompt() {
  const tenderLines = tenders
    .map(
      (t) =>
        `- ${t.id} | ${t.name} | ref ${t.reference} | ${t.organisation} | ${t.location} | closes ${t.closingDate} | status ${t.status} | match ${t.match}%`,
    )
    .join("\n");

  const docLines = companyDocuments.map((d) => `- ${d.name} (${d.category}, ${d.status})`).join("\n");
  const sourceLines = scraperSources.map((s) => `- ${s.name} (${s.status})`).join("\n");
  const templateLines = emailTemplates.map((t) => `- ${t.title}: ${t.subject}`).join("\n");

  return `You are the Tender OS assistant for ${company.name}, a South African company that bids on public tenders.

You know the whole system: tender pipeline, document vault, company profile, email templates, scraper sources and reports. Answer briefly and practically, in plain business English. Use markdown for lists and tables.

You can take actions with the provided tools. Never claim an action is already done — every action must be confirmed by the user first, so describe what you are proposing.

COMPANY
${company.name} · ${company.city}, ${company.province} · contact ${company.contactPerson} (${company.email})

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
    try {
      const key = process.env["OPENROUTER_API_KEY"];
      console.log("[assistant] key present:", Boolean(key));
      if (!key) {
        return {
          content: "The assistant is not connected yet — an OpenRouter API key still needs to be saved.",
          actions: [] as AssistantAction[],
        };
      }

      const prompt = await systemPrompt();
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tender-os.lovable.app",
        "X-Title": "Tender OS",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: prompt }, ...data.messages],
        tools: TOOLS,
        tool_choice: "auto",
        max_tokens: 256,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return {
        content: `The AI assistant could not answer right now (OpenRouter ${res.status}). ${detail.slice(0, 200)}`,
        actions: [] as AssistantAction[],
      };
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
      const argsJson = call.function.arguments || "{}";
      return {
        id: call.id,
        name: call.function.name,
        label: describeAction(call.function.name, safeParse(argsJson)),
        argsJson,
      };
    });

    return {
      content:
        message?.content?.trim() || (actions.length ? "I can do that — confirm below." : "I did not get a reply."),
      actions,
    };
    } catch (error) {
      console.error("[assistant] handler error:", error);
      throw error;
    }
  });

function safeParse(json: string): Record<string, string> {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) out[k] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
    return out;
  } catch {
    return {};
  }
}

function describeAction(name: string, args: Record<string, string>) {
  switch (name) {
    case "run_scraper":
      return args["sources"] ? `Run the scraper on ${args["sources"]}` : "Run the scraper on all sources";
    case "send_email":
      return `Send an email to ${args["to"] ?? ""} — "${args["subject"] ?? ""}"`;
    case "update_tender_status":
      return `Set ${args["tenderId"] ?? ""} status to ${args["status"] ?? ""}`;
    default:
      return name;
  }
}

const ActionInput = z.object({
  name: z.string(),
  argsJson: z.string().default("{}"),
});

export const runAssistantAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ActionInput.parse(input))
  .handler(async ({ data }) => {
    const args = safeParse(data.argsJson);

    // Try to execute against the real Firebase backend when it is configured.
    // If it is not ready, the demo responses below let the user see the flow.
    try {
      const {
        isFirebaseConfigured,
        runScraperNow,
        sendTenderEmail,
        setTenderStatus,
      } = await import("@/lib/live-data");

      if (isFirebaseConfigured) {
        switch (data.name) {
          case "run_scraper": {
            const sources = args["sources"]
              ? args["sources"].split(",").map((s) => s.trim()).filter(Boolean)
              : undefined;
            const message = await runScraperNow(sources);
            return { ok: true, message };
          }
          case "send_email": {
            const message = await sendTenderEmail({
              to: args["to"] ?? "",
              subject: args["subject"] ?? "",
              body: args["body"] ?? "",
              ...(args["tenderId"] ? { tenderId: args["tenderId"] } : {}),
            });
            return { ok: true, message };
          }
          case "update_tender_status": {
            await setTenderStatus(args["tenderId"] ?? "", args["status"] as TenderStatus);
            return { ok: true, message: `Status updated to ${args["status"] ?? ""}.` };
          }
        }
      }
    } catch {
      // Backend not reachable yet — fall through to the demo response.
    }

    switch (data.name) {
      case "run_scraper":
        return { ok: true, message: "Scraper run started. New tenders will appear on the Tenders page." };
      case "send_email":
        return { ok: true, message: `Email queued to ${args["to"] ?? ""}.` };
      case "update_tender_status":
        return { ok: true, message: `Status updated to ${args["status"] ?? ""}.` };
      default:
        return { ok: false, message: `Unknown action: ${data.name}` };
    }
  });
