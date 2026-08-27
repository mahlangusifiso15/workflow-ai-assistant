import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  emailPrompt,
  meetingPrompt,
  plannerPrompt,
  researchPrompt,
  chatSystemPrompt,
} from "./ai/prompts";
import type {
  EmailResult,
  MeetingResult,
  PlannerResult,
  ResearchResult,
} from "./types";

const toneSchema = z.enum(["Formal", "Friendly", "Persuasive", "Concise"]);

const emailSchema = z.object({
  purpose: z.string().min(1),
  recipient: z.string().min(1),
  keyInfo: z.string().min(1),
  outcome: z.string().min(1),
  tone: toneSchema,
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai/gateway.server");
    const r = await aiJson<EmailResult>(emailPrompt(data));
    return {
      subject: r.subject ?? "",
      body: r.body ?? "",
      nextAction: r.nextAction ?? "",
      missingInfo: r.missingInfo ?? [],
    } satisfies EmailResult;
  });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ notes: z.string().min(20) }).parse(d))
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai/gateway.server");
    const r = await aiJson<MeetingResult>(meetingPrompt(data.notes));
    return {
      summary: r.summary ?? "",
      keyPoints: r.keyPoints ?? [],
      decisions: r.decisions ?? [],
      actionItems: r.actionItems ?? [],
      risks: r.risks ?? [],
      nextSteps: r.nextSteps ?? [],
      missingInfo: r.missingInfo ?? [],
    } satisfies MeetingResult;
  });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        tasks: z
          .array(
            z.object({
              name: z.string().min(1),
              deadline: z.string().optional(),
              notes: z.string().optional(),
            }),
          )
          .min(1),
        horizon: z.enum(["Daily", "Weekly"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai/gateway.server");
    const r = await aiJson<PlannerResult>(plannerPrompt(data));
    return {
      planned: r.planned ?? [],
      schedule: r.schedule ?? [],
      advice: r.advice ?? "",
      missingInfo: r.missingInfo ?? [],
    } satisfies PlannerResult;
  });

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        question: z.string().min(3),
        purpose: z.string().min(1),
        depth: z.enum(["Quick overview", "Standard", "Detailed"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai/gateway.server");
    const r = await aiJson<ResearchResult>(researchPrompt(data));
    return {
      summary: r.summary ?? "",
      keyFindings: r.keyFindings ?? [],
      concepts: r.concepts ?? [],
      benefits: r.benefits ?? [],
      risks: r.risks ?? [],
      recommendations: r.recommendations ?? [],
      furtherQuestions: r.furtherQuestions ?? [],
      verificationNote:
        r.verificationNote ??
        "This response was generated without external sources. Verify important details independently.",
    } satisfies ResearchResult;
  });

export const workplaceChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1),
            }),
          )
          .min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { aiText } = await import("./ai/gateway.server");
    const reply = await aiText([
      { role: "system", content: chatSystemPrompt },
      ...data.messages,
    ]);
    return { reply };
  });
