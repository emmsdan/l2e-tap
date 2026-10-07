import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, CheckCircle2, Fingerprint, CalendarClock, UserPlus, Scale, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, ReasonBadge, td } from "@/components/l2e/ui";
import { RegisterStudentDialog } from "@/components/l2e/RegisterStudentDialog";
import { useL2E } from "@/lib/l2e";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — L2E Campus Operations" },
      { name: "description", content: "Live metrics for students, subscriptions and gate taps across the L2E campus." },
      { property: "og:title", content: "Overview — L2E Campus Operations" },
      { property: "og:description", content: "Live metrics for students, subscriptions and gate taps." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { students, subs, taps, instructions } = useL2E();
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
    <>
      <PageHeader title="Overview" sub="Wednesday, 7 October 2026"
        actions={<>
          <RegisterStudentDialog trigger={<Button><UserPlus className="size-4" />Register student</Button>} />
          <Button variant="outline" asChild><Link to="/pebbles"><Scale className="size-4" />Reconcile Pebbles</Link></Button>
        </>} />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">{label}<Icon className="size-4" /></div>
            <p className="mt-3 font-mono text-3xl font-medium">{value}</p>
          </div>
        ))}
      </div>

      {(failed > 0 || pending > 0) && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {failed > 0 && <Link to="/pebbles" className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><AlertTriangle className="size-4 text-destructive" /><span><b>{failed}</b> payroll instructions failed and need manual review</span></Link>}
          {pending > 0 && <Link to="/students" className="flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm"><CalendarClock className="size-4 text-warning" /><span><b>{pending}</b> subscriptions awaiting Pebbles confirmation</span></Link>}
        </div>
      )}

      <Panel className="mt-6" title="Recent access denials" actions={<Link to="/attendance" className="text-xs text-primary">View all</Link>}>
        <table className="w-full"><tbody className="divide-y">
          {denials.map((t) => (
            <tr key={t.id}>
              <td className={td + " font-mono text-xs text-muted-foreground"}>{t.at.slice(5, 16).replace("T", " ")}</td>
              <td className={td}>{name(t.student_id)}</td>
              <td className={td + " hidden text-muted-foreground sm:table-cell"}>{t.device}</td>
              <td className={td + " text-right"}>{t.reason && <ReasonBadge reason={t.reason} />}</td>
            </tr>
          ))}
        </tbody></table>
      </Panel>
    </>
  );
}
