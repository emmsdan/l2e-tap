import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Pill, SubBadge, th, td } from "@/components/l2e/ui";
import { RegisterStudentDialog } from "@/components/l2e/RegisterStudentDialog";
import { useL2E } from "@/lib/l2e";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Student Roster — L2E" },
      { name: "description", content: "Search and manage L2E fellows, cards and subscription status." },
      { property: "og:title", content: "Student Roster — L2E" },
      { property: "og:description", content: "Search and manage L2E fellows and cards." },
    ],
  }),
  component: Students,
});

const PAGE = 8;

function Students() {
  const { students, subs } = useL2E();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const rows = useMemo(() => students.filter((s) =>
    (status === "all" || s.status === status) &&
    (!q || `${s.id} ${s.full_name} ${s.card_uid}`.toLowerCase().includes(q.toLowerCase()))), [students, q, status]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <PageHeader title="Students" sub={`${students.length} fellows on roster`} actions={<RegisterStudentDialog trigger={<Button><UserPlus className="size-4" />Register</Button>} />} />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search name, ID or card UID" className="pl-8" />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="WITHDRAWN">Withdrawn</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/40"><tr><th className={th}>Student</th><th className={th}>Card UID</th><th className={th}>Status</th><th className={th}>Subscriptions</th></tr></thead>
            <tbody className="divide-y">
              {view.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className={td}><Link to="/students/$id" params={{ id: s.id }} className="font-medium hover:text-primary">{s.full_name}</Link><div className="font-mono text-xs text-muted-foreground">{s.id}</div></td>
                  <td className={td + " font-mono text-xs"}>{s.card_uid}</td>
                  <td className={td}><Pill tone={s.status === "ACTIVE" ? "success" : "muted"}>{s.status}</Pill></td>
                  <td className={td}><div className="flex flex-wrap gap-1">{subs.filter((x) => x.student_id === s.id).map((x) => <SubBadge key={x.id} sub={{ status: x.status }} />)}</div></td>
                </tr>
              ))}
              {view.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No students match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <span>Page {page + 1} of {pages}</span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" /></Button>
            <Button size="icon" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
