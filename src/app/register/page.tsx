"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Laptop, Check, X, Wallet, Award, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money, STIPEND } from "@/lib/v2/support";
import { states, campusFor, useWorkspace, total, type Student } from "@/lib/v2/workspace";

function Register() {
  const router = useRouter();
  const { data, registerStudentApi } = useWorkspace();
  const [submitting, setSubmitting] = useState(false);
  const [sponsorship, setSponsorship] = useState<"self" | "l2e" | null>(null);
  const [basics, setBasics] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: "",
  });
  const [mode, setMode] = useState<"onsite" | "online" | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const allQuestions = [
    {
      key: "hasLaptop",
      title: "Do you already have a working laptop?",
      helper: "If you own one, bring it along — you're all set for the programme.",
      yes: "Yes, I have my own",
      no: "No, I don't have one",
      eyebrow: "Your setup",
      grants: "",
      modes: ["onsite", "online"],
    },
    {
      key: "needLaptop",
      title: "Would you like us to provide one?",
      helper: "A work-ready machine issued to you for the programme.",
      yes: "Yes, provide a laptop",
      no: "No, I'll sort it myself",
      eyebrow: "Your setup",
      grants: "laptop",
      modes: ["onsite", "online"],
      condition: (ans: Record<string, boolean>) => !ans["hasLaptop"],
    },
    {
      key: "hub",
      title: "Do you need a desk at the learning hub?",
      helper: "Power, fast internet, mentors and your cohort in the room.",
      yes: "Yes, give me hub access",
      no: "No, I'll work elsewhere",
      eyebrow: "Where you work",
      grants: "hub",
      modes: ["onsite"],
    },
    {
      key: "accommodation",
      title: "Do you need accommodation?",
      helper: "A shared room within walking distance of campus.",
      yes: "Yes, I need a place",
      no: "No, I have somewhere",
      eyebrow: "Where you sleep",
      grants: "accommodation",
      modes: ["onsite"],
    },
    {
      key: "transport",
      title: "Do you need transportation to campus?",
      helper: "Daily shuttle, tap your card to board.",
      yes: "Yes, add the shuttle",
      no: "No, I'll make my way",
      eyebrow: "Getting there",
      grants: "transport",
      modes: ["onsite"],
    },
    {
      key: "meals",
      title: "Do you need a feeding arrangement?",
      helper: "Two meals on every training day, paid by tapping your card.",
      yes: "Yes, feed me on campus",
      no: "No, I'll handle meals",
      eyebrow: "Feeding",
      grants: "meals",
      modes: ["onsite"],
    },
    {
      key: "data",
      title: "Do you need a monthly data bundle?",
      helper: mode === "online" ? "Essential if you're learning remotely." : "For the days you work off campus.",
      yes: "Yes, I need data",
      no: "No, I'm covered",
      eyebrow: "Connectivity",
      grants: "data",
      modes: ["onsite", "online"],
    },
    {
      key: "health",
      title: "Would you like health insurance?",
      helper: "Clinic cover for you while you're in the programme.",
      yes: "Yes, cover me",
      no: "No, thanks",
      eyebrow: "Wellbeing",
      grants: "health",
      modes: ["onsite", "online"],
    },
    {
      key: "allowance",
      title: "Do you need a living allowance?",
      helper: "Monthly cash support while you're in the programme.",
      yes: "Yes, I need support",
      no: "No, I don't need it",
      eyebrow: "Cash",
      grants: "allowance",
      modes: ["onsite", "online"],
    },
  ];

  // Active question list filtered by current mode and condition
  const getActiveQuestions = (currentAnswers: Record<string, boolean>) => {
    if (!mode) return [];
    return allQuestions.filter((item) => {
      if (!item.modes.includes(mode)) return false;
      if (item.condition && !item.condition(currentAnswers)) return false;
      return true;
    });
  };

  const activeQuestions = getActiveQuestions(answers);

  // Define total progression keys: "sponsorship" -> "basics" -> "mode" -> [question keys] -> "summary"
  const stepKeys = ["sponsorship", "basics", "mode", ...activeQuestions.map((item) => item.key), "summary"];

  // Current active step ID
  const [currentStepKey, setCurrentStepKey] = useState<string>("sponsorship");

  // Keep currentStepKey valid if questions change (e.g. needLaptop conditionally removed)
  const currentStepIndex = Math.max(0, stepKeys.indexOf(currentStepKey));
  const activeStepKey = stepKeys.includes(currentStepKey) ? currentStepKey : stepKeys[currentStepIndex] || "summary";

  const isSponsorshipStep = activeStepKey === "sponsorship";
  const isBasicsStep = activeStepKey === "basics";
  const isModeStep = activeStepKey === "mode";
  const summary = activeStepKey === "summary";
  const q = activeQuestions.find((item) => item.key === activeStepKey);

  const count = stepKeys.length;
  const currentStepNumber = stepKeys.indexOf(activeStepKey) + 1;

  const goToNextStep = (updatedAnswers = answers) => {
    const nextActiveQuestions = getActiveQuestions(updatedAnswers);
    const nextStepKeys = ["sponsorship", "basics", "mode", ...nextActiveQuestions.map((item) => item.key), "summary"];
    const idx = nextStepKeys.indexOf(activeStepKey);
    if (idx !== -1 && idx + 1 < nextStepKeys.length) {
      setCurrentStepKey(nextStepKeys[idx + 1]);
    } else {
      setCurrentStepKey("summary");
    }
  };

  const goToPrevStep = () => {
    const idx = stepKeys.indexOf(activeStepKey);
    if (idx > 0) {
      setCurrentStepKey(stepKeys[idx - 1]);
    } else {
      router.push("/");
    }
  };

  const selected = allQuestions
    .filter((item) => item.grants && answers[item.key])
    .map((item) => item.grants);
  const spent = total(selected, data.catalog);
  const valid =
    basics.firstName.trim().length > 1 &&
    basics.lastName.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(basics.email) &&
    basics.phone.trim().length >= 7 &&
    !!basics.state;

  async function finish() {
    if (!mode || submitting) return;
    setSubmitting(true);
    try {
      await registerStudentApi({
        firstName: basics.firstName,
        lastName: basics.lastName,
        email: basics.email,
        phone: basics.phone,
        state: basics.state,
        mode,
        subscriptions: selected,
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="wizard-width flex items-center justify-between py-4">
          <Link href="/">
            <Image className="brand-logo" src="/logo.svg" alt="Learn2Earn" width={104} height={40} priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/register/single"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Single-page form
            </Link>
            <span className="text-sm text-muted-foreground">
              Step {currentStepNumber} of {count}
            </span>
          </div>
        </div>
        <progress className="wizard-progress" max={count} value={currentStepNumber} />
      </header>

      <main className="wizard-width wizard-layout">
        <div>
          <p className="text-sm uppercase font-medium text-primary">
            {isSponsorshipStep
              ? "Sponsorship"
              : isBasicsStep
                ? "Let's meet you"
                : isModeStep
                  ? "Your programme"
                  : summary
                    ? "Your package"
                    : q?.eyebrow}
          </p>
          <h1 className="page-heading mt-3">
            {isSponsorshipStep
              ? "How do you want to be sponsored?"
              : isBasicsStep
                ? "First, the basics."
                : isModeStep
                  ? "How will you learn?"
                  : summary
                    ? "You're all set."
                    : q?.title}
          </h1>
          <p className="text-muted-foreground">
            {isSponsorshipStep
              ? "Choose whether you are covering your programme independently or joining under Learn2Earn sponsorship."
              : isBasicsStep
                ? "We use this to issue your student ID and match you to the nearest campus."
                : isModeStep
                  ? "Pick the setup that works for you. Your support package follows."
                  : summary
                    ? "Here’s your monthly support package. You can change it anytime."
                    : q?.helper}
          </p>

          {isSponsorshipStep ? (
            <div className="mt-8 space-y-4">
              {[
                {
                  id: "self" as const,
                  title: "Self Sponsored",
                  helper: "You or your private guardian will cover your programme and resources directly.",
                  icon: UserCheck,
                },
                {
                  id: "l2e" as const,
                  title: "Learn2Earn Sponsored",
                  helper: "Zero upfront tuition with monthly support stipend, hub facilities, and stipend wallet.",
                  icon: Award,
                },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className={sponsorship === item.id ? "choice choice-active" : "choice"}
                  onClick={() => {
                    setSponsorship(item.id);
                    goToNextStep();
                  }}
                >
                  <item.icon />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.helper}</small>
                  </span>
                </Button>
              ))}
            </div>
          ) : isBasicsStep ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {(["firstName", "lastName", "email", "phone"] as const).map((key, i) => (
                <label className="grid gap-2 text-sm" key={key}>
                  {["First name", "Last name", "Email address", "Phone number"][i]}
                  <Input
                    className="h-12"
                    type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                    value={basics[key]}
                    placeholder={["Amara", "Okafor", "amara@email.com", "0801 234 5678"][i]}
                    onChange={(e) => setBasics({ ...basics, [key]: e.target.value })}
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm sm:col-span-2">
                State of residence
                <select
                  className="form-select h-12"
                  value={basics.state}
                  onChange={(e) => setBasics({ ...basics, state: e.target.value })}
                >
                  <option value="">Select your state</option>
                  {states.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : isModeStep ? (
            <div className="mt-8 space-y-4">
              {(["onsite", "online"] as const).map((m) => (
                <Button
                  key={m}
                  variant="outline"
                  className={mode === m ? "choice choice-active" : "choice"}
                  onClick={() => setMode(m)}
                >
                  {m === "onsite" ? <Building2 /> : <Laptop />}
                  <span>
                    <strong>{m === "onsite" ? "Onsite at a campus" : "Online, from anywhere"}</strong>
                    <small>
                      {m === "onsite"
                        ? "Learn with your cohort at a physical hub."
                        : "Join the programme remotely, on your schedule."}
                    </small>
                  </span>
                </Button>
              ))}
            </div>
          ) : summary ? (
            <div className="mt-8 space-y-4">
              <div className="summary-line">
                <span>Monthly pay</span>
                <strong>{money(STIPEND)}</strong>
              </div>
              {data.catalog
                .filter((s) => selected.includes(s.id))
                .map((s) => (
                  <div className="summary-line" key={s.id}>
                    <span>{s.name}</span>
                    <span>
                      {money(s.price)}{" "}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={"Remove " + s.name}
                        onClick={() =>
                          setAnswers({
                            ...answers,
                            [allQuestions.find((query) => query.grants === s.id)?.key ?? ""]: false,
                          })
                        }
                      >
                        <X />
                      </Button>
                    </span>
                  </div>
                ))}
              <div className="summary-line text-primary font-semibold">
                <span>Left in your wallet</span>
                <span>{money(STIPEND - spent)}</span>
              </div>
            </div>
          ) : q ? (
            <div className="mt-8 space-y-4">
              {[true, false].map((a) => (
                <Button
                  key={String(a)}
                  variant="outline"
                  className={answers[q.key] === a ? "choice choice-active" : "choice"}
                  onClick={() => {
                    const newAnswers = { ...answers, [q.key]: a };
                    if (q.key === "hasLaptop" && a === true) {
                      newAnswers["needLaptop"] = false;
                    }
                    setAnswers(newAnswers);
                    goToNextStep(newAnswers);
                  }}
                >
                  {a ? <Check /> : <X />}
                  <span>
                    <strong>{a ? q.yes : q.no}</strong>
                    {a && q.grants && (
                      <small>{money(data.catalog.find((s) => s.id === q.grants)?.price ?? 0)} / month</small>
                    )}
                  </span>
                </Button>
              ))}
            </div>
          ) : null}

          <div className="flex justify-between mt-10 gap-4">
            <Button variant="ghost" onClick={goToPrevStep}>
              <ArrowLeft />
              Back
            </Button>
            {(isSponsorshipStep || isBasicsStep || isModeStep || summary) && (
              <Button
                disabled={
                  isSponsorshipStep
                    ? !sponsorship
                    : isBasicsStep
                      ? !valid
                      : isModeStep
                        ? !mode
                        : false
                }
                onClick={() => (summary ? finish() : goToNextStep())}
              >
                {summary ? "Confirm and create account" : "Continue"}
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>

        <aside className="package-summary">
          <div className="flex gap-2 items-center text-sm text-primary">
            <Wallet className="size-4" />
            Your monthly package
          </div>
          <h2 className="text-3xl font-bold mt-4">{money(STIPEND)}</h2>
          <p className="text-sm text-muted-foreground mt-2">Your monthly pay while you learn.</p>
          <div className="mt-6 space-y-3">
            {data.catalog
              .filter((s) => selected.includes(s.id))
              .map((s) => (
                <div className="summary-line text-sm" key={s.id}>
                  <span>{s.name}</span>
                  <strong>{money(s.price)}</strong>
                </div>
              ))}
            {!selected.length && <p className="text-sm text-muted-foreground">Your selections will appear here.</p>}
          </div>
          <div className="summary-line border-t mt-6 pt-4 text-sm">
            <span>Subscribed</span>
            <strong>{money(spent)}</strong>
          </div>
          <div className="summary-line mt-3 text-primary font-bold">
            <span>Wallet balance</span>
            <span>{money(STIPEND - spent)}</span>
          </div>
        </aside>
      </main>
    </div>
  );
}

import SinglePageRegister from "./single/page"
export default SinglePageRegister