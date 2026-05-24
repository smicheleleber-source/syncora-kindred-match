export type Complexity = "simple" | "moderate" | "complex";
export type Urgency = "high" | "medium" | "low";
export type FirmSize = "solo" | "small" | "mid" | "large";
export type GenderComposition =
  | "mixed"
  | "predominantly_male"
  | "predominantly_female"
  | "all_male"
  | "all_female"
  | "prefer_not_to_say";

export interface Provider {
  id: string;
  name: string;
  category: string;
  specialties: string[];
  // Subset of `specialties` that the system has independently validated
  // (e.g. license check, sample-work review, peer attestation). Anything in
  // `specialties` but NOT in `validated_specialties` is treated as
  // self-reported experience that still needs validation.
  validated_specialties?: string[];
  complexity_supported: Complexity[];
  // Subset of `complexity_supported` that the Syncora system has independently
  // validated against completed case work (closed matters, peer review,
  // outcome verification). Anything in `complexity_supported` but NOT in
  // `validated_complexity` is treated as a self-claim that still needs proof.
  // Required for "complex" — unvalidated complex claims do not count for
  // matching or display as a confirmed capability.
  validated_complexity?: Complexity[];
  availability: Urgency; // soonest urgency they can handle
  location: string;
  budget_min: number;
  budget_max: number;
  bio: string;
  // Supplier-supplied verification & availability detail
  license_number?: string;
  license_board?: string; // e.g. "Texas State Bar", "California Medical Board"
  years_experience?: number;
  verified?: boolean; // true once license_number + board look valid
  next_available?: string; // ISO date string of soonest open slot
  weekly_capacity?: number; // new matters they can take per week
  contact_email?: string;
  // Alliances may accept donations from community members.
  accepts_donations?: boolean;
  donation_url?: string;
  mission?: string;
  // Rate, firm size, pro bono, and team composition
  pro_bono?: boolean; // offers some free / sliding-scale services
  hourly_rate?: number; // USD / hour; 0 or omitted = flat-fee / contingency
  firm_size?: FirmSize;
  gender_composition?: GenderComposition;
  // Solo / no-paralegal practitioners: when false, the client gets direct
  // availability (no gatekeeper) and an automatic reduced rate.
  has_paralegal?: boolean;
  // Ethical attestations. Each key maps to a checklist item the professional
  // affirms on listing. See ETHICS_CHECKLIST below for the canonical items.
  ethics?: Partial<Record<EthicsKey, boolean>>;
  // Backup-coverage relationships. Required for solo / no-paralegal
  // practitioners so clients aren't stranded if the lawyer is unavailable.
  backup_firms?: BackupContact[];
  // Continuing-education attestations completed in the last 12 months.
  continuing_education?: Partial<Record<CEKey, CEEntry>>;
}

// Flat discount applied (display only) when a lawyer has no paralegal.
export const SOLO_LAWYER_DISCOUNT_PCT = 15;

// ---- Ethical checklist ----

export type EthicsKey =
  | "conflict_check"
  | "fee_transparency"
  | "written_engagement"
  | "confidentiality"
  | "competence_referral"
  | "trust_account"
  | "backup_coverage";

export interface EthicsItem {
  key: EthicsKey;
  label: string;
  description: string;
  /** When true, this item only applies to solo / no-paralegal practitioners. */
  soloOnly?: boolean;
}

export const ETHICS_CHECKLIST: EthicsItem[] = [
  {
    key: "conflict_check",
    label: "Conflict-of-interest check",
    description: "I run a documented conflict check before accepting any new matter.",
  },
  {
    key: "written_engagement",
    label: "Written engagement letter",
    description: "I provide a signed engagement letter setting scope, fees, and termination terms.",
  },
  {
    key: "fee_transparency",
    label: "Fee transparency",
    description: "Hourly rate, retainer, and likely costs are disclosed in writing before the client commits.",
  },
  {
    key: "confidentiality",
    label: "Confidentiality & privilege",
    description: "I maintain client confidentiality and protect privileged communications per applicable bar rules.",
  },
  {
    key: "competence_referral",
    label: "Competence & referral",
    description: "If a matter exceeds my competence, I refer the client to a qualified colleague rather than continue alone.",
  },
  {
    key: "trust_account",
    label: "Client-trust account",
    description: "Client funds are held in a separate IOLTA / trust account, never commingled with operating funds.",
  },
  {
    key: "backup_coverage",
    label: "Backup-coverage relationships",
    description:
      "As a solo / no-paralegal practitioner, I have standing arrangements with at least one other attorney or firm to cover emergencies, deadlines, and extended absences.",
    soloOnly: true,
  },
];

export interface BackupContact {
  firm: string;
  attorney?: string;
  contact?: string; // email or phone
}

export function isSoloPractitioner(p: Provider): boolean {
  return p.firm_size === "solo" || p.has_paralegal === false;
}

// ---- Continuing-education checklist ----

export type CEKey =
  | "ethics_cle"
  | "technology_competence"
  | "trust_accounting"
  | "diversity_bias"
  | "wellness_substance"
  | "practice_area_update"
  | "cybersecurity_privacy";

export interface CEItem {
  key: CEKey;
  label: string;
  description: string;
  /** Minimum hours expected within the last 12 months. */
  minHours: number;
}

export interface CEEntry {
  completed: boolean;
  hours?: number;
  completed_on?: string; // YYYY-MM-DD
  provider?: string; // CLE provider / bar name
}

export const CE_CHECKLIST: CEItem[] = [
  {
    key: "ethics_cle",
    label: "Ethics / professional responsibility CLE",
    description: "Annual bar-required ethics or professional-responsibility credit.",
    minHours: 1,
  },
  {
    key: "technology_competence",
    label: "Technology competence",
    description: "Duty of technology competence — modern tools, e-filing, e-discovery.",
    minHours: 1,
  },
  {
    key: "trust_accounting",
    label: "Trust accounting / IOLTA",
    description: "Handling client funds, reconciliation, and IOLTA compliance.",
    minHours: 1,
  },
  {
    key: "diversity_bias",
    label: "Diversity, equity & implicit bias",
    description: "Bias awareness and inclusive client service training.",
    minHours: 1,
  },
  {
    key: "wellness_substance",
    label: "Lawyer wellness / substance abuse",
    description: "Mental health and substance-abuse awareness for legal professionals.",
    minHours: 1,
  },
  {
    key: "practice_area_update",
    label: "Practice-area update",
    description: "Current-year update CLE in your primary practice area.",
    minHours: 3,
  },
  {
    key: "cybersecurity_privacy",
    label: "Cybersecurity & client privacy",
    description: "Securing client data, breach response, and privilege protection.",
    minHours: 1,
  },
];

export const FIRM_SIZE_LABELS: Record<FirmSize, string> = {
  solo: "Solo practitioner",
  small: "Small firm (2–10)",
  mid: "Mid-size firm (11–50)",
  large: "Large firm (50+)",
};

export const GENDER_LABELS: Record<GenderComposition, string> = {
  mixed: "Mixed gender team",
  predominantly_male: "Predominantly male",
  predominantly_female: "Predominantly female",
  all_male: "All male",
  all_female: "All female",
  prefer_not_to_say: "Prefer not to say",
};

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
  "mutual aid network",
  "worker cooperative",
  "housing cooperative",
  "tenant union",
  "community land trust",
  "restorative justice circle",
  "community defense fund",
  "neighborhood council",
  "credit union / lending circle",
  "indigenous self-governance",
] as const;

// Top-level reason a user comes to Syncora Connect. Each domain expands into a
// list of subcategories (categories), and each subcategory into specialties.
export const DOMAINS = [
  "Legal",
  "Medical",
  "Professional Services",
  "Mediation & Neutrals",
  "Spiritual & Counseling",
  "Self-Governance Alliances",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_DESCRIPTIONS: Record<Domain, string> = {
  Legal: "Attorneys for civil, criminal, family, business, and immigration matters.",
  Medical: "Malpractice and negligence claims involving healthcare providers.",
  "Professional Services": "Negligence by accountants, engineers, and architects.",
  "Mediation & Neutrals":
    "Fringe professionals adjacent to legal work: GALs, mediators, counselors, arbitrators, parenting coordinators, social workers.",
  "Spiritual & Counseling": "Abuse and breach-of-trust by clergy or counselors.",
  "Self-Governance Alliances":
    "Community-led groups: mutual aid, co-ops, tenant unions, restorative circles.",
};

export const CATEGORIES_BY_DOMAIN: Record<Domain, string[]> = {
  Legal: [
    "family law",
    "criminal defense",
    "personal injury",
    "estate planning",
    "business law",
    "immigration law",
    "real estate law",
    "employment law",
    "tax law",
    "legal malpractice",
  ],
  Medical: [
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
  ],
  "Professional Services": [
    "accounting malpractice",
    "engineering malpractice",
    "architectural malpractice",
  ],
  "Mediation & Neutrals": [
    "guardian ad litem",
    "mediator",
    "arbitrator",
    "parenting coordinator",
    "counselor / therapist",
    "social worker",
    "court-appointed evaluator",
    "victim advocate",
  ],
  "Spiritual & Counseling": ["clergy malpractice"],
  "Self-Governance Alliances": [
    "mutual aid network",
    "worker cooperative",
    "housing cooperative",
    "tenant union",
    "community land trust",
    "restorative justice circle",
    "community defense fund",
    "neighborhood council",
    "credit union / lending circle",
    "indigenous self-governance",
  ],
};

// Specialty options shown to users after they pick a category. These define
// finer-grained expertise (e.g. custody, military, DUI) within a practice area.
export const SPECIALTIES_BY_CATEGORY: Record<string, string[]> = {
  "family law": [
    "custody", "divorce", "adoption", "prenuptial agreement", "alimony",
    "child support", "domestic violence", "military family", "LGBTQ+",
    "high-asset", "international custody", "mediation", "uncontested divorce",
    "mental illness in family", "DSS / CPS case", "educational interference",
    "parental alienation", "guardian ad litem disputes", "special needs child",
    "school IEP / 504 disputes", "termination of parental rights",
    "grandparent rights", "relocation / move-away",
  ],
  "criminal defense": [
    "DUI", "drug charges", "white-collar", "federal charges", "juvenile",
    "violent crime", "sex crime", "expungement", "appeals", "military (court-martial)",
    "misdemeanor", "bail",
  ],
  "personal injury": [
    "car accident", "motorcycle", "truck accident", "slip & fall", "dog bite",
    "wrongful death", "product liability", "premises liability", "workplace injury",
  ],
  "estate planning": [
    "wills", "trusts", "probate", "elder law", "special needs",
    "business succession", "asset protection", "veterans benefits",
  ],
  "business law": [
    "contracts", "M&A", "startup incorporation", "IP licensing",
    "partnership disputes", "securities", "franchise", "employment contracts",
  ],
  "immigration law": [
    "visas", "green cards", "naturalization", "asylum", "deportation defense",
    "employment-based", "family-based", "DACA", "investor visas",
  ],
  "real estate law": [
    "closings", "title review", "landlord-tenant", "zoning",
    "commercial leases", "HOA disputes", "construction defects",
  ],
  "employment law": [
    "wrongful termination", "discrimination", "harassment", "wage & hour",
    "whistleblower", "non-compete", "ADA", "military (USERRA)", "severance",
  ],
  "tax law": [
    "IRS audit", "tax planning", "offshore disclosure", "sales tax",
    "estate tax", "business tax", "crypto", "tax litigation",
  ],
  "medical malpractice": [
    "hospital negligence", "ER errors", "anesthesia", "oncology",
    "cardiology", "VA / military medicine",
  ],
  "dental malpractice": [
    "dental implants", "root canal", "nerve damage", "orthodontics",
    "oral surgery", "anesthesia",
  ],
  "nursing malpractice": [
    "nursing home abuse", "medication errors", "bedsores", "falls",
    "elder neglect", "hospice",
  ],
  "surgical malpractice": [
    "wrong-site surgery", "retained instruments", "anesthesia",
    "post-op infection", "robotic surgery", "cosmetic surgery",
  ],
  "birth injury malpractice": [
    "cerebral palsy", "Erb's palsy", "oxygen deprivation",
    "C-section errors", "shoulder dystocia",
  ],
  "misdiagnosis malpractice": [
    "cancer misdiagnosis", "stroke", "heart attack", "infection",
    "pediatric", "ER triage",
  ],
  "pharmacy malpractice": [
    "wrong drug", "dosing error", "drug interaction", "compounding",
    "mail-order pharmacy",
  ],
  "mental health malpractice": [
    "therapist misconduct", "suicide foreseeability", "improper commitment",
    "breach of confidentiality", "boundary violations",
  ],
  "chiropractic malpractice": [
    "cervical manipulation", "disc injury", "informed consent", "stroke",
  ],
  "veterinary malpractice": [
    "surgical errors", "anesthesia", "misdiagnosis",
    "exotic animals", "wrongful death",
  ],
  "legal malpractice": [
    "missed deadlines", "conflict of interest", "settlement negligence",
    "appeals", "fee disputes",
  ],
  "accounting malpractice": [
    "audit failure", "tax prep error", "fiduciary breach",
    "forensic", "securities filings",
  ],
  "engineering malpractice": [
    "structural", "civil", "mechanical", "electrical", "geotechnical",
    "environmental",
  ],
  "architectural malpractice": [
    "design defect", "code violation", "cost overrun",
    "construction administration", "ADA compliance",
  ],
  "clergy malpractice": [
    "clergy abuse", "institutional cover-up", "breach of confidence",
  ],
  "guardian ad litem": [
    "child custody", "abuse & neglect", "termination of parental rights",
    "incapacitated adult", "elder GAL", "probate GAL", "special needs",
  ],
  "mediator": [
    "divorce", "custody", "civil dispute", "workplace", "community",
    "commercial / contract", "elder / family caregiving", "online mediation",
  ],
  "arbitrator": [
    "commercial", "construction", "employment", "consumer",
    "labor / union", "international",
  ],
  "parenting coordinator": [
    "high-conflict custody", "co-parenting plans", "decision-making disputes",
    "reunification", "blended family",
  ],
  "counselor / therapist": [
    "individual therapy", "couples / marriage", "family", "trauma / PTSD",
    "child & adolescent", "domestic violence survivor", "substance use",
    "grief", "court-ordered evaluation",
  ],
  "social worker": [
    "LCSW clinical", "child welfare", "elder welfare", "case management",
    "school social work", "medical social work", "forensic social work",
  ],
  "court-appointed evaluator": [
    "custody evaluation", "psychological evaluation", "competency",
    "risk assessment", "reunification assessment",
  ],
  "victim advocate": [
    "domestic violence", "sexual assault", "child abuse",
    "elder abuse", "court accompaniment", "protective order assistance",
  ],
  "mutual aid network": [
    "food distribution", "rent relief", "medical bill help",
    "childcare support", "disaster response",
  ],
  "worker cooperative": [
    "tech", "trades", "agriculture", "food service", "creative services",
  ],
  "housing cooperative": [
    "limited equity", "student housing", "senior housing", "affordable ownership",
  ],
  "tenant union": [
    "rent strike", "eviction defense", "habitability", "rent control",
  ],
  "community land trust": [
    "affordable homeownership", "commercial CLT", "agricultural CLT",
  ],
  "restorative justice circle": [
    "youth diversion", "harm repair", "school-based", "reentry",
  ],
  "community defense fund": [
    "bail fund", "ICE defense", "protest legal support", "police accountability",
  ],
  "neighborhood council": [
    "participatory budgeting", "public safety", "land use", "civic tech",
  ],
  "credit union / lending circle": [
    "tanda / cundina", "small-business loans", "emergency loans", "financial literacy",
  ],
  "indigenous self-governance": [
    "tribal council", "land back", "traditional courts", "language revitalization",
  ],
};

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
    pro_bono: false,
    hourly_rate: 425,
    firm_size: "mid",
    gender_composition: "mixed",
    has_paralegal: true,
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
    pro_bono: true,
    hourly_rate: 195,
    firm_size: "small",
    gender_composition: "predominantly_female",
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
    pro_bono: true,
    hourly_rate: 275,
    firm_size: "small",
    gender_composition: "mixed",
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
    firm_size: "solo",
    hourly_rate: 175,
    has_paralegal: false,
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
    pro_bono: true,
    hourly_rate: 150,
    firm_size: "solo",
    gender_composition: "predominantly_female",
    has_paralegal: false,
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
    pro_bono: false,
    hourly_rate: 650,
    firm_size: "large",
    gender_composition: "predominantly_male",
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
    pro_bono: true,
    hourly_rate: 295,
    firm_size: "small",
    gender_composition: "mixed",
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
  {
    id: "33",
    name: "Eastside Mutual Aid Collective",
    category: "mutual aid network",
    specialties: ["food distribution", "rent relief", "medical bill help"],
    complexity_supported: ["simple", "moderate"],
    availability: "high",
    location: "Detroit, MI",
    budget_min: 0,
    budget_max: 0,
    bio: "Neighbor-to-neighbor support network covering groceries, rent, and emergency funds.",
    accepts_donations: true,
    mission: "Direct cash and goods to households in crisis — no application, no means test.",
    pro_bono: true,
    hourly_rate: 0,
    firm_size: "small",
    gender_composition: "mixed",
  },
  {
    id: "34",
    name: "Cooperative Builders Guild",
    category: "worker cooperative",
    specialties: ["trades", "tech"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Oakland, CA",
    budget_min: 0,
    budget_max: 0,
    bio: "Worker-owned construction and software co-op reinvesting profits into member equity.",
    accepts_donations: true,
    mission: "Grow the worker-ownership economy through training, financing, and conversions.",
  },
  {
    id: "35",
    name: "Riverside Tenant Union",
    category: "tenant union",
    specialties: ["eviction defense", "habitability", "rent strike"],
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "high",
    location: "Brooklyn, NY",
    budget_min: 0,
    budget_max: 0,
    bio: "Building-by-building organizing for renters facing displacement and disrepair.",
    accepts_donations: true,
    mission: "Fund tenant organizers and emergency stay-in-place grants.",
  },
  {
    id: "36",
    name: "Greenline Community Land Trust",
    category: "community land trust",
    specialties: ["affordable homeownership", "agricultural CLT"],
    complexity_supported: ["complex"],
    availability: "low",
    location: "Atlanta, GA",
    budget_min: 0,
    budget_max: 0,
    bio: "Steward land off the speculative market for permanently affordable homes and farms.",
    accepts_donations: true,
    mission: "Acquire and steward land for permanent community ownership.",
  },
  {
    id: "37",
    name: "Circle Up Restorative Justice",
    category: "restorative justice circle",
    specialties: ["youth diversion", "harm repair", "school-based"],
    complexity_supported: ["moderate"],
    availability: "medium",
    location: "Minneapolis, MN",
    budget_min: 0,
    budget_max: 0,
    bio: "Facilitates restorative dialogues as an alternative to court and school discipline.",
    accepts_donations: true,
    mission: "Train facilitators and run circles in schools, courts, and neighborhoods.",
  },
  {
    id: "38",
    name: "Liberty Bail & Defense Fund",
    category: "community defense fund",
    specialties: ["bail fund", "protest legal support", "ICE defense"],
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "high",
    location: "Houston, TX",
    budget_min: 0,
    budget_max: 0,
    bio: "Rotating revolving fund posting bail and funding defense for low-income arrestees.",
    accepts_donations: true,
    mission: "Free people from cash-bail detention and protect protest and immigrant rights.",
  },
  {
    id: "39",
    name: "South Side Lending Circle",
    category: "credit union / lending circle",
    specialties: ["tanda / cundina", "small-business loans", "financial literacy"],
    complexity_supported: ["simple", "moderate"],
    availability: "medium",
    location: "Chicago, IL",
    budget_min: 0,
    budget_max: 0,
    bio: "Peer-funded micro-loans that build credit and capital outside extractive banking.",
    accepts_donations: true,
    mission: "Capitalize lending pools for unbanked entrepreneurs and families.",
  },
  {
    id: "40",
    name: "Northern Plains Tribal Self-Governance Alliance",
    category: "indigenous self-governance",
    specialties: ["tribal council", "land back", "language revitalization"],
    complexity_supported: ["complex"],
    availability: "low",
    location: "Rapid City, SD",
    budget_min: 0,
    budget_max: 0,
    bio: "Coalition supporting tribal self-determination, sovereignty, and cultural restoration.",
    accepts_donations: true,
    mission: "Resource sovereignty work, land-back campaigns, and language programs.",
  },
  {
    id: "41",
    name: "Rivera GAL Services",
    category: "guardian ad litem",
    specialties: ["child custody", "abuse & neglect", "special needs"],
    complexity_supported: ["moderate", "complex"],
    availability: "high",
    location: "Austin, TX",
    budget_min: 1500,
    budget_max: 6000,
    bio: "Court-appointed guardian ad litem representing the best interests of children in custody and dependency matters.",
    years_experience: 12,
    hourly_rate: 175,
    firm_size: "solo",
    pro_bono: true,
  },
  {
    id: "42",
    name: "Common Ground Mediation",
    category: "mediator",
    specialties: ["divorce", "custody", "online mediation"],
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "high",
    location: "Remote / nationwide",
    budget_min: 800,
    budget_max: 4500,
    bio: "Trained family and civil mediators offering structured, neutral resolution outside the courtroom.",
    years_experience: 9,
    hourly_rate: 220,
    firm_size: "small",
  },
  {
    id: "43",
    name: "Hartwell Arbitration Group",
    category: "arbitrator",
    specialties: ["commercial", "construction", "employment"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Dallas, TX",
    budget_min: 3000,
    budget_max: 18000,
    bio: "Former judges and senior counsel providing AAA/JAMS-style binding arbitration.",
    years_experience: 22,
    hourly_rate: 450,
    firm_size: "small",
  },
  {
    id: "44",
    name: "Bridge Parenting Coordination",
    category: "parenting coordinator",
    specialties: ["high-conflict custody", "co-parenting plans", "reunification"],
    complexity_supported: ["complex"],
    availability: "medium",
    location: "Houston, TX",
    budget_min: 1200,
    budget_max: 5500,
    bio: "Court-appointed parenting coordinators helping high-conflict families implement custody orders.",
    years_experience: 14,
    hourly_rate: 200,
    firm_size: "solo",
  },
  {
    id: "45",
    name: "Cedar Counseling Collective",
    category: "counselor / therapist",
    specialties: ["trauma / PTSD", "domestic violence survivor", "family"],
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "high",
    location: "Portland, OR",
    budget_min: 100,
    budget_max: 250,
    bio: "Licensed clinical therapists offering trauma-informed care, sliding-scale slots, and court-coordinated treatment.",
    years_experience: 10,
    hourly_rate: 150,
    pro_bono: true,
    firm_size: "small",
  },
  {
    id: "46",
    name: "Anchor Forensic Social Work",
    category: "social worker",
    specialties: ["forensic social work", "child welfare", "case management"],
    complexity_supported: ["moderate", "complex"],
    availability: "medium",
    location: "Phoenix, AZ",
    budget_min: 900,
    budget_max: 4000,
    bio: "LCSW-led practice supporting attorneys with mitigation, child welfare, and case-management work.",
    years_experience: 11,
    hourly_rate: 165,
    firm_size: "solo",
  },
  {
    id: "47",
    name: "Meridian Custody Evaluations",
    category: "court-appointed evaluator",
    specialties: ["custody evaluation", "psychological evaluation", "reunification assessment"],
    complexity_supported: ["complex"],
    availability: "low",
    location: "Denver, CO",
    budget_min: 4500,
    budget_max: 15000,
    bio: "Licensed psychologists conducting court-ordered custody and risk evaluations.",
    years_experience: 18,
    hourly_rate: 300,
    firm_size: "small",
  },
  {
    id: "48",
    name: "Safe Harbor Victim Advocacy",
    category: "victim advocate",
    specialties: ["domestic violence", "sexual assault", "protective order assistance"],
    complexity_supported: ["simple", "moderate", "complex"],
    availability: "high",
    location: "Atlanta, GA",
    budget_min: 0,
    budget_max: 0,
    bio: "Nonprofit advocates providing court accompaniment, safety planning, and protective-order support at no cost.",
    accepts_donations: true,
    mission: "Free, trauma-informed advocacy for survivors navigating courts and law enforcement.",
    pro_bono: true,
    firm_size: "small",
  },
];

export interface MatchInput {
  category: string;
  specialties: string[];
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

/**
 * Extra credit (0–10) for matching urgency with faster-than-needed availability.
 * High urgency rewards high-availability providers strongly; low urgency
 * doesn't need a speed boost.
 */
function computeUrgencyBoost(
  inputUrgency: Urgency,
  provAvail: Urgency,
): { pts: number; note: string } {
  const need = urgencyRank[inputUrgency];
  const have = urgencyRank[provAvail];
  if (need <= 1) {
    return { pts: 0, note: "Low urgency — no speed boost applied" };
  }
  // High urgency: high avail +10, medium +4, low +0
  // Medium urgency: high avail +6, medium +3, low +0
  let pts = 0;
  if (need === 3) pts = have === 3 ? 10 : have === 2 ? 4 : 0;
  else if (need === 2) pts = have === 3 ? 6 : have === 2 ? 3 : 0;
  if (pts === 0) {
    return {
      pts: 0,
      note: `Their ${provAvail} availability doesn't accelerate a ${inputUrgency}-urgency matter`,
    };
  }
  return {
    pts,
    note: `Faster than required (${provAvail} availability for ${inputUrgency} urgency)`,
  };
}

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
    const categoryPts = categoryMatch ? 20 : 0;

    // Specialty subscore (max 10) rolls into the documented 30-pt category weight.
    const userSpecs = input.specialties.map((s) => s.toLowerCase());
    const provSpecs = provider.specialties.map((s) => s.toLowerCase());
    const overlap = userSpecs.filter((s) => provSpecs.includes(s));
    let specialtyPts = 0;
    let specialtyNote = "";
    if (!categoryMatch) {
      specialtyPts = 0;
      specialtyNote = "Different category — specialties not credited";
    } else if (userSpecs.length === 0) {
      specialtyPts = 10;
      specialtyNote = `Covers ${provider.specialties.slice(0, 3).join(", ")}${provider.specialties.length > 3 ? ", …" : ""}`;
    } else {
      specialtyPts = Math.round((overlap.length / userSpecs.length) * 10);
      specialtyNote = overlap.length
        ? `Matches your specialties: ${overlap.join(", ")}`
        : `No overlap with your specialties (offers ${provider.specialties.slice(0, 3).join(", ")})`;
    }

    breakdown.push({
      label: "Category",
      points: categoryPts,
      max: 20,
      note: categoryMatch ? `Practices ${provider.category}` : `Different category (${provider.category})`,
    });
    breakdown.push({
      label: "Specialty",
      points: specialtyPts,
      max: 10,
      note: specialtyNote,
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

    // Urgency boost: when the client is in a hurry, reward providers whose
    // own availability is faster than the bare minimum. No boost (and no
    // penalty) when urgency is low — speed isn't needed.
    const urgencyBoost = computeUrgencyBoost(input.urgency, provider.availability);
    breakdown.push({
      label: "Urgency boost",
      points: urgencyBoost.pts,
      max: 10,
      note: urgencyBoost.note,
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
