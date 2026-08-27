import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Activity, ActivityKind, Handoff, Priority, Task } from "./types";
import { seedActivity, seedTasks } from "./demo-data";

type Counts = Record<ActivityKind, number>;

type StoreValue = {
  tasks: Task[];
  activity: Activity[];
  counts: Counts;
  profileName: string;
  setProfileName: (v: string) => void;
  addTasks: (
    tasks: { name: string; priority?: Priority; deadline?: string; duration?: string; notes?: string }[],
    source?: Task["source"],
  ) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
  logActivity: (kind: ActivityKind, title: string, detail: string) => void;
  handoff: Handoff | null;
  setHandoff: (h: Handoff | null) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

const KEY = "workflow-ai-state-v1";

type Persisted = {
  tasks: Task[];
  activity: Activity[];
  counts: Counts;
  profileName: string;
};

const emptyCounts: Counts = { email: 0, meeting: 0, task: 0, research: 0, chat: 0 };

const initial: Persisted = {
  tasks: seedTasks,
  activity: seedActivity,
  counts: { email: 4, meeting: 2, task: seedTasks.length, research: 1, chat: 0 },
  profileName: "Sifiso Mahlangu",
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...(JSON.parse(raw) as Persisted) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const logActivity = useCallback((kind: ActivityKind, title: string, detail: string) => {
    setState((s) => ({
      ...s,
      counts: { ...s.counts, [kind]: (s.counts[kind] ?? 0) + 1 },
      activity: [
        { id: crypto.randomUUID(), kind, title, detail, at: Date.now() },
        ...s.activity,
      ].slice(0, 25),
    }));
  }, []);

  const addTasks: StoreValue["addTasks"] = useCallback((incoming, source = "manual") => {
    setState((s) => {
      const base = s.tasks.length;
      const next: Task[] = incoming.map((t, i) => ({
        id: crypto.randomUUID(),
        name: t.name,
        priority: t.priority ?? "Medium",
        duration: t.duration ?? "—",
        deadline: t.deadline ?? "No date given",
        order: base + i + 1,
        done: false,
        source,
        ...(t.notes ? { notes: t.notes } : {}),
      }));
      return {
        ...s,
        tasks: [...s.tasks, ...next],
        counts: { ...s.counts, task: s.counts.task + next.length },
      };
    });
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }, []);

  const setTasks = useCallback((tasks: Task[]) => {
    setState((s) => ({ ...s, tasks }));
  }, []);

  const setProfileName = useCallback((profileName: string) => {
    setState((s) => ({ ...s, profileName }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      tasks: state.tasks,
      activity: state.activity,
      counts: { ...emptyCounts, ...state.counts },
      profileName: state.profileName,
      setProfileName,
      addTasks,
      updateTask,
      removeTask,
      setTasks,
      logActivity,
      handoff,
      setHandoff,
    }),
    [state, handoff, addTasks, updateTask, removeTask, setTasks, logActivity, setProfileName],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
