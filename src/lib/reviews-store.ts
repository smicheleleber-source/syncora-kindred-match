import { useSyncExternalStore } from "react";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  providerId: string;
  providerName: string;
  authorName: string;
  matterType: string;
  rating: ReviewRating;
  outcome: "favorable" | "mixed" | "unfavorable" | "pending";
  pros: string;
  cons: string;
  barComplaintFiled: boolean;
  barComplaintBoard?: string;
  barComplaintNumber?: string;
  barComplaintStatus?: "filed" | "under_review" | "dismissed" | "sanction";
  barComplaintNotes?: string;
  verifiedClient: boolean;
  createdAt: number;
}

const STORAGE_KEY = "syncora.reviews.v1";

function seed(): Review[] {
  return [
    {
      id: "r-seed-1",
      providerId: "1",
      providerName: "Hartley & Vance Family Law",
      authorName: "Former client (verified)",
      matterType: "Custody modification",
      rating: 5,
      outcome: "favorable",
      pros: "Clear communication, strong courtroom presence, prepared every filing on time.",
      cons: "Hourly rate ran high once trial prep started — budget conversations could be earlier.",
      barComplaintFiled: false,
      verifiedClient: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    },
    {
      id: "r-seed-2",
      providerId: "2",
      providerName: "Marlowe Legal Collective",
      authorName: "Anonymous",
      matterType: "DSS / CPS case",
      rating: 2,
      outcome: "unfavorable",
      pros: "Initial intake was thorough.",
      cons: "Missed two filing deadlines. Did not return calls for 3 weeks during a critical hearing window.",
      barComplaintFiled: true,
      barComplaintBoard: "State Bar — Disciplinary Counsel",
      barComplaintNumber: "DC-2025-0142",
      barComplaintStatus: "under_review",
      barComplaintNotes: "Complaint focuses on neglect and failure to communicate.",
      verifiedClient: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    },
  ];
}

function load(): Review[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seed();
    return parsed as Review[];
  } catch {
    return seed();
  }
}

let reviews: Review[] = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function getReviews(): Review[] {
  return reviews;
}

export function addReview(r: Omit<Review, "id" | "createdAt">): Review {
  const review: Review = {
    ...r,
    id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  reviews = [review, ...reviews];
  emit();
  return review;
}

export function deleteReview(id: string) {
  reviews = reviews.filter((r) => r.id !== id);
  emit();
}

export function useReviews(): Review[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getReviews,
    getReviews,
  );
}

export interface ProviderRatingSummary {
  count: number;
  average: number;
  barComplaints: number;
}

export function summarizeProvider(
  providerId: string,
  list: Review[] = reviews,
): ProviderRatingSummary {
  const subset = list.filter((r) => r.providerId === providerId);
  if (subset.length === 0) return { count: 0, average: 0, barComplaints: 0 };
  const sum = subset.reduce((acc, r) => acc + r.rating, 0);
  const barComplaints = subset.filter((r) => r.barComplaintFiled).length;
  return {
    count: subset.length,
    average: Math.round((sum / subset.length) * 10) / 10,
    barComplaints,
  };
}