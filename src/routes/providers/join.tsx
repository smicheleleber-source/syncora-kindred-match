import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  CATEGORIES_BY_DOMAIN,
  CE_CHECKLIST,
  DOMAINS,
  ETHICS_CHECKLIST,
  FIRM_SIZE_LABELS,
  GENDER_LABELS,
  SPECIALTIES_BY_CATEGORY,
  type BackupContact,
  type CEEntry,
  type CEKey,
  type Certification,
  type Complexity,
  type Degree,
  type Domain,
  type EthicsKey,
  type FirmSize,
  type GenderComposition,
  type Urgency,
} from "@/lib/providers";
import { addProvider } from "@/lib/provider-store";
import { useLibrary } from "@/lib/connections";

export const Route = createFileRoute("/providers/join")({
  head: () => ({
    meta: [
      { title: "List your practice — Syncora Connect" },
      {
        name: "description",
        content:
          "Suppliers: publish your availability, license, and specialties so Syncora Connect can match you with clients.",
      },
    ],
  }),
  component: JoinPage,
});

// Schema for supplier intake — validated before any provider is added.
const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Practice name is required")
    .max(120, "Practice name must be under 120 characters"),
  contact_email: z.string().trim().email("Enter a valid email").max(255),
  domain: z.enum(DOMAINS as unknown as [Domain, ...Domain[]]),
  category: z.string().min(1, "Pick a subcategory"),
  specialties: z
    .array(z.string().min(1).max(60))
    .max(20, "Up to 20 specialties"),
  location: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z .'-]+,\s*[A-Za-z]{2,}$/,
      "Use format: City, ST (e.g. Austin, TX)",
    )
    .max(80),
  complexity_supported: z
    .array(z.enum(["simple", "moderate", "complex"]))
    .min(1, "Select at least one complexity level"),
  availability: z.enum(["high", "medium", "low"]),
  next_available: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .optional()
    .or(z.literal("")),
  weekly_capacity: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(200, "Unrealistic capacity"),
  budget_min: z.number().int().min(0).max(1_000_000),
  budget_max: z.number().int().min(0).max(1_000_000),
  practice_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .refine((d) => {
      const t = new Date(d).getTime();
      if (Number.isNaN(t)) return false;
      const now = Date.now();
      const earliest = now - 80 * 365.25 * 24 * 60 * 60 * 1000;
      return t <= now && t >= earliest;
    }, "Date must be in the past and within the last 80 years"),
  license_number: z
    .string()
    .trim()
    .min(3, "License number is required for verification")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers, and dashes only"),
  license_board: z
    .string()
    .trim()
    .min(2, "Issuing board is required")
    .max(120),
  bio: z
    .string()
    .trim()
    .min(20, "Add at least a short description (20+ chars)")
    .max(600, "Keep your bio under 600 characters"),
  pro_bono: z.boolean().optional(),
  hourly_rate: z.number().int().min(0).max(5000).optional(),
  firm_size: z.enum(["solo", "small", "mid", "large"]).optional(),
  gender_composition: z.enum([
    "mixed",
    "predominantly_male",
    "predominantly_female",
    "all_male",
    "all_female",
    "prefer_not_to_say",
  ]).optional(),
  has_paralegal: z.boolean().optional(),
  licensed_states: z
    .array(z.string().regex(/^[A-Z]{2}$/, "Use 2-letter state codes"))
    .max(56, "Too many states")
    .optional(),
  ethics: z.record(z.string(), z.boolean()).optional(),
  backup_firms: z
    .array(
      z.object({
        firm: z.string().trim().min(2, "Firm name required").max(120),
        attorney: z.string().trim().max(120).optional().or(z.literal("")),
        contact: z.string().trim().max(160).optional().or(z.literal("")),
      }),
    )
    .max(10)
    .optional(),
  continuing_education: z
    .record(
      z.string(),
      z.object({
        completed: z.boolean(),
        hours: z.number().min(0).max(200).optional(),
        completed_on: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .or(z.literal("")),
        provider: z.string().trim().max(160).optional().or(z.literal("")),
      }),
    )
    .optional(),
  degrees: z
    .array(
      z.object({
        degree: z.string().trim().min(1, "Degree required").max(40),
        institution: z.string().trim().min(2, "Institution required").max(160),
        field: z.string().trim().max(120).optional().or(z.literal("")),
        year: z
          .number()
          .int()
          .min(1900)
          .max(new Date().getFullYear() + 1)
          .optional(),
      }),
    )
    .max(15)
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string().trim().min(2, "Name required").max(160),
        issuer: z.string().trim().min(2, "Issuer required").max(160),
        year: z
          .number()
          .int()
          .min(1900)
          .max(new Date().getFullYear() + 1)
          .optional(),
        expires: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .or(z.literal("")),
      }),
    )
    .max(20)
    .optional(),
}).refine((v) => v.budget_max >= v.budget_min, {
  message: "Max budget must be ≥ min budget",
  path: ["budget_max"],
}).superRefine((v, ctx) => {
  const isSolo = v.firm_size === "solo" || v.has_paralegal === false;
  if (!isSolo) return;
  // Solo practitioners must attest backup coverage and list at least one firm.
  if (!v.ethics?.backup_coverage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Solo practitioners must attest to backup-coverage arrangements.",
      path: ["ethics", "backup_coverage"],
    });
  }
  const firms = (v.backup_firms ?? []).filter((b) => b.firm.trim());
  if (firms.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add at least one backup firm or attorney you have arrangements with.",
      path: ["backup_firms"],
    });
  }
});

type FormErrors = Partial<Record<string, string>>;

function JoinPage() {
  const navigate = useNavigate();
  const library = useLibrary();
  const [domain, setDomain] = useState<Domain>("Legal Services");
  const [category, setCategory] = useState<string>(
    CATEGORIES_BY_DOMAIN["Legal Services"][0],
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<Complexity[]>(["moderate"]);
  const [availability, setAvailability] = useState<Urgency>("medium");
  const [nextAvail, setNextAvail] = useState("");
  const [weeklyCapacity, setWeeklyCapacity] = useState(3);
  const [budgetMin, setBudgetMin] = useState(1000);
  const [budgetMax, setBudgetMax] = useState(8000);
  const [practiceStart, setPracticeStart] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseBoard, setLicenseBoard] = useState("");
  const [bio, setBio] = useState("");
  const [proBono, setProBono] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [firmSize, setFirmSize] = useState<FirmSize | undefined>(undefined);
  const [genderComp, setGenderComp] = useState<GenderComposition | undefined>(
    undefined,
  );
  const [hasParalegal, setHasParalegal] = useState<boolean>(true);
  const [licensedStatesText, setLicensedStatesText] = useState("");
  const [ethics, setEthics] = useState<Partial<Record<EthicsKey, boolean>>>({});
  const [backupFirms, setBackupFirms] = useState<BackupContact[]>([
    { firm: "", attorney: "", contact: "" },
  ]);
  const [ce, setCe] = useState<Partial<Record<CEKey, CEEntry>>>({});
  const [degrees, setDegrees] = useState<Degree[]>([
    { degree: "", institution: "", field: "", year: undefined },
  ]);
  const [certifications, setCertifications] = useState<Certification[]>([
    { name: "", issuer: "", year: undefined, expires: "" },
  ]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  const specialtyOptions = useMemo(
    () => SPECIALTIES_BY_CATEGORY[category] ?? [],
    [category],
  );

  const isSolo = firmSize === "solo" || hasParalegal === false;

  function toggle<T>(list: T[], setList: (v: T[]) => void, v: T) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    const licensedStates = Array.from(
      new Set(
        licensedStatesText
          .split(/[,\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
      ),
    );
    const payload = {
      name,
      contact_email: email,
      domain,
      category,
      specialties,
      location,
      complexity_supported: complexity,
      availability,
      next_available: nextAvail,
      weekly_capacity: weeklyCapacity,
      budget_min: budgetMin,
      budget_max: budgetMax,
      practice_start_date: practiceStart,
      license_number: licenseNumber,
      license_board: licenseBoard,
      bio,
      pro_bono: proBono,
      hourly_rate: hourlyRate,
      firm_size: firmSize,
      gender_composition: genderComp,
      has_paralegal: hasParalegal,
      licensed_states: licensedStates.length ? licensedStates : undefined,
      ethics,
      backup_firms: backupFirms
        .map((b) => ({
          firm: b.firm.trim(),
          attorney: b.attorney?.trim() || undefined,
          contact: b.contact?.trim() || undefined,
        }))
        .filter((b) => b.firm),
      continuing_education: ce,
      degrees: degrees
        .map((d) => ({
          degree: d.degree.trim(),
          institution: d.institution.trim(),
          field: d.field?.trim() || undefined,
          year: d.year || undefined,
        }))
        .filter((d) => d.degree && d.institution),
      certifications: certifications
        .map((c) => ({
          name: c.name.trim(),
          issuer: c.issuer.trim(),
          year: c.year || undefined,
          expires: c.expires?.trim() || undefined,
        }))
        .filter((c) => c.name && c.issuer),
    };
    const parsed = supplierSchema.safeParse(payload);
    if (!parsed.success) {
      const fe: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      // Surface validation errors: scroll the error summary into view and focus it.
      requestAnimationFrame(() => {
        const el = errorSummaryRef.current;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.focus();
        }
      });
      return;
    }
    setErrors({});
    const v = parsed.data;

    addProvider({
      id: `s-${Date.now()}`,
      name: v.name,
      category: v.category,
      specialties: v.specialties,
      // All self-reported on signup — must be validated later by the system.
      validated_specialties: [],
      complexity_supported: v.complexity_supported,
      availability: v.availability,
      location: v.location,
      budget_min: v.budget_min,
      budget_max: v.budget_max,
      bio: v.bio,
      license_number: v.license_number,
      license_board: v.license_board,
      practice_start_date: v.practice_start_date,
      // Experience validation is system-controlled — Syncora cross-checks the
      // date against the licensing board and accumulated case work.
      experience_validated: false,
      // `verified` is a system-controlled attribute. It is NEVER set by the
      // professional on signup — Syncora staff (or an automated license-board
      // check) flips it on only after the license + identity are confirmed.
      verified: false,
      next_available: v.next_available || undefined,
      weekly_capacity: v.weekly_capacity,
      contact_email: v.contact_email,
      pro_bono: v.pro_bono,
      hourly_rate: v.hourly_rate,
      firm_size: v.firm_size,
      gender_composition: v.gender_composition,
      has_paralegal: v.has_paralegal,
      licensed_states: v.licensed_states,
      ethics: v.ethics,
      backup_firms: v.backup_firms,
      continuing_education: v.continuing_education,
      // All credentials enter as unvalidated claims — system flips
      // `validated` after confirmation with the issuing institution / body.
      degrees: (v.degrees ?? []).map((d) => ({ ...d, validated: false })),
      certifications: (v.certifications ?? []).map((c) => ({
        ...c,
        validated: false,
      })),
    });

    setSuccess(
      "Listing saved. Verification is performed by Syncora — your profile will show as unverified until our team confirms your license with the issuing board.",
    );
    setTimeout(() => navigate({ to: "/" }), 1500);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-br from-accent/10 via-background to-primary/5">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Syncora Connect · Suppliers
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            List your practice
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Tell us what you do, when you're available, and your credentials.
            Verified listings rank higher and get surfaced to matched clients.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← Back to client matching
            </Link>
            <Link
              to="/professionals"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              For professionals →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
          noValidate
        >
          {success && (
            <div className="mb-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground">
              {success}
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
              className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground outline-none"
            >
              <p className="font-semibold text-destructive">
                Please fix {Object.keys(errors).length} issue
                {Object.keys(errors).length === 1 ? "" : "s"} before submitting:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {Object.entries(errors).map(([key, msg]) => (
                  <li key={key}>
                    <span className="font-medium text-foreground">{key}:</span> {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section title="About your practice">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Practice name" error={errors.name}>
                <Input
                  value={name}
                  onChange={setName}
                  placeholder="Hartley & Vance Family Law"
                  maxLength={120}
                />
              </Field>
              <Field label="Contact email" error={errors.contact_email}>
                <Input
                  value={email}
                  onChange={setEmail}
                  type="email"
                  placeholder="intake@yourfirm.com"
                  maxLength={255}
                />
              </Field>
              <Field label="Location (city, state)" error={errors.location}>
                <Input
                  value={location}
                  onChange={setLocation}
                  placeholder="Austin, TX"
                  maxLength={80}
                />
              </Field>
              <Field
                label="States licensed to practice in"
                error={errors.licensed_states}
              >
                <Input
                  value={licensedStatesText}
                  onChange={setLicensedStatesText}
                  placeholder="TX, NM, OK"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Comma-separated 2-letter state codes. Each state is verified
                  against its bar admission record. Use the{" "}
                  <Link
                    to="/supply-demand"
                    className="font-medium text-primary hover:underline"
                  >
                    supply-vs-demand map
                  </Link>{" "}
                  to decide whether to get licensed in another state.
                </p>
              </Field>
              <Field
                label="Date of entry into practice"
                error={errors.practice_start_date}
              >
                <input
                  type="date"
                  value={practiceStart}
                  onChange={(e) => setPracticeStart(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Experience is derived from this date and only shows as
                  validated after Syncora cross-checks it with the licensing
                  board and your in-tool case history.
                </p>
              </Field>
            </div>
          </Section>

          <Section title="What you handle">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Domain">
                <select
                  value={domain}
                  onChange={(e) => {
                    const d = e.target.value as Domain;
                    setDomain(d);
                    setCategory(CATEGORIES_BY_DOMAIN[d][0]);
                    setSpecialties([]);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategory" error={errors.category}>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSpecialties([]);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES_BY_DOMAIN[domain].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {specialtyOptions.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-sm font-medium text-foreground">
                  Specialties
                </div>
                <div className="flex flex-wrap gap-2">
                  {specialtyOptions.map((s) => {
                    const active = specialties.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggle(specialties, setSpecialties, s)}
                        className={
                          "rounded-full border px-3 py-1 text-xs font-medium transition " +
                          (active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1.5 text-sm font-medium text-foreground">
                Complexity levels you handle
              </div>
              <p className="mb-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                <strong>How this is validated:</strong> you self-identify the
                tiers you handle here. <em>Simple</em> and <em>moderate</em>{" "}
                claims are accepted as-is.{" "}
                <strong>"Complex" must be proven by completed case work</strong>{" "}
                — until then it shows on your profile as{" "}
                <em>claimed · pending validation</em> and earns reduced points
                in client matching.
              </p>
              {errors.complexity_supported && (
                <p className="mb-1 text-xs text-destructive">
                  {errors.complexity_supported}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {(["simple", "moderate", "complex"] as Complexity[]).map((c) => {
                  const active = complexity.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggle(complexity, setComplexity, c)}
                      className={
                        "rounded-full border px-3 py-1 text-xs font-medium capitalize transition " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                      }
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Availability">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Soonest urgency you can take">
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as Urgency)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="high">High — within days</option>
                  <option value="medium">Medium — within 2 weeks</option>
                  <option value="low">Low — within a month+</option>
                </select>
              </Field>
              <Field label="Next available date" error={errors.next_available}>
                <Input
                  value={nextAvail}
                  onChange={setNextAvail}
                  type="date"
                  placeholder=""
                  maxLength={10}
                />
              </Field>
              <Field
                label="New matters per week"
                error={errors.weekly_capacity}
              >
                <NumInput
                  value={weeklyCapacity}
                  onChange={setWeeklyCapacity}
                  min={0}
                  max={200}
                />
              </Field>
            </div>
          </Section>

          <Section title="Budget range you serve">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Minimum engagement (USD)" error={errors.budget_min}>
                <NumInput
                  value={budgetMin}
                  onChange={setBudgetMin}
                  min={0}
                  max={1_000_000}
                  step={100}
                />
              </Field>
              <Field label="Maximum engagement (USD)" error={errors.budget_max}>
                <NumInput
                  value={budgetMax}
                  onChange={setBudgetMax}
                  min={0}
                  max={1_000_000}
                  step={100}
                />
              </Field>
            </div>
          </Section>

          <Section title="Verification">
            <p className="mb-3 text-xs text-muted-foreground">
              <strong>Verification is system-controlled.</strong> You provide
              your license details here; Syncora checks them against the
              issuing board and flips the <em>Verified</em> badge on after
              confirmation. You cannot mark your own listing as verified.
              Verified listings rank above unverified ones.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="License / bar number"
                error={errors.license_number}
              >
                <Input
                  value={licenseNumber}
                  onChange={setLicenseNumber}
                  placeholder="e.g. TX-24081234"
                  maxLength={40}
                />
              </Field>
              <Field label="Issuing board" error={errors.license_board}>
                <Input
                  value={licenseBoard}
                  onChange={setLicenseBoard}
                  placeholder="State Bar of Texas"
                  maxLength={120}
                />
              </Field>
            </div>
          </Section>

          <Section title="Public bio">
            <Field label="Short description shown to clients" error={errors.bio}>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={600}
                rows={4}
                placeholder="Senior litigators specializing in complex custody and high-asset divorce."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <p className="mt-1 text-xs text-muted-foreground">
              {bio.length}/600 characters
            </p>
          </Section>

          <Section title="Rate, firm size & team composition">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hourly rate (USD)" error={errors.hourly_rate}>
                <NumInput
                  value={hourlyRate ?? 0}
                  onChange={(v) => setHourlyRate(v === 0 ? undefined : v)}
                  min={0}
                  max={5000}
                  step={25}
                />
              </Field>
              <Field label="Firm size">
                <select
                  value={firmSize ?? ""}
                  onChange={(e) =>
                    setFirmSize((e.target.value as FirmSize) || undefined)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select —</option>
                  {Object.entries(FIRM_SIZE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Gender composition of professionals">
                <select
                  value={genderComp ?? ""}
                  onChange={(e) =>
                    setGenderComp(
                      (e.target.value as GenderComposition) || undefined,
                    )
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select —</option>
                  {Object.entries(GENDER_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={proBono}
                  onChange={(e) => setProBono(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <span className="text-sm text-foreground">
                  I offer pro bono / sliding-scale services
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={hasParalegal}
                  onChange={(e) => setHasParalegal(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <span className="text-sm text-foreground">
                  I work with a paralegal / support staff
                </span>
              </label>
            </div>
          </Section>

          <Section title="Ethical checklist">
            <p className="mb-3 text-xs text-muted-foreground">
              Attest to the standards you uphold with every client. Solo
              practitioners must additionally confirm backup-coverage
              arrangements.
            </p>
            <div className="space-y-2">
              {ETHICS_CHECKLIST.filter((i) => (i.soloOnly ? isSolo : true)).map(
                (item) => {
                  const checked = !!ethics[item.key];
                  const err = errors[`ethics.${item.key}`];
                  return (
                    <label
                      key={item.key}
                      className={
                        "flex items-start gap-3 rounded-md border bg-background px-3 py-2.5 " +
                        (err ? "border-destructive" : "border-input")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setEthics((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                      />
                      <span className="text-sm text-foreground">
                        <strong className="block font-medium">
                          {item.label}
                          {item.soloOnly && (
                            <span className="ml-2 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                              Solo required
                            </span>
                          )}
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                        {err && (
                          <span className="mt-1 block text-xs text-destructive">
                            {err}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                },
              )}
            </div>

            {isSolo && (
              <div className="mt-5">
                <div className="mb-1.5 text-sm font-medium text-foreground">
                  Backup-coverage firms / attorneys
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  List at least one outside attorney or firm you have a
                  standing arrangement with to cover deadlines and emergencies.
                </p>
                {errors.backup_firms && (
                  <p className="mb-2 text-xs text-destructive">
                    {errors.backup_firms}
                  </p>
                )}
                <div className="space-y-2">
                  {backupFirms.map((b, i) => (
                    <div
                      key={i}
                      className="grid gap-2 rounded-md border border-input bg-background p-3 md:grid-cols-[1.4fr_1fr_1.2fr_auto]"
                    >
                      <input
                        type="text"
                        value={b.firm}
                        onChange={(e) =>
                          setBackupFirms((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, firm: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Firm name *"
                        maxLength={120}
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        value={b.attorney ?? ""}
                        onChange={(e) =>
                          setBackupFirms((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, attorney: e.target.value }
                                : x,
                            ),
                          )
                        }
                        placeholder="Lead attorney"
                        maxLength={120}
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        value={b.contact ?? ""}
                        onChange={(e) =>
                          setBackupFirms((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, contact: e.target.value }
                                : x,
                            ),
                          )
                        }
                        placeholder="Email or phone"
                        maxLength={160}
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setBackupFirms((prev) =>
                            prev.length === 1
                              ? [{ firm: "", attorney: "", contact: "" }]
                              : prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBackupFirms((prev) => [
                      ...prev,
                      { firm: "", attorney: "", contact: "" },
                    ])
                  }
                  className="mt-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40"
                >
                  + Add another firm
                </button>
              </div>
            )}
          </Section>

          <Section title="Degrees & education">
            <p className="mb-3 text-xs text-muted-foreground">
              Add the academic degrees that qualify you for this practice.
              Each entry is verified by Syncora against the institution's
              registrar / National Student Clearinghouse and shown with a ✓
              once confirmed.
            </p>
            <div className="space-y-2">
              {degrees.map((d, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-md border border-input bg-background p-3 md:grid-cols-[0.8fr_1.6fr_1.2fr_0.6fr_auto]"
                >
                  <input
                    type="text"
                    value={d.degree}
                    onChange={(e) =>
                      setDegrees((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, degree: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="JD / LLM / MBA"
                    maxLength={40}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={d.institution}
                    onChange={(e) =>
                      setDegrees((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, institution: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Institution *"
                    maxLength={160}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={d.field ?? ""}
                    onChange={(e) =>
                      setDegrees((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, field: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Field (optional)"
                    maxLength={120}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={d.year ?? ""}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    onChange={(e) =>
                      setDegrees((prev) =>
                        prev.map((x, idx) =>
                          idx === i
                            ? { ...x, year: Number(e.target.value) || undefined }
                            : x,
                        ),
                      )
                    }
                    placeholder="Year"
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDegrees((prev) =>
                        prev.length === 1
                          ? [{ degree: "", institution: "", field: "", year: undefined }]
                          : prev.filter((_, idx) => idx !== i),
                      )
                    }
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setDegrees((prev) => [
                  ...prev,
                  { degree: "", institution: "", field: "", year: undefined },
                ])
              }
              className="mt-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40"
            >
              + Add another degree
            </button>
          </Section>

          <Section title="Certifications & board specialties">
            <p className="mb-3 text-xs text-muted-foreground">
              Board certifications, specialty credentials, and active
              professional certifications. Each is verified by Syncora with
              the issuing body and marked ✓ once confirmed.
            </p>
            <div className="space-y-2">
              {certifications.map((c, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-md border border-input bg-background p-3 md:grid-cols-[1.6fr_1.4fr_0.6fr_0.9fr_auto]"
                >
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) =>
                      setCertifications((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Certification name *"
                    maxLength={160}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={c.issuer}
                    onChange={(e) =>
                      setCertifications((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, issuer: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Issuing body *"
                    maxLength={160}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={c.year ?? ""}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    onChange={(e) =>
                      setCertifications((prev) =>
                        prev.map((x, idx) =>
                          idx === i
                            ? { ...x, year: Number(e.target.value) || undefined }
                            : x,
                        ),
                      )
                    }
                    placeholder="Year"
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    value={c.expires ?? ""}
                    onChange={(e) =>
                      setCertifications((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, expires: e.target.value } : x,
                        ),
                      )
                    }
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCertifications((prev) =>
                        prev.length === 1
                          ? [{ name: "", issuer: "", year: undefined, expires: "" }]
                          : prev.filter((_, idx) => idx !== i),
                      )
                    }
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setCertifications((prev) => [
                  ...prev,
                  { name: "", issuer: "", year: undefined, expires: "" },
                ])
              }
              className="mt-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40"
            >
              + Add another certification
            </button>
          </Section>

          <Section title="Continuing education (last 12 months)">
            <p className="mb-3 text-xs text-muted-foreground">
              Check each CLE / continuing-education topic you've completed in
              the last year. Add hours and the issuing provider where you can —
              clients see this on your profile.
            </p>
            <div className="space-y-2">
              {CE_CHECKLIST.map((item) => {
                const entry = ce[item.key];
                const checked = !!entry?.completed;
                return (
                  <div
                    key={item.key}
                    className="rounded-md border border-input bg-background p-3"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setCe((prev) => ({
                            ...prev,
                            [item.key]: {
                              ...(prev[item.key] ?? {}),
                              completed: e.target.checked,
                            },
                          }))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                      />
                      <span className="text-sm text-foreground">
                        <strong className="block font-medium">
                          {item.label}
                          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                            min {item.minHours} hr{item.minHours === 1 ? "" : "s"}
                          </span>
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </label>
                    {checked && (
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <input
                          type="number"
                          min={0}
                          max={200}
                          step={0.5}
                          value={entry?.hours ?? ""}
                          onChange={(e) =>
                            setCe((prev) => ({
                              ...prev,
                              [item.key]: {
                                ...(prev[item.key] ?? { completed: true }),
                                completed: true,
                                hours: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          placeholder="Hours"
                          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                        />
                        <input
                          type="date"
                          value={entry?.completed_on ?? ""}
                          onChange={(e) =>
                            setCe((prev) => ({
                              ...prev,
                              [item.key]: {
                                ...(prev[item.key] ?? { completed: true }),
                                completed: true,
                                completed_on: e.target.value,
                              },
                            }))
                          }
                          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={entry?.provider ?? ""}
                          onChange={(e) =>
                            setCe((prev) => ({
                              ...prev,
                              [item.key]: {
                                ...(prev[item.key] ?? { completed: true }),
                                completed: true,
                                provider: e.target.value,
                              },
                            }))
                          }
                          placeholder="CLE provider / bar"
                          maxLength={160}
                          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {library.length > 0 && (
            <Section title="Parameters other suppliers and clients commonly track">
              <p className="mb-3 text-xs text-muted-foreground">
                These came from past engagements (AI-normalized). You'll add the
                values per-client once you connect.
              </p>
              <div className="flex flex-wrap gap-2">
                {library.slice(0, 12).map((p) => (
                  <span
                    key={p.key}
                    title={p.example ? `e.g. ${p.example}` : undefined}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                  >
                    {p.label}{" "}
                    <span className="text-muted-foreground">×{p.uses}</span>
                  </span>
                ))}
              </div>
            </Section>
          )}

          <button
            type="submit"
            className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring md:w-auto"
          >
            Submit listing for verification
          </button>
        </form>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 border-b border-border pb-6 last:border-b-0 last:pb-0">
      <h2 className="mb-3 text-base font-semibold text-card-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
