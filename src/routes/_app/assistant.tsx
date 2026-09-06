import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Check, Loader2, Send, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageHeader";
import { chatWithAssistant, runAssistantAction, type AssistantAction } from "@/lib/assistant.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/assistant")({
  component: Assistant,
  head: () => ({
    meta: [
      { title: "AI Assistant | Tender OS" },
      {
        name: "description",
        content: "Ask about your tenders, documents and deadlines — and run scrapes or send emails with one confirmation.",
      },
      { property: "og:title", content: "AI Assistant | Tender OS" },
      { property: "og:description", content: "Your tender co-pilot: answers, scraping and email, all in one chat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
  handled?: Record<string, "done" | "skipped">;
};

const SUGGESTIONS = [
  "Which tenders close in the next 7 days?",
  "What documents are expiring soon?",
  "Run a scrape on all sources",
  "Draft a clarification email for the Polokwane tender",
];

function Assistant() {
  const chat = useServerFn(chatWithAssistant);
  const act = useServerFn(runAssistantAction);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi Lufuno — I know your tenders, documents, deadlines and templates. Ask me anything, or tell me to run a scrape or send an email and I'll ask you to confirm first.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await chat({
        data: { messages: next.map((m) => ({ role: m.role, content: m.content })) },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply.content, actions: reply.actions, handled: {} }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The assistant could not reply.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — I couldn't reach the assistant service just now. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const resolve = async (msgIndex: number, action: AssistantAction, approve: boolean) => {
    if (approve) {
      try {
        const result = await act({ data: { name: action.name, argsJson: action.argsJson } });
        result.ok ? toast.success(result.message) : toast.error(result.message);
      } catch {
        toast.error("That action could not be completed.");
        return;
      }
    } else {
      toast.info("Action cancelled.");
    }
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIndex ? { ...m, handled: { ...m.handled, [action.id]: approve ? "done" : "skipped" } } : m,
      ),
    );
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-[900px] flex-col gap-4">
      <PageHeader title="AI Assistant" subtitle="Answers about your tender pipeline — and actions you approve." />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </span>
            <div className={cn("min-w-0 max-w-[85%] space-y-3", m.role === "user" && "text-right")}>
              <div
                className={cn(
                  "inline-block break-words rounded-2xl px-4 py-2.5 text-left text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert [&_*]:text-inherit [&_table]:block [&_table]:overflow-x-auto">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>

              {m.actions?.map((a) => {
                const state = m.handled?.[a.id];
                return (
                  <Card key={a.id} className="text-left">
                    <CardContent className="space-y-3 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Action needs your approval
                      </p>
                      <p className="text-sm font-medium">{a.label}</p>
                      {state ? (
                        <p className="text-sm text-muted-foreground">
                          {state === "done" ? "Approved and run." : "Cancelled."}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 min-[420px]:flex">
                          <Button size="sm" onClick={() => resolve(i, a, true)}>
                            <Check className="size-4" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => resolve(i, a, false)}>
                            <X className="size-4" /> Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-border pt-4"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder="Ask about a tender, a deadline, or tell me to run a scrape..."
          rows={2}
          className="min-h-[52px] resize-none"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
