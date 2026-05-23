import { useSyncExternalStore } from "react";

const KEY = "syncora.solicitor.v1";

export type SolicitorCaseStatus = "intake" | "active" | "in_court" | "settled" | "closed";

export type SolicitorCase = {
  id: string;
  client_name: string;
  matter: string;
  category: string;
  status: SolicitorCaseStatus;
  next_event: string;
  next_date: string; // ISO date
  hourly_rate: number;
  created_at: number;
};

export type TimeEntry = {
  id: string;
  case_id: string;
  date: string;
  hours: number;
  description: string;
  billed: boolean;
};

export type Invoice = {
  id: string;
  case_id: string;
  number: string;
  amount: number;
  issued_at: number;
  status: "draft" | "sent" | "paid";
};

export type SolicitorDoc = {
  id: string;
  case_id: string;
  title: string;
  kind: "pleading" | "contract" | "evidence" | "correspondence" | "memo";
  shared_with: string[];
  updated_at: number;
  notes: string;
};

export type SolicitorState = {
  cases: SolicitorCase[];
  time: TimeEntry[];
  invoices: Invoice[];
  docs: SolicitorDoc[];
};

const SEED: SolicitorState = {
  cases: [
    {
      id: "c1",
      client_name: "Avery Lin",
      matter: "Medical malpractice — misdiagnosis claim",
      category: "Medical malpractice",
      status: "active",
      next_event: "Deposition prep",
      next_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
      hourly_rate: 350,
      created_at: Date.now() - 14 * 86400000,
    },
    {
      id: "c2",
      client_name: "Northgate Coop",
      matter: "Accounting malpractice — audit failure",
      category: "Accounting malpractice",
      status: "in_court",
      next_event: "Status conference",
      next_date: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
      hourly_rate: 425,
      created_at: Date.now() - 60 * 86400000,
    },
  ],
  time: [
    { id: "t1", case_id: "c1", date: new Date().toISOString().slice(0, 10), hours: 2.5, description: "Review medical records", billed: false },
    { id: "t2", case_id: "c2", date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), hours: 1.25, description: "Drafted reply brief", billed: true },
  ],
  invoices: [
    { id: "i1", case_id: "c2", number: "INV-1042", amount: 5312.5, issued_at: Date.now() - 7 * 86400000, status: "sent" },
  ],
  docs: [
    { id: "d1", case_id: "c1", title: "Expert witness retainer", kind: "contract", shared_with: ["client", "co-counsel"], updated_at: Date.now() - 2 * 86400000, notes: "Signed v2." },
    { id: "d2", case_id: "c2", title: "Motion to compel discovery", kind: "pleading", shared_with: ["co-counsel"], updated_at: Date.now() - 86400000, notes: "Ready for filing." },
  ],
};

function load(): SolicitorState {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as SolicitorState;
  } catch {
    return SEED;
  }
}

let state: SolicitorState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSolicitor() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function addCase(c: Omit<SolicitorCase, "id" | "created_at">) {
  state = { ...state, cases: [...state.cases, { ...c, id: uid(), created_at: Date.now() }] };
  persist();
}
export function updateCase(id: string, patch: Partial<SolicitorCase>) {
  state = { ...state, cases: state.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
  persist();
}
export function removeCase(id: string) {
  state = {
    ...state,
    cases: state.cases.filter((c) => c.id !== id),
    time: state.time.filter((t) => t.case_id !== id),
    invoices: state.invoices.filter((i) => i.case_id !== id),
    docs: state.docs.filter((d) => d.case_id !== id),
  };
  persist();
}

export function addTime(t: Omit<TimeEntry, "id">) {
  state = { ...state, time: [...state.time, { ...t, id: uid() }] };
  persist();
}
export function removeTime(id: string) {
  state = { ...state, time: state.time.filter((t) => t.id !== id) };
  persist();
}

export function addInvoice(i: Omit<Invoice, "id" | "issued_at">) {
  state = { ...state, invoices: [...state.invoices, { ...i, id: uid(), issued_at: Date.now() }] };
  persist();
}
export function setInvoiceStatus(id: string, status: Invoice["status"]) {
  state = { ...state, invoices: state.invoices.map((i) => (i.id === id ? { ...i, status } : i)) };
  persist();
}

export function generateInvoiceFromUnbilled(caseId: string) {
  const c = state.cases.find((x) => x.id === caseId);
  if (!c) return;
  const entries = state.time.filter((t) => t.case_id === caseId && !t.billed);
  const hours = entries.reduce((s, t) => s + t.hours, 0);
  if (hours <= 0) return;
  const amount = +(hours * c.hourly_rate).toFixed(2);
  const number = `INV-${1000 + state.invoices.length + 1}`;
  state = {
    ...state,
    invoices: [...state.invoices, { id: uid(), case_id: caseId, number, amount, issued_at: Date.now(), status: "draft" }],
    time: state.time.map((t) => (entries.find((e) => e.id === t.id) ? { ...t, billed: true } : t)),
  };
  persist();
}

export function addDoc(d: Omit<SolicitorDoc, "id" | "updated_at">) {
  state = { ...state, docs: [...state.docs, { ...d, id: uid(), updated_at: Date.now() }] };
  persist();
}
export function removeDoc(id: string) {
  state = { ...state, docs: state.docs.filter((d) => d.id !== id) };
  persist();
}