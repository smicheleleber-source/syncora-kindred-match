import { useSyncExternalStore } from "react";

export type ComplaintStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "dismissed"
  | "sanctioned"
  | "withdrawn";

export type SelectionType = "election" | "retention" | "appointment" | "reappointment";

export type Judge = {
  id: string;
  name: string;
  court: string; // e.g. "Travis County District Court"
  jurisdiction: string; // e.g. "TX"
  practiceAreas: string[]; // self-reported / claimed experience
  validated_practice_areas?: string[]; // confirmed by Syncora system
  termEndsISO?: string; // YYYY-MM-DD
  nextEvent?: {
    type: SelectionType;
    dateISO: string;
    notes?: string;
  };
};

export type Complaint = {
  id: string;
  judgeId: string;
  clientId: string; // private — only visible to professional & complainant
  caseRef: string; // private
  category:
    | "bias"
    | "ex_parte"
    | "delay"
    | "demeanor"
    | "conflict_of_interest"
    | "rules_violation"
    | "other";
  summary: string; // public-redacted summary shown on the judge profile
  privateNotes: string; // never shown publicly
  status: ComplaintStatus;
  filedISO: string;
  lastUpdateISO: string;
  oversightBody?: string; // e.g. "TX State Commission on Judicial Conduct"
  trackingNumber?: string;
};

type State = {
  judges: Judge[];
  complaints: Complaint[];
};

const KEY = "syncora.judges.v1";

function seed(): State {
  const today = new Date();
  const inDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  return {
    judges: [
      {
        id: "judge-1",
        name: "Hon. M. Alvarez",
        court: "Travis County District Court, 250th",
        jurisdiction: "TX",
        practiceAreas: ["family", "civil"],
        termEndsISO: inDays(420),
        nextEvent: {
          type: "election",
          dateISO: inDays(420),
          notes: "Partisan general election; primary 90 days prior.",
        },
      },
      {
        id: "judge-2",
        name: "Hon. R. Chen",
        court: "U.S. District Court, W.D. Tex.",
        jurisdiction: "Federal",
        practiceAreas: ["criminal", "ip", "civil"],
        nextEvent: {
          type: "appointment",
          dateISO: inDays(180),
          notes: "Senate Judiciary hearing scheduled.",
        },
      },
      {
        id: "judge-3",
        name: "Hon. P. Okafor",
        court: "Probate Court No. 1",
        jurisdiction: "TX",
        practiceAreas: ["probate", "elder"],
        termEndsISO: inDays(60),
        nextEvent: {
          type: "retention",
          dateISO: inDays(60),
          notes: "Retention vote — uncontested.",
        },
      },
    ],
    complaints: [
      {
        id: "c-seed-1",
        judgeId: "judge-1",
        clientId: "demo-client",
        caseRef: "FAM-2024-00123",
        category: "delay",
        summary:
          "Ruling on temporary orders delayed beyond statutory window without explanation.",
        privateNotes: "Client missed school-year deadline; collect docket entries.",
        status: "under_review",
        filedISO: inDays(-40),
        lastUpdateISO: inDays(-7),
        oversightBody: "TX State Commission on Judicial Conduct",
        trackingNumber: "SCJC-2024-8821",
      },
    ],
  };
}

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as State;
  } catch {
    return seed();
  }
}

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export function useJudges() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export function addJudge(j: Omit<Judge, "id">) {
  state = { ...state, judges: [...state.judges, { ...j, id: crypto.randomUUID() }] };
  persist();
}

export function addComplaint(
  c: Omit<Complaint, "id" | "filedISO" | "lastUpdateISO" | "status"> & {
    status?: ComplaintStatus;
  },
) {
  const now = new Date().toISOString().slice(0, 10);
  state = {
    ...state,
    complaints: [
      ...state.complaints,
      {
        ...c,
        id: crypto.randomUUID(),
        status: c.status ?? "draft",
        filedISO: now,
        lastUpdateISO: now,
      },
    ],
  };
  persist();
}

export function updateComplaintStatus(id: string, status: ComplaintStatus) {
  state = {
    ...state,
    complaints: state.complaints.map((c) =>
      c.id === id
        ? { ...c, status, lastUpdateISO: new Date().toISOString().slice(0, 10) }
        : c,
    ),
  };
  persist();
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00").getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now.getTime()) / (1000 * 60 * 60 * 24));
}

export type AlignmentLevel = "high" | "medium" | "low" | "none";

/**
 * Score how relevant a judge's upcoming selection event is to a client's
 * situation, given matter type + estimated case-resolution date.
 */
export function alignmentForClient(
  judge: Judge,
  client: { practiceArea?: string; expectedResolutionISO?: string },
): { level: AlignmentLevel; reason: string } {
  const areaMatch =
    client.practiceArea && judge.practiceAreas.includes(client.practiceArea);
  const d = daysUntil(judge.nextEvent?.dateISO);
  const r = daysUntil(client.expectedResolutionISO);

  if (!judge.nextEvent || d == null) {
    return { level: "none", reason: "No upcoming selection event on file." };
  }

  // Selection event lands during the case window
  if (r != null && d <= r + 30 && d >= -30) {
    if (areaMatch)
      return {
        level: "high",
        reason: `${judge.nextEvent.type} in ${d}d overlaps your expected resolution and matches your matter type.`,
      };
    return {
      level: "medium",
      reason: `${judge.nextEvent.type} in ${d}d overlaps your expected resolution window.`,
    };
  }

  if (areaMatch && d <= 365) {
    return {
      level: "medium",
      reason: `Same practice area; ${judge.nextEvent.type} in ${d}d.`,
    };
  }

  if (d <= 180) {
    return {
      level: "low",
      reason: `${judge.nextEvent.type} in ${d}d, but no direct overlap.`,
    };
  }

  return { level: "low", reason: `${judge.nextEvent.type} not for ${d} days.` };
}

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  dismissed: "Dismissed",
  sanctioned: "Sanctioned",
  withdrawn: "Withdrawn",
};

export const CATEGORY_LABEL: Record<Complaint["category"], string> = {
  bias: "Bias / impartiality",
  ex_parte: "Improper ex parte contact",
  delay: "Unreasonable delay",
  demeanor: "Demeanor / conduct",
  conflict_of_interest: "Conflict of interest",
  rules_violation: "Rules violation",
  other: "Other",
};