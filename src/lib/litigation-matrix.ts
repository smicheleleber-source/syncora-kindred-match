import { useSyncExternalStore } from "react";

// A systems-engineering view of a case: every claim breaks down into legal
// elements, and every element must be proven by evidence and supporting court
// documents. The matrix makes the gaps visible.

export type ProofStrength = "missing" | "weak" | "adequate" | "strong";

export const PROOF_STRENGTH_LABEL: Record<ProofStrength, string> = {
  missing: "Missing",
  weak: "Weak",
  adequate: "Adequate",
  strong: "Strong",
};

export const PROOF_STRENGTH_SCORE: Record<ProofStrength, number> = {
  missing: 0,
  weak: 1,
  adequate: 2,
  strong: 3,
};

export type DocumentKind =
  | "complaint"
  | "answer"
  | "motion"
  | "brief"
  | "discovery_request"
  | "discovery_response"
  | "deposition"
  | "affidavit"
  | "exhibit"
  | "expert_report"
  | "order"
  | "transcript"
  | "correspondence"
  | "other";

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  complaint: "Complaint",
  answer: "Answer",
  motion: "Motion",
  brief: "Brief",
  discovery_request: "Discovery request",
  discovery_response: "Discovery response",
  deposition: "Deposition",
  affidavit: "Affidavit / declaration",
  exhibit: "Exhibit",
  expert_report: "Expert report",
  order: "Court order",
  transcript: "Hearing transcript",
  correspondence: "Correspondence",
  other: "Other",
};

export interface CourtDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  cite: string; // e.g. "Dkt. 42", "Ex. B", "Smith Depo 112:4-19"
  url?: string;
  notes?: string;
  citation_ids?: string[]; // case-law authority joined into this doc
  created_at: number;
}

export interface MatrixElement {
  id: string;
  text: string; // the legal element to prove
  burden: "prima facie" | "rebuttal" | "damages";
  strength: ProofStrength;
  evidence_notes: string;
  document_ids: string[]; // refs into CourtDocument[]
  citation_ids?: string[]; // case-law authority supporting the element
}

export interface MatrixClaim {
  id: string;
  name: string;
  cause_of_action: string; // statute / common-law label
  party: "plaintiff" | "defendant" | "counterclaim";
  elements: MatrixElement[];
}

export interface LitigationMatrix {
  case_name: string;
  case_number: string;
  forum: string;
  trial_date: string; // ISO date or ""
  documents: CourtDocument[];
  claims: MatrixClaim[];
  citations?: CaseLawCitation[];
}

export interface CaseLawCitation {
  id: string;
  case_name: string; // e.g. "Hadley v. Baxendale"
  reporter: string; // e.g. "9 Ex. 341" or "517 U.S. 559"
  court: string; // e.g. "U.S. Supreme Court", "S.D.N.Y."
  year: number;
  pin_cite?: string; // e.g. "at 564"
  holding: string; // 1–3 sentence summary
  url?: string; // CourtListener / Google Scholar / Westlaw permalink
  tags: string[]; // e.g. ["breach", "damages", "foreseeability"]
  created_at: number;
}

export function formatCitation(c: CaseLawCitation): string {
  const pin = c.pin_cite ? `, ${c.pin_cite}` : "";
  return `${c.case_name}, ${c.reporter}${pin} (${c.court} ${c.year})`;
}

const STORAGE_KEY = "syncora.litigation-matrix.v2";

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function seed(): LitigationMatrix {
  const docs: CourtDocument[] = [
    {
      id: uid("doc"),
      kind: "complaint",
      title: "Verified Complaint",
      cite: "Dkt. 1",
      notes: "Filed 03/14. Pleads breach + fraud counts.",
      created_at: Date.now() - 86400000 * 60,
    },
    {
      id: uid("doc"),
      kind: "exhibit",
      title: "Master Services Agreement",
      cite: "Ex. A",
      notes: "Signed contract — § 4 contains the disputed term.",
      created_at: Date.now() - 86400000 * 58,
    },
    {
      id: uid("doc"),
      kind: "deposition",
      title: "Deposition of J. Reyes (CFO)",
      cite: "Reyes Depo 88:2 – 92:15",
      notes: "Admits invoices were withheld in Q3.",
      created_at: Date.now() - 86400000 * 20,
    },
  ];
  const [dCompl, dEx, dDepo] = docs;
  return {
    case_name: "Acme Holdings v. Cardinal Logistics",
    case_number: "1:25-cv-00417",
    forum: "S.D.N.Y.",
    trial_date: "",
    documents: docs,
    claims: [
      {
        id: uid("claim"),
        name: "Count I — Breach of Contract",
        cause_of_action: "N.Y. common law — breach of written contract",
        party: "plaintiff",
        elements: [
          {
            id: uid("el"),
            text: "Existence of a valid contract",
            burden: "prima facie",
            strength: "strong",
            evidence_notes: "Signed MSA with integration clause.",
            document_ids: [dCompl.id, dEx.id],
          },
          {
            id: uid("el"),
            text: "Plaintiff's performance",
            burden: "prima facie",
            strength: "adequate",
            evidence_notes: "Delivery logs and acceptance emails.",
            document_ids: [dEx.id],
          },
          {
            id: uid("el"),
            text: "Defendant's breach",
            burden: "prima facie",
            strength: "adequate",
            evidence_notes: "CFO admits withholding payment in Q3.",
            document_ids: [dDepo.id],
          },
          {
            id: uid("el"),
            text: "Damages caused by the breach",
            burden: "damages",
            strength: "weak",
            evidence_notes: "Need expert report to quantify lost profits.",
            document_ids: [],
          },
        ],
      },
      {
        id: uid("claim"),
        name: "Count II — Fraudulent Inducement",
        cause_of_action: "N.Y. common law fraud",
        party: "plaintiff",
        elements: [
          {
            id: uid("el"),
            text: "Material misrepresentation",
            burden: "prima facie",
            strength: "weak",
            evidence_notes: "Pre-contract emails — need to authenticate.",
            document_ids: [],
          },
          {
            id: uid("el"),
            text: "Scienter (knowledge of falsity)",
            burden: "prima facie",
            strength: "missing",
            evidence_notes: "No direct evidence yet; pursue in 30(b)(6).",
            document_ids: [],
          },
          {
            id: uid("el"),
            text: "Justifiable reliance",
            burden: "prima facie",
            strength: "adequate",
            evidence_notes: "Client decision memo references the rep.",
            document_ids: [],
          },
          {
            id: uid("el"),
            text: "Resulting damages",
            burden: "damages",
            strength: "weak",
            evidence_notes: "Overlap with Count I damages model.",
            document_ids: [],
          },
        ],
      },
    ],
    citations: [
      {
        id: uid("cite"),
        case_name: "Hadley v. Baxendale",
        reporter: "9 Ex. 341",
        court: "Ct. of Exchequer",
        year: 1854,
        pin_cite: "at 354",
        holding:
          "Contract damages are limited to losses that were foreseeable at the time of contracting or arising naturally from the breach.",
        url: "https://en.wikipedia.org/wiki/Hadley_v_Baxendale",
        tags: ["breach", "damages", "foreseeability"],
        created_at: Date.now() - 86400000 * 30,
      },
      {
        id: uid("cite"),
        case_name: "Eurycleia Partners, LP v. Seward & Kissel, LLP",
        reporter: "12 N.Y.3d 553",
        court: "N.Y. Ct. App.",
        year: 2009,
        pin_cite: "at 559",
        holding:
          "Fraud requires (1) a material misrepresentation, (2) knowledge of falsity, (3) intent to induce reliance, (4) justifiable reliance, and (5) damages.",
        tags: ["fraud", "elements", "scienter"],
        created_at: Date.now() - 86400000 * 20,
      },
    ],
  };
}

let state: LitigationMatrix = load();
const listeners = new Set<() => void>();

function load(): LitigationMatrix {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LitigationMatrix;
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

export function useMatrix(): LitigationMatrix {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => seed(),
  );
}

export function updateCaseMeta(patch: Partial<Pick<LitigationMatrix, "case_name" | "case_number" | "forum" | "trial_date">>) {
  state = { ...state, ...patch };
  emit();
}

export function addClaim(name: string, cause: string, party: MatrixClaim["party"]) {
  state = {
    ...state,
    claims: [
      ...state.claims,
      { id: uid("claim"), name, cause_of_action: cause, party, elements: [] },
    ],
  };
  emit();
}

export function removeClaim(claimId: string) {
  state = { ...state, claims: state.claims.filter((c) => c.id !== claimId) };
  emit();
}

export function addElement(claimId: string, text: string, burden: MatrixElement["burden"]) {
  state = {
    ...state,
    claims: state.claims.map((c) =>
      c.id === claimId
        ? {
            ...c,
            elements: [
              ...c.elements,
              {
                id: uid("el"),
                text,
                burden,
                strength: "missing",
                evidence_notes: "",
                document_ids: [],
              },
            ],
          }
        : c,
    ),
  };
  emit();
}

export function updateElement(claimId: string, elementId: string, patch: Partial<MatrixElement>) {
  state = {
    ...state,
    claims: state.claims.map((c) =>
      c.id !== claimId
        ? c
        : {
            ...c,
            elements: c.elements.map((e) => (e.id === elementId ? { ...e, ...patch } : e)),
          },
    ),
  };
  emit();
}

export function removeElement(claimId: string, elementId: string) {
  state = {
    ...state,
    claims: state.claims.map((c) =>
      c.id !== claimId ? c : { ...c, elements: c.elements.filter((e) => e.id !== elementId) },
    ),
  };
  emit();
}

export function toggleElementDoc(claimId: string, elementId: string, docId: string) {
  state = {
    ...state,
    claims: state.claims.map((c) =>
      c.id !== claimId
        ? c
        : {
            ...c,
            elements: c.elements.map((e) => {
              if (e.id !== elementId) return e;
              const has = e.document_ids.includes(docId);
              return {
                ...e,
                document_ids: has
                  ? e.document_ids.filter((d) => d !== docId)
                  : [...e.document_ids, docId],
              };
            }),
          },
    ),
  };
  emit();
}

export function addDocument(doc: Omit<CourtDocument, "id" | "created_at">) {
  state = {
    ...state,
    documents: [
      ...state.documents,
      { ...doc, id: uid("doc"), created_at: Date.now() },
    ],
  };
  emit();
}

export function removeDocument(docId: string) {
  state = {
    ...state,
    documents: state.documents.filter((d) => d.id !== docId),
    claims: state.claims.map((c) => ({
      ...c,
      elements: c.elements.map((e) => ({
        ...e,
        document_ids: e.document_ids.filter((id) => id !== docId),
      })),
    })),
  };
  emit();
}

export function claimReadiness(claim: MatrixClaim): { pct: number; label: string } {
  if (claim.elements.length === 0) return { pct: 0, label: "No elements yet" };
  const max = claim.elements.length * PROOF_STRENGTH_SCORE.strong;
  const got = claim.elements.reduce(
    (sum, e) => sum + PROOF_STRENGTH_SCORE[e.strength],
    0,
  );
  const pct = Math.round((got / max) * 100);
  const label =
    pct >= 80 ? "Trial-ready" : pct >= 50 ? "Provable, work to do" : pct >= 25 ? "Gaps remain" : "High risk";
  return { pct, label };
}