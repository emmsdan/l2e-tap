import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/* ---------- Types ---------- */
export type SubStatus = "PENDING" | "ACTIVE" | "CANCELLED" | "LAPSED";
export type StudentStatus = "ACTIVE" | "WITHDRAWN";
export type DenyReason = "NO_ACTIVE_ENTITLEMENT" | "DOUBLE_TAP" | "OUTSIDE_TIME_WINDOW" | "EXPIRED" | "UNKNOWN_CARD";

export interface Service { key: string; name: string; monthly_kobo: number; active_subscribers: number; archived?: boolean }
export interface Subscription { id: string; student_id: string; service_key: string; amount_kobo: number; status: SubStatus; created_at: string; valid_until?: string | undefined }
export interface Student { id: string; full_name: string; card_uid: string; status: StudentStatus; registered_at: string }
export interface Tap { id: string; student_id: string | null; card_uid: string; device: string; at: string; decision: "ALLOW" | "DENY"; reason?: DenyReason | undefined }
export interface Instruction { id: string; student_id: string; service_key: string; amount_kobo: number; kind: "DEDUCT" | "UPDATE" | "STOP"; status: "PENDING" | "SENT" | "FAILED"; error?: string | undefined; at: string }

/* ---------- Money ---------- */
export const koboToNaira = (k: number) => k / 100;
export const nairaToKobo = (n: number) => Math.round(n * 100);
export const formatNaira = (k: number) =>
  "₦" + koboToNaira(k).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Uppercase, strip separators/whitespace. "04:a2-3f 9b" -> "04A23F9B" */
export const normaliseCardUid = (raw: string) => raw.replace(/[^0-9a-fA-F]/g, "").toUpperCase();

export const REASON_INFO: Record<DenyReason, { label: string; help: string; tone: "danger" | "warning" }> = {
  NO_ACTIVE_ENTITLEMENT: { label: "No entitlement", help: "Card is valid but the student has no ACTIVE or in-period CANCELLED subscription for this gate.", tone: "danger" },
  EXPIRED: { label: "Expired", help: "The paid period ended (LAPSED). Access stops at valid_until.", tone: "danger" },
  UNKNOWN_CARD: { label: "Unknown card", help: "Card UID is not registered with Tap2Access.", tone: "danger" },
  DOUBLE_TAP: { label: "Double tap", help: "Same card tapped again within the anti-passback window.", tone: "warning" },
  OUTSIDE_TIME_WINDOW: { label: "Outside hours", help: "Tap occurred outside the access rule's allowed time window.", tone: "warning" },
};

/* ---------- Seed ---------- */
const NAMES = ["Adaeze Okafor","Tunde Bakare","Chiamaka Eze","Ibrahim Musa","Funmilayo Adeyemi","Emeka Nwosu","Halima Bello","Segun Ogunleye","Ngozi Obi","Yusuf Danjuma","Kemi Alabi","Obinna Chukwu","Zainab Lawal","Femi Ajayi"];
function seed() {
  const services: Service[] = [
    { key: "gym", name: "Campus Gym", monthly_kobo: 3000000, active_subscribers: 0 },
    { key: "library_247", name: "Library 24/7", monthly_kobo: 1500000, active_subscribers: 0 },
    { key: "makerspace", name: "Makerspace Lab", monthly_kobo: 4500000, active_subscribers: 0 },
    { key: "shuttle", name: "Campus Shuttle", monthly_kobo: 800000, active_subscribers: 0 },
  ];
  const students: Student[] = NAMES.map((n, i) => ({
    id: `L2E-${(1001 + i).toString()}`,
    full_name: n,
    card_uid: (0x04a23f00 + i * 4099).toString(16).toUpperCase().padStart(8, "0"),
    status: i === 11 ? "WITHDRAWN" : "ACTIVE",
    registered_at: `2026-0${(i % 8) + 1}-1${i % 9}`,
  }));
  const statuses: SubStatus[] = ["ACTIVE","ACTIVE","PENDING","CANCELLED","ACTIVE","LAPSED","ACTIVE"];
  const subs: Subscription[] = [];
  students.forEach((s, i) => {
    const svc = services[i % services.length]!;
    const st = statuses[i % statuses.length]!;
    subs.push({ id: `sub_${i}a`, student_id: s.id, service_key: svc.key, amount_kobo: svc.monthly_kobo, status: st, created_at: "2026-09-01", valid_until: st === "PENDING" ? undefined : st === "LAPSED" ? "2026-09-30" : "2026-10-31" });
    if (i % 3 === 0) {
      const s2 = services[(i + 1) % services.length]!;
      subs.push({ id: `sub_${i}b`, student_id: s.id, service_key: s2.key, amount_kobo: s2.monthly_kobo, status: "ACTIVE", created_at: "2026-09-05", valid_until: "2026-11-04" });
    }
  });
  const reasons: (DenyReason | undefined)[] = [undefined, undefined, "NO_ACTIVE_ENTITLEMENT", undefined, "DOUBLE_TAP", undefined, "OUTSIDE_TIME_WINDOW", undefined, "EXPIRED", undefined, "UNKNOWN_CARD"];
  const devices = ["Main Gate A", "Gym Turnstile", "Library Door 2", "Makerspace Reader"];
  const taps: Tap[] = Array.from({ length: 48 }, (_, i) => {
    const r = reasons[i % reasons.length];
    const st = r === "UNKNOWN_CARD" ? null : students[i % students.length];
    const hour = 7 + (i % 14), min = (i * 7) % 60;
    const day = i < 20 ? "07" : "06";
    return { id: `tap_${i}`, student_id: st?.id ?? null, card_uid: st?.card_uid ?? "DEADBEEF", device: devices[i % devices.length]!, at: `2026-10-${day}T${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:00`, decision: r ? "DENY" : "ALLOW", reason: r };
  });
  const instructions: Instruction[] = [
    { id: "ins_901", student_id: "L2E-1003", service_key: "makerspace", amount_kobo: 4500000, kind: "DEDUCT", status: "PENDING", at: "2026-10-07T09:12:00" },
    { id: "ins_900", student_id: "L2E-1010", service_key: "makerspace", amount_kobo: 4500000, kind: "DEDUCT", status: "FAILED", error: "Pebbles 422: employee record not found", at: "2026-10-06T16:40:00" },
    { id: "ins_899", student_id: "L2E-1005", service_key: "gym", amount_kobo: 3000000, kind: "UPDATE", status: "SENT", at: "2026-10-06T11:02:00" },
    { id: "ins_898", student_id: "L2E-1012", service_key: "library_247", amount_kobo: 1500000, kind: "STOP", status: "FAILED", error: "Timeout after 3 retries", at: "2026-10-05T08:15:00" },
    { id: "ins_897", student_id: "L2E-1001", service_key: "gym", amount_kobo: 3000000, kind: "DEDUCT", status: "SENT", at: "2026-10-01T07:00:00" },
  ];
  return { services, students, subs, taps, instructions };
}

/* ---------- Store ---------- */
interface Ctx {
  services: Service[]; students: Student[]; subs: Subscription[]; taps: Tap[]; instructions: Instruction[];
  tap2accessDown: boolean; setTap2accessDown: (v: boolean) => void;
  apiKey: string; authMode: "x-api-key" | "bearer"; setAuth: (k: string, m: "x-api-key" | "bearer") => void;
  registerStudent: (s: { student_id: string; full_name: string; card_uid: string }) => { ok: true } | { ok: false; status: 409; message: string };
  withdrawStudent: (id: string) => void;
  subscribe: (studentId: string, serviceKey: string) => Subscription;
  unsubscribe: (subId: string) => void;
  updatePrice: (key: string, kobo: number) => number;
  archiveService: (key: string) => void;
  retryInstruction: (id: string) => void;
}
const L2ECtx = createContext<Ctx | null>(null);
export const useL2E = () => { const c = useContext(L2ECtx); if (!c) throw new Error("L2EProvider missing"); return c; };

const nowIso = () => new Date().toISOString().slice(0, 19);

export function L2EProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(seed);
  const [tap2accessDown, setTap2accessDown] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [authMode, setAuthMode] = useState<"x-api-key" | "bearer">("x-api-key");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const services = data.services.map((s) => ({ ...s, active_subscribers: data.subs.filter((x) => x.service_key === s.key && x.status === "ACTIVE").length }));

  const registerStudent: Ctx["registerStudent"] = (s) => {
    const uid = normaliseCardUid(s.card_uid);
    const dup = data.students.find((x) => x.card_uid === uid);
    if (dup) return { ok: false, status: 409, message: `Card ${uid} is already assigned to ${dup.full_name} (${dup.id}).` };
    if (data.students.some((x) => x.id === s.student_id)) return { ok: false, status: 409, message: `Student ID ${s.student_id} already exists.` };
    setData((d) => ({ ...d, students: [{ id: s.student_id, full_name: s.full_name, card_uid: uid, status: "ACTIVE", registered_at: nowIso().slice(0, 10) }, ...d.students] }));
    return { ok: true };
  };

  const subscribe = useCallback((studentId: string, serviceKey: string) => {
    const svc = data.services.find((s) => s.key === serviceKey)!;
    const sub: Subscription = { id: `sub_${Date.now()}`, student_id: studentId, service_key: serviceKey, amount_kobo: svc.monthly_kobo, status: "PENDING", created_at: nowIso().slice(0, 10) };
    const ins: Instruction = { id: `ins_${Date.now()}`, student_id: studentId, service_key: serviceKey, amount_kobo: svc.monthly_kobo, kind: "DEDUCT", status: "PENDING", at: nowIso() };
    setData((d) => ({ ...d, subs: [sub, ...d.subs], instructions: [ins, ...d.instructions] }));
    // Simulated Pebbles webhook confirmation
    timers.current.push(setTimeout(() => {
      setData((d) => ({
        ...d,
        subs: d.subs.map((x) => (x.id === sub.id ? { ...x, status: "ACTIVE", valid_until: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) } : x)),
        instructions: d.instructions.map((x) => (x.id === ins.id ? { ...x, status: "SENT" } : x)),
      }));
    }, 8000));
    return sub;
  }, [data.services]);

  const ctx: Ctx = {
    ...data, services, tap2accessDown, setTap2accessDown, apiKey, authMode,
    setAuth: (k, m) => { setApiKey(k); setAuthMode(m); },
    registerStudent,
    withdrawStudent: (id) => setData((d) => ({ ...d, students: d.students.map((s) => (s.id === id ? { ...s, status: "WITHDRAWN" } : s)), subs: d.subs.map((x) => (x.student_id === id && (x.status === "ACTIVE" || x.status === "PENDING") ? { ...x, status: "CANCELLED", valid_until: x.valid_until ?? nowIso().slice(0, 10) } : x)) })),
    subscribe,
    unsubscribe: (id) => setData((d) => ({ ...d, subs: d.subs.map((x) => (x.id === id ? { ...x, status: "CANCELLED" } : x)) })),
    updatePrice: (key, kobo) => {
      const affected = data.subs.filter((x) => x.service_key === key && x.status === "ACTIVE");
      setData((d) => ({
        ...d,
        services: d.services.map((s) => (s.key === key ? { ...s, monthly_kobo: kobo } : s)),
        subs: d.subs.map((x) => (x.service_key === key && x.status === "ACTIVE" ? { ...x, amount_kobo: kobo } : x)),
        instructions: [...affected.map((a, i) => ({ id: `ins_u${Date.now()}_${i}`, student_id: a.student_id, service_key: key, amount_kobo: kobo, kind: "UPDATE" as const, status: "PENDING" as const, at: nowIso() })), ...d.instructions],
      }));
      return affected.length;
    },
    archiveService: (key) => setData((d) => ({ ...d, services: d.services.map((s) => (s.key === key ? { ...s, archived: true } : s)) })),
    retryInstruction: (id) => setData((d) => ({ ...d, instructions: d.instructions.map((x) => (x.id === id ? { ...x, status: "PENDING", error: undefined } : x)) })),
  };
  return <L2ECtx.Provider value={ctx}>{children}</L2ECtx.Provider>;
}

/** Access is granted for ACTIVE, and CANCELLED until valid_until. */
export const grantsAccess = (s: Subscription, today = new Date().toISOString().slice(0, 10)) =>
  s.status === "ACTIVE" || (s.status === "CANCELLED" && !!s.valid_until && s.valid_until >= today);
