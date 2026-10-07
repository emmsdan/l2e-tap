import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, Pencil, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, Panel, Pill, Hint, th, td } from "@/components/l2e/ui";
import { formatNaira, nairaToKobo, koboToNaira, useL2E, type Service } from "@/lib/l2e";
import { toast } from "sonner";

export const Route = createFileRoute("/prices")({
  head: () => ({
    meta: [
      { title: "Service Pricing — L2E" },
      { name: "description", content: "Manage monthly service prices in Naira with automatic payroll re-pricing." },
      { property: "og:title", content: "Service Pricing — L2E" },
      { property: "og:description", content: "Manage monthly service prices with automatic re-pricing." },
    ],
  }),
  component: Prices,
});

function Prices() {
  const { services, updatePrice, archiveService } = useL2E();
  const [edit, setEdit] = useState<{ key: string; naira: string } | null>(null);
  const [confirm, setConfirm] = useState<{ svc: Service; kobo: number } | null>(null);
  const [archive, setArchive] = useState<Service | null>(null);

  return (
    <>
      <PageHeader title="Service price catalogue" sub="Prices stored as integer kobo; shown in Naira." />
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 p-4 text-sm">
        <RefreshCcw className="mt-0.5 size-4 shrink-0 text-info" />
        <p><b>Auto-repricing:</b> changing a price queues an <span className="font-mono text-xs">UPDATE</span> payroll instruction to Pebbles for every active subscriber of that service. New amounts apply from the next deduction cycle.</p>
      </div>
      <Panel>
        <table className="w-full">
          <thead className="border-b bg-muted/40"><tr><th className={th}>Service</th><th className={th}>Monthly price</th><th className={th}><Hint tip="Subscribers whose payroll instruction will be updated on price change.">Active subs</Hint></th><th className={th}></th></tr></thead>
          <tbody className="divide-y">
            {services.map((s) => (
              <tr key={s.key} className={s.archived ? "opacity-50" : ""}>
                <td className={td}><p className="font-medium">{s.name}</p><p className="font-mono text-xs text-muted-foreground">{s.key}</p></td>
                <td className={td}>
                  {edit?.key === s.key ? (
                    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const k = nairaToKobo(Number(edit.naira)); if (k > 0 && k !== s.monthly_kobo) setConfirm({ svc: s, kobo: k }); else setEdit(null); }}>
                      <span className="text-muted-foreground">₦</span>
                      <Input autoFocus type="number" min={1} step="0.01" value={edit.naira} onChange={(e) => setEdit({ ...edit, naira: e.target.value })} className="h-8 w-32 font-mono" />
                      <Button size="sm" type="submit">Save</Button><Button size="sm" variant="ghost" type="button" onClick={() => setEdit(null)}>Cancel</Button>
                    </form>
                  ) : (
                    <div><span className="font-mono">{formatNaira(s.monthly_kobo)}</span><p className="font-mono text-[11px] text-muted-foreground">{s.monthly_kobo.toLocaleString()} kobo</p></div>
                  )}
                </td>
                <td className={td}><Pill tone={s.active_subscribers ? "success" : "muted"}>{s.active_subscribers}</Pill></td>
                <td className={td + " text-right"}>
                  {s.archived ? <Pill tone="muted">Archived</Pill> : (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Edit price" onClick={() => setEdit({ key: s.key, naira: String(koboToNaira(s.monthly_kobo)) })}><Pencil className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Archive" onClick={() => setArchive(s)}><Archive className="size-4" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update {confirm?.svc.name} price?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="font-mono text-base text-foreground">{confirm && formatNaira(confirm.svc.monthly_kobo)} → {confirm && formatNaira(confirm.kobo)}</p>
                <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-foreground">This will automatically queue amount updates for all <b>{confirm?.svc.active_subscribers}</b> active subscribers.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (!confirm) return; const n = updatePrice(confirm.svc.key, confirm.kobo); toast.success(`Price updated · ${n} payroll updates queued`); setEdit(null); setConfirm(null); }}>Update & queue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!archive} onOpenChange={(o) => !o && setArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Archive {archive?.name}?</AlertDialogTitle><AlertDialogDescription>New subscriptions will be blocked. Existing subscriptions are unaffected.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (archive) archiveService(archive.key); setArchive(null); }}>Archive</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
