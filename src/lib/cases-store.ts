import { useSyncExternalStore } from "react";

export type CaseCategory =
  | "Civil Rights"
  | "Tenant / Housing"
  | "Family / Custody"
  | "Immigration"
  | "Criminal Defense"
  | "Environmental"
  | "Worker / Labor"
  | "Consumer Protection"
  | "Other";

export const CASE_CATEGORIES: CaseCategory[] = [
  "Civil Rights",
  "Tenant / Housing",
  "Family / Custody",
  "Immigration",
  "Criminal Defense",
  "Environmental",
  "Worker / Labor",
  "Consumer Protection",
  "Other",
];

export type ReviewStatus = "pending" | "approved" | "flagged";

export interface CaseReview {
  id: string;
  reviewer_name: string;
  vote: "promote" | "needs_work" | "reject";
  note: string;
  created_at: number;
}

export interface LegalCase {
  id: string;
  title: string;
  summary: string;
  category: CaseCategory;
  location: string;
  submitter_name: string;
  submitter_role: "client" | "advocate" | "attorney";
  goal_amount: number;
  raised_amount: number;
  status: ReviewStatus;
  reviews: CaseReview[];
  created_at: number;
}

const STORAGE_KEY = "syncora.cases.v1";

const SEED: LegalCase[] = [
  {
    id: "c-001",
    title: "Wrongful eviction of disabled tenant in East Austin",
    summary:
      "Landlord filed a no-cause eviction in retaliation for an ADA accommodation request. Tenant is a wheelchair user; trial set in 6 weeks.",
    category: "Tenant / Housing",
    location: "Austin, TX",
    submitter_name: "Maria L.",
    submitter_role: "advocate",
    goal_amount: 8000,
    raised_amount: 2150,
    status: "approved",
    reviews: [
      {
        id: "r-1",
        reviewer_name: "J. Patel, Esq.",
        vote: "promote",
        note: "Clear ADA retaliation claim. Worth promoting.",
        created_at: Date.now() - 86400000 * 3,
      },
    ],
    created_at: Date.now() - 86400000 * 5,
  },
  {
    id: "c-002",
    title: "Asylum appeal for family fleeing political persecution",
    summary:
      "Initial denial overturned at BIA; circuit court appeal needs funding for transcript, brief, and oral argument prep.",
    category: "Immigration",
    location: "El Paso, TX",
    submitter_name: "Refugio Legal Aid",
    submitter_role: "attorney",
    goal_amount: 15000,
    raised_amount: 9800,
    status: "approved",
    reviews: [],
    created_at: Date.now() - 86400000 * 12,
  },
  {
    id: "c-003",
    title: "Class action: contaminated well water in rural county",
    summary:
      "Over 40 households impacted. Need funding for water testing experts and to certify the class.",
    category: "Environmental",
    location: "Hardin County, KY",
    submitter_name: "Sam R.",
    submitter_role: "client",
    goal_amount: 25000,
    raised_amount: 4300,
    status: "pending",
    reviews: [],
    created_at: Date.now() - 86400000 * 1,
  },
];

let state: LegalCase[] = load();
const listeners = new Set<() => void>();

function load(): LegalCase[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED;
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

export function useCases(): LegalCase[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => SEED,
  );
}

export function submitCase(
  input: Omit<LegalCase, "id" | "raised_amount" | "status" | "reviews" | "created_at">,
): LegalCase {
  const c: LegalCase = {
    ...input,
    id: `c-${Date.now()}`,
    raised_amount: 0,
    status: "pending",
    reviews: [],
    created_at: Date.now(),
  };
  state = [c, ...state];
  emit();
  return c;
}

export function addReview(caseId: string, review: Omit<CaseReview, "id" | "created_at">) {
  state = state.map((c) => {
    if (c.id !== caseId) return c;
    const reviews = [
      ...c.reviews,
      { ...review, id: `r-${Date.now()}`, created_at: Date.now() },
    ];
    const promotes = reviews.filter((r) => r.vote === "promote").length;
    const rejects = reviews.filter((r) => r.vote === "reject").length;
    let status: ReviewStatus = c.status;
    if (promotes >= 2 && promotes > rejects) status = "approved";
    else if (rejects >= 2 && rejects > promotes) status = "flagged";
    return { ...c, reviews, status };
  });
  emit();
}

export function pledge(caseId: string, amount: number) {
  state = state.map((c) =>
    c.id === caseId ? { ...c, raised_amount: c.raised_amount + amount } : c,
  );
  emit();
}