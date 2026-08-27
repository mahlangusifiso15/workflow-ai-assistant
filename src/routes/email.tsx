import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Wand2, Eraser, ListChecks } from "lucide-react";
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
import { generateEmail } from "@/lib/ai.functions";
import { INPUT_REMINDER } from "@/lib/ai/prompts";
import { DEMO_EMAIL } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import type { EmailResult } from "@/lib/types";
import { aiErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | WorkFlow AI" },
      {
        name: "description",
        content:
          "Generate professional workplace emails with a chosen tone, editable output and a suggested next action.",
      },
      { property: "og:title", content: "Smart Email Generator | WorkFlow AI" },
      {
        property: "og:description",
        content: "Turn key points into a clear, professional email you can edit and send.",
      },
    ],
  }),
  component: EmailPage,
});

type Tone = "Formal" | "Friendly" | "Persuasive" | "Concise";

function EmailPage() {
  const { logActivity, handoff, setHandoff, addTasks } = useStore();
  const navigate = useNavigate();

  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [keyInfo, setKeyInfo] = useState("");
  const [outcome, setOutcome] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (handoff?.kind === "email") {
      setPurpose(handoff.purpose);
      setKeyInfo(handoff.keyInfo);
      setOutcome(handoff.outcome);
      setHandoff(null);
      toast.info("Content brought in from another tool. Add a recipient and generate.");
    }
  }, [handoff, setHandoff]);

  const run = async () => {
    if (!purpose || !recipient || !keyInfo || !outcome) {
      toast.error("Fill in all fields so the AI does not have to guess.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await generateEmail({ data: { purpose, recipient, keyInfo, outcome, tone } });
      setResult(r);
      setSubject(r.subject);
      setBody(r.body);
      setEditing(false);
      logActivity("email", `Generated email: ${r.subject || purpose}`, `Tone: ${tone}`);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setPurpose("");
    setRecipient("");
    setKeyInfo("");
    setOutcome("");
    setTone("Formal");
    setResult(null);
    setError(null);
  };

  return (
    <AppShell
      title="Smart Email Generator"
      description="Turn your key points into a professional email — no invented facts."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="text-base font-semibold">Email brief</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The AI uses only what you enter here.
          </p>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Email purpose</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Request a deadline extension"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Thandi Nkosi, Marketing Lead"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="keyInfo">Key information</Label>
              <Textarea
                id="keyInfo"
                rows={4}
                value={keyInfo}
                onChange={(e) => setKeyInfo(e.target.value)}
                placeholder="Facts the email must contain"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outcome">Desired outcome</Label>
              <Input
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Approval for a new deadline"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Formal", "Friendly", "Persuasive", "Concise"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <InputNotice text={INPUT_REMINDER} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={loading}>
                <Wand2 className="size-4" />
                {loading ? "Generating…" : "Generate email"}
              </Button>
              <Button variant="outline" onClick={clear} disabled={loading}>
                <Eraser className="size-4" />
                Clear
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPurpose(DEMO_EMAIL.purpose);
                  setRecipient(DEMO_EMAIL.recipient);
                  setKeyInfo(DEMO_EMAIL.keyInfo);
                  setOutcome(DEMO_EMAIL.outcome);
                  setTone("Persuasive");
                }}
              >
                Load example
              </Button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {loading && <LoadingState label="Drafting your email…" />}
          {!loading && error && <ErrorState message={error} onRetry={run} />}
          {!loading && !error && !result && (
            <EmptyState
              icon={Mail}
              title="No email yet"
              description="Complete the brief and generate an email. You can edit everything before sending."
            />
          )}
          {!loading && result && (
            <AiOutputCard
              title="Generated email"
              subtitle={`Tone: ${tone} • Recipient: ${recipient}`}
              copyValue={`Subject: ${subject}\n\n${body}`}
              editing={editing}
              onEdit={() => setEditing((v) => !v)}
              onSave={() => {
                logActivity("email", `Saved email: ${subject}`, "Edited draft saved");
                toast.success("Email saved to recent activity");
              }}
              onRegenerate={run}
              regenerating={loading}
              extraActions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    addTasks(
                      [
                        {
                          name: result.nextAction || `Follow up with ${recipient}`,
                          priority: "Medium",
                        },
                      ],
                      "ai",
                    );
                    toast.success("Next action added to Task Planner");
                    navigate({ to: "/tasks" });
                  }}
                >
                  <ListChecks className="size-4" />
                  Add to Planner
                </Button>
              }
            >
              <div className="space-y-1.5">
                <Label htmlFor="subjectOut">Subject line</Label>
                <Input
                  id="subjectOut"
                  value={subject}
                  readOnly={!editing}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bodyOut">Email</Label>
                <Textarea
                  id="bodyOut"
                  rows={14}
                  value={body}
                  readOnly={!editing}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-sans"
                />
              </div>
              {result.nextAction && (
                <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                  <span className="font-semibold">Suggested next action: </span>
                  {result.nextAction}
                </div>
              )}
              {result.missingInfo.length > 0 && (
                <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
                  <p className="font-semibold">Missing information the AI did not invent</p>
                  <ul className="mt-1 list-disc pl-5 text-foreground/80">
                    {result.missingInfo.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AiOutputCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
