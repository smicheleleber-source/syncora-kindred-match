export type Complexity = "simple" | "moderate" | "complex";
export type Urgency = "high" | "medium" | "low";

export interface Provider {
  id: string;
  name: string;
  category: string;
  complexity_supported: Complexity[];
  availability: Urgency; // soonest urgency they can handle
  location: string;
  budget_min: number;
  budget_max: number;
  bio: string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "1",
    name: "Hartley & Vance Family Law",
    category: "family law",
    complexity_supported: ["moderate", "complex"],
    availability: "high",
    location: "Austin, TX",
    budget_min: 3000,
    budget_max: 12000,
    bio: "Senior litigators specializing in complex custody and high-asset divorce.",
  },
  {
    id: "2",
    name: "Marlowe Legal Collective",
    category: "family law",
    complexity_supported: ["simple", "moderate"],
    availability: "medium",
    location: "Austin, TX",
    budget_min: 800,
    budget_max: 4000,
    bio: "Approachable family attorneys focused on mediation and uncontested cases.",
  },
  {
    id: "3",
    name: "Okafor Family Advocates",
    category: "family law",
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "high",
    location: "Dallas, TX",
    budget_min: 2000,
    budget_max: 9000,
    bio: "Full-service family law with rapid intake for urgent matters.",
  },
  {
    id: "4",
    name: "Bayside Family Law Group",
    category: "family law",
    complexity_supported: ["simple"],
    availability: "low",
    location: "San Diego, CA",
    budget_min: 500,
    budget_max: 2500,
    bio: "Flat-fee uncontested divorce and document prep.",
  },
  {
    id: "5",
    name: "Lindgren & Park LLP",
    category: "family law",
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Seattle, WA",
    budget_min: 4000,
    budget_max: 15000,
    bio: "Trial-tested counsel for contested custody and asset division.",
  },
  {
    id: "6",
    name: "Rivera Mediation Studio",
    category: "family law",
    complexity_supported: ["simple", "moderate"],
    availability: "high",
    location: "Brooklyn, NY",
    budget_min: 1000,
    budget_max: 5000,
    bio: "Collaborative mediation-first practice with quick turnaround.",
  },
  {
    id: "7",
    name: "Holloway Family Counsel",
    category: "family law",
    complexity_supported: ["complex"],
    availability: "low",
    location: "Chicago, IL",
    budget_min: 6000,
    budget_max: 20000,
    bio: "Boutique firm for international custody and high-net-worth cases.",
  },
  {
    id: "8",
    name: "Greenfield Family Law Clinic",
    category: "family law",
    complexity_supported: ["simple", "moderate"],
    availability: "medium",
    location: "Denver, CO",
    budget_min: 600,
    budget_max: 3500,
    bio: "Community-focused practice with sliding-scale fees.",
  },
];

export interface MatchInput {
  category: string;
  urgency: Urgency;
  complexity: Complexity;
  location: string;
  budget_min: number;
  budget_max: number;
}

export interface ScoredProvider {
  provider: Provider;
  score: number;
  breakdown: { label: string; points: number; max: number; note: string }[];
}

const urgencyRank: Record<Urgency, number> = { high: 3, medium: 2, low: 1 };

function normalizeLoc(s: string) {
  return s.toLowerCase().trim();
}

function locationScore(userLoc: string, provLoc: string): { pts: number; note: string } {
  const u = normalizeLoc(userLoc);
  if (!u) return { pts: 0, note: "No location provided" };
  const p = normalizeLoc(provLoc);
  if (p === u) return { pts: 15, note: `Exact match (${provLoc})` };
  const uParts = u.split(",").map((x) => x.trim()).filter(Boolean);
  const pParts = p.split(",").map((x) => x.trim()).filter(Boolean);
  const city = uParts[0];
  const state = uParts[1];
  if (city && pParts[0] === city) return { pts: 15, note: `Same city (${provLoc})` };
  if (state && pParts[1] === state) return { pts: 9, note: `Same state (${provLoc})` };
  return { pts: 0, note: `Different region (${provLoc})` };
}

function budgetScore(userMin: number, userMax: number, provMin: number, provMax: number): { pts: number; note: string } {
  if (userMax <= 0) return { pts: 0, note: "No budget provided" };
  const overlap = Math.min(userMax, provMax) - Math.max(userMin, provMin);
  if (overlap >= 0) {
    const userRange = Math.max(1, userMax - userMin);
    const ratio = Math.min(1, (overlap + 1) / userRange);
    const pts = Math.round(6 + ratio * 4);
    return { pts, note: `Budget overlaps yours ($${provMin}–$${provMax})` };
  }
  const gap = Math.max(provMin - userMax, userMin - provMax);
  const reference = Math.max(userMax, 1);
  const closeness = Math.max(0, 1 - gap / reference);
  const pts = Math.round(closeness * 5);
  return { pts, note: `Budget outside yours ($${provMin}–$${provMax})` };
}

export function matchProviders(input: MatchInput, providers: Provider[] = PROVIDERS): ScoredProvider[] {
  const scored = providers.map<ScoredProvider>((provider) => {
    const breakdown: ScoredProvider["breakdown"] = [];

    const categoryMatch = provider.category.toLowerCase() === input.category.toLowerCase();
    breakdown.push({
      label: "Category",
      points: categoryMatch ? 30 : 0,
      max: 30,
      note: categoryMatch ? `Practices ${provider.category}` : `Different category (${provider.category})`,
    });

    const complexityFit = provider.complexity_supported.includes(input.complexity);
    const adjacentFit =
      !complexityFit &&
      provider.complexity_supported.some((c) => Math.abs(rankComplexity(c) - rankComplexity(input.complexity)) === 1);
    const complexityPts = complexityFit ? 25 : adjacentFit ? 12 : 0;
    breakdown.push({
      label: "Complexity",
      points: complexityPts,
      max: 25,
      note: complexityFit
        ? `Handles ${input.complexity} cases`
        : adjacentFit
          ? `Handles adjacent complexity (${provider.complexity_supported.join(", ")})`
          : `Doesn't typically handle ${input.complexity} cases`,
    });

    const availDelta = urgencyRank[provider.availability] - urgencyRank[input.urgency];
    const availPts = availDelta >= 0 ? 20 : availDelta === -1 ? 10 : 4;
    breakdown.push({
      label: "Availability",
      points: availPts,
      max: 20,
      note:
        availDelta >= 0
          ? `Available for ${input.urgency} urgency (their slot: ${provider.availability})`
          : `Limited availability for ${input.urgency} urgency (their slot: ${provider.availability})`,
    });

    const loc = locationScore(input.location, provider.location);
    breakdown.push({ label: "Location", points: loc.pts, max: 15, note: loc.note });

    const bud = budgetScore(input.budget_min, input.budget_max, provider.budget_min, provider.budget_max);
    breakdown.push({ label: "Budget", points: bud.pts, max: 10, note: bud.note });

    const score = breakdown.reduce((s, b) => s + b.points, 0);
    return { provider, score, breakdown };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

function rankComplexity(c: Complexity) {
  return c === "simple" ? 1 : c === "moderate" ? 2 : 3;
}