"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Pill, SubBadge, th, td } from "@/components/l2e/ui";
import { RegisterStudentDialog } from "@/components/l2e/RegisterStudentDialog";
import { useL2E } from "@/lib/l2e";

const PAGE = 8;

export default function Students() {
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
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <PageHeader
        title="Students"
        sub={`${students.length} fellows on roster`}
        actions={<RegisterStudentDialog trigger={<Button className="bg-[#0b2866] hover:bg-[#153f93]"><UserPlus className="size-4 mr-2" />Register</Button>} />}
      />

      <Panel className="border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder="Search name, ID or card UID"
              className="pl-9 bg-white border-slate-200"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-44 bg-white border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className={th}>Student</th>
                <th className={th}>Card UID</th>
                <th className={th}>Status</th>
                <th className={th}>Subscriptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {view.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className={td}>
                    <Link href={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                      {s.full_name}
                    </Link>
                    <div className="font-mono text-xs text-slate-500 mt-0.5">{s.id}</div>
                  </td>
                  <td className={td + " font-mono text-xs text-slate-600"}>{s.card_uid}</td>
                  <td className={td}>
                    <Pill tone={s.status === "ACTIVE" ? "success" : "muted"}>{s.status}</Pill>
                  </td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1.5">
                      {subs.filter((x) => x.student_id === s.id).map((x) =>
                        <SubBadge key={x.id} sub={{ status: x.status, valid_until: x.valid_until }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {view.length === 0 &&
                <tr>
                  <td colSpan={4} className="p-12 text-center text-sm text-slate-500">
                    No students match your search criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
          <span className="font-medium">Page {page + 1} of {pages}</span>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8 bg-white" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 bg-white" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
