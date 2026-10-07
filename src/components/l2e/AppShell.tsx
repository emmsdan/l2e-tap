"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Users, Tags, DoorOpen, Scale, KeyRound, Wifi, WifiOff, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useL2E } from "@/lib/l2e";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "Tap2Pay", icon: ShoppingCart },
  { to: "/students", label: "Students", icon: Users },
  { to: "/prices", label: "Pricing", icon: Tags },
  { to: "/attendance", label: "Access Logs", icon: DoorOpen },
  { to: "/pebbles", label: "Reconciliation", icon: Scale },
] as const;

function SettingsDialog() {
  const { apiKey, authMode, setAuth, tap2accessDown, setTap2accessDown } = useL2E();
  const [k, setK] = useState(apiKey);
  const [m, setM] = useState(authMode);
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm"><KeyRound className="size-4 mr-2" />API</Button></DialogTrigger>
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
    { k: "health", ok: true },
    { k: "ready", ok: !tap2accessDown },
  ];
  return (
    <div className="space-y-1.5 px-3 text-xs" data-tick={tick}>
      <p className="px-1 text-[10px] uppercase tracking-wider text-slate-400">System</p>
      {items.map((i) => (
        <div key={i.k} className="flex items-center justify-between rounded px-1 py-0.5">
          <span className="font-mono">{i.k}</span>
          <span className="flex items-center gap-1.5">
            {i.ok ? <Wifi className="size-3 text-white" /> : <WifiOff className="size-3 text-red-400" />}
            <span className={i.ok ? "text-white" : "text-red-400"}>{i.ok ? "ok" : "degraded"}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Using explicit NO DARKMODE strategy. Colors are forced into the light-mode/sidebar-blue style.

  if (pathname === "/" || pathname.startsWith("/portal") || pathname.startsWith("/pos")) {
    return <main className="font-sans min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen font-sans bg-[#f4f7fb]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#0b2866] text-white md:flex shadow-xl shadow-blue-900/10 z-20">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="grid size-10 place-items-center bg-[#183980] rounded-lg text-xs font-bold font-sans tracking-tight">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20L20 10V30L10 20Z" fill="white" />
              <path d="M30 20L20 10V30L30 20Z" fill="white" />
            </svg>
          </div>
          <div className="leading-none flex flex-col">
            <span className="text-xl font-bold font-sans tracking-tight">LEARN</span>
            <span className="text-xl font-bold font-sans tracking-tight text-white -mt-0.5">2EARN</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-2 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link key={to} href={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-[#183980] text-white shadow-inner" : "text-slate-300 hover:bg-[#183980] hover:text-white"}`}>
                {active && <div className="absolute left-0 w-1.5 h-8 bg-orange-500 rounded-r-full" />}
                <Icon className={`size-5 ${active ? "text-orange-500" : "text-slate-300"}`} />{label}
              </Link>
            );
          })}
        </nav>
        <div className="py-6 px-3 bg-[#081d4a]"><Health /></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.map(({ to, icon: Icon, label }) => (
              <Link key={to} href={to} aria-label={label} className="rounded-md p-2 text-slate-500"><Icon className="size-5" /></Link>
            ))}
          </nav>
          <div className="flex-1"></div>
          <div className="flex items-center gap-3"><SettingsDialog /></div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
