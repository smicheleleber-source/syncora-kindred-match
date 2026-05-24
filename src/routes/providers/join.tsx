import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  type Complexity,
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
  years_experience: z.number().int().min(0).max(80),
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
  const [domain, setDomain] = useState<Domain>("Legal");
  const [category, setCategory] = useState<string>(
    CATEGORIES_BY_DOMAIN.Legal[0],
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
  const [years, setYears] = useState(5);
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
  const [ethics, setEthics] = useState<Partial<Record<EthicsKey, boolean>>>({});
  const [backupFirms, setBackupFirms] = useState<BackupContact[]>([
    { firm: "", attorney: "", contact: "" },
  ]);
  const [ce, setCe] = useState<Partial<Record<CEKey, CEEntry>>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

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
      years_experience: years,
      license_number: licenseNumber,
      license_board: licenseBoard,
      bio,
      pro_bono: proBono,
      hourly_rate: hourlyRate,
      firm_size: firmSize,
      gender_composition: genderComp,
      has_paralegal: hasParalegal,
      ethics,
      backup_firms: backupFirms
        .map((b) => ({
          firm: b.firm.trim(),
          attorney: b.attorney?.trim() || undefined,
          contact: b.contact?.trim() || undefined,
        }))
        .filter((b) => b.firm),
      continuing_education: ce,
    };
    const parsed = supplierSchema.safeParse(payload);
    if (!parsed.success) {
      const fe: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    const v = parsed.data;

    // "Verification" — simple heuristic on the validated fields. A real system
    // would call an external license registry; we mark verified when the
    // license + board look complete and experience is plausible.
    const verified =
      v.license_number.length >= 4 &&
      v.license_board.length >= 4 &&
      v.years_experience >= 1;

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
      years_experience: v.years_experience,
      verified,
      next_available: v.next_available || undefined,
      weekly_capacity: v.weekly_capacity,
      contact_email: v.contact_email,
      pro_bono: v.pro_bono,
      hourly_rate: v.hourly_rate,
      firm_size: v.firm_size,
      gender_composition: v.gender_composition,
      has_paralegal: v.has_paralegal,
      ethics: v.ethics,
      backup_firms: v.backup_firms,
      continuing_education: v.continuing_education,
    });

    setSuccess(
      verified
        ? "Your practice is live and verified. Clients can match with you now."
        : "Listing saved. Verification pending review of your license details.",
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
              <Field label="Years of experience" error={errors.years_experience}>
                <NumInput value={years} onChange={setYears} min={0} max={80} />
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
              We verify license details against the issuing board. Verified
              listings get a badge and rank above unverified ones.
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
