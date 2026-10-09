"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Pill, ReasonBadge, th, td } from "@/components/l2e/ui";
import { REASON_INFO, useL2E, type DenyReason } from "@/lib/l2e";
import { cn } from "@/lib/utils";

export default function Attendance() {
  const { taps, students } = useL2E();
  const [sid, setSid] = useState("");
  const [decision, setDecision] = useState("all");
  const [reason, setReason] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => taps.filter((t) =>
    (!sid || (t.student_id ?? "").toLowerCase().includes(sid.toLowerCase())) &&
    (decision === "all" || t.decision === decision) &&
    (reason === "all" || t.reason === reason) &&
    (!from || t.at.slice(0, 10) >= from) && (!to || t.at.slice(0, 10) <= to)), [taps, sid, decision, reason, from, to]);

  const denyCounts = (Object.keys(REASON_INFO) as DenyReason[]).map((r) => ({ r, n: taps.filter((t) => t.reason === r).length }));
  const name = (id: string | null) => students.find((s) => s.id === id)?.full_name;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Access logs & exceptions" sub={`${taps.length} taps · ${taps.filter((t) => t.decision === "DENY").length} denied`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {denyCounts.map(({ r, n }) => (
          <button key={r} onClick={() => setReason(reason === r ? "all" : r)}
            className={cn(
              "rounded-xl border bg-white p-4 text-left transition-all shadow-sm hover:shadow",
              reason === r ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200"
            )}>
            <p className={cn("font-mono text-3xl font-semibold", REASON_INFO[r].tone === "danger" ? "text-red-600" : "text-orange-500")}>{n}</p>
            <p className="mt-2 font-mono text-[10px] text-slate-500 truncate" title={r}>{r}</p>
          </button>
        ))}
      </div>

      <Panel className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50 p-4">
          <Input placeholder="Student ID or Email address" value={sid} onChange={(e) => setSid(e.target.value)} className="w-56 font-mono bg-white border-slate-200" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 bg-white border-slate-200" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 bg-white border-slate-200" />
          <Select value={decision} onValueChange={setDecision}>
            <SelectTrigger className="w-40 bg-white border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any decision</SelectItem>
              <SelectItem value="ALLOW">ALLOW</SelectItem>
              <SelectItem value="DENY">DENY</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-64 bg-white border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any reason</SelectItem>
              {Object.keys(REASON_INFO).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className={th}>Time</th>
                <th className={th}>Student</th>
                <th className={th}>Device</th>
                <th className={th}>Decision</th>
                <th className={th}>Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => {
                const tone = t.reason ? REASON_INFO[t.reason].tone : null;
                return (
                  <tr key={t.id} className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    tone === "danger" && "bg-red-50/50 hover:bg-red-50",
                    tone === "warning" && "bg-orange-50/50 hover:bg-orange-50"
                  )}>
                    <td className={td + " font-mono text-xs text-slate-600"}>{t.at.replace("T", " ").slice(0, 16)}</td>
                    <td className={td}>
                      <span className="font-medium text-slate-800">{name(t.student_id) ?? <span className="text-slate-400">—</span>}</span>
                      <div className="font-mono text-xs text-slate-500 mt-0.5">{t.student_id ?? t.card_uid}</div>
                    </td>
                    <td className={td + " text-slate-600 text-sm"}>{t.device}</td>
                    <td className={td}>
                      <Pill tone={t.decision === "ALLOW" ? "success" : tone === "warning" ? "warning" : "danger"}
                        className={t.decision === "ALLOW" ? "bg-green-100 text-green-700 border-green-200" : ""}>
                        {t.decision}
                      </Pill>
                    </td>
                    <td className={td}>{t.reason && <ReasonBadge reason={t.reason} />}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-sm text-slate-500">No taps match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
