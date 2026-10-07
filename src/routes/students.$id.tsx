import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute("/students/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Student ${params.id} — L2E` },
      { name: "description", content: "Student profile with subscriptions and live Tap2Access credentials." },
      { property: "og:title", content: `Student ${params.id} — L2E` },
      { property: "og:description", content: "Student profile and live gate access." },
    ],
  }),
  component: StudentDetail,
});

function SubscribeSheet({ studentId, existing }: { studentId: string; existing: Subscription[] }) {
  const { services, subscribe } = useL2E();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [queued, setQueued] = useState<Subscription | null>(null);
  const live = queued ? existing.find((s) => s.id === queued.id) : null;
  const taken = new Set(existing.filter((s) => s.status === "ACTIVE" || s.status === "PENDING").map((s) => s.service_key));

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setQueued(null); setKey(""); } }}>
      <SheetTrigger asChild><Button size="sm"><Plus className="size-4" />Subscribe</Button></SheetTrigger>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader><SheetTitle>Subscribe to a service</SheetTitle><SheetDescription>Deduction is requested from Pebbles payroll. Access starts only after confirmation.</SheetDescription></SheetHeader>
        {!queued ? (
          <div className="flex flex-1 flex-col gap-4 px-4">
            <RadioGroup value={key} onValueChange={setKey} className="gap-2">
              {services.filter((s) => !s.archived).map((s) => (
                <label key={s.key} className={`flex items-center justify-between rounded-md border p-3 text-sm ${taken.has(s.key) ? "opacity-50" : "cursor-pointer hover:bg-muted/50"}`}>
                  <span className="flex items-center gap-2"><RadioGroupItem value={s.key} disabled={taken.has(s.key)} />{s.name}</span>
                  <span className="font-mono">{formatNaira(s.monthly_kobo)}<span className="text-muted-foreground">/mo</span></span>
                </label>
              ))}
            </RadioGroup>
            <Button disabled={!key} onClick={() => setQueued(subscribe(studentId, key))}>Request payroll deduction</Button>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            <div className="rounded-md border p-4 font-mono text-xs"><span className="text-muted-foreground">POST /students/{studentId}/subscriptions →</span> <b>202 Accepted</b></div>
            {live?.status === "ACTIVE" ? (
              <Alert className="border-success/40 bg-success/10"><ShieldCheck className="size-4 text-success" /><AlertTitle>Active — Pebbles confirmed</AlertTitle><AlertDescription>Access granted until {live.valid_until}.</AlertDescription></Alert>
            ) : (
              <Alert className="border-warning/50 bg-warning/10"><Clock className="size-4 pulse-dot text-warning" /><AlertTitle>Queued · Pending payroll confirmation</AlertTitle><AlertDescription>This is <b>not</b> a confirmed subscription yet. No gate access is granted until Pebbles confirms the deduction.</AlertDescription></Alert>
            )}
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>Close</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StudentDetail() {
  const { id } = Route.useParams();
  const { students, subs, services, tap2accessDown, withdrawStudent, unsubscribe } = useL2E();
  const s = students.find((x) => x.id === id);
  if (!s) return <div className="p-10 text-center text-muted-foreground">Student not found. <Link to="/students" className="text-primary">Back to roster</Link></div>;
  const mine = subs.filter((x) => x.student_id === id);
  const svc = (k: string) => services.find((x) => x.key === k);
  const entitlements = mine.filter((x) => grantsAccess(x));

  return (
    <>
      <Link to="/students" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" />Roster</Link>
      <PageHeader title={s.full_name} sub={`${s.id} · registered ${s.registered_at}`}
        actions={s.status === "ACTIVE" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="sm"><LogOut className="size-4" />Withdraw</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Withdraw {s.full_name}?</AlertDialogTitle><AlertDialogDescription>All subscriptions are cancelled and Pebbles stop instructions are queued. Access continues until each paid period ends.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { withdrawStudent(s.id); toast.success("Student withdrawn"); }}>Withdraw</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <Pill tone="muted">WITHDRAWN</Pill>} />

      {tap2accessDown && (
        <Alert className="mb-6 border-warning/50 bg-warning/10">
          <WifiOff className="size-4 text-warning" />
          <AlertTitle>Tap2Access unreachable — showing local L2E data only</AlertTitle>
          <AlertDescription className="font-mono text-xs">tap2access_error: "upstream timeout after 3000ms (GET /cards/{s.card_uid})"</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Subscriptions" actions={s.status === "ACTIVE" && <SubscribeSheet studentId={s.id} existing={mine} />}>
            <table className="w-full">
              <thead className="border-b bg-muted/40"><tr><th className={th}>Service</th><th className={th}>Amount</th><th className={th}>Status</th><th className={th}></th></tr></thead>
              <tbody className="divide-y">
                {mine.map((x) => (
                  <tr key={x.id}>
                    <td className={td}>{svc(x.service_key)?.name ?? x.service_key}</td>
                    <td className={td + " font-mono"}>{formatNaira(x.amount_kobo)}</td>
                    <td className={td}><SubBadge sub={x} /></td>
                    <td className={td + " text-right"}>{x.status === "ACTIVE" && <Button size="sm" variant="ghost" onClick={() => unsubscribe(x.id)}>Unsubscribe</Button>}</td>
                  </tr>
                ))}
                {mine.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">No subscriptions.</td></tr>}
              </tbody>
            </table>
          </Panel>
          <Panel title="Local profile">
            <dl className="grid grid-cols-2 gap-4 p-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Card UID</dt><dd className="font-mono">{s.card_uid}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Roster status</dt><dd>{s.status}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Access-granting subs</dt><dd>{entitlements.length}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Monthly payroll</dt><dd className="font-mono">{formatNaira(mine.filter((x) => x.status === "ACTIVE").reduce((a, b) => a + b.amount_kobo, 0))}</dd></div>
            </dl>
          </Panel>
        </div>

        <Panel title={<span className="flex items-center gap-2">Live access card <Hint tip="Queried live from Tap2Access on every view — never cached in L2E, to avoid state drift." /></span>}>
          {tap2accessDown ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground"><WifiOff className="size-6" />Live credentials unavailable.<br />Gate decisions continue at Tap2Access.</div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="relative overflow-hidden rounded-lg bg-sidebar p-4 text-sidebar-foreground">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest"><span>Tap2Access</span><CreditCard className="size-4" /></div>
                <p className="mt-6 font-mono text-lg tracking-[0.2em] text-sidebar-accent-foreground">{s.card_uid.match(/.{1,2}/g)?.join(" ")}</p>
                <div className="mt-3 flex justify-between text-xs"><span>{s.full_name}</span><span className={entitlements.length ? "text-sidebar-primary" : "text-destructive"}>{entitlements.length ? "● ENABLED" : "● NO ACCESS"}</span></div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><ShieldCheck className="size-3.5" />Active entitlements</p>
                {entitlements.length ? entitlements.map((e) => (
                  <div key={e.id} className="flex justify-between border-b py-1.5 text-sm last:border-0"><span>{svc(e.service_key)?.name}</span><span className="font-mono text-xs text-muted-foreground">→ {e.valid_until}</span></div>
                )) : <p className="text-sm text-muted-foreground">None</p>}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><KeyRound className="size-3.5" />Credentials</p>
                <div className="flex justify-between text-sm"><span className="font-mono text-xs">cred_{s.card_uid.slice(-4).toLowerCase()}</span><Pill tone="success">MIFARE · active</Pill></div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Cpu className="size-3.5" />Permitted devices</p>
                <div className="flex flex-wrap gap-1">{["Main Gate A", ...entitlements.map((e) => ({ gym: "Gym Turnstile", library_247: "Library Door 2", makerspace: "Makerspace Reader", shuttle: "Shuttle Reader" } as Record<string, string>)[e.service_key])].map((d) => <Pill key={d} tone="muted">{d}</Pill>)}</div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
