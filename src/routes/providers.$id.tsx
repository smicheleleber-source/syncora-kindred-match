import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FIRM_SIZE_LABELS,
  GENDER_LABELS,
  getExperienceYears,
  getValidatedComplexity,
  getClaimedPendingComplexity,
  isSoloPractitioner,
  matchProviders,
  SOLO_LAWYER_DISCOUNT_PCT,
  type MatchInput,
  type ScoredProvider,
} from "@/lib/providers";
import { useProviders } from "@/lib/provider-store";
import { SoloLawyerBenefits } from "@/components/SoloLawyerBenefits";
import { EthicsChecklist } from "@/components/EthicsChecklist";
import { CEChecklist } from "@/components/CEChecklist";
import { ProviderReviews } from "@/components/ProviderReviews";

const MATCH_INPUT_KEY = "syncora.lastMatchInput.v1";

export const Route = createFileRoute("/providers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Provider · ${params.id} — Syncora Connect` },
      {
        name: "description",
        content:
          "Full provider bio and a detailed breakdown of why this provider ranked in your top matches.",
      },
    ],
  }),
  component: ProviderDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">Provider not found</h1>
      <Link to="/" className="mt-3 inline-block text-primary hover:underline">
        Back to matching
      </Link>
    </div>
  ),
});

function ProviderDetail() {
  const { id } = Route.useParams();
  const providers = useProviders();
  const provider = providers.find((p) => p.id === id);
  const [lastInput, setLastInput] = useState<MatchInput | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MATCH_INPUT_KEY);
      if (raw) setLastInput(JSON.parse(raw) as MatchInput);
    } catch {
      /* ignore */
    }
  }, []);

  if (!provider) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Provider not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This provider may have been removed.
        </p>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          Back to matching
        </Link>
      </div>
    );
  }

  const scored: ScoredProvider | null = lastInput
    ? matchProviders(lastInput, [provider])[0] ?? null
    : null;

  const isSoloLawyer =
    provider.has_paralegal === false &&
    /law|legal|attorney|defense|injury|estate|immigration|tax|employment|business|real estate|family/i.test(
      provider.category,
    );
  const displayRate =
    isSoloLawyer && provider.hourly_rate
      ? Math.round(provider.hourly_rate * (1 - SOLO_LAWYER_DISCOUNT_PCT / 100))
      : provider.hourly_rate;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            Syncora Connect
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to matches
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">
                {provider.name}
                {provider.verified && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-accent-foreground ring-1 ring-accent/40">
                    ✓ Verified
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {provider.category} · {provider.location} · $
                {provider.budget_min.toLocaleString()}–$
                {provider.budget_max.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Availability: {provider.availability} urgency
              </p>
              <ComplexityLine provider={provider} />
            </div>
            {scored && (
              <div className="flex items-baseline gap-1 rounded-full bg-primary/10 px-3 py-1.5">
                <span className="text-2xl font-semibold tabular-nums text-primary">
                  {scored.score}
                </span>
                <span className="text-xs text-primary/70">/100</span>
              </div>
            )}
          </div>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Bio
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {provider.bio || "No bio provided."}
          </p>

          {(provider.years_experience != null ||
            provider.hourly_rate != null ||
            provider.firm_size ||
            provider.gender_composition ||
            provider.pro_bono ||
            provider.weekly_capacity != null ||
            provider.next_available) && (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              {provider.years_experience != null && (
                <Stat label="Experience" value={`${provider.years_experience} yrs`} />
              )}
              {provider.hourly_rate != null && provider.hourly_rate > 0 && (
                <Stat
                  label="Hourly rate"
                  value={
                    isSoloLawyer
                      ? `$${displayRate} (−${SOLO_LAWYER_DISCOUNT_PCT}%)`
                      : `$${provider.hourly_rate}`
                  }
                />
              )}
              {provider.weekly_capacity != null && (
                <Stat label="Weekly capacity" value={`${provider.weekly_capacity}`} />
              )}
              {provider.next_available && (
                <Stat label="Next available" value={provider.next_available} />
              )}
              {provider.firm_size && (
                <Stat label="Firm size" value={FIRM_SIZE_LABELS[provider.firm_size]} />
              )}
              {provider.gender_composition && (
                <Stat label="Team" value={GENDER_LABELS[provider.gender_composition]} />
              )}
              {provider.pro_bono && <Stat label="Pro bono" value="Yes" />}
            </dl>
          )}

          {provider.specialties.length > 0 && (
            <>
              <h2 className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Specialties
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-muted-foreground">
                  {(provider.validated_specialties ?? []).length}/
                  {provider.specialties.length} validated
                </span>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Specialties are first reported by the provider as claimed
                experience, then promoted to <strong>validated</strong> once the
                system confirms them (license check, sample work, references).
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {provider.specialties.map((s) => {
                  const matched = lastInput?.specialties.includes(s);
                  const validated = (provider.validated_specialties ?? []).includes(s);
                  return (
                    <span
                      key={s}
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                        (matched
                          ? "bg-accent/20 text-accent-foreground ring-1 ring-accent/40"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      <span
                        title={validated ? "Validated by Syncora" : "Claimed — pending validation"}
                        className={
                          "text-[10px] " +
                          (validated ? "text-emerald-600" : "text-amber-600")
                        }
                      >
                        {validated ? "✓" : "◷"}
                      </span>
                      {s}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {isSoloLawyer && <SoloLawyerBenefits className="mt-6" variant="profile" />}

        <div className="mt-6">
          <EthicsChecklist
            provider={provider}
            soloRequired={isSoloPractitioner(provider)}
          />
        </div>

        <div className="mt-6">
          <CEChecklist provider={provider} />
        </div>

        <div className="mt-6">
          <ProviderReviews provider={provider} />
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Why this match ranked here</h2>
          {scored ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Scored against your last submitted case:{" "}
                <strong>{lastInput?.category}</strong>,{" "}
                {lastInput?.urgency} urgency, {lastInput?.complexity} complexity,{" "}
                {lastInput?.location || "no location"}, $
                {lastInput?.budget_min.toLocaleString()}–$
                {lastInput?.budget_max.toLocaleString()}.
              </p>
              <div className="mt-5 space-y-3">
                {scored.breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {b.points}/{b.max}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${(b.points / b.max) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{b.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-medium">Total</span>
                <span className="tabular-nums">
                  {scored.score}/
                  {scored.breakdown.reduce((s, b) => s + b.max, 0)}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Submit a case on the{" "}
              <Link to="/" className="text-primary hover:underline">
                matching page
              </Link>{" "}
              to see the exact reasons this provider ranks for your situation.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function ComplexityLine({
  provider,
}: {
  provider: import("@/lib/providers").Provider;
}) {
  const validated = getValidatedComplexity(provider);
  const pending = getClaimedPendingComplexity(provider);
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span>Handles:</span>
      {validated.length > 0 ? (
        validated.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold capitalize text-accent-foreground ring-1 ring-accent/40"
          >
            ✓ {c}
          </span>
        ))
      ) : (
        <span className="italic text-muted-foreground/80">
          no validated tiers yet
        </span>
      )}
      {pending.map((c) => (
        <span
          key={c}
          className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300"
          title="Self-claimed — pending case-work validation"
        >
          {c} · claimed
        </span>
      ))}
    </p>
  );
}