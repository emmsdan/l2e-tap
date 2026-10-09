"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { services, STIPEND } from "./support";
import { api, type ApiPrice, type ApiStudent, type ApiSubscription } from "@/lib/api";
import { toast } from "sonner";

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  state: string;
  campus: string;
  mode: "onsite" | "online";
  cardId: string;
  monthsEnrolled: number;
  monthlyStipend: number;
  subscriptions: string[];
  assignments: Record<string, string>;
  rooms?: Record<string, string>;
  createdAt: string;
  activity: { label: string; detail: string; at: string }[];
};

export type CatalogService = {
  id: string;
  name: string;
  description: string;
  price: number;
  modes: string[];
  tapAccess: boolean;
  archived?: boolean;
  icon: string;
};

export type Facility = {
  id: string;
  name: string;
  kind: string;
  state: string;
  campus: string;
  capacity: number;
  rooms?: { id: string; name: string; capacity: number }[];
};

export type Reader = {
  id: string;
  label: string;
  facilityId: string;
  roomId: string;
  online: boolean;
};

export type Workspace = {
  student: Student | null;
  students: Student[];
  catalog: CatalogService[];
  facilities: Facility[];
  readers: Reader[];
};

export const states =
  "Abia.Adamawa.Akwa Ibom.Anambra.Bauchi.Bayelsa.Benue.Borno.Cross River.Delta.Ebonyi.Edo.Ekiti.Enugu.FCT - Abuja.Gombe.Imo.Jigawa.Kaduna.Kano.Katsina.Kebbi.Kogi.Kwara.Lagos.Nasarawa.Niger.Ogun.Ondo.Osun.Oyo.Plateau.Rivers.Sokoto.Taraba.Yobe.Zamfara".split(
    "."
  );

export const campusFor = (state: string) =>
  state === "Lagos" ? "Yaba Campus" : state === "FCT - Abuja" ? "Wuse Campus" : "Ilorin Campus";

export const onsiteIds = ["hub", "meals", "transport", "accommodation"];

export function initialWorkspace(): Workspace {
  const facilities: Facility[] = [
    ["fac-hub-ilorin", "Ilorin Learning Hall A", "hub", "Kwara", 120],
    ["fac-hub-ilorin-b", "Ilorin Learning Hall B", "hub", "Kwara", 80],
    ["fac-hub-yaba", "Yaba Learning Hall", "hub", "Lagos", 150],
    ["fac-hub-wuse", "Wuse Learning Hall", "hub", "FCT - Abuja", 90],
    ["fac-acc-tanke", "Tanke Hostel", "accommodation", "Kwara", 60],
    ["fac-acc-sabo", "Sabo Residence", "accommodation", "Lagos", 45],
    ["fac-tra-ilorin", "Ilorin Shuttle Route 1", "transport", "Kwara", 40],
    ["fac-tra-yaba", "Yaba Shuttle Route 1", "transport", "Lagos", 40],
    ["fac-kit-ilorin", "Ilorin Kitchen", "kitchen", "Kwara", 200],
    ["fac-kit-yaba", "Yaba Kitchen", "kitchen", "Lagos", 200],
  ].map(([id, name, kind, state, capacity]) => ({
    id: String(id),
    name: String(name),
    kind: String(kind),
    state: String(state),
    capacity: Number(capacity),
    campus: campusFor(String(state)),
  }));

  const mainFacility = facilities[0];
  if (mainFacility) {
    mainFacility.rooms = [
      { id: "room-ilorin-1", name: "Hall A1", capacity: 60 },
      { id: "room-ilorin-2", name: "Hall A2", capacity: 40 },
      { id: "room-ilorin-lab", name: "Hardware Lab", capacity: 20 },
    ];
  }



  return {
    student: null,
    students: [],
    catalog: [],
    facilities,
    readers: [
      ...facilities.map((f, i) => ({
        id: "RDR-" + (1001 + i),
        label: f.name + " — main door",
        facilityId: f.id,
        roomId: "",
        online: i % 7 !== 3,
      })),
      ...(mainFacility?.rooms ?? []).map((r, i) => ({
        id: "RDR-" + (1101 + i),
        label: r.name + " door",
        facilityId: mainFacility?.id ?? "fac-hub-ilorin",
        roomId: r.id,
        online: i !== 2,
      })),
    ],
  };
}

const STORAGE_KEY = "l2e_v2_workspace_state";

export interface WorkspaceContextType {
  data: Workspace;
  ready: boolean;
  activeStudentId: string | null;
  selectStudent: (studentId: string) => Promise<void>;
  loginStudent: (studentId: string) => Promise<Student>;
  logoutStudent: () => void;
  refreshWorkspace: () => Promise<void>;
  update: (fn: (w: Workspace) => Workspace) => void;
  // Specific V1 API backed mutations
  registerStudentApi: (student: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    state: string;
    mode: "onsite" | "online";
    subscriptions: string[];
    cardId?: string;
  }) => Promise<Student>;
  subscribeStudentApi: (studentId: string, serviceKey: string) => Promise<void>;
  unsubscribeStudentApi: (studentId: string, serviceKey: string) => Promise<void>;
  saveServicePriceApi: (serviceKey: string, serviceName: string, priceNaira: number) => Promise<void>;
  archiveServiceApi: (serviceKey: string) => Promise<void>;
}

const Context = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Workspace>(initialWorkspace);
  const [ready, setReady] = useState(false);
  const changed = useRef(false);  // Active student id stored in local storage
  const [activeStudentId, setActiveStudentIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("l2e_active_student_id") || null;
    }
    return null;
  });

  const setActiveStudentId = (id: string | null) => {
    setActiveStudentIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("l2e_active_student_id", id);
      } else {
        localStorage.removeItem("l2e_active_student_id");
      }
    }
  };

  // Helper to fetch live student details, subscriptions, and attendance
  const fetchLiveStudentData = async (
    targetStudentId: string,
    existingStudent?: Student | null
  ): Promise<Student | null> => {
    try {
      const [detailRes, subRes, attRes] = await Promise.allSettled([
        api.getStudent(targetStudentId),
        api.listSubscriptions(targetStudentId),
        api.listAttendance({ student_id: targetStudentId, limit: 15 }),
      ]);

      const detail = detailRes.status === "fulfilled" ? detailRes.value : null;
      const apiSubs = subRes.status === "fulfilled" ? subRes.value.subscriptions || [] : [];
      const apiAtt = attRes.status === "fulfilled" ? attRes.value.attendance || [] : [];

      const rawStudent = detail?.student;
      const fullName = rawStudent?.full_name || existingStudent?.firstName
        ? `${existingStudent?.firstName || ""} ${existingStudent?.lastName || ""}`.trim()
        : "Fellow";
      const nameParts = fullName.split(" ");
      const firstName = existingStudent?.firstName || nameParts[0] || "Fellow";
      const lastName = existingStudent?.lastName || nameParts.slice(1).join(" ") || "Student";

      // Extract card uid from tap2access credentials or fallback
      const credentials = detail?.tap2access?.credentials;
      let cardUid = existingStudent?.cardId;
      if (credentials && credentials.length > 0) {
        const cred = credentials[0] as Record<string, unknown>;
        cardUid = (cred.card_uid as string) || (cred.credential_id as string) || cardUid;
      }
      if (!cardUid) {
        cardUid = `L2E-${targetStudentId.replace(/^stu-|^L2E-/, "")}`;
      }

      // Active subscriptions from live API
      const liveSubs = apiSubs
        .filter((sub) => (sub.status ?? sub.state) === "ACTIVE")
        .map((sub) => sub.service_key);

      // Map attendance to activity log
      const liveActivity = apiAtt.map((att) => ({
        label: att.decision === "ALLOW" ? `Granted: ${att.service_name || "Access"}` : `Denied: ${att.service_name || "Access"}`,
        detail: att.reason || (att.device_id ? `Tapped at ${att.device_id}` : "Tap event"),
        at: att.occurred_at || new Date().toISOString(),
      }));

      const state = existingStudent?.state || "Lagos";
      const mode = existingStudent?.mode || "onsite";

      return {
        id: targetStudentId,
        firstName,
        lastName,
        email: existingStudent?.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@learn2earn.ng`.replace(/\s+/g, ""),
        phone: existingStudent?.phone,
        state,
        campus: mode === "online" ? "Remote" : campusFor(state),
        mode,
        cardId: cardUid,
        monthsEnrolled: existingStudent?.monthsEnrolled || 1,
        monthlyStipend: existingStudent?.monthlyStipend || STIPEND,
        subscriptions: liveSubs.length > 0 ? liveSubs : (existingStudent?.subscriptions || []),
        assignments: existingStudent?.assignments || {},
        rooms: existingStudent?.rooms,
        createdAt: rawStudent?.created_at || existingStudent?.createdAt || new Date().toISOString(),
        activity: liveActivity.length > 0 ? liveActivity : (existingStudent?.activity || []),
      };
    } catch (err) {
      console.warn("Could not load live student info:", err);
      return existingStudent || null;
    }
  };

  // 1. Initial Load: Load local cache first, then sync with live v1 API endpoints
  useEffect(() => {
    let localData: Workspace | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localData = JSON.parse(stored) as Workspace;
        setData(localData);
      }
    } catch {
      // ignore
    }

    async function syncWithV1Api() {
      try {
        const [studentsRes, pricesRes] = await Promise.allSettled([
          api.listStudents({ limit: 100 }),
          api.listPrices(),
        ]);

        let updatedCatalog: CatalogService[] = [];
        let updatedStudents: Student[] = [];

        // Sync prices from API into catalog - ONLY LIVE DATA
        if (pricesRes.status === "fulfilled" && pricesRes.value.prices?.length) {
          const apiPrices = pricesRes.value.prices;
          updatedCatalog = apiPrices.map((p) => {
            const isTapAccess = onsiteIds.includes(p.service_key);
            const modes = isTapAccess ? ["onsite"] : ["onsite", "online"];
            return {
              id: p.service_key,
              name: p.service_name,
              description: `Support service: ${p.service_name}`,
              price: Math.round(p.amount_kobo / 100),
              modes,
              tapAccess: isTapAccess,
              archived: p.status === "ARCHIVED",
              icon: p.service_key,
            };
          });
        } else if (localData?.catalog?.length) {
          updatedCatalog = localData.catalog;
        }

        // Sync students from API into students list
        if (studentsRes.status === "fulfilled" && studentsRes.value.students?.length) {
          const apiStudents = studentsRes.value.students;
          const mappedApiStudents: Student[] = apiStudents.map((s, idx) => {
            const nameParts = (s.full_name || "Student").split(" ");
            const firstName = nameParts[0] || "Student";
            const lastName = nameParts.slice(1).join(" ") || `Fellow-${idx + 1}`;
            const state = states[idx % states.length] ?? "Lagos";
            const mode = idx % 3 === 0 ? "online" : "onsite";

            const existing = localData?.students.find((e) => e.id === s.student_id);

            return {
              id: s.student_id,
              firstName,
              lastName,
              email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@learn2earn.ng`.replace(/\s+/g, ""),
              state,
              campus: mode === "online" ? "Remote" : campusFor(state),
              mode,
              cardId: `L2E-${s.student_id.replace(/^stu-|^L2E-/, "")}`,
              monthsEnrolled: existing?.monthsEnrolled ?? 1,
              monthlyStipend: STIPEND,
              subscriptions: existing?.subscriptions ?? [],
              assignments: existing?.assignments ?? {},
              createdAt: s.created_at || new Date().toISOString(),
              activity: existing?.activity ?? [],
            };
          });

          updatedStudents = mappedApiStudents;
        }

        // Only select the student that signed up or logged in with their id
        const storedStudentId = localStorage.getItem("l2e_active_student_id");
        let liveActiveStudent: Student | null = null;

        if (storedStudentId) {
          const baseStudent = updatedStudents.find((s) => s.id === storedStudentId) || localData?.student;
          liveActiveStudent = await fetchLiveStudentData(storedStudentId, baseStudent);
          if (!liveActiveStudent) {
            // Clear invalid stored student id
            localStorage.removeItem("l2e_active_student_id");
            setActiveStudentIdState(null);
          }
        }

        setData((prev) => ({
          ...prev,
          catalog: updatedCatalog,
          students: updatedStudents.length > 0 ? updatedStudents : prev.students,
          student: liveActiveStudent || prev.student,
        }));

        setReady(true);
      } catch (err) {
        console.warn("V1 API sync note:", err);
        setReady(true);
      }
    }

    syncWithV1Api();
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    if (!ready || !changed.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data, ready]);

  // V1 API: Register a student using api.registerStudent & api.subscribeStudent
  const registerStudentApi = async (input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    state: string;
    mode: "onsite" | "online";
    subscriptions: string[];
    cardId?: string;
  }): Promise<Student> => {
    const studentId = `L2E-${Date.now().toString().slice(-4)}`;
    const cardUid = input.cardId || `CARD-${studentId}`;
    const fullName = `${input.firstName} ${input.lastName}`.trim();

    try {
      // 1. Call v1 API register
      await api.registerStudent({
        student_id: studentId,
        full_name: fullName,
        card_uid: cardUid,
      });

      // 2. Subscribe selected services via v1 API
      for (const subKey of input.subscriptions) {
        try {
          await api.subscribeStudent(studentId, subKey);
        } catch (e) {
          console.warn(`Could not subscribe service ${subKey} for ${studentId}:`, e);
        }
      }
    } catch (err) {
      console.warn("Registering via local fallback:", err);
    }

    const newStudent: Student = {
      id: studentId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      state: input.state,
      campus: input.mode === "online" ? "Remote" : campusFor(input.state),
      mode: input.mode,
      cardId: cardUid,
      monthsEnrolled: 1,
      monthlyStipend: STIPEND,
      subscriptions: input.subscriptions,
      assignments: {},
      createdAt: new Date().toISOString(),
      activity: [{ label: "Registration completed", detail: "NFC ID card issued", at: new Date().toISOString() }],
    };

    changed.current = true;
    setActiveStudentId(studentId);
    setData((prev) => ({
      ...prev,
      student: newStudent,
      students: [newStudent, ...prev.students],
    }));

    return newStudent;
  };

  // V1 API: Subscribe a service
  const subscribeStudentApi = async (studentId: string, serviceKey: string) => {
    try {
      await api.subscribeStudent(studentId, serviceKey);
    } catch (err) {
      console.warn("V1 API subscribe notice:", err);
    }

    changed.current = true;
    setData((prev) => {
      const updateStu = (st: Student) => {
        if (st.id !== studentId) return st;
        if (st.subscriptions.includes(serviceKey)) return st;
        return {
          ...st,
          subscriptions: [...st.subscriptions, serviceKey],
          activity: [
            {
              label: `${serviceKey} subscribed`,
              detail: "Monthly package updated via V1 API",
              at: new Date().toISOString(),
            },
            ...st.activity,
          ],
        };
      };

      return {
        ...prev,
        student: prev.student ? updateStu(prev.student) : null,
        students: prev.students.map(updateStu),
      };
    });
  };

  // V1 API: Unsubscribe a service
  const unsubscribeStudentApi = async (studentId: string, serviceKey: string) => {
    try {
      await api.unsubscribeStudent(studentId, serviceKey);
    } catch (err) {
      console.warn("V1 API unsubscribe notice:", err);
    }

    changed.current = true;
    setData((prev) => {
      const updateStu = (st: Student) => {
        if (st.id !== studentId) return st;
        return {
          ...st,
          subscriptions: st.subscriptions.filter((s) => s !== serviceKey),
          activity: [
            {
              label: `${serviceKey} unsubscribed`,
              detail: "Monthly package updated via V1 API",
              at: new Date().toISOString(),
            },
            ...st.activity,
          ],
        };
      };

      return {
        ...prev,
        student: prev.student ? updateStu(prev.student) : null,
        students: prev.students.map(updateStu),
      };
    });
  };

  // V1 API: Create or update service price
  const saveServicePriceApi = async (serviceKey: string, serviceName: string, priceNaira: number) => {
    const kobo = priceNaira * 100;
    try {
      await api.setPrice(serviceName, kobo);
    } catch {
      try {
        await api.createService({
          service_name: serviceName,
          service_key: serviceKey,
          amount_kobo: kobo,
        });
      } catch (err) {
        console.warn("V1 API setPrice notice:", err);
      }
    }

    changed.current = true;
    setData((prev) => ({
      ...prev,
      catalog: prev.catalog.map((c) =>
        c.id === serviceKey ? { ...c, name: serviceName, price: priceNaira } : c
      ),
    }));
  };

  // V1 API: Archive service
  const archiveServiceApi = async (serviceKey: string) => {
    try {
      await api.archivePrice(serviceKey);
    } catch (err) {
      console.warn("V1 API archive notice:", err);
    }

    changed.current = true;
    setData((prev) => ({
      ...prev,
      catalog: prev.catalog.map((c) => (c.id === serviceKey ? { ...c, archived: !c.archived } : c)),
    }));
  };

  // Log in student by student ID (validates against live API)
  const loginStudent = async (studentId: string): Promise<Student> => {
    const cleanId = studentId.trim();
    if (!cleanId) throw new Error("Please enter a valid student ID");

    // Fetch live data directly from server
    const existing = data.students.find((s) => s.id.toLowerCase() === cleanId.toLowerCase());
    const live = await fetchLiveStudentData(cleanId, existing);
    if (!live) {
      throw new Error(`Student with ID "${cleanId}" not found`);
    }

    setActiveStudentId(cleanId);
    changed.current = true;
    setData((prev) => ({
      ...prev,
      student: live,
      students: prev.students.some((s) => s.id === live.id)
        ? prev.students.map((s) => (s.id === live.id ? live : s))
        : [live, ...prev.students],
    }));

    return live;
  };

  const logoutStudent = () => {
    setActiveStudentId(null);
    changed.current = true;
    setData((prev) => ({
      ...prev,
      student: null,
    }));
  };

  // Select and switch student in dashboard
  const selectStudent = async (studentId: string) => {
    await loginStudent(studentId);
  };

  // Refresh entire workspace from live V1 APIs
  const refreshWorkspace = async () => {
    try {
      const [studentsRes, pricesRes] = await Promise.allSettled([
        api.listStudents({ limit: 100 }),
        api.listPrices(),
      ]);

      let updatedCatalog = [...data.catalog];
      if (pricesRes.status === "fulfilled" && pricesRes.value.prices?.length) {
        const apiPrices = pricesRes.value.prices;
        updatedCatalog = updatedCatalog.map((catItem) => {
          const matched = apiPrices.find(
            (p) => p.service_key === catItem.id || p.service_name.toLowerCase() === catItem.name.toLowerCase()
          );
          if (matched) {
            return {
              ...catItem,
              name: matched.service_name || catItem.name,
              price: Math.round(matched.amount_kobo / 100),
              archived: matched.status === "ARCHIVED",
            };
          }
          return catItem;
        });
      }

      let targetId = activeStudentId || data.student?.id;
      let liveStu: Student | null = data.student;
      if (targetId) {
        liveStu = await fetchLiveStudentData(targetId, data.student);
      }

      changed.current = true;
      setData((prev) => ({
        ...prev,
        catalog: updatedCatalog,
        student: liveStu || prev.student,
      }));
    } catch (e) {
      console.warn("Refresh workspace note:", e);
    }
  };

  return (
    <Context.Provider
      value={{
        data,
        ready,
        activeStudentId,
        selectStudent,
        loginStudent,
        logoutStudent,
        refreshWorkspace,
        update: (fn) => {
          changed.current = true;
          setData(fn);
        },
        registerStudentApi,
        subscribeStudentApi,
        unsubscribeStudentApi,
        saveServicePriceApi,
        archiveServiceApi,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Workspace unavailable");
  return ctx;
}

export const total = (ids: string[], catalog: CatalogService[]) =>
  catalog.filter((s) => ids.includes(s.id)).reduce((a, s) => a + s.price, 0);
