import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListChecks, Plus, Trash2, Wand2, CalendarClock, Check } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planTasks } from "@/lib/ai.functions";
import { INPUT_REMINDER } from "@/lib/ai/prompts";
import { DEMO_TASKS } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import type { PlannerResult, Priority, Task } from "@/lib/types";
import { aiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | WorkFlow AI" },
      {
        name: "description",
        content:
          "Capture tasks, let AI set priority, duration and order, then generate a daily or weekly schedule.",
      },
      { property: "og:title", content: "AI Task Planner | WorkFlow AI" },
      {
        property: "og:description",
        content: "Prioritised tasks and an AI generated daily or weekly schedule.",
      },
    ],
  }),
  component: TasksPage,
});

const priorityTone: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/15 text-warning-foreground",
  Low: "bg-muted text-muted-foreground",
};

function TaskRow({ task }: { task: Task }) {
  const { updateTask, removeTask } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <Checkbox
        checked={task.done}
        onCheckedChange={(v) => updateTask(task.id, { done: Boolean(v) })}
        aria-label={`Mark ${task.name} complete`}
      />
      <div className="min-w-[180px] flex-1">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              updateTask(task.id, { name });
              setEditing(false);
            }}
            autoFocus
          />
        ) : (
          <p
            className={cn(
              "text-sm font-medium",
              task.done && "text-muted-foreground line-through",
            )}
          >
            {task.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {task.deadline} • {task.duration}
          {task.notes ? ` • ${task.notes}` : ""}
          {task.source !== "manual" ? ` • from ${task.source}` : ""}
        </p>
      </div>
      <Select
        value={task.priority}
        onValueChange={(v) => updateTask(task.id, { priority: v as Priority })}
      >
        <SelectTrigger className="w-[110px]" aria-label="Reprioritize task">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["High", "Medium", "Low"] as Priority[]).map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge variant="secondary" className={priorityTone[task.priority]}>
        {task.priority}
      </Badge>
      <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
        Edit
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete task"
        onClick={() => removeTask(task.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

function TasksPage() {
  const { tasks, addTasks, updateTask, logActivity } = useStore();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [horizon, setHorizon] = useState<"Daily" | "Weekly">("Daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlannerResult | null>(null);

  const open = tasks.filter((t) => !t.done);

  const add = () => {
    if (!name.trim()) {
      toast.error("Enter a task name first.");
      return;
    }
    addTasks([{ name: name.trim(), deadline: deadline.trim() || "No date given" }]);
    setName("");
    setDeadline("");
    toast.success("Task added");
  };

  const generate = async () => {
    if (open.length === 0) {
      toast.error("Add at least one open task before generating a schedule.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await planTasks({
        data: {
          horizon,
          tasks: open.map((t) => ({
            name: t.name,
            deadline: t.deadline,
            notes: t.notes ?? "",
          })),
        },
      });
      setPlan(r);
      r.planned.forEach((p) => {
        const match = open.find((t) => t.name.toLowerCase() === p.name.toLowerCase());
        if (match) {
          updateTask(match.id, {
            priority: p.priority,
            duration: p.duration,
            order: p.order,
          });
        }
      });
      logActivity("task", `Generated ${horizon.toLowerCase()} schedule`, `${open.length} tasks`);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="AI Task Planner"
      description="Prioritise your work and build a realistic schedule."
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="text-base font-semibold">Add tasks</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <Label htmlFor="taskName">Task name</Label>
              <Input
                id="taskName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Prepare presentation"
              />
            </div>
            <div className="w-44 space-y-1.5">
              <Label htmlFor="taskDeadline">Deadline</Label>
              <Input
                id="taskDeadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Friday"
              />
            </div>
            <Button onClick={add}>
              <Plus className="size-4" />
              Add task
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                addTasks(DEMO_TASKS.map((t) => ({ name: t.name, deadline: t.deadline })));
                toast.success("Example tasks added");
              }}
            >
              Load example tasks
            </Button>
          </div>
          <div className="mt-3">
            <InputNotice text={INPUT_REMINDER} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              Your tasks{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({open.length} open, {tasks.length - open.length} done)
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={horizon} onValueChange={(v) => setHorizon(v as "Daily" | "Weekly")}>
                <SelectTrigger className="w-[130px]" aria-label="Schedule type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={generate} disabled={loading}>
                <Wand2 className="size-4" />
                {loading ? "Planning…" : "Generate schedule"}
              </Button>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={ListChecks}
                title="No tasks yet"
                description="Add your first task above, or load the example task list."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...tasks]
                .sort((a, b) => Number(a.done) - Number(b.done) || a.order - b.order)
                .map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
            </ul>
          )}
        </section>

        {loading && <LoadingState label="Building your schedule…" />}
        {!loading && error && <ErrorState message={error} onRetry={generate} />}

        {!loading && plan && (
          <AiOutputCard
            title={`${horizon} schedule`}
            subtitle="Priority and order are suggestions — adjust as you need."
            copyValue={plan.schedule
              .map((s) => `${s.slot}: ${s.items.join(", ")}`)
              .join("\n")}
            onRegenerate={generate}
            regenerating={loading}
            onSave={() => toast.success("Schedule saved to this session")}
          >
            {plan.advice && <p className="text-sm text-foreground/85">{plan.advice}</p>}
            <ol className="space-y-3 border-l-2 border-border pl-4">
              {plan.schedule.map((s, n) => (
                <li key={n} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-semibold">{s.slot}</p>
                  <ul className="mt-1 space-y-1 text-sm text-foreground/85">
                    {s.items.map((it, k) => (
                      <li key={k} className="flex items-start gap-2">
                        <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            {plan.planned.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Recommended order</h3>
                <ul className="space-y-2">
                  {[...plan.planned]
                    .sort((a, b) => a.order - b.order)
                    .map((p, n) => (
                      <li
                        key={n}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {p.order}
                        </span>
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="secondary" className={priorityTone[p.priority]}>
                          {p.priority}
                        </Badge>
                        <span className="text-muted-foreground">{p.duration}</span>
                        <span className="text-muted-foreground">• {p.deadline}</span>
                        <span className="w-full text-xs text-muted-foreground">{p.rationale}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {plan.missingInfo.length > 0 && (
              <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
                <p className="font-semibold">To improve this plan, add:</p>
                <ul className="mt-1 list-disc pl-5 text-foreground/80">
                  {plan.missingInfo.map((m, n) => (
                    <li key={n}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="size-3.5" /> Mark tasks complete in the list above to keep the plan
              current.
            </p>
          </AiOutputCard>
        )}
      </div>
    </AppShell>
  );
}
