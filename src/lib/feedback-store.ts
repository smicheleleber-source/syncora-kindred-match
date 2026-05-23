import { useSyncExternalStore } from "react";

const KEY = "syncora.feedback.v1";

export type FeedbackRole = "client" | "professional" | "staff";
export type FeedbackKind = "bug" | "improvement" | "feature" | "praise";
export type FeedbackStatus = "open" | "reviewing" | "planned" | "in_progress" | "shipped" | "declined";

export type FeedbackResponse = {
  id: string;
  author: string; // "Syncora team" or staff name
  message: string;
  at: number;
};

export type FeedbackItem = {
  id: string;
  title: string;
  body: string;
  kind: FeedbackKind;
  role: FeedbackRole;
  author_name: string;
  status: FeedbackStatus;
  upvotes: number;
  upvoted_by: string[]; // local pseudo-ids
  responses: FeedbackResponse[];
  created_at: number;
  updated_at: number;
};

const SEED: FeedbackItem[] = [
  {
    id: "f1",
    title: "Show provider response time on match cards",
    body: "I want to know how quickly a solicitor typically replies before I reach out.",
    kind: "improvement",
    role: "client",
    author_name: "Avery L.",
    status: "planned",
    upvotes: 14,
    upvoted_by: [],
    responses: [
      { id: "r1", author: "Syncora team", message: "Great idea — on the roadmap for next month.", at: Date.now() - 3 * 86400000 },
    ],
    created_at: Date.now() - 10 * 86400000,
    updated_at: Date.now() - 3 * 86400000,
  },
  {
    id: "f2",
    title: "Bulk-import time entries from CSV",
    body: "Manual entry is slow when migrating from another billing tool.",
    kind: "feature",
    role: "professional",
    author_name: "Northgate Legal",
    status: "reviewing",
    upvotes: 7,
    upvoted_by: [],
    responses: [],
    created_at: Date.now() - 5 * 86400000,
    updated_at: Date.now() - 5 * 86400000,
  },
  {
    id: "f3",
    title: "Match score breakdown is exactly what I needed",
    body: "Transparency on why a provider ranked first built trust immediately.",
    kind: "praise",
    role: "client",
    author_name: "M. Okafor",
    status: "shipped",
    upvotes: 22,
    upvoted_by: [],
    responses: [],
    created_at: Date.now() - 20 * 86400000,
    updated_at: Date.now() - 20 * 86400000,
  },
];

function load(): FeedbackItem[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as FeedbackItem[];
  } catch {
    return SEED;
  }
}

let state: FeedbackItem[] = load();
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

export function useFeedback() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

function getVoter(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("syncora.voter.v1");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem("syncora.voter.v1", id);
  }
  return id;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function submitFeedback(input: {
  title: string;
  body: string;
  kind: FeedbackKind;
  role: FeedbackRole;
  author_name: string;
}): FeedbackItem {
  const item: FeedbackItem = {
    id: uid(),
    ...input,
    status: "open",
    upvotes: 1,
    upvoted_by: [getVoter()],
    responses: [],
    created_at: Date.now(),
    updated_at: Date.now(),
  };
  state = [item, ...state];
  persist();
  return item;
}

export function toggleUpvote(id: string) {
  const voter = getVoter();
  state = state.map((f) => {
    if (f.id !== id) return f;
    const has = f.upvoted_by.includes(voter);
    return {
      ...f,
      upvoted_by: has ? f.upvoted_by.filter((v) => v !== voter) : [...f.upvoted_by, voter],
      upvotes: Math.max(0, f.upvotes + (has ? -1 : 1)),
    };
  });
  persist();
}

export function hasUpvoted(item: FeedbackItem): boolean {
  return item.upvoted_by.includes(getVoter());
}

export function setFeedbackStatus(id: string, status: FeedbackStatus) {
  state = state.map((f) =>
    f.id === id ? { ...f, status, updated_at: Date.now() } : f,
  );
  persist();
}

export function addResponse(id: string, author: string, message: string) {
  state = state.map((f) =>
    f.id === id
      ? {
          ...f,
          responses: [...f.responses, { id: uid(), author, message, at: Date.now() }],
          updated_at: Date.now(),
        }
      : f,
  );
  persist();
}