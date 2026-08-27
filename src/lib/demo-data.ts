import type { Activity, Task } from "./types";

export const DEMO_MEETING_NOTES = `Marketing team meeting — Tuesday 10:00

Attendees: Thandi (Marketing Lead), Sipho (Social), Lerato (Design), Ben (Finance)

- Campaign launch is set for the 14th. Thandi confirmed creative concepts are approved.
- Social media schedule: Sipho will publish 3 posts per week for the first month. Draft calendar due Friday.
- Budget approval: Ben still waiting on finance sign-off for the extra R40 000 on paid ads. Risk that paid rollout slips a week.
- Client presentation: Lerato to prepare the slide deck by the 11th so the team can review before the client call on the 12th.
- Decision: we launch organically on the 14th even if paid budget is delayed.
- Open question: who owns reporting after launch? Not resolved.`;

export const DEMO_TASKS: { name: string; deadline: string }[] = [
  { name: "Finish monthly report", deadline: "Friday" },
  { name: "Respond to client emails", deadline: "Today" },
  { name: "Prepare presentation", deadline: "Wednesday" },
  { name: "Attend team meeting", deadline: "Tomorrow 10:00" },
  { name: "Review project budget", deadline: "Thursday" },
];

export const DEMO_RESEARCH = "Impact of artificial intelligence on workplace productivity";

export const DEMO_EMAIL = {
  purpose: "Request a one week extension on the campaign report",
  recipient: "Thandi Nkosi, Marketing Lead",
  keyInfo:
    "Report is 70% complete. Waiting on finance figures from Ben. Client call moved to the 12th.",
  outcome: "Approval for a new deadline of the 19th",
};

const now = Date.now();

export const seedTasks: Task[] = DEMO_TASKS.map((t, i) => ({
  id: `seed-${i}`,
  name: t.name,
  priority: i < 2 ? "High" : i < 4 ? "Medium" : "Low",
  duration: i === 0 ? "2 hours" : "45 min",
  deadline: t.deadline,
  order: i + 1,
  done: false,
  source: "manual",
}));

export const seedActivity: Activity[] = [
  {
    id: "a1",
    kind: "meeting",
    title: "Summarised: Marketing campaign launch meeting",
    detail: "6 action items extracted",
    at: now - 1000 * 60 * 45,
  },
  {
    id: "a2",
    kind: "email",
    title: "Generated email: Budget sign-off follow up",
    detail: "Tone: Persuasive",
    at: now - 1000 * 60 * 60 * 5,
  },
  {
    id: "a3",
    kind: "research",
    title: "Research: AI and workplace productivity",
    detail: "Depth: Standard",
    at: now - 1000 * 60 * 60 * 26,
  },
];
