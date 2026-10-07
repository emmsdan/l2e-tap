"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CreditCard, Cpu, ShieldCheck, WifiOff, LogOut, Plus, Clock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader, Panel, Pill, SubBadge, Hint, th, td } from "@/components/l2e/ui";
import { formatNaira, grantsAccess, useL2E, type Subscription } from "@/lib/l2e";
import { toast } from "sonner";

function SubscribeSheet({ studentId, existing }: { studentId: string; existing: Subscription[] }) {
  const { services, subscribe } = useL2E();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [queued, setQueued] = useState<Subscription | null>(null);
  const live = queued ? existing.find((s) => s.id === queued.id) : null;
  const taken = new Set(existing.filter((s) => s.status === "ACTIVE" || s.status === "PENDING").map((s) => s.service_key));

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setQueued(null); setKey(""); } }}>
      <SheetTrigger asChild><Button size="sm" className="bg-[#0b2866] hover:bg-[#153f93]"><Plus className="size-4 mr-2" />Subscribe</Button></SheetTrigger>
      <SheetContent className="flex flex-col gap-4 bg-white border-l border-slate-200">
        <SheetHeader>
          <SheetTitle className="text-[#0b2866]">Subscribe to a service</SheetTitle>
          <SheetDescription className="text-slate-500">Deduction is requested from Pebbles payroll. Access starts only after confirmation.</SheetDescription>
        </SheetHeader>
        {!queued ? (
          <div className="flex flex-1 flex-col gap-4 px-1 mt-4">
            <RadioGroup value={key} onValueChange={setKey} className="gap-3">
              {services.filter((s) => !s.archived).map((s) => (
                <label key={s.key} className={`flex items-center justify-between rounded-lg border p-4 text-sm transition-colors ${taken.has(s.key) ? "opacity-50 border-slate-200 bg-slate-50" : "cursor-pointer hover:bg-blue-50 hover:border-blue-200 border-slate-200 bg-white"}`}>
                  <span className="flex items-center gap-3 font-medium text-slate-800"><RadioGroupItem value={s.key} disabled={taken.has(s.key)} />{s.name}</span>
                  <span className="font-mono text-slate-900">{formatNaira(s.monthly_kobo)}<span className="text-slate-500 font-sans">/mo</span></span>
                </label>
              ))}
            </RadioGroup>
            <Button disabled={!key} onClick={() => setQueued(subscribe(studentId, key))} className="mt-4 bg-[#0b2866] hover:bg-[#153f93]">Request payroll deduction</Button>
          </div>
        ) : (
          <div className="space-y-6 px-1 mt-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-700">
              <span className="text-slate-500">POST /students/{studentId}/subscriptions →</span> <b className="text-blue-700">202 Accepted</b>
            </div>
            {live?.status === "ACTIVE" ? (
              <Alert className="border-green-200 bg-green-50 shadow-sm">
                <ShieldCheck className="size-5 text-green-600" />
                <AlertTitle className="text-green-800 font-medium">Active — Pebbles confirmed</AlertTitle>
                <AlertDescription className="text-green-700 mt-1">Access granted until {live.valid_until}.</AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-200 bg-orange-50 shadow-sm">
                <Clock className="size-5 pulse-dot text-orange-500" />
                <AlertTitle className="text-orange-800 font-medium">Queued · Pending payroll confirmation</AlertTitle>
                <AlertDescription className="text-orange-700 mt-1">This is <b>not</b> a confirmed subscription yet. No gate access is granted until Pebbles confirms the deduction.</AlertDescription>
              </Alert>
            )}
            <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>Close</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function StudentDetail() {
  const params = useParams();
  const id = params.id as string;
  const { students, subs, services, tap2accessDown, withdrawStudent, unsubscribe } = useL2E();
  
  const s = students.find((x) => x.id === id);
  if (!s) return <div className="p-10 text-center text-slate-500">Student not found. <Link href="/students" className="text-blue-600 hover:underline">Back to roster</Link></div>;
  
  const mine = subs.filter((x) => x.student_id === id);
  const svc = (k: string) => services.find((x) => x.key === k);
  const entitlements = mine.filter((x) => grantsAccess(x));

  return (
    <div className="animate-in fade-in duration-300">
      <Link href="/students" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-700 transition-colors">
        <ArrowLeft className="size-4" /> Back to Roster
      </Link>
      
      <PageHeader title={s.full_name} sub={`${s.id} · registered ${s.registered_at}`}
        actions={s.status === "ACTIVE" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors"><LogOut className="size-4 mr-2" />Withdraw</Button></AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#0b2866]">Withdraw {s.full_name}?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500">All subscriptions are cancelled and Pebbles stop instructions are queued. Access continues until each paid period ends.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { withdrawStudent(s.id); toast.success("Student withdrawn"); }}>Withdraw Student</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <Pill tone="muted">WITHDRAWN</Pill>} />

      {tap2accessDown && (
        <Alert className="mb-8 border-orange-200 bg-orange-50 shadow-sm">
          <WifiOff className="size-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">Tap2Access unreachable — showing local L2E data only</AlertTitle>
          <AlertDescription className="font-mono text-xs text-orange-800 mt-2">tap2access_error: "upstream timeout after 3000ms (GET /cards/{s.card_uid})"</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Subscriptions" actions={s.status === "ACTIVE" && <SubscribeSheet studentId={s.id} existing={mine} />} className="border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className={th}>Service</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Status</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {mine.map((x) => (
                    <tr key={x.id} className="hover:bg-slate-50 transition-colors">
                      <td className={td + " font-medium text-slate-800"}>{svc(x.service_key)?.name ?? x.service_key}</td>
                      <td className={td + " font-mono text-slate-600"}>{formatNaira(x.amount_kobo)}</td>
                      <td className={td}><SubBadge sub={x} /></td>
                      <td className={td + " text-right"}>
                        {x.status === "ACTIVE" && <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => unsubscribe(x.id)}>Unsubscribe</Button>}
                      </td>
                    </tr>
                  ))}
                  {mine.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-500">No subscriptions found for this student.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
          
          <Panel title="Local profile" className="border-slate-200 shadow-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6 p-6 text-sm bg-white rounded-b-lg">
              <div><dt className="text-xs font-medium text-slate-500 mb-1">Card UID</dt><dd className="font-mono text-slate-900 bg-slate-100 inline-block px-2 py-1 rounded">{s.card_uid}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500 mb-1">Roster status</dt><dd className="font-medium text-slate-900">{s.status}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500 mb-1">Access-granting subs</dt><dd className="font-medium text-slate-900 text-lg">{entitlements.length}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500 mb-1">Monthly payroll</dt><dd className="font-mono text-slate-900 font-semibold">{formatNaira(mine.filter((x) => x.status === "ACTIVE").reduce((a, b) => a + b.amount_kobo, 0))}</dd></div>
            </dl>
          </Panel>
        </div>

        <Panel title={<span className="flex items-center gap-2 text-[#0b2866]">Live access card <Hint tip="Queried live from Tap2Access on every view — never cached in L2E, to avoid state drift." /></span>} className="border-slate-200 shadow-sm border-t-4 border-t-[#0b2866]">
          {tap2accessDown ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-slate-500 bg-slate-50 rounded-b-lg">
              <div className="p-3 bg-white rounded-full shadow-sm"><WifiOff className="size-6 text-slate-400" /></div>
              <p>Live credentials unavailable.<br />Gate decisions continue at Tap2Access.</p>
            </div>
          ) : (
            <div className="space-y-6 p-5 bg-white rounded-b-lg">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0b2866] to-[#153f93] p-5 text-white shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CreditCard className="size-24 -mr-4 -mt-4" />
                </div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-medium opacity-80 relative z-10">
                  <span>Tap2Access</span><CreditCard className="size-4" />
                </div>
                <p className="mt-8 font-mono text-xl tracking-[0.2em] font-medium relative z-10 drop-shadow-sm">{s.card_uid.match(/.{1,2}/g)?.join(" ")}</p>
                <div className="mt-4 flex justify-between text-sm font-medium relative z-10">
                  <span className="truncate pr-4">{s.full_name}</span>
                  <span className={entitlements.length ? "text-orange-400" : "text-red-300"}>{entitlements.length ? "● ENABLED" : "● NO ACCESS"}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><ShieldCheck className="size-4 text-blue-500" />Active entitlements</p>
                {entitlements.length ? entitlements.map((e) => (
                  <div key={e.id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <span className="font-medium text-slate-800">{svc(e.service_key)?.name}</span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">→ {e.valid_until}</span>
                  </div>
                )) : <p className="text-sm text-slate-500 italic">None</p>}
              </div>
              
              <div className="pt-2">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><KeyRound className="size-4 text-blue-500" />Credentials</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">cred_{s.card_uid.slice(-4).toLowerCase()}</span>
                  <Pill tone="success" className="bg-green-100 text-green-700 border-green-200">MIFARE · active</Pill>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Cpu className="size-4 text-blue-500" />Permitted devices</p>
                <div className="flex flex-wrap gap-2">
                  {["Main Gate A", ...entitlements.map((e) => ({ gym: "Gym Turnstile", library_247: "Library Door 2", makerspace: "Makerspace Reader", shuttle: "Shuttle Reader" } as Record<string, string>)[e.service_key])].map((d) => 
                    <Pill key={d} tone="muted" className="bg-slate-100 text-slate-600 border-slate-200">{d}</Pill>
                  )}
                </div>
              </div>
            </div>
          )}
        </Panel>
        
        <div className="lg:col-span-3">
          <Panel title="Recent usage (Gate Taps)" className="border-slate-200 shadow-sm" actions={<Link href={`/attendance?sid=${s.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">View in access logs</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className={th}>Time</th>
                    <th className={th}>Device</th>
                    <th className={th}>Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(() => {
                    const myTaps = useL2E().taps.filter(t => t.student_id === s.id).slice(0, 5);
                    if (myTaps.length === 0) return <tr><td colSpan={3} className="p-8 text-center text-sm text-slate-500">No recent gate taps found.</td></tr>;
                    return myTaps.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className={td + " font-mono text-xs text-slate-600"}>{t.at.replace("T", " ").slice(0, 16)}</td>
                        <td className={td + " text-slate-700"}>{t.device}</td>
                        <td className={td}>
                          <Pill tone={t.decision === "ALLOW" ? "success" : "danger"} className={t.decision === "ALLOW" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                            {t.decision} {t.reason && `· ${t.reason}`}
                          </Pill>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
