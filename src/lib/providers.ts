export type Complexity = "simple" | "moderate" | "complex";
export type Urgency = "high" | "medium" | "low";

export interface Provider {
  id: string;
  name: string;
  category: string;
  specialties: string[];
  complexity_supported: Complexity[];
  availability: Urgency; // soonest urgency they can handle
  location: string;
  budget_min: number;
  budget_max: number;
  bio: string;
}

export const CATEGORIES = [
  "family law",
  "criminal defense",
  "personal injury",
  "estate planning",
  "business law",
  "immigration law",
  "real estate law",
  "employment law",
  "tax law",
  "medical malpractice",
  "dental malpractice",
  "nursing malpractice",
  "surgical malpractice",
  "birth injury malpractice",
  "misdiagnosis malpractice",
  "pharmacy malpractice",
  "mental health malpractice",
  "chiropractic malpractice",
  "veterinary malpractice",
  "legal malpractice",
  "accounting malpractice",
  "engineering malpractice",
  "architectural malpractice",
  "clergy malpractice",
] as const;

export const PROVIDERS: Provider[] = [
  {
    id: "1",
    name: "Hartley & Vance Family Law",
    category: "family law",
    specialties: ["custody", "divorce", "high-asset", "prenuptial agreement"],
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
    specialties: ["divorce", "mediation", "uncontested divorce", "alimony"],
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
    specialties: ["custody", "divorce", "domestic violence", "child support"],
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
    specialties: ["uncontested divorce", "document prep"],
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
    specialties: ["custody", "divorce", "asset division", "alimony"],
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
    specialties: ["mediation", "collaborative divorce", "co-parenting"],
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
    specialties: ["international custody", "high-asset", "prenuptial agreement"],
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
    specialties: ["divorce", "custody", "adoption", "domestic violence"],
    complexity_supported: ["simple", "moderate"],
    availability: "medium",
    location: "Denver, CO",
    budget_min: 600,
    budget_max: 3500,
    bio: "Community-focused practice with sliding-scale fees.",
  },
  {
    id: "9",
    name: "Cross & Brennan Criminal Defense",
    category: "criminal defense",
    specialties: ["DUI", "federal charges", "violent crime", "white-collar"],
    complexity_supported: ["moderate", "complex"],
    availability: "high",
    location: "Los Angeles, CA",
    budget_min: 5000,
    budget_max: 25000,
    bio: "Former prosecutors defending DUIs, felonies, and federal charges.",
  },
  {
    id: "10",
    name: "Reyes Criminal Law Firm",
    category: "criminal defense",
    specialties: ["DUI", "misdemeanor", "drug charges", "bail"],
    complexity_supported: ["simple", "moderate"],
    availability: "high",
    location: "Houston, TX",
    budget_min: 1500,
    budget_max: 8000,
    bio: "24/7 bail assistance and misdemeanor defense with transparent pricing.",
  },
  {
    id: "11",
    name: "Summit Personal Injury Partners",
    category: "personal injury",
    specialties: ["car accident", "slip & fall", "wrongful death", "motorcycle"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Denver, CO",
    budget_min: 0,
    budget_max: 50000,
    bio: "Contingency-fee car accidents, slips, and wrongful death cases.",
  },
  {
    id: "12",
    name: "Berkshire Estate Planning Group",
    category: "estate planning",
    specialties: ["wills", "trusts", "probate", "elder law"],
    complexity_supported: ["simple", "moderate"],
    availability: "low",
    location: "Boston, MA",
    budget_min: 1200,
    budget_max: 6000,
    bio: "Wills, trusts, and probate avoidance for families and retirees.",
  },
  {
    id: "13",
    name: "Meridian Business Counsel",
    category: "business law",
    specialties: ["contracts", "M&A", "startup incorporation", "partnership disputes"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "New York, NY",
    budget_min: 4000,
    budget_max: 20000,
    bio: "Contract negotiation, M&A prep, and startup incorporation.",
  },
  {
    id: "14",
    name: "Pinnacle Immigration Services",
    category: "immigration law",
    specialties: ["visas", "green cards", "naturalization", "deportation defense", "asylum"],
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "high",
    location: "Miami, FL",
    budget_min: 1000,
    budget_max: 10000,
    bio: "Visas, green cards, naturalization, and removal defense.",
  },
  {
    id: "15",
    name: "Westgate Real Estate Law",
    category: "real estate law",
    specialties: ["closings", "title review", "landlord-tenant", "zoning"],
    complexity_supported: ["simple", "moderate"],
    availability: "low",
    location: "Phoenix, AZ",
    budget_min: 800,
    budget_max: 4500,
    bio: "Closings, title review, and landlord-tenant disputes.",
  },
  {
    id: "16",
    name: "Fairwork Employment Attorneys",
    category: "employment law",
    specialties: ["wrongful termination", "discrimination", "wage & hour", "harassment"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "San Francisco, CA",
    budget_min: 2500,
    budget_max: 12000,
    bio: "Wrongful termination, discrimination, and wage-and-hour claims.",
  },
  {
    id: "17",
    name: "Ledger Tax & Legal",
    category: "tax law",
    specialties: ["IRS audit", "tax planning", "business tax", "offshore disclosure"],
    complexity_supported: ["moderate", "complex"],
    availability: "low",
    location: "Chicago, IL",
    budget_min: 3000,
    budget_max: 15000,
    bio: "IRS disputes, audits, and tax planning for individuals and small businesses.",
  },
  {
    id: "18",
    name: "Caldwell Medical Malpractice Group",
    category: "medical malpractice",
    specialties: ["hospital negligence", "ER errors", "anesthesia", "oncology"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Philadelphia, PA",
    budget_min: 0,
    budget_max: 75000,
    bio: "Contingency-fee representation for hospital negligence and physician errors.",
  },
  {
    id: "19",
    name: "Whitestone Dental Malpractice Attorneys",
    category: "dental malpractice",
    specialties: ["dental implants", "root canal", "nerve damage", "orthodontics"],
    complexity_supported: ["simple", "moderate"],
    availability: "medium",
    location: "Atlanta, GA",
    budget_min: 500,
    budget_max: 20000,
    bio: "Botched procedures, nerve damage, and failed implant claims.",
  },
  {
    id: "20",
    name: "Patrone Nursing Negligence Law",
    category: "nursing malpractice",
    specialties: ["nursing home abuse", "medication errors", "bedsores", "elder neglect"],
    complexity_supported: ["moderate", "complex"],
    availability: "high",
    location: "Columbus, OH",
    budget_min: 1000,
    budget_max: 30000,
    bio: "Nursing home abuse, medication errors, and elder care neglect.",
  },
  {
    id: "21",
    name: "Sterling Surgical Error Advocates",
    category: "surgical malpractice",
    specialties: ["wrong-site surgery", "retained instruments", "anesthesia", "post-op infection"],
    complexity_supported: ["complex"],
    availability: "low",
    location: "Houston, TX",
    budget_min: 2000,
    budget_max: 100000,
    bio: "Retained instruments, wrong-site surgery, and anesthesia complications.",
  },
  {
    id: "22",
    name: "Cradle & Care Birth Injury Firm",
    category: "birth injury malpractice",
    specialties: ["cerebral palsy", "Erb's palsy", "oxygen deprivation", "C-section errors"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Charlotte, NC",
    budget_min: 0,
    budget_max: 150000,
    bio: "Cerebral palsy, Erb's palsy, and delivery-room negligence cases.",
  },
  {
    id: "23",
    name: "Cardinal Misdiagnosis Law Partners",
    category: "misdiagnosis malpractice",
    specialties: ["cancer misdiagnosis", "stroke", "heart attack", "ER triage"],
    complexity_supported: ["moderate", "complex"],
    availability: "high",
    location: "Minneapolis, MN",
    budget_min: 1500,
    budget_max: 60000,
    bio: "Delayed cancer diagnosis, stroke misreads, and ER triage failures.",
  },
  {
    id: "24",
    name: "Apothecary Liability Counsel",
    category: "pharmacy malpractice",
    specialties: ["wrong drug", "dosing error", "drug interaction", "compounding"],
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "medium",
    location: "Orlando, FL",
    budget_min: 800,
    budget_max: 25000,
    bio: "Prescription mix-ups, dosing errors, and dangerous drug interactions.",
  },
  {
    id: "25",
    name: "Beacon Mental Health Malpractice",
    category: "mental health malpractice",
    specialties: ["therapist misconduct", "suicide foreseeability", "improper commitment", "breach of confidentiality"],
    complexity_supported: ["moderate", "complex"],
    availability: "low",
    location: "Portland, OR",
    budget_min: 1500,
    budget_max: 35000,
    bio: "Therapist boundary violations, suicide foreseeability, and improper commitment.",
  },
  {
    id: "26",
    name: "Aligned Spine Chiropractic Claims",
    category: "chiropractic malpractice",
    specialties: ["cervical manipulation", "disc injury", "informed consent"],
    complexity_supported: ["simple", "moderate"],
    availability: "medium",
    location: "Las Vegas, NV",
    budget_min: 500,
    budget_max: 15000,
    bio: "Stroke from cervical manipulation, herniated discs, and informed-consent failures.",
  },
  {
    id: "27",
    name: "Pawline Veterinary Malpractice",
    category: "veterinary malpractice",
    specialties: ["surgical errors", "anesthesia", "misdiagnosis", "exotic animals"],
    complexity_supported: ["simple", "moderate"],
    availability: "high",
    location: "Nashville, TN",
    budget_min: 400,
    budget_max: 10000,
    bio: "Surgical errors, anesthesia deaths, and misdiagnosis in companion animals.",
  },
  {
    id: "28",
    name: "Hartwell Legal Malpractice Group",
    category: "legal malpractice",
    specialties: ["missed deadlines", "conflict of interest", "settlement negligence", "appeals"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Washington, DC",
    budget_min: 2500,
    budget_max: 40000,
    bio: "Missed deadlines, conflicts of interest, and attorney negligence claims.",
  },
  {
    id: "29",
    name: "Ballard Accounting Malpractice Counsel",
    category: "accounting malpractice",
    specialties: ["audit failure", "tax prep error", "fiduciary breach", "forensic"],
    complexity_supported: ["moderate", "complex"],
    availability: "low",
    location: "Charlotte, NC",
    budget_min: 3000,
    budget_max: 45000,
    bio: "CPA negligence, audit failures, and tax preparer errors.",
  },
  {
    id: "30",
    name: "Truss & Beam Engineering Liability",
    category: "engineering malpractice",
    specialties: ["structural", "civil", "mechanical", "geotechnical"],
    complexity_supported: ["complex"],
    availability: "low",
    location: "Pittsburgh, PA",
    budget_min: 5000,
    budget_max: 80000,
    bio: "Structural failures, design defects, and professional engineer negligence.",
  },
  {
    id: "31",
    name: "Drafted Architectural Malpractice Firm",
    category: "architectural malpractice",
    specialties: ["design defect", "code violation", "cost overrun", "construction administration"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "San Francisco, CA",
    budget_min: 4000,
    budget_max: 50000,
    bio: "Plan defects, code violations, and construction administration failures.",
  },
  {
    id: "32",
    name: "Sanctuary Clergy Abuse Advocates",
    category: "clergy malpractice",
    specialties: ["clergy abuse", "institutional cover-up", "breach of confidence"],
    complexity_supported: ["complex"],
    availability: "medium",
    location: "Boston, MA",
    budget_min: 0,
    budget_max: 60000,
    bio: "Confidential representation for clergy abuse and institutional cover-ups.",
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
