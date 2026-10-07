import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw, AlertOctagon, RotateCcw, ShieldAlert, HelpCircle, Scale, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Pill, Hint, th, td, type Tone } from "@/components/l2e/ui";
import { formatNaira, useL2E } from "@/lib/l2e";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/pebbles")({
  head: () => ({
    meta: [
      { title: "Payroll Reconciliation — L2E" },
      { name: "description", content: "Pebbles payroll instruction queue and discrepancy audit." },
      { property: "og:title", content: "Payroll Reconciliation — L2E" },
      { property: "og:description", content: "Pebbles payroll instruction queue and discrepancy audit." },
    ],
  }),
  component: Pebbles,
});

const REPORT = {
  generated_at: "2026-10-07T10:42:00",
  missing_at_pebbles: [
    { student_id: "L2E-1004", service: "Campus Shuttle", local_kobo: 800000, note: "ACTIVE locally, no deduction found" },
    { student_id: "L2E-1008", service: "Campus Gym", local_kobo: 3000000, note: "ACTIVE locally, no deduction found" },
  ],
  unknown_locally: [
    { employee_ref: "PB-77120", student_id: "L2E-1006", service: "Library 24/7", pebbles_kobo: 1500000, note: "Deducting, but sub is LAPSED" },
  ],
  amount_mismatch: [
    { student_id: "L2E-1005", service: "Campus Gym", local_kobo: 3000000, pebbles_kobo: 2500000 },
    { student_id: "L2E-1013", service: "Makerspace Lab", local_kobo: 4500000, pebbles_kobo: 4000000 },
  ],
  unreachable: [{ student_id: "L2E-1010", note: "Pebbles 404 employee record" }],
};

function Pebbles() {
  const { instructions, retryInstruction, students } = useL2E();
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(REPORT.generated_at);
  const name = (id: string) => students.find((s) => s.id === id)?.full_name ?? id;
  const statusTone: Record<string, Tone> = { PENDING: "warning", SENT: "success", FAILED: "danger" };
  const unbilled = REPORT.missing_at_pebbles.reduce((a, b) => a + b.local_kobo, 0);
  const unserviced = REPORT.unknown_locally.reduce((a, b) => a + b.pebbles_kobo, 0);
  const mismatch = REPORT.amount_mismatch.reduce((a, b) => a + Math.abs(b.local_kobo - b.pebbles_kobo), 0);

  const buckets = [
    { title: "Missing at Pebbles", sub: "Unbilled access", icon: ShieldAlert, tone: "text-destructive", count: REPORT.missing_at_pebbles.length, amt: unbilled, tip: "Students with access granted locally but no matching Pebbles deduction — revenue leak." },
    { title: "Unknown locally", sub: "Paying for no access", icon: HelpCircle, tone: "text-warning", count: REPORT.unknown_locally.length, amt: unserviced, tip: "Pebbles is deducting but L2E has no access-granting subscription — refund risk." },
    { title: "Amount mismatch", sub: "Net variance", icon: Scale, tone: "text-info", count: REPORT.amount_mismatch.length, amt: mismatch, tip: "Deduction amount differs from the local subscription amount (often after re-pricing)." },
    { title: "Unreachable", sub: "Could not verify", icon: Unplug, tone: "text-muted-foreground", count: REPORT.unreachable.length, amt: null, tip: "Pebbles returned an error for these records." },
  ];

  return (
    <>
      <PageHeader title="Payroll reconciliation" sub={`Last report ${ran.replace("T", " ")}`}
        actions={<Button disabled={running} onClick={() => { setRunning(true); setTimeout(() => { setRunning(false); setRan(new Date().toISOString().slice(0, 19)); toast.success("Reconciliation complete"); }, 1200); }}>
          <RefreshCw className={cn("size-4", running && "animate-spin")} />{running ? "Reconciling…" : "Run reconciliation"}</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {buckets.map((b) => (
          <div key={b.title} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between"><b.icon className={cn("size-4", b.tone)} /><Hint tip={b.tip} /></div>
            <p className="mt-3 text-sm font-medium">{b.title}</p>
            <p className="text-xs text-muted-foreground">{b.sub}</p>
            <p className="mt-3 font-mono text-2xl">{b.count}</p>
            {b.amt !== null && <p className={cn("font-mono text-xs", b.tone)}>{formatNaira(b.amt)}/mo</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2"><ShieldAlert className="size-4 text-destructive" />Unbilled access</span>}>
          <table className="w-full"><tbody className="divide-y">
            {REPORT.missing_at_pebbles.map((r) => (
              <tr key={r.student_id}><td className={td}><Link to="/students/$id" params={{ id: r.student_id }} className="hover:text-primary">{name(r.student_id)}</Link><p className="text-xs text-muted-foreground">{r.service} · {r.note}</p></td><td className={td + " text-right font-mono text-destructive"}>{formatNaira(r.local_kobo)}</td></tr>
            ))}
          </tbody></table>
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><HelpCircle className="size-4 text-warning" />Unserviced payments</span>}>
          <table className="w-full"><tbody className="divide-y">
            {REPORT.unknown_locally.map((r) => (
              <tr key={r.employee_ref}><td className={td}>{name(r.student_id)} <span className="font-mono text-xs text-muted-foreground">{r.employee_ref}</span><p className="text-xs text-muted-foreground">{r.service} · {r.note}</p></td><td className={td + " text-right font-mono text-warning"}>{formatNaira(r.pebbles_kobo)}</td></tr>
            ))}
          </tbody></table>
        </Panel>
        <Panel title="Amount mismatches" className="lg:col-span-2">
          <table className="w-full">
            <thead className="border-b bg-muted/40"><tr><th className={th}>Student</th><th className={th}>Service</th><th className={th}>L2E</th><th className={th}>Pebbles</th><th className={th}>Δ</th></tr></thead>
            <tbody className="divide-y">
              {REPORT.amount_mismatch.map((r) => (
                <tr key={r.student_id}><td className={td}>{name(r.student_id)}</td><td className={td}>{r.service}</td><td className={td + " font-mono"}>{formatNaira(r.local_kobo)}</td><td className={td + " font-mono"}>{formatNaira(r.pebbles_kobo)}</td><td className={td + " font-mono text-info"}>{formatNaira(r.local_kobo - r.pebbles_kobo)}</td></tr>
              ))}
              {REPORT.unreachable.map((r) => (
                <tr key={r.student_id} className="bg-muted/30"><td className={td}>{name(r.student_id)}</td><td className={td + " text-muted-foreground"} colSpan={4}><Unplug className="mr-1 inline size-3" />{r.note}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel className="mt-6" title="Outbound instruction queue">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/40"><tr><th className={th}>ID</th><th className={th}>Student</th><th className={th}>Kind</th><th className={th}>Amount</th><th className={th}>Status</th><th className={th}></th></tr></thead>
            <tbody className="divide-y">
              {instructions.map((i) => (
                <tr key={i.id} className={i.status === "FAILED" ? "bg-destructive/5" : ""}>
                  <td className={td + " font-mono text-xs"}>{i.id}<p className="text-muted-foreground">{i.at.replace("T", " ").slice(0, 16)}</p></td>
                  <td className={td}>{name(i.student_id)}<p className="font-mono text-xs text-muted-foreground">{i.service_key}</p></td>
                  <td className={td}><Pill tone="muted" className="font-mono">{i.kind}</Pill></td>
                  <td className={td + " font-mono"}>{formatNaira(i.amount_kobo)}</td>
                  <td className={td}><Pill tone={statusTone[i.status] ?? "muted"}>{i.status === "FAILED" && <AlertOctagon className="size-3" />}{i.status}</Pill>{i.error && <p className="mt-1 text-xs text-destructive">{i.error}</p>}</td>
                  <td className={td + " text-right"}>{i.status === "FAILED" && <Button size="sm" variant="outline" onClick={() => { retryInstruction(i.id); toast("Instruction re-queued"); }}><RotateCcw className="size-3.5" />Retry</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
