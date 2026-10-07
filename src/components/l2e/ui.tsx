import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { REASON_INFO, type DenyReason, type SubStatus, type Subscription } from "@/lib/l2e";
import { Clock, CheckCircle2, XCircle, Ban, Info } from "lucide-react";

const tones = {
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning border-warning/40",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-info/10 text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
} as const;
export type Tone = keyof typeof tones;

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function Hint({ children, tip }: { children?: ReactNode; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1">{children ?? <Info className="size-3.5 text-muted-foreground" />}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
    </Tooltip>
  );
}

const SUB: Record<SubStatus, { tone: Tone; label: string; icon: typeof Clock; tip: string }> = {
  PENDING: { tone: "warning", label: "Pending Payroll", icon: Clock, tip: "Queued for Pebbles. No access is granted until Pebbles confirms the deduction." },
  ACTIVE: { tone: "success", label: "Active", icon: CheckCircle2, tip: "Pebbles confirmed the deduction. Access granted." },
  CANCELLED: { tone: "info", label: "Cancelled", icon: Ban, tip: "Unsubscribed. Access remains until the paid period ends." },
  LAPSED: { tone: "muted", label: "Lapsed", icon: XCircle, tip: "Paid period ended. No access." },
};
export function SubBadge({ sub }: { sub: Pick<Subscription, "status" | "valid_until"> }) {
  const c = SUB[sub.status];
  const Icon = c.icon;
  const extra = sub.status === "ACTIVE" && sub.valid_until ? ` · until ${sub.valid_until}` : sub.status === "CANCELLED" && sub.valid_until ? ` · access until ${sub.valid_until}` : "";
  return (
    <Hint tip={c.tip}>
      <Pill tone={c.tone}><Icon className={cn("size-3", sub.status === "PENDING" && "pulse-dot")} />{c.label}{extra}</Pill>
    </Hint>
  );
}

export function ReasonBadge({ reason }: { reason: DenyReason }) {
  const r = REASON_INFO[reason];
  return <Hint tip={r.help}><Pill tone={r.tone} className="font-mono">{reason}</Pill></Hint>;
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, className }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-sm font-medium">{title}</h2>{actions}
        </header>
      )}
      {children}
    </section>
  );
}

export const th = "px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
export const td = "px-4 py-2.5 text-sm";
