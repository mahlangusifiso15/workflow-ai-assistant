export function aiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: unknown }).message);
    if (m && !m.startsWith("Error:")) return m;
    return m.replace(/^Error:\s*/, "");
  }
  return "The AI request failed. Please try again.";
}
