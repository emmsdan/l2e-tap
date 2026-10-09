"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Nfc, Wallet, RotateCcw, TrendingUp, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { money, getServiceIcon } from "@/lib/v2/support";
import { useWorkspace, total } from "@/lib/v2/workspace";
import { toast } from "sonner";

export default function Dashboard() {
  const {
    data,
    update,
    ready,
    selectStudent,
    loginStudent,
    logoutStudent,
    refreshWorkspace,
    subscribeStudentApi,
    unsubscribeStudentApi,
  } = useWorkspace();
  const [inputStudentId, setInputStudentId] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputStudentId.trim()) return;
    setLoggingIn(true);
    try {
      await loginStudent(inputStudentId.trim());
      toast.success(`Welcome! Student account loaded.`);
      setShowSwitchModal(false);
      setInputStudentId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load student record");
    } finally {
      setLoggingIn(false);
    }
  };

  if (!ready) {
    return <div className="site-width py-16 text-muted-foreground">Loading your dashboard…</div>;
  }

  if (!s) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="w-full max-w-md mx-auto p-6 bg-card border rounded-2xl shadow-sm text-center">
          <Image src="/logo.svg" alt="Learn2Earn" width={104} height={40} className="brand-logo mx-auto mb-6" />
          <h1 className="page-heading text-2xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Enter your Student ID to view your live wallet, active subscriptions, and NFC access card.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label htmlFor="student-id-input" className="block text-xs font-medium text-muted-foreground mb-1">
                Student ID / Fellow Code
              </label>
              <input
                id="student-id-input"
                type="text"
                placeholder="e.g. L2E-1234 or STU-1"
                value={inputStudentId}
                onChange={(e) => setInputStudentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                disabled={loggingIn}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loggingIn || !inputStudentId.trim()}>
              {loggingIn ? "Loading fellow account…" : "Access dashboard"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or create new</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/register">Register new student account</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const spent = total(s.subscriptions, data.catalog);
  const balance = s.monthlyStipend - spent;
  const item = data.catalog.find((c) => c.id === pending);
  const active = !!pending && s.subscriptions.includes(pending);

  return (
    <>
      <header className="site-header">
        <div className="site-width flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logo.svg" alt="Learn2Earn" width={104} height={40} className="brand-logo" />
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {s.campus} · {s.mode === "onsite" ? "Onsite" : "Online"}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition cursor-pointer"
              title="Click to switch student account"
            >
              <div className="hidden sm:block text-right">
                <span className="text-sm font-semibold block leading-tight">
                  {s.firstName} {s.lastName}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono block">
                  ID: {s.id}
                </span>
              </div>
              <span className="avatar">
                {s.firstName[0]}
                {s.lastName[0]}
              </span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSwitchModal(true)}
            >
              Switch ID
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={logoutStudent}
              className="text-muted-foreground hover:text-foreground"
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="site-width !py-[40px]">
        <h1 className="page-heading">Hey {s.firstName}</h1>
        <p className="text-muted-foreground">Month {s.monthsEnrolled} of your programme. Here's where your money is going.</p>

        <div className="dashboard-top mt-6">
          <div className="wallet-panel">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm flex gap-2 items-center">
                  <Wallet className="size-4" />
                  Wallet balance this month
                </p>
                <strong className="display text-5xl block mt-3">{money(balance)}</strong>
              </div>
              <span className="text-sm">{s.subscriptions.length} active</span>
            </div>
            <progress className="wallet-progress" max={s.monthlyStipend} value={Math.min(spent, s.monthlyStipend)} />
            <div className="grid grid-cols-3 gap-4 mt-5">
              {[
                ["Monthly pay", s.monthlyStipend],
                ["Subscribed", spent],
                ["Left over", balance],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs opacity-80">{label}</p>
                  <strong className="block mt-1">{money(Number(value))}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-panel">
            <p className="text-sm text-muted-foreground flex gap-2">
              <TrendingUp className="size-4" />
              Total spent on training
            </p>
            <strong className="display text-4xl block mt-3">{money(spent * s.monthsEnrolled)}</strong>
            <p className="text-sm text-muted-foreground mt-2">
              {money(spent)} × {s.monthsEnrolled} months
            </p>
            <div className="month-bars mt-5">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={i < s.monthsEnrolled ? "month-bar active" : "month-bar"} />
              ))}
            </div>
            <label className="text-xs text-muted-foreground flex justify-between mt-4 items-center">
              Months enrolled
              <select
                className="form-select"
                aria-label="Months enrolled"
                value={s.monthsEnrolled}
                onChange={(e) =>
                  update((w) => ({
                    ...w,
                    student: w.student ? { ...w.student, monthsEnrolled: Number(e.target.value) } : null,
                  }))
                }
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Your subscriptions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Turn anything off when you don't need it. It stops billing next cycle.
              </p>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">{money(spent)}/mo</span>
          </div>

          <div className="subscription-grid mt-5">
            {data.catalog
              .filter((c) => !c.archived && c.modes.includes(s.mode))
              .map((c) => {
                const on = s.subscriptions.includes(c.id);
                const Icon = getServiceIcon(c.id || c.name);
                return (
                  <div key={c.id} className={on ? "subscription-card subscribed" : "subscription-card"}>
                    <div className="flex gap-3 items-start">
                      <span className="service-icon shrink-0">
                        <Icon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="text-sm">{c.name}</strong>
                        <p className="text-sm text-muted-foreground">{money(c.price)} /mo</p>
                      </div>
                      <Switch
                        checked={on}
                        aria-label={(on ? "Unsubscribe from " : "Subscribe to ") + c.name}
                        onCheckedChange={() => setPending(c.id)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{c.description}</p>
                    {c.tapAccess && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-3">
                        <Nfc className="size-3" />
                        Card access {on ? "enabled" : "disabled"}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </section>

        <section className="dashboard-bottom mt-10">
          <div className="dashboard-panel">
            <div className="flex justify-between items-center">
              <p className="flex gap-2 text-sm text-muted-foreground items-center">
                <CreditCard className="size-4" />
                Your NFC student card
              </p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Tap2Access
              </span>
            </div>
            <div className="nfc-card mt-4">
              <div className="flex justify-between text-sm">
                <span>Learn2Earn</span>
                <Nfc className="size-5" />
              </div>
              <p className="display text-xl font-bold mt-8">{s.cardId}</p>
              <div className="flex justify-between items-end mt-1">
                <p className="text-sm opacity-80">
                  {s.firstName} {s.lastName}
                </p>
                <span className="text-xs opacity-60 font-mono">{s.id}</span>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ["Student ID", s.id],
                ["Card UID", s.cardId],
                ["Campus", s.campus],
                ["Mode", s.mode === "onsite" ? "Onsite" : "Online"],
                ["State", s.state],
                ["Email", s.email],
              ].map(([k, v]) => (
                <div className="summary-line gap-4" key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="dashboard-panel">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Recent activity</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Live Attendance Logs
              </span>
            </div>
            <div className="mt-5 divide-y max-h-96 overflow-y-auto pr-1">
              {s.activity.map((a, i) => (
                <div key={i} className="py-4">
                  <strong className="text-sm">{a.label}</strong>
                  <p className="text-sm text-muted-foreground mt-1">{a.detail}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              ))}
              {!s.activity.length && (
                <p className="text-sm text-muted-foreground py-4">No attendance or tap activity recorded yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {active ? "Unsubscribe from" : "Subscribe to"} {item?.name}?
            </DialogTitle>
            <DialogDescription>
              Your monthly package goes from {money(spent)} to{" "}
              {money(spent + (active ? -1 : 1) * (item?.price ?? 0))}, leaving{" "}
              {money(balance + (active ? 1 : -1) * (item?.price ?? 0))} in your wallet.
              {item?.tapAccess
                ? " Card access for this service will be switched " + (active ? "off." : "on.")
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Keep as is
            </Button>
            <Button
              onClick={async () => {
                if (!item) return;
                const itemId = item.id;
                try {
                  if (active) {
                    await unsubscribeStudentApi(s.id, itemId);
                    toast.success(`Unsubscribed from ${item.name}`);
                  } else {
                    await subscribeStudentApi(s.id, itemId);
                    toast.success(`Subscribed to ${item.name}`);
                  }
                } catch (e) {
                  toast.error(`Action failed: ${e instanceof Error ? e.message : "Unknown error"}`);
                }
                setPending(null);
              }}
            >
              {active ? "Unsubscribe" : "Subscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSwitchModal} onOpenChange={setShowSwitchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Student Account</DialogTitle>
            <DialogDescription>
              Enter the student ID of the fellow account you would like to view or switch to.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4 my-2">
            <div>
              <label htmlFor="switch-student-id-input" className="block text-xs font-medium text-muted-foreground mb-1">
                Student ID
              </label>
              <input
                id="switch-student-id-input"
                type="text"
                placeholder="e.g. L2E-1001 or STU-1"
                value={inputStudentId}
                onChange={(e) => setInputStudentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                disabled={loggingIn}
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowSwitchModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loggingIn || !inputStudentId.trim()}>
                {loggingIn ? "Switching…" : "Switch to Fellow"}
              </Button>
            </DialogFooter>
          </form>

          <div className="pt-2 border-t text-center">
            <Link
              href="/register"
              onClick={() => setShowSwitchModal(false)}
              className="text-xs text-primary hover:underline font-medium"
            >
              Or register a brand new student account →
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
