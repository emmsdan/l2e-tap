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
import { money, services } from "@/lib/v2/support";
import { useWorkspace, total } from "@/lib/v2/workspace";

export default function Dashboard() {
  const { data, update, ready, subscribeStudentApi, unsubscribeStudentApi } = useWorkspace();
  const s = data.student;
  const [pending, setPending] = useState<string | null>(null);

  if (!ready) {
    return <div className="site-width py-16 text-muted-foreground">Loading your dashboard…</div>;
  }

  if (!s) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center p-6">
          <Image src="/logo.svg" alt="Learn2Earn" width={104} height={40} className="brand-logo mx-auto mb-8" />
          <h1 className="page-heading">Your dashboard is waiting.</h1>
          <p className="text-muted-foreground mb-6">Create your student account to get started.</p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Back home</Link>
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
        <div className="site-width">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logo.svg" alt="Learn2Earn" width={104} height={40} className="brand-logo" />
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {s.campus} · {s.mode === "onsite" ? "Onsite" : "Online"}
            </span>
          </Link>
          <div className="flex gap-2 items-center">
            <span className="hidden sm:inline text-sm">
              {s.firstName} {s.lastName}
            </span>
            <span className="avatar">
              {s.firstName[0]}
              {s.lastName[0]}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset prototype account"
              onClick={() => update((w) => ({ ...w, student: null }))}
            >
              <RotateCcw />
            </Button>
          </div>
        </div>
      </header>

      <main className="site-width py-10">
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
                const Icon = services.find((v) => v.id === c.icon)?.icon ?? Wallet;
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
            <p className="flex gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              Your NFC student card
            </p>
            <div className="nfc-card mt-4">
              <div className="flex justify-between text-sm">
                <span>Learn2Earn</span>
                <Nfc className="size-5" />
              </div>
              <p className="display text-xl font-bold mt-8">{s.cardId}</p>
              <p className="text-sm opacity-70 mt-1">
                {s.firstName} {s.lastName}
              </p>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ["Campus", s.campus],
                ["Mode", s.mode === "onsite" ? "Onsite" : "Online"],
                ["State", s.state],
                ["Email", s.email],
              ].map(([k, v]) => (
                <div className="summary-line gap-4" key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="dashboard-panel">
            <h2 className="text-lg font-bold">Recent activity</h2>
            <div className="mt-5 divide-y">
              {s.activity.map((a, i) => (
                <div key={i} className="py-4">
                  <strong className="text-sm">{a.label}</strong>
                  <p className="text-sm text-muted-foreground mt-1">{a.detail}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
              {!s.activity.length && (
                <p className="text-sm text-muted-foreground py-4">No recent activity logged yet.</p>
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
                if (active) {
                  await unsubscribeStudentApi(s.id, itemId);
                } else {
                  await subscribeStudentApi(s.id, itemId);
                }
                setPending(null);
              }}
            >
              {active ? "Unsubscribe" : "Subscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
