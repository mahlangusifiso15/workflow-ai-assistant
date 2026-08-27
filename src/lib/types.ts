export type Priority = "High" | "Medium" | "Low";

export type EmailResult = {
  subject: string;
  body: string;
  nextAction: string;
  missingInfo: string[];
};

export type ActionItem = {
  task: string;
  owner: string;
  deadline: string;
  priority: Priority;
};

export type MeetingResult = {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  risks: string[];
  nextSteps: string[];
  missingInfo: string[];
};

export type PlannedTask = {
  name: string;
  priority: Priority;
  duration: string;
  deadline: string;
  order: number;
  rationale: string;
};

export type PlannerResult = {
  planned: PlannedTask[];
  schedule: { slot: string; items: string[] }[];
  advice: string;
  missingInfo: string[];
};

export type ResearchResult = {
  summary: string;
  keyFindings: string[];
  concepts: { term: string; explanation: string }[];
  benefits: string[];
  risks: string[];
  recommendations: string[];
  furtherQuestions: string[];
  verificationNote: string;
};

export type Task = {
  id: string;
  name: string;
  priority: Priority;
  duration: string;
  deadline: string;
  order: number;
  done: boolean;
  source: "manual" | "meeting" | "ai";
  notes?: string;
};

export type ActivityKind = "email" | "meeting" | "task" | "research" | "chat";

export type Activity = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  at: number;
};

export type Handoff =
  | { kind: "email"; purpose: string; keyInfo: string; outcome: string }
  | { kind: "tasks"; tasks: { name: string; priority: Priority; deadline: string }[] };
