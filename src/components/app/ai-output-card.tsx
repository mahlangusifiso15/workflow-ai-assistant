import { useState, type ReactNode } from "react";
import { Copy, Check, Pencil, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-ai px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ai-foreground",
        className,
      )}
    >
      <Sparkles className="size-3" aria-hidden />
      AI Generated
    </span>
  );
}

export function copyText(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success("Copied to clipboard"))
    .catch(() => toast.error("Could not copy. Select the text and copy manually."));
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        copyText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {label}
    </Button>
  );
}

export function AiOutputCard({
  title,
  subtitle,
  copyValue,
  onEdit,
  editing,
  onSave,
  onRegenerate,
  regenerating,
  extraActions,
  children,
}: {
  title: string;
  subtitle?: string;
  copyValue?: string;
  onEdit?: () => void;
  editing?: boolean;
  onSave?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  extraActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <AiBadge />
          </div>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {copyValue !== undefined && <CopyButton text={copyValue} />}
          {onEdit && (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-4" />
              {editing ? "Done editing" : "Edit"}
            </Button>
          )}
          {onSave && (
            <Button type="button" variant="outline" size="sm" onClick={onSave}>
              <Save className="size-4" />
              Save
            </Button>
          )}
          {onRegenerate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={regenerating}
            >
              <RefreshCw className={cn("size-4", regenerating && "animate-spin")} />
              Regenerate
            </Button>
          )}
          {extraActions}
        </div>
      </header>
      <div className="space-y-4 px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-10 text-center shadow-card">
      <div className="mx-auto size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <p className="mt-4 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">This usually takes a few seconds.</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-5 py-4">
      <p className="text-sm font-semibold text-destructive">Something went wrong</p>
      <p className="mt-1 text-sm text-foreground/80">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

export function InputNotice({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}
