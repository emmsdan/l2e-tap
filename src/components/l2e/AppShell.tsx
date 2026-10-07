import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Users, Tags, DoorOpen, Scale, Moon, Sun, KeyRound, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useL2E } from "@/lib/l2e";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/prices", label: "Pricing", icon: Tags },
  { to: "/attendance", label: "Access Logs", icon: DoorOpen },
  { to: "/pebbles", label: "Reconciliation", icon: Scale },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("l2e-theme") === "dark"); }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("l2e-theme", dark ? "dark" : "light"); }, [dark]);
  return (
    <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function SettingsDialog() {
  const { apiKey, authMode, setAuth, tap2accessDown, setTap2accessDown } = useL2E();
  const [k, setK] = useState(apiKey);
  const [m, setM] = useState(authMode);
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm"><KeyRound className="size-4" />API</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API connection</DialogTitle>
          <DialogDescription>Credentials sent with every request to the L2E API.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={m} onValueChange={(v) => setM(v as typeof m)} className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="x-api-key" />X-Api-Key header</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="bearer" />Authorization: Bearer</label>
          </RadioGroup>
          <div className="space-y-1.5"><Label>Key</Label><Input type="password" value={k} onChange={(e) => setK(e.target.value)} placeholder="l2e_live_…" className="font-mono" /></div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div><p className="text-sm font-medium">Simulate Tap2Access outage</p><p className="text-xs text-muted-foreground">Demo the degraded profile view.</p></div>
            <Switch checked={tap2accessDown} onCheckedChange={setTap2accessDown} />
          </div>
        </div>
        <DialogFooter><Button onClick={() => { setAuth(k, m); toast.success("API settings saved"); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Health() {
  const { tap2accessDown } = useL2E();
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 10000); return () => clearInterval(t); }, []);
  const items = [
    { k: "/health", ok: true },
    { k: "/ready", ok: !tap2accessDown },
  ];
  return (
    <div className="space-y-1.5 px-3 text-xs" data-tick={tick}>
      <p className="px-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">System</p>
      {items.map((i) => (
        <div key={i.k} className="flex items-center justify-between rounded px-1 py-0.5">
          <span className="font-mono">{i.k}</span>
          <span className="flex items-center gap-1.5">
            {i.ok ? <Wifi className="size-3 text-sidebar-primary" /> : <WifiOff className="size-3 text-destructive" />}
            <span className={i.ok ? "text-sidebar-primary" : "text-destructive"}>{i.ok ? "ok" : "degraded"}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid size-7 place-items-center rounded-md bg-sidebar-primary font-mono text-xs font-bold text-sidebar-primary-foreground">L2E</div>
          <div className="leading-tight"><p className="text-sm font-semibold text-sidebar-accent-foreground">Learn to Earn</p><p className="text-[10px] text-sidebar-foreground/60">Campus Operations</p></div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}>
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border py-4"><Health /></div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} activeOptions={{ exact: to === "/" }} aria-label={label} className="rounded-md p-2 text-muted-foreground" activeProps={{ className: "bg-accent text-accent-foreground" }}><Icon className="size-4" /></Link>
            ))}
          </nav>
          <p className="hidden font-mono text-xs text-muted-foreground md:block">api.l2e.campus / v1</p>
          <div className="flex items-center gap-2"><SettingsDialog /><ThemeToggle /></div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
