"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building2,
  Laptop,
  Check,
  Wallet,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  Award,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money, STIPEND, getServiceIcon } from "@/lib/v2/support";
import { states, campusFor, useWorkspace, total } from "@/lib/v2/workspace";

export default function SinglePageRegister() {
  const router = useRouter();
  const { data, registerStudentApi } = useWorkspace();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [sponsorship, setSponsorship] = useState<"self" | "l2e">("l2e");
  const [basics, setBasics] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: "",
  });
  const [mode, setMode] = useState<"onsite" | "online">("onsite");
  const [hasOwnLaptop, setHasOwnLaptop] = useState<boolean | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "hub",
    "meals",
    "transport",
    "data",
  ]);

  // Handle toggling of a service ID
  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // When switching modes, if switching to online, clean up onsite-only services if desired,
  // or filter them dynamically.
  const handleModeChange = (newMode: "onsite" | "online") => {
    setMode(newMode);
    if (newMode === "online") {
      // remove onsite-only services
      const onsiteOnly = ["hub", "meals", "transport", "accommodation"];
      setSelectedServices((prev) => prev.filter((id) => !onsiteOnly.includes(id)));
    } else {
      // add default onsite services if empty
      setSelectedServices((prev) => {
        const next = new Set(prev);
        next.add("hub");
        next.add("meals");
        return Array.from(next);
      });
    }
  };

  const handleLaptopOwnership = (ownsLaptop: boolean) => {
    setHasOwnLaptop(ownsLaptop);
    if (ownsLaptop) {
      // If user owns a laptop, remove laptop service from selections
      setSelectedServices((prev) => prev.filter((id) => id !== "laptop"));
    } else {
      // If user doesn't own a laptop, add laptop service
      setSelectedServices((prev) =>
        prev.includes("laptop") ? prev : [...prev, "laptop"]
      );
    }
  };

  // Filter catalog based on active mode
  const availableServices = data.catalog.filter((svc) => {
    if (svc.archived) return false;
    if (svc.modes && svc.modes.length > 0) {
      return svc.modes.includes(mode);
    }
    return true;
  });

  const spent = total(selectedServices, data.catalog);
  const balance = STIPEND - spent;

  const isBasicsValid =
    basics.firstName.trim().length > 1 &&
    basics.lastName.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(basics.email) &&
    basics.phone.trim().length >= 7 &&
    !!basics.state;

  const canSubmit = isBasicsValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await registerStudentApi({
        firstName: basics.firstName,
        lastName: basics.lastName,
        email: basics.email,
        phone: basics.phone,
        state: basics.state,
        mode,
        subscriptions: selectedServices,
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b bg-background sticky top-0 z-30">
        <div className="wizard-width flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              className="brand-logo"
              src="/logo.svg"
              alt="Learn2Earn"
              width={104}
              height={40}
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Switch to step-by-step
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border">
              <Sparkles className="size-3 text-primary" /> Single Page Form
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="wizard-width py-10">
        {/* Title & Introduction */}
        <div className="mb-10 max-w-2xl">
          <p className="text-xs sm:text-sm uppercase font-semibold tracking-wider text-primary">
            Student Enrolment
          </p>
          <h1 className="page-heading mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Register for Learn2Earn
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Complete your registration in one simple form. Choose your learning mode,
            fill in your personal details, and customize your support package.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7-8 Columns: All Form Sections */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
              {/* SECTION 1: Sponsorship */}
              <section className="bg-card border rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 pb-5 border-b mb-6">
                  <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">How do you want to be sponsored?</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Select your sponsorship model for the programme.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    onClick={() => setSponsorship("self")}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all flex flex-col justify-between ${
                      sponsorship === "self"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <UserCheck className="size-5" />
                      </div>
                      <div
                        className={`size-5 rounded-full border flex items-center justify-center ${
                          sponsorship === "self"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {sponsorship === "self" && <Check className="size-3" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-base">Self Sponsored</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        You or your private guardian will cover your programme and resources directly.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setSponsorship("l2e")}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all flex flex-col justify-between ${
                      sponsorship === "l2e"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <Award className="size-5" />
                      </div>
                      <div
                        className={`size-5 rounded-full border flex items-center justify-center ${
                          sponsorship === "l2e"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {sponsorship === "l2e" && <Check className="size-3" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-base">Learn2Earn Sponsored</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Zero tuition upfront with monthly stipend package, campus support, and learning wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Personal Information */}
              <section className="bg-card border rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 pb-5 border-b mb-6">
                  <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Personal Information</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your details will be used to create your student account and ID card.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    First name *
                    <Input
                      className="h-11"
                      required
                      value={basics.firstName}
                      placeholder="e.g. Amara"
                      onChange={(e) =>
                        setBasics({ ...basics, firstName: e.target.value })
                      }
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium">
                    Last name *
                    <Input
                      className="h-11"
                      required
                      value={basics.lastName}
                      placeholder="e.g. Okafor"
                      onChange={(e) =>
                        setBasics({ ...basics, lastName: e.target.value })
                      }
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium">
                    Email address *
                    <Input
                      className="h-11"
                      type="email"
                      required
                      value={basics.email}
                      placeholder="amara@email.com"
                      onChange={(e) =>
                        setBasics({ ...basics, email: e.target.value })
                      }
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium">
                    Phone number *
                    <Input
                      className="h-11"
                      type="tel"
                      required
                      value={basics.phone}
                      placeholder="0801 234 5678"
                      onChange={(e) =>
                        setBasics({ ...basics, phone: e.target.value })
                      }
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                    State of residence *
                    <select
                      className="form-select h-11 w-full"
                      required
                      value={basics.state}
                      onChange={(e) =>
                        setBasics({ ...basics, state: e.target.value })
                      }
                    >
                      <option value="">Select your state</option>
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {basics.state && (
                  <div className="mt-4 p-3 rounded-lg bg-secondary/60 flex items-center gap-2.5 text-xs text-muted-foreground border">
                    <Info className="size-4 text-primary shrink-0" />
                    <span>
                      Campus matched:{" "}
                      <strong className="text-foreground">
                        {campusFor(basics.state)}
                      </strong>{" "}
                      based on your state.
                    </span>
                  </div>
                )}
              </section>

              {/* SECTION 3: Learning Mode */}
              <section className="bg-card border rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 pb-5 border-b mb-6">
                  <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Learning Mode</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Choose how you want to participate in the programme.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    onClick={() => handleModeChange("onsite")}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all flex flex-col justify-between ${
                      mode === "onsite"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-5" />
                      </div>
                      <div
                        className={`size-5 rounded-full border flex items-center justify-center ${
                          mode === "onsite"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {mode === "onsite" && <Check className="size-3" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-base">Onsite at Campus</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Learn with your cohort at a physical hub. Eligible for meals,
                        accommodation, hub desk, and shuttle bus.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleModeChange("online")}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all flex flex-col justify-between ${
                      mode === "online"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <Laptop className="size-5" />
                      </div>
                      <div
                        className={`size-5 rounded-full border flex items-center justify-center ${
                          mode === "online"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {mode === "online" && <Check className="size-3" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-base">Online / Remote</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Join the programme from anywhere on your schedule. Data
                        allowance and laptop options available.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: Device / Laptop Setup */}
              <section className="bg-card border rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 pb-5 border-b mb-6">
                  <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    4
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Laptop & Hardware Setup</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Do you have your own working machine or need one provided?
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleLaptopOwnership(true)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex items-start justify-between ${
                      hasOwnLaptop === true
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div>
                      <strong className="block text-sm font-semibold">
                        I have my own laptop
                      </strong>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        You will bring your machine along. No laptop subscription fee.
                      </span>
                    </div>
                    <div
                      className={`size-5 rounded-full border shrink-0 ml-3 flex items-center justify-center ${
                        hasOwnLaptop === true
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {hasOwnLaptop === true && <Check className="size-3" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaptopOwnership(false)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex items-start justify-between ${
                      hasOwnLaptop === false
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div>
                      <strong className="block text-sm font-semibold">
                        I need a laptop provided
                      </strong>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        A work-ready machine issued to you (+₦25,000/mo).
                      </span>
                    </div>
                    <div
                      className={`size-5 rounded-full border shrink-0 ml-3 flex items-center justify-center ${
                        hasOwnLaptop === false
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {hasOwnLaptop === false && <Check className="size-3" />}
                    </div>
                  </button>
                </div>
              </section>

              {/* SECTION 5: Support Services Package */}
              <section className="bg-card border rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-5 border-b mb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      5
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Support Services Menu</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Select which benefits you need. Deducted from your ₦150k monthly stipend.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="text-xs text-muted-foreground">Selected items</span>
                    <p className="text-sm font-bold text-primary">
                      {selectedServices.length} of {availableServices.length}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3.5">
                  {availableServices.map((svc) => {
                    const isSelected = selectedServices.includes(svc.id);
                    const IconComponent = getServiceIcon(svc.id);

                    return (
                      <div
                        key={svc.id}
                        onClick={() => toggleService(svc.id)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 ${
                          isSelected
                            ? "border-primary/80 bg-accent/30 shadow-xs"
                            : "border-border hover:border-muted-foreground/30 bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`p-2.5 rounded-lg shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <IconComponent className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm truncate">
                                {svc.name}
                              </span>
                              {svc.tapAccess && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground">
                                  NFC Tap
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {svc.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-foreground">
                            {money(svc.price)}
                            <span className="text-xs font-normal text-muted-foreground">
                              /mo
                            </span>
                          </span>
                          <div
                            className={`size-5 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/30 bg-background"
                            }`}
                          >
                            {isSelected && <Check className="size-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Submit Button (Mobile & Desktop inline trigger) */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSubmit}
                  className="w-full h-12 text-base font-semibold shadow-md"
                >
                  {submitting ? "Creating your account..." : "Complete Registration"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                {!isBasicsValid && (
                  <p className="text-xs text-muted-foreground text-center mt-2.5">
                    Please fill out all required basic information above to proceed.
                  </p>
                )}
              </div>
            </div>

            {/* Right 4-5 Columns: Sticky Package & Wallet Summary */}
            <aside className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
              <div className="package-summary border border-border shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-primary">
                    <Wallet className="size-4" />
                    Support Breakdown
                  </div>
                  <span className="text-xs text-muted-foreground">Monthly allocation</span>
                </div>

                {/* Total Stipend */}
                <div className="mt-4">
                  <span className="text-xs text-muted-foreground block">
                    Base Monthly Stipend
                  </span>
                  <div className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                    {money(STIPEND)}
                  </div>
                </div>

                {/* Selected services list */}
                <div className="mt-6 space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Selected Subscriptions ({selectedServices.length})
                  </span>

                  {selectedServices.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 italic">
                      No services selected. You'll receive the full stipend in cash.
                    </p>
                  ) : (
                    data.catalog
                      .filter((s) => selectedServices.includes(s.id))
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="text-foreground truncate pr-2">
                            {s.name}
                          </span>
                          <span className="font-semibold shrink-0">
                            {money(s.price)}
                          </span>
                        </div>
                      ))
                  )}
                </div>

                {/* Calculations */}
                <div className="border-t mt-5 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground text-xs">
                    <span>Total Subscribed:</span>
                    <span className="font-semibold text-foreground">{money(spent)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                    <span className="font-bold text-foreground">Wallet Balance:</span>
                    <span
                      className={`text-base font-extrabold ${
                        balance >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {money(balance)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight pt-1">
                    {balance >= 0
                      ? "This remaining balance is deposited directly into your cash wallet every month."
                      : "Your selections exceed the stipend allowance."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full h-11 font-semibold"
                  >
                    {submitting ? "Registering..." : "Submit Registration"}
                  </Button>
                </div>
              </div>

              {/* Security / Assurance Card */}
              <div className="bg-card border rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  <span>Flexible & Cancel Anytime</span>
                </div>
                <p className="leading-relaxed">
                  You can adjust your service subscriptions, campus access, or
                  feeding arrangement at the beginning of each month in your student portal.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}
