import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Wand2, Eraser, ListChecks, Mail } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { summarizeMeeting } from "@/lib/ai.functions";
import { INPUT_REMINDER } from "@/lib/ai/prompts";
import { DEMO_MEETING_NOTES } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import type { MeetingResult, Priority } from "@/lib/types";
import { aiErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | WorkFlow AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into a summary, decisions, risks and an action item table you can send to the Task Planner.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | WorkFlow AI" },
      {
        property: "og:description",
        content: "Extract decisions, owners, deadlines and next steps from meeting notes.",
      },
    ],
  }),
  component: MeetingsPage,
});

const priorityTone: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/15 text-warning-foreground",
  Low: "bg-muted text-muted-foreground",
};

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None identified in these notes.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/85">
          {items.map((i, n) => (
            <li key={`${title}-${n}`}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MeetingsPage() {
  const { addTasks, logActivity, setHandoff } = useStore();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeetingResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState("");

  const run = async () => {
    if (notes.trim().length < 20) {
      toast.error("Paste more meeting notes so the AI has something to work with.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await summarizeMeeting({ data: { notes } });
      setResult(r);
      setSummary(r.summary);
      setEditing(false);
      logActivity("meeting", "Summarised meeting notes", `${r.actionItems.length} action items`);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const createTasks = () => {
    if (!result || result.actionItems.length === 0) return;
    addTasks(
      result.actionItems.map((a) => ({
        name: a.task,
        priority: a.priority,
        deadline: a.deadline || "No date given",
        notes: a.owner ? `Owner: ${a.owner}` : "",
      })),
      "meeting",
    );
    toast.success(`${result.actionItems.length} tasks added to the Task Planner`);
    navigate({ to: "/tasks" });
  };

  return (
    <AppShell
      title="Meeting Notes Summarizer"
      description="Extract decisions, risks and action items from raw notes."
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
          <Label htmlFor="notes" className="text-base font-semibold">
            Meeting notes
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste raw notes, bullet points or a transcript.
          </p>
          <Textarea
            id="notes"
            rows={12}
            className="mt-3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your meeting notes here…"
          />
          <div className="mt-3 space-y-3">
            <InputNotice text={INPUT_REMINDER} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={loading}>
                <Wand2 className="size-4" />
                {loading ? "Analysing…" : "Summarise notes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNotes("");
                  setResult(null);
                  setError(null);
                }}
              >
                <Eraser className="size-4" />
                Clear
              </Button>
              <Button variant="ghost" onClick={() => setNotes(DEMO_MEETING_NOTES)}>
                Load example meeting
              </Button>
            </div>
          </div>
        </section>

        {loading && <LoadingState label="Reading the meeting notes…" />}
        {!loading && error && <ErrorState message={error} onRetry={run} />}
        {!loading && !error && !result && (
          <EmptyState
            icon={FileText}
            title="No summary yet"
            description="Paste meeting notes above, or load the example marketing meeting to see how it works."
          />
        )}

        {!loading && result && (
          <div className="space-y-4">
            <AiOutputCard
              title="Meeting summary"
              copyValue={summary}
              editing={editing}
              onEdit={() => setEditing((v) => !v)}
              onSave={() => toast.success("Summary saved")}
              onRegenerate={run}
              regenerating={loading}
              extraActions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setHandoff({
                      kind: "email",
                      purpose: "Share the meeting outcome with the team",
                      keyInfo: summary,
                      outcome: "Team is aligned on decisions and next steps",
                    });
                    navigate({ to: "/email" });
                  }}
                >
                  <Mail className="size-4" />
                  Use in Email
                </Button>
              }
            >
              <Textarea
                rows={6}
                value={summary}
                readOnly={!editing}
                onChange={(e) => setSummary(e.target.value)}
              />
            </AiOutputCard>

            <div className="grid gap-4 md:grid-cols-2">
              <ListCard title="Key discussion points" items={result.keyPoints} />
              <ListCard title="Decisions" items={result.decisions} />
              <ListCard title="Risks and unresolved issues" items={result.risks} />
              <ListCard title="Suggested next steps" items={result.nextSteps} />
            </div>

            <AiOutputCard
              title="Action items"
              subtitle="Owners and deadlines are taken from your notes only."
              copyValue={result.actionItems
                .map((a) => `${a.task} | ${a.owner} | ${a.deadline} | ${a.priority}`)
                .join("\n")}
              extraActions={
                <Button size="sm" onClick={createTasks} disabled={result.actionItems.length === 0}>
                  <ListChecks className="size-4" />
                  Create Tasks
                </Button>
              }
            >
              {result.actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No action items were found in these notes.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.actionItems.map((a, n) => (
                        <TableRow key={`${a.task}-${n}`}>
                          <TableCell className="max-w-[280px] whitespace-normal font-medium">
                            {a.task}
                          </TableCell>
                          <TableCell>{a.owner || "Unassigned"}</TableCell>
                          <TableCell>{a.deadline || "No date given"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={priorityTone[a.priority] ?? ""}>
                              {a.priority}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {result.missingInfo.length > 0 && (
                <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
                  <p className="font-semibold">Not covered in the notes</p>
                  <ul className="mt-1 list-disc pl-5 text-foreground/80">
                    {result.missingInfo.map((m, n) => (
                      <li key={n}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AiOutputCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
