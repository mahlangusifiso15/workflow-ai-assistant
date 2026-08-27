const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class AiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function friendly(status: number, message: string) {
  if (status === 429) return "The AI assistant is busy right now. Please try again in a moment.";
  if (status === 402) return "AI credits have run out for this workspace. Add credits to continue.";
  if (status === 403) return "AI access is currently blocked for this workspace.";
  if (status === 401) return "The AI service is not configured correctly.";
  return message || "The AI request failed. Please try again.";
}

async function call(messages: ChatMessage[], json: boolean) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError(401, "The AI service is not configured correctly.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    let msg = "";
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      msg = body?.error?.message ?? body?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new AiError(res.status, friendly(res.status, msg));
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) throw new AiError(502, "The AI returned an empty response. Try again.");
  return content;
}

export async function aiText(messages: ChatMessage[]) {
  return call(messages, false);
}

export async function aiJson<T>(prompt: string): Promise<T> {
  const raw = await call([{ role: "user", content: prompt }], true);
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new AiError(502, "The AI response could not be read. Please regenerate.");
  }
}
