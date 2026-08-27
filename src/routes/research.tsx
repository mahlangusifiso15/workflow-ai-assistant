import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Wand2, Mail, Info, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import {
  AiOutputCard,
  EmptyState,
  ErrorState,
  InputNotice,
  LoadingState,
} from "@/components/app/ai-output-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runResearch } from "@/lib/ai.functions";
import { INPUT_REMINDER } from "@/lib/ai/prompts";
import { DEMO_RESEARCH } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import type { ResearchResult } from "@/lib/types";
import { aiErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | WorkFlow AI" },
      {
        name: "description",
        content:
          "Explore a workplace research question at your chosen depth, with findings, risks, recommendations and verification guidance.",
      },
      { property: "og:title", content: "AI Research Assistant | WorkFlow AI" },
      {
        property: "og:description",
        content: "Structured research insights for workplace decisions, clearly labelled as AI generated.",
      },
    ],
  }),
  component: ResearchPage,
});

type Depth = "Quick overview" | "Standard" | "Detailed";

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/85">
        {items.map((i, n) => (
          <li key={n}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function ResearchPage() {
  const { logActivity, setHandoff, addTasks } = useStore();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [purpose, setPurpose] = useState("");
  const [depth, setDepth] = useState<Depth>("Standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [summary, setSummary] = useState("");
  const [editing, setEditing] = useState(false);

  const run = async () => {
    if (!question.trim() || !purpose.trim()) {
      toast.error("Add both a research question and a purpose.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await runResearch({ data: { question, purpose, depth } });
      setResult(r);
      setSummary(r.summary);
      setEditing(false);
      logActivity("research", `Research: ${question}`, `Depth: ${depth}`);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="AI Research Assistant"
      description="Structured insight for workplace decisions — always verify independently."
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="question">Research question or topic</Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Impact of artificial intelligence on workplace productivity"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Preparing a recommendation for the leadership team"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depth">Desired depth</Label>
              <Select value={depth} onValueChange={(v) => setDepth(v as Depth)}>
                <SelectTrigger id="depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Quick overview", "Standard", "Detailed"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <InputNotice text={INPUT_REMINDER} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={loading}>
                <Wand2 className="size-4" />
                {loading ? "Researching…" : "Run research"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setQuestion(DEMO_RESEARCH);
                  setPurpose("Preparing a recommendation for the leadership team");
                }}
              >
                Load example topic
              </Button>
            </div>
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>
            This assistant has no external search access. Nothing here is externally verified —
            confirm important facts, figures and legal or financial details independently.
          </p>
        </div>

        {loading && <LoadingState label="Researching your question…" />}
        {!loading && error && <ErrorState message={error} onRetry={run} />}
        {!loading && !error && !result && (
          <EmptyState
            icon={Search}
            title="No research session yet"
            description="Enter a question and purpose, or load the example topic to see the structure."
          />
        )}

        {!loading && result && (
          <div className="space-y-4">
            <AiOutputCard
              title="Research summary"
              subtitle={`${depth} • Not externally verified`}
              copyValue={summary}
              editing={editing}
              onEdit={() => setEditing((v) => !v)}
              onSave={() => toast.success("Research summary saved")}
              onRegenerate={run}
              regenerating={loading}
              extraActions={
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setHandoff({
                        kind: "email",
                        purpose: `Share research insights on: ${question}`,
                        keyInfo: `${summary}\n\nKey findings:\n- ${result.keyFindings.join("\n- ")}`,
                        outcome: purpose,
                      });
                      navigate({ to: "/email" });
                    }}
                  >
                    <Mail className="size-4" />
                    Use in Email
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addTasks(
                        result.recommendations.slice(0, 5).map((r) => ({
                          name: r,
                          priority: "Medium" as const,
                        })),
                        "ai",
                      );
                      toast.success("Recommendations added to Task Planner");
                      navigate({ to: "/tasks" });
                    }}
                  >
                    <ListChecks className="size-4" />
                    Add to Planner
                  </Button>
                </>
              }
            >
              <Textarea
                rows={6}
                value={summary}
                readOnly={!editing}
                onChange={(e) => setSummary(e.target.value)}
              />
              <p className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
                {result.verificationNote}
              </p>
            </AiOutputCard>

            <div className="grid gap-4 md:grid-cols-2">
              <Block title="Key findings" items={result.keyFindings} />
              <Block title="Benefits" items={result.benefits} />
              <Block title="Risks" items={result.risks} />
              <Block title="Recommendations" items={result.recommendations} />
              <Block title="Questions for further research" items={result.furtherQuestions} />
              {result.concepts?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <h3 className="text-sm font-semibold">Important concepts</h3>
                  <dl className="mt-2 space-y-2 text-sm">
                    {result.concepts.map((c, n) => (
                      <div key={n}>
                        <dt className="font-medium">{c.term}</dt>
                        <dd className="text-foreground/80">{c.explanation}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
