import { useSyncExternalStore } from "react";

export type BillStatus =
  | "introduced"
  | "committee"
  | "floor_vote"
  | "passed"
  | "signed"
  | "dead";

export type ThreatLevel = "low" | "moderate" | "high" | "critical";

export type FeatureArea =
  | "matching"
  | "reviews"
  | "advertising"
  | "doc_collab"
  | "litigation_matrix"
  | "professional_listings"
  | "data_transparency";

export interface Lobbyist {
  id: string;
  name: string;
  firm: string;
  clients: string[];
  jurisdictions: string[];
  contact: string;
  notes?: string;
}

export interface Bill {
  id: string;
  number: string; // e.g. "TX HB 2451"
  title: string;
  jurisdiction: string; // e.g. "Texas", "Federal"
  status: BillStatus;
  threat: ThreatLevel;
  filedAt: number;
  hearingAt?: number;
  sponsors: string[];
  affects: FeatureArea[]; // which Syncoraconnect features this bill would limit
  summary: string;
  sourceUrl?: string;
  linkedLobbyistIds: string[]; // lobbyists known to be pushing or opposing
}

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface OppositionTask {
  id: string;
  billId: string;
  title: string;
  kind:
    | "draft_opposition_contract"
    | "draft_testimony"
    | "coalition_outreach"
    | "press_statement"
    | "lobbyist_engagement"
    | "member_alert";
  assignee?: string;
  status: TaskStatus;
  dueAt?: number;
  notes?: string;
  createdAt: number;
}

const BILLS_KEY = "syncora.legislative.bills.v1";
const LOBBY_KEY = "syncora.legislative.lobbyists.v1";
const TASKS_KEY = "syncora.legislative.tasks.v1";

const FEATURE_LABELS: Record<FeatureArea, string> = {
  matching: "Provider matching",
  reviews: "Public reviews & bar complaints",
  advertising: "Paid advertising",
  doc_collab: "Doc collaboration",
  litigation_matrix: "Litigation matrix",
  professional_listings: "Professional listings",
  data_transparency: "Public transparency data",
};

export function featureLabel(f: FeatureArea): string {
  return FEATURE_LABELS[f];
}

const THREAT_WEIGHT: Record<ThreatLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const STATUS_WEIGHT: Record<BillStatus, number> = {
  dead: 0,
  introduced: 1,
  committee: 2,
  floor_vote: 3,
  passed: 4,
  signed: 5,
};

// ----- seed data -----

function seedLobbyists(): Lobbyist[] {
  return [
    {
      id: "lob-1",
      name: "Margaret Ellsworth",
      firm: "Capitol Bridge Strategies",
      clients: ["State Bar Association", "Legal Defense PAC"],
      jurisdictions: ["Texas", "Federal"],
      contact: "mellsworth@capitolbridge.example",
      notes:
        "Historically opposes online attorney-rating platforms. Tracks reviews legislation closely.",
    },
    {
      id: "lob-2",
      name: "Devon Park",
      firm: "Park & Reeves Public Affairs",
      clients: ["Bar Disciplinary Counsel", "Judicial Conference"],
      jurisdictions: ["California", "Federal"],
      contact: "dpark@parkreeves.example",
      notes:
        "Pushes restrictions on third-party legal marketing & lead-gen platforms.",
    },
    {
      id: "lob-3",
      name: "Coalition for Legal Access",
      firm: "Coalition for Legal Access",
      clients: ["Consumer rights groups"],
      jurisdictions: ["Federal"],
      contact: "advocacy@legalaccess.example",
      notes: "Friendly — supports transparency platforms. Useful coalition partner.",
    },
  ];
}

function seedBills(): Bill[] {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  return [
    {
      id: "bill-1",
      number: "TX HB 2451",
      title: "Attorney Advertising Transparency Act",
      jurisdiction: "Texas",
      status: "committee",
      threat: "high",
      filedAt: now - day * 12,
      hearingAt: now + day * 9,
      sponsors: ["Rep. Halloran", "Rep. Nguyen"],
      affects: ["advertising", "professional_listings", "matching"],
      summary:
        "Would require platforms matching consumers to attorneys to disclose fee structures and prohibit pay-for-placement that 'materially influences' match ordering.",
      sourceUrl: "https://capitol.texas.gov/example",
      linkedLobbyistIds: ["lob-1"],
    },
    {
      id: "bill-2",
      number: "CA SB 814",
      title: "Consumer Reviews of Licensed Professionals Restrictions",
      jurisdiction: "California",
      status: "introduced",
      threat: "critical",
      filedAt: now - day * 4,
      sponsors: ["Sen. Ortiz"],
      affects: ["reviews", "data_transparency", "professional_listings"],
      summary:
        "Allows licensed attorneys to demand removal of negative reviews referencing bar complaints prior to final adjudication. Would gut the bar-complaint surfacing on Syncoraconnect's review feature.",
      sourceUrl: "https://leginfo.ca.gov/example",
      linkedLobbyistIds: ["lob-2", "lob-1"],
    },
    {
      id: "bill-3",
      number: "FED HR 1190",
      title: "Legal Services Marketplace Disclosure Act",
      jurisdiction: "Federal",
      status: "introduced",
      threat: "moderate",
      filedAt: now - day * 22,
      sponsors: ["Rep. Whitaker"],
      affects: ["matching", "advertising", "data_transparency"],
      summary:
        "Federal disclosure framework for legal-services marketplaces. Mostly aligned with Syncoraconnect's current policies — monitor for amendments.",
      sourceUrl: "https://congress.gov/example",
      linkedLobbyistIds: ["lob-3"],
    },
  ];
}

function seedTasks(): OppositionTask[] {
  const now = Date.now();
  return [
    {
      id: "task-seed-1",
      billId: "bill-2",
      title: "Draft opposition contract & talking points against CA SB 814",
      kind: "draft_opposition_contract",
      status: "todo",
      dueAt: now + 1000 * 60 * 60 * 24 * 5,
      notes:
        "Focus on consumer right-to-know re: bar complaints already public record.",
      createdAt: now - 1000 * 60 * 60 * 24,
    },
    {
      id: "task-seed-2",
      billId: "bill-1",
      title: "Coordinate testimony for TX HB 2451 committee hearing",
      kind: "draft_testimony",
      status: "in_progress",
      assignee: "Policy team",
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
    },
  ];
}

// ----- store plumbing -----

function load<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback();
  }
}

let bills: Bill[] = load(BILLS_KEY, seedBills);
let lobbyists: Lobbyist[] = load(LOBBY_KEY, seedLobbyists);
let tasks: OppositionTask[] = load(TASKS_KEY, seedTasks);

const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    window.localStorage.setItem(LOBBY_KEY, JSON.stringify(lobbyists));
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ----- public API -----

export function getBills(): Bill[] {
  return bills;
}
export function getLobbyists(): Lobbyist[] {
  return lobbyists;
}
export function getTasks(): OppositionTask[] {
  return tasks;
}

export function useBills(): Bill[] {
  return useSyncExternalStore(subscribe, getBills, getBills);
}
export function useLobbyists(): Lobbyist[] {
  return useSyncExternalStore(subscribe, getLobbyists, getLobbyists);
}
export function useTasks(): OppositionTask[] {
  return useSyncExternalStore(subscribe, getTasks, getTasks);
}

function rid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addBill(b: Omit<Bill, "id" | "filedAt"> & { filedAt?: number }): Bill {
  const bill: Bill = {
    ...b,
    id: rid("bill"),
    filedAt: b.filedAt ?? Date.now(),
  };
  bills = [bill, ...bills];
  emit();
  return bill;
}

export function updateBill(id: string, patch: Partial<Bill>) {
  bills = bills.map((b) => (b.id === id ? { ...b, ...patch } : b));
  emit();
}

export function deleteBill(id: string) {
  bills = bills.filter((b) => b.id !== id);
  tasks = tasks.filter((t) => t.billId !== id);
  emit();
}

export function addLobbyist(l: Omit<Lobbyist, "id">): Lobbyist {
  const lob: Lobbyist = { ...l, id: rid("lob") };
  lobbyists = [lob, ...lobbyists];
  emit();
  return lob;
}

export function deleteLobbyist(id: string) {
  lobbyists = lobbyists.filter((l) => l.id !== id);
  bills = bills.map((b) => ({
    ...b,
    linkedLobbyistIds: b.linkedLobbyistIds.filter((x) => x !== id),
  }));
  emit();
}

export function addTask(t: Omit<OppositionTask, "id" | "createdAt">): OppositionTask {
  const task: OppositionTask = {
    ...t,
    id: rid("task"),
    createdAt: Date.now(),
  };
  tasks = [task, ...tasks];
  emit();
  return task;
}

export function updateTask(id: string, patch: Partial<OppositionTask>) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
}

export function deleteTask(id: string) {
  tasks = tasks.filter((t) => t.id !== id);
  emit();
}

// Health = aggregate threat score across active bills.
// 0 = healthy. Higher = more legislative risk.
export function healthScore(list: Bill[] = bills): number {
  return list
    .filter((b) => b.status !== "dead")
    .reduce(
      (acc, b) => acc + THREAT_WEIGHT[b.threat] * (1 + STATUS_WEIGHT[b.status] * 0.4),
      0,
    );
}

export function healthLabel(score: number): {
  label: string;
  tone: "ok" | "warn" | "danger" | "critical";
} {
  if (score <= 3) return { label: "Healthy", tone: "ok" };
  if (score <= 8) return { label: "Watch", tone: "warn" };
  if (score <= 16) return { label: "At risk", tone: "danger" };
  return { label: "Critical", tone: "critical" };
}

// Suggest tasks an employee should consider for a bill, based on threat & affected features.
export function suggestTasksForBill(bill: Bill): Array<Omit<OppositionTask, "id" | "createdAt" | "billId">> {
  const suggestions: Array<Omit<OppositionTask, "id" | "createdAt" | "billId">> = [];
  if (bill.threat === "critical" || bill.threat === "high") {
    suggestions.push({
      title: `Draft opposition contract & legal memo against ${bill.number}`,
      kind: "draft_opposition_contract",
      status: "todo",
    });
    suggestions.push({
      title: `Prepare written/oral testimony for ${bill.number}`,
      kind: "draft_testimony",
      status: "todo",
    });
  }
  if (bill.affects.includes("reviews") || bill.affects.includes("data_transparency")) {
    suggestions.push({
      title: `Coalition outreach (consumer & press orgs) re: ${bill.number}`,
      kind: "coalition_outreach",
      status: "todo",
    });
  }
  if (bill.linkedLobbyistIds.length > 0) {
    suggestions.push({
      title: `Engage lobbyists tracking ${bill.number}`,
      kind: "lobbyist_engagement",
      status: "todo",
    });
  }
  if (bill.status === "committee" || bill.status === "floor_vote") {
    suggestions.push({
      title: `Alert affected Syncoraconnect members about ${bill.number}`,
      kind: "member_alert",
      status: "todo",
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      title: `Monitor ${bill.number} — no action required yet`,
      kind: "member_alert",
      status: "todo",
    });
  }
  return suggestions;
}

export function generateTasksForBill(billId: string): OppositionTask[] {
  const bill = bills.find((b) => b.id === billId);
  if (!bill) return [];
  const existing = new Set(
    tasks.filter((t) => t.billId === billId).map((t) => t.title),
  );
  const created: OppositionTask[] = [];
  for (const s of suggestTasksForBill(bill)) {
    if (existing.has(s.title)) continue;
    created.push(addTask({ ...s, billId }));
  }
  return created;
}

export const ALL_FEATURE_AREAS: FeatureArea[] = [
  "matching",
  "reviews",
  "advertising",
  "doc_collab",
  "litigation_matrix",
  "professional_listings",
  "data_transparency",
];

export const ALL_BILL_STATUSES: BillStatus[] = [
  "introduced",
  "committee",
  "floor_vote",
  "passed",
  "signed",
  "dead",
];

export const ALL_THREAT_LEVELS: ThreatLevel[] = ["low", "moderate", "high", "critical"];

export const TASK_KIND_LABELS: Record<OppositionTask["kind"], string> = {
  draft_opposition_contract: "Draft opposition contract",
  draft_testimony: "Draft testimony",
  coalition_outreach: "Coalition outreach",
  press_statement: "Press statement",
  lobbyist_engagement: "Lobbyist engagement",
  member_alert: "Member alert",
};