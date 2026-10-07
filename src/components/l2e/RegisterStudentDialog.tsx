import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { normaliseCardUid, useL2E } from "@/lib/l2e";
import { toast } from "sonner";

export function RegisterStudentDialog({ trigger }: { trigger: ReactNode }) {
  const { registerStudent } = useL2E();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ student_id: "", full_name: "", card_uid: "" });
  const [err, setErr] = useState<string | null>(null);
  const uid = normaliseCardUid(f.card_uid);
  const valid = f.student_id && f.full_name && uid.length >= 8;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setErr(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Register student</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const r = registerStudent({ ...f, card_uid: uid });
          if (!r.ok) { setErr(r.message); return; }
          toast.success(`${f.full_name} registered`);
          setF({ student_id: "", full_name: "", card_uid: "" }); setOpen(false);
        }}>
          {err && (
            <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>409 · Duplicate</AlertTitle><AlertDescription>{err}</AlertDescription></Alert>
          )}
          <div className="space-y-1.5"><Label>Student ID</Label><Input value={f.student_id} onChange={(e) => setF({ ...f, student_id: e.target.value })} placeholder="L2E-1050" className="font-mono" /></div>
          <div className="space-y-1.5"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Card UID</Label>
            <Input value={f.card_uid} onChange={(e) => setF({ ...f, card_uid: e.target.value })} placeholder="04:a2:3f:9b" className="font-mono" />
            <p className="text-xs text-muted-foreground">Normalised: <span className="font-mono text-foreground">{uid || "—"}</span>{uid && uid.length < 8 && " (min 8 hex chars)"}</p>
          </div>
          <DialogFooter><Button type="submit" disabled={!valid}>Register</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
