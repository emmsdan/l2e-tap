"use client";

import Link from "next/link";
import { Users, CheckCircle2, Fingerprint, CalendarClock, UserPlus, Scale, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, ReasonBadge, td } from "@/components/l2e/ui";
import { RegisterStudentDialog } from "@/components/l2e/RegisterStudentDialog";
import { useL2E } from "@/lib/l2e";

export default function Overview() {
  const { students, subs, taps, instructions } = useL2E();
  // Using fixed date as in original code
  const today = taps.filter((t) => t.at.startsWith("2026-10-07"));
  
  const metrics = [
    { label: "Total students", value: students.length, icon: Users },
    { label: "Active subscriptions", value: subs.filter((s) => s.status === "ACTIVE").length, icon: CheckCircle2 },
    { label: "Attendance taps", value: taps.length, icon: Fingerprint },
    { label: "Taps today", value: today.length, icon: CalendarClock },
  ];
  const denials = taps.filter((t) => t.decision === "DENY").slice(0, 6);
  const failed = instructions.filter((i) => i.status === "FAILED").length;
  const pending = subs.filter((s) => s.status === "PENDING").length;
  const name = (id: string | null) => students.find((s) => s.id === id)?.full_name ?? "Unknown card";

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-2 pb-6 border-b border-slate-200">
        <h1 className="text-4xl font-serif text-[#0b2866] tracking-tight">Talent Nation</h1>
        <h2 className="text-xl font-medium text-blue-600">Course: AI Engineering Fellowship</h2>
        <p className="text-slate-500 max-w-2xl mt-2">
          A practical AI Engineering Fellowship pathway for individuals who want to build real AI engineering skill, 
          sharpen their thinking, and learn the discipline of shipping useful work.
        </p>
      </div>

      <PageHeader title="Overview" sub="Wednesday, 7 October 2026"
        actions={<>
          <RegisterStudentDialog trigger={<Button className="bg-[#0b2866] hover:bg-[#153f93]"><UserPlus className="size-4 mr-2" />Register student</Button>} />
          <Button variant="outline" asChild><Link href="/pebbles"><Scale className="size-4 mr-2" />Reconcile Pebbles</Link></Button>
        </>} />
        
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-sm text-slate-500 font-medium">{label}<Icon className="size-5 text-blue-600" /></div>
            <p className="mt-4 font-sans text-4xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {(failed > 0 || pending > 0) && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {failed > 0 && <Link href="/pebbles" className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm transition-colors hover:bg-red-100"><AlertTriangle className="size-5 text-red-600" /><span><b>{failed}</b> payroll instructions failed and need manual review</span></Link>}
          {pending > 0 && <Link href="/students" className="flex items-center gap-4 rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm transition-colors hover:bg-orange-100"><CalendarClock className="size-5 text-orange-600" /><span><b>{pending}</b> subscriptions awaiting Pebbles confirmation</span></Link>}
        </div>
      )}

      <Panel className="mt-8 shadow-sm rounded-xl border-slate-200 bg-white" title="Recent access denials" actions={<Link href="/attendance" className="text-sm font-medium text-blue-600 hover:text-blue-800">View all</Link>}>
        <table className="w-full"><tbody className="divide-y divide-slate-100">
          {denials.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
              <td className={td + " font-mono text-xs text-slate-500 py-4"}>{t.at.slice(5, 16).replace("T", " ")}</td>
              <td className={td + " font-medium text-slate-900 py-4"}>{name(t.student_id)}</td>
              <td className={td + " hidden text-slate-500 sm:table-cell py-4"}>{t.device}</td>
              <td className={td + " text-right py-4"}>{t.reason && <ReasonBadge reason={t.reason} />}</td>
            </tr>
          ))}
        </tbody></table>
      </Panel>
    </div>
  );
}
