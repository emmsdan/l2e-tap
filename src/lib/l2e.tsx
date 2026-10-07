import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  type ApiStudent,
  type ApiSubscription,
  type ApiPrice,
  type ApiAttendance,
  type ApiInstruction,
  type ApiStats,
  type StudentDetailResponse,
} from "./api";

/* ---------- Types ---------- */
export type SubStatus = "PENDING" | "ACTIVE" | "CANCELLED" | "LAPSED";
export type StudentStatus = "ACTIVE" | "WITHDRAWN";
export type DenyReason =
  | "NO_ACTIVE_ENTITLEMENT"
  | "DOUBLE_TAP"
  | "OUTSIDE_TIME_WINDOW"
  | "EXPIRED"
  | "UNKNOWN_CARD"
  | "ENTITLED"
  | string;

export interface Service {
  key: string;
  name: string;
  monthly_kobo: number;
  active_subscribers: number;
  archived?: boolean;
}

export interface Subscription {
  id: string;
  student_id: string;
  service_key: string;
  service_name?: string;
  amount_kobo: number;
  status: SubStatus;
  created_at: string;
  valid_until?: string | undefined;
}

export interface Student {
  id: string;
  full_name: string;
  card_uid: string;
  status: StudentStatus;
  registered_at: string;
  tap2pay_person_id?: string | null;
}

export interface Tap {
  id: string;
  student_id: string | null;
  card_uid: string;
  device: string;
  at: string;
  decision: "ALLOW" | "DENY";
  reason?: DenyReason | undefined;
}

export interface Instruction {
  id: string;
  student_id: string;
  service_key: string;
  amount_kobo: number;
  kind: "DEDUCT" | "UPDATE" | "STOP" | "SUBSCRIBE" | "UNSUBSCRIBE" | "UPDATE_AMOUNT";
  status: "PENDING" | "SENT" | "FAILED";
  error?: string | undefined;
  at: string;
}

/* ---------- Money ---------- */
export const koboToNaira = (k: number) => k / 100;
export const nairaToKobo = (n: number) => Math.round(n * 100);
export const formatNaira = (k: number) =>
  "₦" +
  koboToNaira(k).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/** Uppercase, strip separators/whitespace. "04:a2-3f 9b" -> "04A23F9B" */
export const normaliseCardUid = (raw: string) =>
  raw.replace(/[^0-9a-fA-F]/g, "").toUpperCase();

export const REASON_INFO: Record<
  string,
  { label: string; help: string; tone: "danger" | "warning" }
> = {
  NO_ACTIVE_ENTITLEMENT: {
    label: "No entitlement",
    help: "Card is valid but the student has no ACTIVE or in-period CANCELLED subscription for this gate.",
    tone: "danger",
  },
  EXPIRED: {
    label: "Expired",
    help: "The paid period ended (LAPSED). Access stops at valid_until.",
    tone: "danger",
  },
  UNKNOWN_CARD: {
    label: "Unknown card",
    help: "Card UID is not registered with Tap2Access.",
    tone: "danger",
  },
  DOUBLE_TAP: {
    label: "Double tap",
    help: "Same card tapped again within the anti-passback window.",
    tone: "warning",
  },
  OUTSIDE_TIME_WINDOW: {
    label: "Outside hours",
    help: "Tap occurred outside the access rule's allowed time window.",
    tone: "warning",
  },
};

/* ---------- Fallback Initial Data ---------- */
const DEFAULT_SERVICES: Service[] = [
  { key: "gym", name: "Campus Gym", monthly_kobo: 3000000, active_subscribers: 0 },
  { key: "library_247", name: "Library 24/7", monthly_kobo: 1500000, active_subscribers: 0 },
  { key: "makerspace", name: "Makerspace Lab", monthly_kobo: 4500000, active_subscribers: 0 },
  { key: "shuttle", name: "Campus Shuttle", monthly_kobo: 800000, active_subscribers: 0 },
];

/* ---------- Store Context ---------- */
interface Ctx {
  services: Service[];
  students: Student[];
  subs: Subscription[];
  taps: Tap[];
  instructions: Instruction[];
  stats: ApiStats | null;
  loading: boolean;
  tap2accessDown: boolean;
  setTap2accessDown: (v: boolean) => void;
  apiKey: string;
  authMode: "x-api-key" | "bearer";
  setAuth: (k: string, m: "x-api-key" | "bearer") => void;
  refreshData: () => Promise<void>;
  registerStudent: (s: {
    student_id: string;
    full_name: string;
    card_uid: string;
  }) => Promise<{ ok: boolean; status?: number; message?: string }>;
  withdrawStudent: (id: string) => Promise<void>;
  subscribe: (
    studentId: string,
    serviceKey: string
  ) => Promise<Subscription | null>;
  unsubscribe: (studentId: string, serviceKey: string, subId?: string) => Promise<void>;
  updatePrice: (key: string, kobo: number) => Promise<number>;
  archiveService: (key: string) => Promise<void>;
  retryInstruction: (id: string) => void;
  getStudentDetails: (id: string) => Promise<StudentDetailResponse | null>;
}

const L2ECtx = createContext<Ctx | null>(null);
export const useL2E = () => {
  const c = useContext(L2ECtx);
  if (!c) throw new Error("L2EProvider missing");
  return c;
};

const nowIso = () => new Date().toISOString().slice(0, 19);

export function L2EProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [students, setStudents] = useState<Student[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [taps, setTaps] = useState<Tap[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [tap2accessDown, setTap2accessDown] = useState(false);
  const [apiKey, setApiKey] = useState(
    process.env.NEXT_PUBLIC_API_KEY || "l2e-7098b398654efe69d9d957251b19405a"
  );
  const [authMode, setAuthMode] = useState<"x-api-key" | "bearer">("bearer");

  // Fetch initial data from real backend API schema
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        studentsRes,
        pricesRes,
        attendanceRes,
        instructionsRes,
        statsRes,
      ] = await Promise.allSettled([
        api.listStudents({ limit: 100 }),
        api.listPrices(),
        api.listAttendance({ limit: 100 }),
        api.listInstructions(),
        api.stats(),
      ]);

      // 1. Process prices / services
      let currentServices = DEFAULT_SERVICES;
      if (pricesRes.status === "fulfilled" && pricesRes.value.prices) {
        currentServices = pricesRes.value.prices.map((p) => ({
          key: p.service_key,
          name: p.service_name || p.service_key,
          monthly_kobo: p.amount_kobo,
          active_subscribers: 0,
          archived: p.status === "ARCHIVED",
        }));
      }

      // 2. Process students
      let loadedStudents: Student[] = [];
      if (studentsRes.status === "fulfilled" && studentsRes.value.students) {
        loadedStudents = studentsRes.value.students.map((s) => ({
          id: s.student_id,
          full_name: s.full_name,
          card_uid: "CARD-" + s.student_id.replace(/[^0-9A-Z]/gi, "").slice(-8).toUpperCase(),
          status: s.status,
          registered_at: s.created_at ? s.created_at.slice(0, 10) : nowIso().slice(0, 10),
          tap2pay_person_id: s.tap2pay_person_id,
        }));
        setStudents(loadedStudents);
      }

      // 3. Process attendance / taps
      if (attendanceRes.status === "fulfilled" && attendanceRes.value.attendance) {
        setTaps(
          attendanceRes.value.attendance.map((a) => ({
            id: `tap_${a.id}`,
            student_id: a.student_id,
            card_uid: a.student_id ? `CARD-${a.student_id}` : "UNKNOWN",
            device: a.service_name || a.device_id || "Main Gate",
            at: a.occurred_at || nowIso(),
            decision: a.decision,
            reason: a.reason as DenyReason,
          }))
        );
      }

      // 4. Process instructions
      if (instructionsRes.status === "fulfilled" && instructionsRes.value.instructions) {
        setInstructions(
          instructionsRes.value.instructions.map((ins) => ({
            id: ins.id,
            student_id: ins.student_id,
            service_key: ins.service_key,
            amount_kobo: ins.amount_kobo || 0,
            kind: ins.kind as any,
            status: (ins.state || ins.status || "PENDING") as "PENDING" | "SENT" | "FAILED",
            error: ins.last_error || undefined,
            at: ins.created_at || nowIso(),
          }))
        );
      }

      // 5. Process stats
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      }

      // 6. Subscriptions: Fetch for known students
      if (loadedStudents.length > 0) {
        const subsPromises = loadedStudents.slice(0, 15).map(async (st) => {
          try {
            const res = await api.listSubscriptions(st.id);
            return res.subscriptions || [];
          } catch {
            return [];
          }
        });
        const allSubsArrays = await Promise.all(subsPromises);
        const flattenedSubs: Subscription[] = [];
        allSubsArrays.flat().forEach((apiSub, idx) => {
          flattenedSubs.push({
            id: `sub_${apiSub.student_id}_${apiSub.service_key}_${idx}`,
            student_id: apiSub.student_id,
            service_key: apiSub.service_key,
            service_name: apiSub.service_name,
            amount_kobo: apiSub.amount_kobo || 0,
            status: (apiSub.state || apiSub.status || "ACTIVE") as SubStatus,
            created_at: nowIso().slice(0, 10),
            valid_until: apiSub.valid_until ? apiSub.valid_until.slice(0, 10) : undefined,
          });
        });
        setSubs(flattenedSubs);

        // Update active subscriber counts on services
        currentServices = currentServices.map((svc) => ({
          ...svc,
          active_subscribers: flattenedSubs.filter(
            (s) => s.service_key === svc.key && s.status === "ACTIVE"
          ).length,
        }));
      }

      setServices(currentServices);
    } catch (err) {
      console.error("Failed to load data from L2E API:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real API Register Student
  const registerStudent: Ctx["registerStudent"] = async (s) => {
    const uid = normaliseCardUid(s.card_uid);
    try {
      const res = await api.registerStudent({
        student_id: s.student_id,
        full_name: s.full_name,
        card_uid: uid,
      });

      const newStudent: Student = {
        id: res.student?.student_id || s.student_id,
        full_name: res.student?.full_name || s.full_name,
        card_uid: uid,
        status: res.student?.status || "ACTIVE",
        registered_at: nowIso().slice(0, 10),
        tap2pay_person_id: res.tap2pay_person_id || res.student?.tap2pay_person_id,
      };

      setStudents((prev) => [newStudent, ...prev.filter((x) => x.id !== newStudent.id)]);
      return { ok: true };
    } catch (err: any) {
      const message = err?.message || "Failed to register student";
      return { ok: false, status: err?.status || 400, message };
    }
  };

  // Real API Withdraw Student
  const withdrawStudent: Ctx["withdrawStudent"] = async (id: string) => {
    try {
      await api.withdrawStudent(id);
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "WITHDRAWN" } : s))
      );
      setSubs((prev) =>
        prev.map((x) =>
          x.student_id === id && (x.status === "ACTIVE" || x.status === "PENDING")
            ? { ...x, status: "CANCELLED", valid_until: x.valid_until ?? nowIso().slice(0, 10) }
            : x
        )
      );
    } catch (err) {
      console.error("Withdraw student API error:", err);
    }
  };

  // Real API Subscribe
  const subscribe: Ctx["subscribe"] = async (studentId: string, serviceKey: string) => {
    const svc = services.find((s) => s.key === serviceKey);
    const serviceName = svc?.name || serviceKey;

    try {
      const res = await api.subscribeStudent(studentId, serviceName);
      const subData = res.subscription;

      const newSub: Subscription = {
        id: `sub_${Date.now()}`,
        student_id: studentId,
        service_key: subData.service_key || serviceKey,
        service_name: subData.service_name || serviceName,
        amount_kobo: subData.amount_kobo || svc?.monthly_kobo || 0,
        status: (subData.state || subData.status || "PENDING") as SubStatus,
        created_at: nowIso().slice(0, 10),
        valid_until: subData.valid_until ? subData.valid_until.slice(0, 10) : undefined,
      };

      setSubs((prev) => [newSub, ...prev]);

      if (res.instruction) {
        setInstructions((prev) => [
          {
            id: res.instruction.id,
            student_id: studentId,
            service_key: serviceKey,
            amount_kobo: svc?.monthly_kobo || 0,
            kind: "SUBSCRIBE",
            status: (res.instruction.state as "PENDING" | "SENT" | "FAILED") || "PENDING",
            at: nowIso(),
          },
          ...prev,
        ]);
      }

      return newSub;
    } catch (err) {
      console.error("Subscribe API error:", err);
      // Fallback local addition if network drops
      const fallbackSub: Subscription = {
        id: `sub_${Date.now()}`,
        student_id: studentId,
        service_key: serviceKey,
        service_name: serviceName,
        amount_kobo: svc?.monthly_kobo || 0,
        status: "PENDING",
        created_at: nowIso().slice(0, 10),
      };
      setSubs((prev) => [fallbackSub, ...prev]);
      return fallbackSub;
    }
  };

  // Real API Unsubscribe
  const unsubscribe: Ctx["unsubscribe"] = async (
    studentId: string,
    serviceKey: string,
    subId?: string
  ) => {
    try {
      await api.unsubscribeStudent(studentId, serviceKey);
      setSubs((prev) =>
        prev.map((x) =>
          (subId ? x.id === subId : x.student_id === studentId && x.service_key === serviceKey)
            ? { ...x, status: "CANCELLED" }
            : x
        )
      );
    } catch (err) {
      console.error("Unsubscribe API error:", err);
      setSubs((prev) =>
        prev.map((x) =>
          (subId ? x.id === subId : x.student_id === studentId && x.service_key === serviceKey)
            ? { ...x, status: "CANCELLED" }
            : x
        )
      );
    }
  };

  // Real API Set Price
  const updatePrice: Ctx["updatePrice"] = async (key: string, kobo: number) => {
    const svc = services.find((s) => s.key === key);
    const serviceName = svc?.name || key;

    try {
      const res = await api.setPrice(serviceName, kobo);
      const repricedCount = res.subscribers_repriced || 0;

      setServices((prev) =>
        prev.map((s) => (s.key === key ? { ...s, monthly_kobo: kobo } : s))
      );
      setSubs((prev) =>
        prev.map((x) =>
          x.service_key === key && x.status === "ACTIVE"
            ? { ...x, amount_kobo: kobo }
            : x
        )
      );

      return repricedCount;
    } catch (err) {
      console.error("Update price API error:", err);
      setServices((prev) =>
        prev.map((s) => (s.key === key ? { ...s, monthly_kobo: kobo } : s))
      );
      return 0;
    }
  };

  // Real API Archive Service
  const archiveService: Ctx["archiveService"] = async (key: string) => {
    try {
      await api.archivePrice(key);
      setServices((prev) =>
        prev.map((s) => (s.key === key ? { ...s, archived: true } : s))
      );
    } catch (err) {
      console.error("Archive price API error:", err);
      setServices((prev) =>
        prev.map((s) => (s.key === key ? { ...s, archived: true } : s))
      );
    }
  };

  const retryInstruction = (id: string) => {
    setInstructions((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "PENDING", error: undefined } : x))
    );
  };

  const getStudentDetails = async (id: string) => {
    try {
      return await api.getStudent(id);
    } catch (err) {
      console.error("Get student details API error:", err);
      return null;
    }
  };

  const ctx: Ctx = {
    services,
    students,
    subs,
    taps,
    instructions,
    stats,
    loading,
    tap2accessDown,
    setTap2accessDown,
    apiKey,
    authMode,
    setAuth: (k, m) => {
      setApiKey(k);
      setAuthMode(m);
    },
    refreshData,
    registerStudent,
    withdrawStudent,
    subscribe,
    unsubscribe,
    updatePrice,
    archiveService,
    retryInstruction,
    getStudentDetails,
  };

  return <L2ECtx.Provider value={ctx}>{children}</L2ECtx.Provider>;
}

/** Access is granted for ACTIVE, and CANCELLED until valid_until. */
export const grantsAccess = (
  s: Subscription,
  today = new Date().toISOString().slice(0, 10)
) =>
  s.status === "ACTIVE" ||
  (s.status === "CANCELLED" && !!s.valid_until && s.valid_until >= today);
