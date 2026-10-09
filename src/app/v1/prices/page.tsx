"use client";

import { useState } from "react";
import { Archive, Pencil, Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, Panel, Pill, Hint, th, td } from "@/components/l2e/ui";
import { formatNaira, nairaToKobo, koboToNaira, useL2E, type Service } from "@/lib/l2e";
import { toast } from "sonner";
import { DEFAULT_SERVICES_LIST } from "@/lib/v2/support";

export default function Prices() {
  const { services, updatePrice, createService, archiveService } = useL2E();
  const [edit, setEdit] = useState<{ key: string; naira: string } | null>(null);
  const [confirm, setConfirm] = useState<{ svc: Service; kobo: number } | null>(null);
  const [archive, setArchive] = useState<Service | null>(null);

  // New Service Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newPriceNaira, setNewPriceNaira] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPriceNaira) return;
    const kobo = nairaToKobo(Number(newPriceNaira));
    if (kobo <= 0) {
      toast.error("Please enter a valid price greater than ₦0");
      return;
    }
    setCreating(true);
    try {
      const res = await createService({
        name: newName.trim(),
        key: newKey.trim() || undefined,
        amount_kobo: kobo,
      });
      if (res.ok) {
        toast.success(`Service "${newName.trim()}" created successfully`);
        setNewName("");
        setNewKey("");
        setNewPriceNaira("");
        setCreateOpen(false);
      } else {
        toast.error(res.message || "Failed to create service");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create service");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateDefault = async () => {
    if (!window.confirm("This will create all 8 default services with the prices below (if they don't already exist). Are you sure?")) {
      return;
    }

    const defaults = DEFAULT_SERVICES_LIST

    let created = 0;
    for (const svc of defaults) {
      // Check if service already exists by key
      try {
        const existing = services.find(s => s.key === svc.id);
        if (!existing) {
          const res = await createService({
            name: svc.name,
            key: svc.id,
            amount_kobo: svc.price * 100,
          } as any);
          if (res.ok) {
            created++;
          }
        }
      } catch (e) {
        console.error(e)
        toast.error("Failed to create service")
      }
    }

    toast.success(`${created} new services created`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Service price catalogue"
        sub="Prices stored as integer kobo; shown in Naira."
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0b2866] hover:bg-[#153f93] text-white">
                  <Plus className="size-4 mr-1.5" /> New Service / Price
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[#0b2866]">Create New Service</DialogTitle>
                  <DialogDescription>
                    Add a new service catalogue item and set its monthly price in Naira.
                  </DialogDescription>
                </DialogHeader>
                <Button className="bg-[#0b2866] hover:bg-[#153f93] text-white" onClick={handleCreateDefault}>
                  <Plus className="size-4 mr-1.5" /> Create Default Prices List
                </Button>
                <form onSubmit={handleCreate} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input
                      id="service-name"
                      placeholder="e.g. Campus Cafeteria Meal Plan"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        if (!newKey || newKey === newName.toLowerCase().replace(/[^a-z0-9]+/g, "_")) {
                          setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="service-key">Service Key (Identifier)</Label>
                    <Input
                      id="service-key"
                      placeholder="e.g. cafeteria_meal_plan"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-[11px] text-slate-500">Unique identifier used for NFC gates and subscriptions</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="service-price">Monthly Price (₦ Naira)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-medium">₦</span>
                      <Input
                        id="service-price"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="5000"
                        className="pl-8 font-mono"
                        value={newPriceNaira}
                        onChange={(e) => setNewPriceNaira(e.target.value)}
                        required
                      />
                    </div>
                    {newPriceNaira && Number(newPriceNaira) > 0 && (
                      <p className="text-[11px] font-mono text-slate-500">
                        = {nairaToKobo(Number(newPriceNaira)).toLocaleString()} kobo
                      </p>
                    )}
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={creating} className="bg-[#0b2866] hover:bg-[#153f93] text-white">
                      {creating ? "Creating..." : "Create Service"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm shadow-sm">
        <RefreshCcw className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p className="text-blue-900">
          <b className="font-semibold text-[#0b2866]">Auto-repricing:</b> changing a price queues an <span className="font-mono text-xs bg-white px-1 py-0.5 rounded border border-blue-100">UPDATE</span> payroll instruction to Pebbles for every active subscriber of that service. New amounts apply from the next deduction cycle.
        </p>
      </div>

      <Panel className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className={th}>Service</th>
                <th className={th}>Monthly price</th>
                <th className={th}><Hint tip="Subscribers whose payroll instruction will be updated on price change.">Active subs</Hint></th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s.key} className={`hover:bg-slate-50 transition-colors ${s.archived ? "text-slate-400 bg-slate-50" : ""}`}>
                  <td className={td}>
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">{s.key}</p>
                  </td>
                  <td className={td}>
                    {edit?.key === s.key ? (
                      <form className="flex items-center gap-2" onSubmit={(e) => {
                        e.preventDefault();
                        const k = nairaToKobo(Number(edit.naira));
                        if (k > 0 && k !== s.monthly_kobo) setConfirm({ svc: s, kobo: k });
                        else setEdit(null);
                      }}>
                        <span className="text-slate-400 font-medium">₦</span>
                        <Input autoFocus type="number" min={1} step="0.01" value={edit.naira} onChange={(e) => setEdit({ ...edit, naira: e.target.value })} className="h-8 w-32 font-mono border-slate-300" />
                        <Button size="sm" type="submit" className="bg-[#0b2866] hover:bg-[#153f93]">Save</Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => setEdit(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <div>
                        <span className="font-mono font-medium text-slate-800">{formatNaira(s.monthly_kobo)}</span>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">{s.monthly_kobo.toLocaleString()} kobo</p>
                      </div>
                    )}
                  </td>
                  <td className={td}>
                    <Pill tone={s.active_subscribers ? "success" : "muted"} className={s.active_subscribers ? "bg-green-100 text-green-700 border-green-200" : ""}>
                      {s.active_subscribers}
                    </Pill>
                  </td>
                  <td className={td + " text-right"}>
                    {s.archived ? <Pill tone="muted" className="bg-slate-100 border-slate-200 text-slate-600">Archived</Pill> : (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50" aria-label="Edit price" onClick={() => setEdit({ key: s.key, naira: String(koboToNaira(s.monthly_kobo)) })}><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-slate-500 hover:text-red-600 hover:bg-red-50" aria-label="Archive" onClick={() => setArchive(s)}><Archive className="size-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0b2866]">Update {confirm?.svc.name} price?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-mono text-base text-slate-500 line-through">{confirm && formatNaira(confirm.svc.monthly_kobo)}</p>
                  <span className="text-slate-400">→</span>
                  <p className="font-mono text-lg font-bold text-[#0b2866]">{confirm && formatNaira(confirm.kobo)}</p>
                </div>
                <p className="rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-900 shadow-sm text-sm">
                  This will automatically queue amount updates for all <b>{confirm?.svc.active_subscribers}</b> active subscribers.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#0b2866] hover:bg-[#153f93] text-white" onClick={async () => {
              if (!confirm) return;
              const n = await updatePrice(confirm.svc.key, confirm.kobo);
              toast.success(`Price updated · ${n} payroll updates queued`);
              setEdit(null);
              setConfirm(null);
            }}>Update & queue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!archive} onOpenChange={(o) => !o && setArchive(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0b2866]">Archive {archive?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              New subscriptions will be blocked. Existing subscriptions are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => { if (archive) await archiveService(archive.key); setArchive(null); }}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
