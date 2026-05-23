import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CATEGORIES_BY_DOMAIN,
  DOMAINS,
  DOMAIN_DESCRIPTIONS,
  matchProviders,
  SPECIALTIES_BY_CATEGORY,
  type Complexity,
  type Domain,
  type MatchInput,
  type Urgency,
} from "@/lib/providers";

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [category, setCategory] = useState<string>("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [complexity, setComplexity] = useState<Complexity>("moderate");
  const [location, setLocation] = useState("Austin, TX");
  const [budgetMin, setBudgetMin] = useState(1000);
  const [budgetMax, setBudgetMax] = useState(5000);
  const [submitted, setSubmitted] = useState<MatchInput | null>(null);

  const matches = useMemo(
    () => (submitted ? matchProviders(submitted) : []),
    [submitted],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted({
      category,
      specialties,
      urgency,
      complexity,
      location,
      budget_min: budgetMin,
      budget_max: budgetMax,
    });
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
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
    setSubmitted(null);
    setStep(2);
  }

  function pickCategory(c: string) {
    setCategory(c);
    setSpecialties([]);
    setSubmitted(null);
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

            <Field label="Complexity">
              <SegGroup
                value={complexity}
                onChange={(v) => setComplexity(v as Complexity)}
                options={[
                  { value: "simple", label: "Simple" },
                  { value: "moderate", label: "Moderate" },
                  { value: "complex", label: "Complex" },
                ]}
              />
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
                          {m.provider.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {m.provider.location} · ${m.provider.budget_min.toLocaleString()}–$
                          {m.provider.budget_max.toLocaleString()}
                        </p>
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

                    <div className="mt-5 space-y-2">
                      {m.breakdown.map((b) => (
                        <div key={b.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{b.label}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {b.points}/{b.max}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${(b.points / b.max) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{b.note}</p>
                        </div>
                      ))}
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
