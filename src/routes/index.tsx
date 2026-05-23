import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CATEGORIES_BY_DOMAIN,
  DOMAINS,
  DOMAIN_DESCRIPTIONS,
  FIRM_SIZE_LABELS,
  GENDER_LABELS,
  matchProviders,
  SPECIALTIES_BY_CATEGORY,
  type Complexity,
  type Domain,
  type MatchInput,
  type Urgency,
} from "@/lib/providers";
import { useProviders } from "@/lib/provider-store";
import { Link, useNavigate } from "@tanstack/react-router";
import { addConnection } from "@/lib/connections";
import { summarizeProvider, useReviews } from "@/lib/reviews-store";

type Matter = {
  id: string;
  domain: Domain | "Legal";
  input: MatchInput;
  created_at: number;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syncora Connect — Legal Matchmaking" },
      {
        name: "description",
        content:
          "Match with the right legal provider based on category, urgency, complexity, location, and budget.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [category, setCategory] = useState<string>("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [location, setLocation] = useState("Austin, TX");
  const [budgetMin, setBudgetMin] = useState(1000);
  const [budgetMax, setBudgetMax] = useState(5000);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [activeMatterId, setActiveMatterId] = useState<string | null>(null);
  const providerDirectory = useProviders();
  const reviews = useReviews();

  // Complexity is derived from the number of specialties required, not chosen
  // by the client. More specialties → narrower expertise → more complex matter.
  const complexity: Complexity =
    specialties.length >= 3
      ? "complex"
      : specialties.length >= 1
        ? "moderate"
        : "simple";

  const activeMatter = useMemo(
    () => matters.find((m) => m.id === activeMatterId) ?? null,
    [matters, activeMatterId],
  );
  const submitted = activeMatter?.input ?? null;
  const matches = useMemo(
    () => (submitted ? matchProviders(submitted, providerDirectory) : []),
    [submitted, providerDirectory],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: MatchInput = {
      category,
      specialties,
      urgency,
      complexity,
      location,
      budget_min: budgetMin,
      budget_max: budgetMax,
    };
    const matter: Matter = {
      id: crypto.randomUUID(),
      domain: domain ?? "Legal",
      input,
      created_at: Date.now(),
    };
    setMatters((prev) => [...prev, matter]);
    setActiveMatterId(matter.id);
    try {
      localStorage.setItem("syncora.lastMatchInput.v1", JSON.stringify(input));
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function startAnotherMatter() {
    setDomain(null);
    setCategory("");
    setSpecialties([]);
    setStep(1);
    setTimeout(() => {
      document.getElementById("intake")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function removeMatter(id: string) {
    setMatters((prev) => prev.filter((m) => m.id !== id));
    if (activeMatterId === id) setActiveMatterId(null);
  }

  const specialtyOptions = SPECIALTIES_BY_CATEGORY[category] ?? [];

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function pickDomain(d: Domain) {
    setDomain(d);
    setCategory("");
    setSpecialties([]);
    setStep(2);
  }

  function pickCategory(c: string) {
    setCategory(c);
    setSpecialties([]);
    setStep(3);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Syncora Connect
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Find the right professional in minutes.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Start with the reason you're here, narrow to a practice area, then tell us
            about your case. We'll score every provider and surface your top three matches.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground">
              Find a provider
            </span>
            <Link
              to="/providers/join"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              List your practice →
            </Link>
            <Link
              to="/professionals"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              For professionals →
            </Link>
            <Link
              to="/donate"
              className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-medium text-foreground hover:border-accent hover:text-accent-foreground"
            >
              ♥ Donate to alliances
            </Link>
            <Link
              to="/cases"
              className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-medium text-foreground hover:border-accent hover:text-accent-foreground"
            >
              Review & fund cases →
            </Link>
            <Link
              to="/court-docs"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Court docs & risk →
            </Link>
            <Link
              to="/reviews"
              className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-medium text-foreground hover:border-accent hover:text-accent-foreground"
            >
              ★ Client reviews →
            </Link>
            <Link
              to="/connections"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              My connections →
            </Link>
            <Link
              to="/playbooks/litigation"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Litigation playbook →
            </Link>
            <Link
              to="/playbooks/matrix"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Litigation matrix →
            </Link>
            <Link
              to="/collab"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Doc collaboration →
            </Link>
            <Link
              to="/advertise"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Advertise →
            </Link>
            <Link
              to="/legislative"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Legislative monitor →
            </Link>
            <Link
              to="/calendar"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Availability calendar →
            </Link>
            <Link
              to="/judges"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Judges & complaints →
            </Link>
            <Link
              to="/admin/providers"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Admin · Providers →
            </Link>
            <Link
              to="/solicitor"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Solicitor workspace →
            </Link>
            <Link
              to="/feedback"
              className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-medium text-foreground hover:border-accent hover:text-accent-foreground"
            >
              Feedback & roadmap →
            </Link>
            <Link
              to="/employee"
              className="rounded-full border border-border bg-background px-4 py-1.5 font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Employee dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <Stepper
          step={step}
          domain={domain}
          category={category}
          onJump={(s: 1 | 2 | 3) => setStep(s)}
        />

        {step === 1 && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-card-foreground">
              What brings you to Syncora Connect?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick the general reason — we'll narrow it down next.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDomain(d)}
                  className={
                    "group rounded-xl border p-5 text-left transition " +
                    (domain === d
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40 hover:bg-primary/5")
                  }
                >
                  <div className="text-base font-semibold text-foreground">{d}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {DOMAIN_DESCRIPTIONS[d]}
                  </div>
                  <div className="mt-3 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Continue →
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && domain && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">
                  Which {domain.toLowerCase()} subcategory fits best?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the practice area closest to your situation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </div>
            <div className="mt-6 grid gap-2 md:grid-cols-2">
              {CATEGORIES_BY_DOMAIN[domain].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickCategory(c)}
                  className="rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium capitalize text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  {c}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                Tell us about your case
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{domain}</span>
                {" › "}
                <span className="font-medium capitalize text-foreground">{category}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← Change
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Location (city, state)">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Austin, TX"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <Field label="Urgency">
              <SegGroup
                value={urgency}
                onChange={(v) => setUrgency(v as Urgency)}
                options={[
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
              />
            </Field>

            <Field label="Complexity (auto)">
              <div className="flex items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium capitalize text-foreground">
                  {complexity}
                </span>
                <span className="text-xs text-muted-foreground">
                  Derived from {specialties.length} specialt
                  {specialties.length === 1 ? "y" : "ies"} selected
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Complexity reflects how specialized the matter is, not a client
                judgement. Pick more specialties below to raise it.
              </p>
            </Field>

            <Field label="Budget — minimum (USD)">
              <input
                type="number"
                min={0}
                step={100}
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <Field label="Budget — maximum (USD)">
              <input
                type="number"
                min={0}
                step={100}
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
          </div>

          {specialtyOptions.length > 0 && (
            <div className="mt-6">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">
                  Specialties (optional)
                </span>
                <span className="text-xs text-muted-foreground">
                  Tap any that apply — e.g. custody, military, DUI
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map((s) => {
                  const active = specialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
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

          <button
            type="submit"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Find my top 3 matches
          </button>
        </form>
        )}

        <section id="results" className="mt-12">
          {submitted ? (
            <>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Your top matches
                </h2>
                <span className="text-xs text-muted-foreground">
                  Scored out of 100
                </span>
              </div>
              <ol className="mt-6 space-y-4">
                {matches.map((m, i) => (
                  <li
                    key={m.provider.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Match #{i + 1}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-card-foreground">
                          <Link
                            to="/providers/$id"
                            params={{ id: m.provider.id }}
                            className="hover:text-primary hover:underline"
                          >
                            {m.provider.name}
                          </Link>
                          {m.provider.verified && (
                            <span
                              title={`Verified · ${m.provider.license_board ?? "license on file"}`}
                              className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-accent-foreground ring-1 ring-accent/40"
                            >
                              ✓ Verified
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {m.provider.location} · ${m.provider.budget_min.toLocaleString()}–$
                          {m.provider.budget_max.toLocaleString()}
                        </p>
                        {(() => {
                          const s = summarizeProvider(m.provider.id, reviews);
                          if (s.count === 0) return null;
                          return (
                            <p className="mt-1 text-xs">
                              <Link
                                to="/reviews"
                                className="text-accent-foreground hover:underline"
                              >
                                ★ {s.average.toFixed(1)} · {s.count} review
                                {s.count === 1 ? "" : "s"}
                              </Link>
                              {s.barComplaints > 0 && (
                                <span className="ml-2 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive ring-1 ring-destructive/30">
                                  {s.barComplaints} bar complaint
                                  {s.barComplaints === 1 ? "" : "s"}
                                </span>
                              )}
                            </p>
                          );
                        })()}
                        {(m.provider.next_available || m.provider.weekly_capacity != null || m.provider.years_experience != null || m.provider.hourly_rate != null || m.provider.firm_size || m.provider.gender_composition || m.provider.pro_bono) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {m.provider.years_experience != null && (
                              <span>{m.provider.years_experience} yrs experience</span>
                            )}
                            {m.provider.next_available && (
                              <span> · Next open {m.provider.next_available}</span>
                            )}
                            {m.provider.weekly_capacity != null && (
                              <span> · {m.provider.weekly_capacity}/wk capacity</span>
                            )}
                            {m.provider.hourly_rate != null && m.provider.hourly_rate > 0 && (
                              <span> · ${m.provider.hourly_rate}/hr</span>
                            )}
                            {m.provider.firm_size && (
                              <span> · {FIRM_SIZE_LABELS[m.provider.firm_size]}</span>
                            )}
                            {m.provider.gender_composition && (
                              <span> · {GENDER_LABELS[m.provider.gender_composition]}</span>
                            )}
                            {m.provider.pro_bono && (
                              <span className="text-accent-foreground"> · Pro bono / sliding scale</span>
                            )}
                          </p>
                        )}
                        {m.provider.specialties.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {m.provider.specialties.map((s) => {
                              const matched = submitted?.specialties.includes(s);
                              return (
                                <span
                                  key={s}
                                  className={
                                    "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                                    (matched
                                      ? "bg-accent/20 text-accent-foreground ring-1 ring-accent/40"
                                      : "bg-muted text-muted-foreground")
                                  }
                                >
                                  {s}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 rounded-full bg-primary/10 px-3 py-1.5">
                        <span className="text-2xl font-semibold tabular-nums text-primary">
                          {m.score}
                        </span>
                        <span className="text-xs text-primary/70">/100</span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-foreground/80">{m.provider.bio}</p>

                    <CategoryMatchPanel
                      breakdown={m.breakdown}
                      requestedCategory={submitted?.category ?? ""}
                      providerCategory={m.provider.category}
                      requestedSpecialties={submitted?.specialties ?? []}
                      providerSpecialties={m.provider.specialties}
                    />

                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Other scoring factors
                      </div>
                      {m.breakdown
                        .filter((b) => b.label !== "Category" && b.label !== "Specialty")
                        .map((b) => (
                          <BreakdownBar key={b.label} {...b} />
                        ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (!submitted) return;
                          const c = addConnection({
                            providerId: m.provider.id,
                            providerName: m.provider.name,
                            category: m.provider.category,
                            clientNote: `Matched at ${m.score}/100 for ${submitted.category}.`,
                            clientLocation: submitted.location,
                            clientBudgetMin: submitted.budget_min,
                            clientBudgetMax: submitted.budget_max,
                          });
                          navigate({ to: "/connections", hash: c.id });
                        }}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                      >
                        Connect with {m.provider.name.split(" ")[0]}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        Starts an engagement where you and the provider define
                        custom parameters together.
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
              Submit your case above to see your top 3 matches with score breakdowns.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ratioTone(points: number, max: number): { bar: string; chip: string; label: string } {
  const ratio = max > 0 ? points / max : 0;
  if (ratio >= 0.85)
    return {
      bar: "bg-accent",
      chip: "bg-accent/15 text-accent-foreground ring-1 ring-accent/40",
      label: "Strong",
    };
  if (ratio >= 0.5)
    return {
      bar: "bg-primary",
      chip: "bg-primary/10 text-primary ring-1 ring-primary/30",
      label: "Partial",
    };
  if (ratio > 0)
    return {
      bar: "bg-muted-foreground/60",
      chip: "bg-muted text-muted-foreground ring-1 ring-border",
      label: "Weak",
    };
  return {
    bar: "bg-destructive/50",
    chip: "bg-destructive/10 text-destructive ring-1 ring-destructive/30",
    label: "No match",
  };
}

function BreakdownBar({
  label,
  points,
  max,
  note,
}: {
  label: string;
  points: number;
  max: number;
  note: string;
}) {
  const tone = ratioTone(points, max);
  const pct = max > 0 ? Math.round((points / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {points}/{max} · {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={"h-full " + tone.bar} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function CategoryMatchPanel({
  breakdown,
  requestedCategory,
  providerCategory,
  requestedSpecialties,
  providerSpecialties,
}: {
  breakdown: { label: string; points: number; max: number; note: string }[];
  requestedCategory: string;
  providerCategory: string;
  requestedSpecialties: string[];
  providerSpecialties: string[];
}) {
  const cat = breakdown.find((b) => b.label === "Category");
  const spec = breakdown.find((b) => b.label === "Specialty");
  if (!cat || !spec) return null;
  const subtotal = cat.points + spec.points;
  const subtotalMax = cat.max + spec.max;
  const subtotalPct = Math.round((subtotal / subtotalMax) * 100);
  const tone = ratioTone(subtotal, subtotalMax);
  const categoryHit =
    requestedCategory.toLowerCase() === providerCategory.toLowerCase();
  const matchedSpecs = requestedSpecialties.filter((s) =>
    providerSpecialties.map((p) => p.toLowerCase()).includes(s.toLowerCase()),
  );
  const missedSpecs = requestedSpecialties.filter(
    (s) => !providerSpecialties.map((p) => p.toLowerCase()).includes(s.toLowerCase()),
  );
  return (
    <div className="mt-5 rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Practice category match
          </div>
          <div className="mt-0.5 text-sm text-foreground">
            You asked for{" "}
            <span className="font-semibold capitalize">{requestedCategory || "—"}</span>
            {" · "}
            They practice{" "}
            <span className="font-semibold capitalize">{providerCategory}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " + tone.chip}>
            {tone.label}
          </span>
          <span className="tabular-nums text-sm font-semibold text-foreground">
            {subtotal}/{subtotalMax}
            <span className="ml-1 text-xs text-muted-foreground">({subtotalPct}%)</span>
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {categoryHit ? "✓ Category" : "✗ Category"}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {cat.points}/{cat.max}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={"h-full " + ratioTone(cat.points, cat.max).bar}
              style={{ width: `${(cat.points / cat.max) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{cat.note}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Specialty overlap
            </span>
            <span className="tabular-nums text-muted-foreground">
              {spec.points}/{spec.max}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={"h-full " + ratioTone(spec.points, spec.max).bar}
              style={{ width: `${(spec.points / spec.max) * 100}%` }}
            />
          </div>
          {requestedSpecialties.length === 0 ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{spec.note}</p>
          ) : (
            <div className="mt-1.5 space-y-1 text-xs">
              {matchedSpecs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-muted-foreground">Matched:</span>
                  {matchedSpecs.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent-foreground ring-1 ring-accent/40"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              )}
              {missedSpecs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-muted-foreground">Missing:</span>
                  {missedSpecs.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border"
                    >
                      ✗ {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SegGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex w-full rounded-md border border-input bg-background p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={
              "flex-1 rounded px-3 py-1.5 text-sm font-medium transition " +
              (active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  step,
  domain,
  category,
  onJump,
}: {
  step: 1 | 2 | 3;
  domain: Domain | null;
  category: string;
  onJump: (s: 1 | 2 | 3) => void;
}) {
  const items: { n: 1 | 2 | 3; label: string; value: string }[] = [
    { n: 1, label: "Reason", value: domain ?? "Choose" },
    { n: 2, label: "Subcategory", value: category || "—" },
    { n: 3, label: "Case details", value: step === 3 ? "In progress" : "—" },
  ];
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        const clickable = done || active;
        return (
          <li key={it.n} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(it.n)}
              className={
                "flex items-center gap-2 rounded-full border px-3 py-1.5 transition " +
                (active
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-border bg-background text-foreground hover:border-primary/40"
                    : "border-border bg-background text-muted-foreground")
              }
            >
              <span
                className={
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold " +
                  (active || done
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground")
                }
              >
                {it.n}
              </span>
              <span className="font-medium">{it.label}</span>
              <span className="hidden capitalize text-muted-foreground sm:inline">
                · {it.value}
              </span>
            </button>
            {i < items.length - 1 && (
              <span className="text-muted-foreground/50">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
