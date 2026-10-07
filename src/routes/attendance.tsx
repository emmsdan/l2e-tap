import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Pill, ReasonBadge, th, td } from "@/components/l2e/ui";
import { REASON_INFO, useL2E, type DenyReason } from "@/lib/l2e";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Access Logs — L2E" },
      { name: "description", content: "Gate tap history with access denials and reason codes." },
      { property: "og:title", content: "Access Logs — L2E" },
      { property: "og:description", content: "Gate tap history with access denials and reason codes." },
    ],
  }),
  component: Attendance,
});

function Attendance() {
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
    <>
      <PageHeader title="Access logs & exceptions" sub={`${taps.length} taps · ${taps.filter((t) => t.decision === "DENY").length} denied`} />
      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
        {denyCounts.map(({ r, n }) => (
          <button key={r} onClick={() => setReason(reason === r ? "all" : r)}
            className={cn("rounded-lg border bg-card p-3 text-left transition-colors", reason === r && "ring-2 ring-ring")}>
            <p className={cn("font-mono text-2xl", REASON_INFO[r].tone === "danger" ? "text-destructive" : "text-warning")}>{n}</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">{r}</p>
          </button>
        ))}
      </div>
      <Panel>
        <div className="flex flex-wrap gap-2 border-b p-3">
          <Input placeholder="Student ID" value={sid} onChange={(e) => setSid(e.target.value)} className="w-36 font-mono" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          <Select value={decision} onValueChange={setDecision}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Any decision</SelectItem><SelectItem value="ALLOW">ALLOW</SelectItem><SelectItem value="DENY">DENY</SelectItem></SelectContent></Select>
          <Select value={reason} onValueChange={setReason}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Any reason</SelectItem>{Object.keys(REASON_INFO).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/40"><tr><th className={th}>Time</th><th className={th}>Student</th><th className={th}>Device</th><th className={th}>Decision</th><th className={th}>Reason</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((t) => {
                const tone = t.reason ? REASON_INFO[t.reason].tone : null;
                return (
                  <tr key={t.id} className={cn(tone === "danger" && "bg-destructive/5", tone === "warning" && "bg-warning/5")}>
                    <td className={td + " font-mono text-xs"}>{t.at.replace("T", " ").slice(0, 16)}</td>
                    <td className={td}>{name(t.student_id) ?? <span className="text-muted-foreground">—</span>}<div className="font-mono text-xs text-muted-foreground">{t.student_id ?? t.card_uid}</div></td>
                    <td className={td + " text-muted-foreground"}>{t.device}</td>
                    <td className={td}><Pill tone={t.decision === "ALLOW" ? "success" : tone === "warning" ? "warning" : "danger"}>{t.decision}</Pill></td>
                    <td className={td}>{t.reason && <ReasonBadge reason={t.reason} />}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No taps match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
