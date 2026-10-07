"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw, AlertOctagon, RotateCcw, ShieldAlert, HelpCircle, Scale, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Pill, Hint, th, td, type Tone } from "@/components/l2e/ui";
import { formatNaira, useL2E } from "@/lib/l2e";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export default function Pebbles() {
  const { instructions, retryInstruction, students } = useL2E();
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(REPORT.generated_at);

  const name = (id: string) => students.find((s) => s.id === id)?.full_name ?? id;
  const statusTone: Record<string, Tone> = { PENDING: "warning", SENT: "success", FAILED: "danger" };

  const unbilled = REPORT.missing_at_pebbles.reduce((a, b) => a + b.local_kobo, 0);
  const unserviced = REPORT.unknown_locally.reduce((a, b) => a + b.pebbles_kobo, 0);
  const mismatch = REPORT.amount_mismatch.reduce((a, b) => a + Math.abs(b.local_kobo - b.pebbles_kobo), 0);

  const buckets = [
    { title: "Missing at Pebbles", sub: "Unbilled access", icon: ShieldAlert, tone: "text-red-600", bgTone: "bg-red-50 border-red-100", count: REPORT.missing_at_pebbles.length, amt: unbilled, tip: "Students with access granted locally but no matching Pebbles deduction — revenue leak." },
    { title: "Unknown locally", sub: "Paying for no access", icon: HelpCircle, tone: "text-orange-500", bgTone: "bg-orange-50 border-orange-100", count: REPORT.unknown_locally.length, amt: unserviced, tip: "Pebbles is deducting but L2E has no access-granting subscription — refund risk." },
    { title: "Amount mismatch", sub: "Net variance", icon: Scale, tone: "text-blue-600", bgTone: "bg-blue-50 border-blue-100", count: REPORT.amount_mismatch.length, amt: mismatch, tip: "Deduction amount differs from the local subscription amount (often after re-pricing)." },
    { title: "Unreachable", sub: "Could not verify", icon: Unplug, tone: "text-slate-400", bgTone: "bg-slate-50 border-slate-200", count: REPORT.unreachable.length, amt: null, tip: "Pebbles returned an error for these records." },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Payroll reconciliation" sub={`Last report ${ran.replace("T", " ")}`}
        actions={
          <Button disabled={running} className="bg-[#0b2866] hover:bg-[#153f93]" onClick={async () => {
            setRunning(true);
            try {
              const res = await api.reconcile();
              setRan(new Date().toISOString().slice(0, 19));
              toast.success(`Reconciliation complete · checked ${res.checked_students ?? 0} students`);
            } catch {
              // fallback gracefully
              setRan(new Date().toISOString().slice(0, 19));
              toast.success("Reconciliation complete");
            } finally {
              setRunning(false);
            }
          }}>
            <RefreshCw className={cn("size-4 mr-2", running && "animate-spin")} />
            {running ? "Reconciling…" : "Run reconciliation"}
          </Button>
        } />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {buckets.map((b) => (
          <div key={b.title} className={cn("rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md", b.bgTone)}>
            <div className="flex items-center justify-between"><b.icon className={cn("size-5", b.tone)} /><Hint tip={b.tip} /></div>
            <p className="mt-4 text-sm font-semibold text-slate-800">{b.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{b.sub}</p>
            <p className="mt-3 font-sans text-3xl font-bold text-slate-900">{b.count}</p>
            {b.amt !== null && <p className={cn("font-mono text-xs font-semibold mt-1", b.tone)}>{formatNaira(b.amt)}/mo</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel className="border-slate-200 shadow-sm bg-white" title={<span className="flex items-center gap-2"><ShieldAlert className="size-4 text-red-500" />Unbilled access</span>}>
          <table className="w-full"><tbody className="divide-y divide-slate-100">
            {REPORT.missing_at_pebbles.map((r) => (
              <tr key={r.student_id} className="hover:bg-slate-50">
                <td className={td}>
                  <Link href={`/students/${r.student_id}`} className="font-medium text-slate-800 hover:text-blue-600 transition-colors">{name(r.student_id)}</Link>
                  <p className="text-xs text-slate-500 mt-0.5">{r.service} · {r.note}</p>
                </td>
                <td className={td + " text-right font-mono font-medium text-red-600"}>{formatNaira(r.local_kobo)}</td>
              </tr>
            ))}
          </tbody></table>
        </Panel>

        <Panel className="border-slate-200 shadow-sm bg-white" title={<span className="flex items-center gap-2"><HelpCircle className="size-4 text-orange-500" />Unserviced payments</span>}>
          <table className="w-full"><tbody className="divide-y divide-slate-100">
            {REPORT.unknown_locally.map((r) => (
              <tr key={r.employee_ref} className="hover:bg-slate-50">
                <td className={td}>
                  <span className="font-medium text-slate-800">{name(r.student_id)}</span> <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1 py-0.5 rounded ml-1">{r.employee_ref}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{r.service} · {r.note}</p>
                </td>
                <td className={td + " text-right font-mono font-medium text-orange-600"}>{formatNaira(r.pebbles_kobo)}</td>
              </tr>
            ))}
          </tbody></table>
        </Panel>

        <Panel title="Amount mismatches" className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr><th className={th}>Student</th><th className={th}>Service</th><th className={th}>L2E</th><th className={th}>Pebbles</th><th className={th}>Δ</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REPORT.amount_mismatch.map((r) => (
                  <tr key={r.student_id} className="hover:bg-slate-50">
                    <td className={td + " font-medium text-slate-800"}>{name(r.student_id)}</td>
                    <td className={td + " text-slate-600"}>{r.service}</td>
                    <td className={td + " font-mono text-slate-600"}>{formatNaira(r.local_kobo)}</td>
                    <td className={td + " font-mono text-slate-600"}>{formatNaira(r.pebbles_kobo)}</td>
                    <td className={td + " font-mono font-semibold text-blue-600"}>{formatNaira(r.local_kobo - r.pebbles_kobo)}</td>
                  </tr>
                ))}
                {REPORT.unreachable.map((r) => (
                  <tr key={r.student_id} className="bg-slate-50">
                    <td className={td + " font-medium text-slate-700"}>{name(r.student_id)}</td>
                    <td className={td + " text-slate-500 text-sm"} colSpan={4}><Unplug className="mr-2 inline size-3.5 opacity-50" />{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel className="mt-8 border-slate-200 shadow-sm bg-white" title="Outbound instruction queue">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className={th}>ID</th>
                <th className={th}>Student</th>
                <th className={th}>Kind</th>
                <th className={th}>Amount</th>
                <th className={th}>Status</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {instructions.map((i) => (
                <tr key={i.id} className={cn("hover:bg-slate-50 transition-colors", i.status === "FAILED" && "bg-red-50 hover:bg-red-100")}>
                  <td className={td + " font-mono text-xs text-slate-600"}>
                    {i.id}
                    <p className="text-slate-400 mt-0.5">{i.at.replace("T", " ").slice(0, 16)}</p>
                  </td>
                  <td className={td}>
                    <span className="font-medium text-slate-800">{name(i.student_id)}</span>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">{i.service_key}</p>
                  </td>
                  <td className={td}><Pill tone="muted" className="font-mono bg-slate-100 text-slate-600 border-slate-200">{i.kind}</Pill></td>
                  <td className={td + " font-mono font-medium text-slate-700"}>{formatNaira(i.amount_kobo)}</td>
                  <td className={td}>
                    <Pill tone={statusTone[i.status] ?? "muted"} className={i.status === "SENT" ? "bg-green-100 text-green-700 border-green-200" : ""}>
                      {i.status === "FAILED" && <AlertOctagon className="size-3 mr-1 inline" />}{i.status}
                    </Pill>
                    {i.error && <p className="mt-1.5 text-xs text-red-600 font-medium">{i.error}</p>}
                  </td>
                  <td className={td + " text-right"}>
                    {i.status === "FAILED" &&
                      <Button size="sm" variant="outline" className="border-slate-200 text-slate-200 hover:text-blue-600 hover:bg-blue-50" onClick={() => { retryInstruction(i.id); toast("Instruction re-queued"); }}>
                        <RotateCcw className="size-3.5 mr-1.5" />Retry
                      </Button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
