/**
 * L2E Backend API Client
 * Using environment variables:
 * - NEXT_PUBLIC_API_BASE_URL
 * - NEXT_PUBLIC_API_KEY
 * - NEXT_PUBLIC_AUTHORIZATION_TOKEN
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://l2e-server-develop-14573850302.europe-west1.run.app";

const API_KEY =
  process.env.NEXT_PUBLIC_API_KEY || "l2e-7098b398654efe69d9d957251b19405a";

const AUTH_TOKEN =
  process.env.NEXT_PUBLIC_AUTHORIZATION_TOKEN ||
  process.env.NEXT_PUBLIC_API_KEY ||
  "l2e-7098b398654efe69d9d957251b19405a";

export function getApiHeaders(customKey?: string, customMode?: "x-api-key" | "bearer") {
  const key = customKey || API_KEY;
  const token = customKey || AUTH_TOKEN;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (customMode === "bearer") {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (customMode === "x-api-key") {
    headers["X-Api-Key"] = key;
  } else {
    // Provide both by default to ensure maximum server compatibility
    headers["X-Api-Key"] = key;
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  customKey?: string,
  customMode?: "x-api-key" | "bearer"
): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers = {
    ...getApiHeaders(customKey, customMode),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.error) {
        errMessage = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } else if (errJson.message) {
        errMessage = errJson.message;
      }
    } catch {
      // not JSON
    }
    const err = new Error(errMessage);
    (err as unknown as { status: number }).status = res.status;
    throw err;
  }

  // 204 or empty response
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

/* ==================== Typed API Endpoints ==================== */

export interface ApiStudent {
  student_id: string;
  full_name: string;
  tap2pay_person_id?: string | null;
  status: "ACTIVE" | "WITHDRAWN";
  enrolment?: "PENDING" | "PERSON_CREATED" | "COMPLETE";
  created_at?: string;
  updated_at?: string;
}

export interface ApiSubscription {
  student_id: string;
  service_key: string;
  service_name?: string;
  reference?: string | null;
  valid_until?: string | null;
  state?: "PENDING" | "ACTIVE" | "CANCELLED" | "LAPSED";
  status?: "PENDING" | "ACTIVE" | "CANCELLED" | "LAPSED";
  amount_kobo?: number | null;
  settled_amount_kobo?: number | null;
}

export interface ApiPrice {
  service_key: string;
  service_name: string;
  amount_kobo: number;
  status: "ACTIVE" | "ARCHIVED";
}

export interface ApiAttendance {
  id: number;
  event_id?: string;
  student_id: string | null;
  person_name?: string | null;
  service_name?: string | null;
  resource_id?: string | null;
  device_id?: string | null;
  decision: "ALLOW" | "DENY";
  reason?: string | null;
  occurred_at: string;
  recorded_at?: string;
}

export interface ApiInstruction {
  id: string;
  student_id: string;
  service_key: string;
  service_name?: string;
  kind: "SUBSCRIBE" | "UNSUBSCRIBE" | "UPDATE_AMOUNT" | "DEDUCT" | "UPDATE" | "STOP";
  amount_kobo?: number | null;
  state?: "PENDING" | "SENT" | "FAILED";
  status?: "PENDING" | "SENT" | "FAILED";
  attempts?: number;
  pebbles_ref?: string | null;
  last_error?: string | null;
  created_at?: string;
}

export interface ApiStats {
  students: number;
  active_subscriptions: number;
  attendance: number;
  taps_today: number;
}

export interface StudentDetailResponse {
  student: ApiStudent;
  subscriptions: ApiSubscription[];
  tap2access: {
    person?: Record<string, unknown>;
    credentials?: Array<Record<string, unknown>>;
    entitlements?: Array<Record<string, unknown>>;
  } | null;
  tap2access_error: string | null;
}

export const api = {
  // Students
  listStudents: (params?: { q?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ students: ApiStudent[]; total?: number }>(`/students${query}`);
  },

  getStudent: (id: string) =>
    apiFetch<StudentDetailResponse>(`/students/${encodeURIComponent(id)}`),

  registerStudent: (body: { student_id: string; full_name: string; card_uid: string }) =>
    apiFetch<{ student: ApiStudent; tap2pay_person_id?: string }>("/students", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  withdrawStudent: (id: string) =>
    apiFetch<{ student_id: string; status: string }>(`/students/${encodeURIComponent(id)}/withdraw`, {
      method: "POST",
    }),

  // Subscriptions
  listSubscriptions: (studentId: string) =>
    apiFetch<{ subscriptions: ApiSubscription[] }>(`/students/${encodeURIComponent(studentId)}/subscriptions`),

  subscribeStudent: (studentId: string, serviceNameOrKey: string) =>
    apiFetch<{
      subscription: ApiSubscription;
      instruction: { id: string; state: string };
      note?: string;
    }>(`/students/${encodeURIComponent(studentId)}/subscriptions`, {
      method: "POST",
      body: JSON.stringify({ service: serviceNameOrKey }),
    }),

  unsubscribeStudent: (studentId: string, serviceKey: string) =>
    apiFetch<{
      subscription: ApiSubscription;
      access_until?: string | null;
      note?: string;
    }>(`/students/${encodeURIComponent(studentId)}/subscriptions/${encodeURIComponent(serviceKey)}`, {
      method: "DELETE",
    }),

  // Prices
  listPrices: () =>
    apiFetch<{ prices: ApiPrice[] }>("/prices"),

  setPrice: (service: string, amount_kobo: number) =>
    apiFetch<{ price: ApiPrice; subscribers_repriced: number }>("/prices", {
      method: "PUT",
      body: JSON.stringify({ service, amount_kobo }),
    }),

  archivePrice: (serviceKey: string) =>
    apiFetch<{ service_key: string; status: string }>(`/prices/${encodeURIComponent(serviceKey)}`, {
      method: "DELETE",
    }),

  // Attendance
  listAttendance: (params?: {
    student_id?: string;
    from?: string;
    to?: string;
    decision?: "ALLOW" | "DENY";
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.student_id) qs.set("student_id", params.student_id);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.decision) qs.set("decision", params.decision);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ attendance: ApiAttendance[]; limit?: number; offset?: number }>(`/attendance${query}`);
  },

  // Pebbles
  listInstructions: (params?: { student_id?: string; state?: "PENDING" | "SENT" | "FAILED" }) => {
    const qs = new URLSearchParams();
    if (params?.student_id) qs.set("student_id", params.student_id);
    if (params?.state) qs.set("state", params.state);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ instructions: ApiInstruction[]; gateway?: string }>(`/pebbles/instructions${query}`);
  },

  reconcile: () =>
    apiFetch<{
      gateway?: string;
      checked_students: number;
      clean: boolean;
      missing_at_pebbles: Array<Record<string, unknown>>;
      unknown_locally: Array<Record<string, unknown>>;
      amount_mismatches: Array<Record<string, unknown>>;
      unreachable: string[];
    }>("/pebbles/reconciliation"),

  // Stats & Operations
  stats: () => apiFetch<ApiStats>("/stats"),
  health: () => apiFetch<{ status: string }>("/health"),
  ready: () => apiFetch<void>("/ready"),
};
