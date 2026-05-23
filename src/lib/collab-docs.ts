import { useSyncExternalStore } from "react";

// Collaborative document drafting + a record of professional decisions
// (why an item was declined, held, or moved forward). The "decision log" is
// just as important as the draft itself — it preserves the reasoning that
// keeps the litigation strategy coherent across collaborators.

export type DraftStatus = "draft" | "in_review" | "approved" | "filed" | "archived";

export const DRAFT_STATUS_LABEL: Record<DraftStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  filed: "Filed",
  archived: "Archived",
};

export type DeclineReason =
  | "not_legally_fit"
  | "insufficient_evidence"
  | "hold_for_later"
  | "conflict_of_interest"
  | "outside_scope"
  | "statute_of_limitations"
  | "low_strategic_value"
  | "client_directive"
  | "ethical_concern"
  | "other";

export const DECLINE_REASON_LABEL: Record<DeclineReason, string> = {
  not_legally_fit: "Not legally fit",
  insufficient_evidence: "Insufficient evidence",
  hold_for_later: "Hold for later",
  conflict_of_interest: "Conflict of interest",
  outside_scope: "Outside scope of engagement",
  statute_of_limitations: "Statute of limitations",
  low_strategic_value: "Low strategic value",
  client_directive: "Client directive",
  ethical_concern: "Ethical concern",
  other: "Other",
};

export type DecisionKind = "include" | "decline" | "revisit";

export interface DocComment {
  id: string;
  author: string;
  role: string; // "Lead counsel", "Paralegal", "Client", "Expert"…
  body: string;
  created_at: number;
}

export interface DocRevision {
  id: string;
  author: string;
  body: string;
  summary?: string;
  created_at: number;
}

export interface DecisionEntry {
  id: string;
  item: string; // what was considered (claim, exhibit, argument, witness…)
  kind: DecisionKind;
  reason?: DeclineReason; // required when kind === "decline" or "revisit"
  rationale: string; // free-text "why"
  author: string;
  revisit_on?: string; // ISO date for "hold for later"
  created_at: number;
}

export interface CollabDoc {
  id: string;
  title: string;
  kind: string; // motion, brief, letter, complaint draft…
  status: DraftStatus;
  body: string;
  collaborators: string[];
  revisions: DocRevision[];
  comments: DocComment[];
  decisions: DecisionEntry[];
  updated_at: number;
  created_at: number;
}

const STORAGE_KEY = "syncora.collab-docs.v1";

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function seed(): CollabDoc[] {
  const now = Date.now();
  return [
    {
      id: uid("doc"),
      title: "MSJ — Breach of Contract (Count I)",
      kind: "Motion for Summary Judgment",
      status: "in_review",
      body:
        "I. INTRODUCTION\n\nPlaintiff respectfully moves for summary judgment on Count I (breach of contract). The material facts are undisputed: a valid MSA exists, plaintiff performed, defendant withheld payment in Q3, and damages are quantifiable.\n\nII. STATEMENT OF UNDISPUTED FACTS\n\n1. The parties executed the Master Services Agreement on [date] (Ex. A).\n2. Plaintiff delivered all required services (Ex. B–D).\n3. Defendant's CFO admitted withholding payment (Reyes Depo 88:2–92:15).\n\nIII. ARGUMENT\n\n[Draft in progress — add Hadley v. Baxendale framing for damages.]",
      collaborators: ["Lead counsel", "Senior associate", "Paralegal"],
      revisions: [
        {
          id: uid("rev"),
          author: "Senior associate",
          summary: "Initial outline + facts section",
          body: "Outline + §§ I–II drafted.",
          created_at: now - 86400000 * 4,
        },
        {
          id: uid("rev"),
          author: "Lead counsel",
          summary: "Tightened intro; flagged damages argument",
          body: "Intro rewritten; III pending.",
          created_at: now - 86400000 * 2,
        },
      ],
      comments: [
        {
          id: uid("cm"),
          author: "Lead counsel",
          role: "Lead counsel",
          body:
            "Damages section still needs an expert declaration. Don't file until we have the Vasquez report.",
          created_at: now - 86400000,
        },
      ],
      decisions: [
        {
          id: uid("dec"),
          item: "Add fraud-on-the-court argument to MSJ",
          kind: "decline",
          reason: "not_legally_fit",
          rationale:
            "Fraud-on-the-court requires clear and convincing evidence of an officer-of-the-court misrepresentation. We don't have that here — pursuing it would dilute the contract argument and invite Rule 11 risk.",
          author: "Lead counsel",
          created_at: now - 86400000 * 3,
        },
        {
          id: uid("dec"),
          item: "Cite Smith v. Jones (3d Cir. 2019) for foreseeability",
          kind: "revisit",
          reason: "hold_for_later",
          rationale:
            "Helpful holding but it's an unpublished disposition. Hold until we see how the court rules on the in-limine motion — may be more useful at trial.",
          author: "Senior associate",
          revisit_on: new Date(now + 86400000 * 21).toISOString().slice(0, 10),
          created_at: now - 86400000 * 2,
        },
        {
          id: uid("dec"),
          item: "Depose former CTO before MSJ filing",
          kind: "include",
          rationale:
            "Likely to corroborate the CFO's admission. Schedule before the dispositive motion deadline.",
          author: "Lead counsel",
          created_at: now - 86400000,
        },
      ],
      updated_at: now - 86400000,
      created_at: now - 86400000 * 5,
    },
  ];
}

let state: CollabDoc[] = load();
const listeners = new Set<() => void>();

function load(): CollabDoc[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CollabDoc[];
  } catch {}
  return seed();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  persist();
  for (const l of listeners) l();
}

export function useCollabDocs(): CollabDoc[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => seed(),
  );
}

export function createDoc(input: { title: string; kind: string; collaborators?: string[] }): CollabDoc {
  const doc: CollabDoc = {
    id: uid("doc"),
    title: input.title,
    kind: input.kind,
    status: "draft",
    body: "",
    collaborators: input.collaborators ?? [],
    revisions: [],
    comments: [],
    decisions: [],
    updated_at: Date.now(),
    created_at: Date.now(),
  };
  state = [doc, ...state];
  emit();
  return doc;
}

export function updateDoc(id: string, patch: Partial<Pick<CollabDoc, "title" | "kind" | "status" | "body" | "collaborators">>) {
  state = state.map((d) =>
    d.id === id ? { ...d, ...patch, updated_at: Date.now() } : d,
  );
  emit();
}

export function removeDoc(id: string) {
  state = state.filter((d) => d.id !== id);
  emit();
}

export function saveRevision(docId: string, author: string, summary: string) {
  state = state.map((d) => {
    if (d.id !== docId) return d;
    return {
      ...d,
      revisions: [
        ...d.revisions,
        { id: uid("rev"), author, summary, body: d.body, created_at: Date.now() },
      ],
      updated_at: Date.now(),
    };
  });
  emit();
}

export function addComment(docId: string, c: Omit<DocComment, "id" | "created_at">) {
  state = state.map((d) =>
    d.id !== docId
      ? d
      : {
          ...d,
          comments: [...d.comments, { ...c, id: uid("cm"), created_at: Date.now() }],
          updated_at: Date.now(),
        },
  );
  emit();
}

export function addDecision(docId: string, dec: Omit<DecisionEntry, "id" | "created_at">) {
  state = state.map((d) =>
    d.id !== docId
      ? d
      : {
          ...d,
          decisions: [...d.decisions, { ...dec, id: uid("dec"), created_at: Date.now() }],
          updated_at: Date.now(),
        },
  );
  emit();
}

export function removeDecision(docId: string, decisionId: string) {
  state = state.map((d) =>
    d.id !== docId
      ? d
      : {
          ...d,
          decisions: d.decisions.filter((x) => x.id !== decisionId),
          updated_at: Date.now(),
        },
  );
  emit();
}