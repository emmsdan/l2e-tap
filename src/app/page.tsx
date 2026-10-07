"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CreditCard,
  DoorOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  LogIn,
  KeyRound,
  ExternalLink,
  Building,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [ssoLoading, setSsoLoading] = useState(false);

  const handleL2ESSO = () => {
    setSsoLoading(true);
    // Simulate L2E SSO authentication flow and redirect into dashboard
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center bg-[#0b2866] rounded-xl text-xs font-bold tracking-tight shadow-md shadow-blue-900/10">
              <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20L20 10V30L10 20Z" fill="white" />
                <path d="M30 20L20 10V30L30 20Z" fill="white" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-sans tracking-tight text-[#0b2866]">LEARN2EARN</span>
              <span className="text-xs font-semibold text-orange-600 tracking-wider uppercase -mt-0.5">
                Talent Nation · Tap2Access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/portal"
              className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-[#0b2866] transition-colors"
            >
              Student Portal
            </Link>
            <Link
              href="/pos"
              className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-[#0b2866] transition-colors"
            >
              Tap2Pay Kiosk
            </Link>

            {/* L2E SSO Button */}
            <Button
              onClick={handleL2ESSO}
              disabled={ssoLoading}
              className="bg-[#0b2866] hover:bg-[#153f93] text-white font-medium px-5 shadow-sm transition-all flex items-center gap-2 h-11"
            >
              {ssoLoading ? (
                <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <KeyRound className="size-4 text-orange-400" />
              )}
              <span>{ssoLoading ? "Authenticating..." : "Login with L2E SSO"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-gradient-to-b from-white via-blue-50/30 to-[#f8fafc]">
        <div className="absolute inset-0 bg-[radial-gradient(#0b2866_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-[#0b2866] text-xs font-semibold tracking-wide">
              <Sparkles className="size-3.5 text-orange-500" />
              <span>Campus Operations & Automated Physical Access</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif text-[#0b2866] tracking-tight leading-[1.15]">
              Empowering Fellows with <span className="text-orange-500 italic">Seamless Tap & Pay</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 font-sans leading-relaxed max-w-2xl mx-auto">
              Automated roster management, asynchronous Pebbles stipend deductions, and live physical gate access for Talent Nation's AI Engineering Fellowship.
            </p>

            {/* CTA Group with prominent SSO */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleL2ESSO}
                disabled={ssoLoading}
                className="w-full sm:w-auto h-14 px-8 text-base bg-[#0b2866] hover:bg-[#153f93] text-white shadow-xl shadow-blue-900/15 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              >
                <KeyRound className="size-5 text-orange-400" />
                <span className="font-semibold">Sign in with L2E SSO</span>
                <ArrowRight className="size-4" />
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-7 text-base border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
              >
                <Link href="/portal">Student Self-Service Portal</Link>
              </Button>
            </div>

            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-green-600" />
              <span>Enterprise single sign-on powered by Talent Nation L2E Identity Provider</span>
            </p>
          </div>

          {/* Quick Preview Grid */}
          <div className="mt-16 md:mt-24 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 rounded-xl bg-blue-50 text-[#0b2866] flex items-center justify-center mb-5">
                <DoorOpen className="size-6 text-[#0b2866]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Live Access Entitlements</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Direct integration with Tap2Access turns physical NFC cards into real-time credentials at gym turnstiles, libraries, and makerspaces.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5">
                <Zap className="size-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Async Payroll Deductions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect subscriptions seamlessly with Pebbles payroll. Transparent state management confirms stipends without false positives.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <CreditCard className="size-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tap2Pay Point-of-Sale</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dedicated checkout kiosk for administrators and campus stations to charge fellow accounts in seconds with physical RFID card scans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Banner */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Active Cohort Programme</p>
            <h2 className="text-2xl font-serif text-[#0b2866]">Talent Nation AI Engineering Fellowship</h2>
            <p className="text-sm text-slate-500">
              Rigorous, hands-on engineering pathway shipping production-ready intelligent software systems.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleL2ESSO}
              className="bg-[#0b2866] hover:bg-[#153f93] text-white"
            >
              Access Admin Hub
            </Button>
            <Button asChild variant="outline" className="border-slate-300">
              <Link href="/prices">View Pricing Catalogue</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-sans">LEARN2EARN</span>
            <span>·</span>
            <span>Talent Nation Campus System</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/portal" className="hover:text-white transition-colors">Fellow Portal</Link>
            <Link href="/pos" className="hover:text-white transition-colors">Kiosk Mode</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Admin Dashboard</Link>
          </div>
          <p>© 2026 Talent Nation & Tap2Pay Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
