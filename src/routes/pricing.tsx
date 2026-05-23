import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Syncora Connect" },
      {
        name: "description",
        content:
          "Graduated service pricing and early-adopter tiers for Syncora Connect. Volume discounts scale as your matter load grows.",
      },
      { property: "og:title", content: "Pricing — Syncora Connect" },
      {
        property: "og:description",
        content:
          "Pay-as-you-grow service pricing plus early-adopter cohorts locked in at founding rates.",
      },
    ],
  }),
  component: PricingPage,
});

type ServiceTier = {
  name: string;
  matters: string;
  unitPrice: number;
  blended: string;
  features: string[];
  highlight?: boolean;
};

const SERVICE_TIERS: ServiceTier[] = [
  {
    name: "Starter",
    matters: "1 – 10 matters / month",
    unitPrice: 79,
    blended: "$79 per matter",
    features: [
      "Client intake & matching",
      "Court document vault (5 GB)",
      "Trust ledger — 1 account",
      "Email support",
    ],
  },
  {
    name: "Practice",
    matters: "11 – 50 matters / month",
    unitPrice: 59,
    blended: "$59 per matter after the first 10",
    features: [
      "Everything in Starter",
      "Provider directory listing",
      "Trust ledger — 10 accounts",
      "Playbook library access",
      "Priority support (next business day)",
    ],
    highlight: true,
  },
  {
    name: "Firm",
    matters: "51 – 250 matters / month",
    unitPrice: 39,
    blended: "$39 per matter after the first 50",
    features: [
      "Everything in Practice",
      "Multi-seat employee portal (up to 25)",
      "SoX 404 audit log exports",
      "Court calendar sync",
      "Dedicated success manager",
    ],
  },
  {
    name: "Enterprise",
    matters: "250+ matters / month",
    unitPrice: 19,
    blended: "$19 per matter at volume",
    features: [
      "Everything in Firm",
      "Unlimited seats & trust accounts",
      "Custom roles & SSO",
      "On-prem audit export & DPA",
      "24/7 incident response",
    ],
  },
];

type EarlyTier = {
  cohort: string;
  seats: string;
  discount: string;
  lockIn: string;
  perks: string[];
  closed?: boolean;
};

const EARLY_TIERS: EarlyTier[] = [
  {
    cohort: "Founding 50",
    seats: "Seats 1 – 50",
    discount: "60% off list, for life",
    lockIn: "Locked while account stays active",
    perks: [
      "Founding-member badge in directory",
      "Direct line to product team",
      "Vote on the roadmap",
    ],
    closed: true,
  },
  {
    cohort: "Pioneer 250",
    seats: "Seats 51 – 300",
    discount: "40% off list for 24 months",
    lockIn: "Then 20% off list, for life",
    perks: [
      "Early access to new portals",
      "Quarterly roadmap previews",
      "Co-marketing opportunities",
    ],
  },
  {
    cohort: "Early Adopter",
    seats: "Seats 301 – 1,000",
    discount: "25% off list for 12 months",
    lockIn: "Then 10% off list for 24 months",
    perks: [
      "Onboarding workshop included",
      "Beta-feature opt-in",
      "Listed in launch announcement",
    ],
  },
  {
    cohort: "Launch Cohort",
    seats: "Seats 1,001+",
    discount: "15% off year one",
    lockIn: "Renews at list price",
    perks: ["Standard onboarding", "Public release features"],
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Syncora Connect
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Pricing that scales with you
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            Graduated per-matter pricing for services, and time-boxed early-adopter
            cohorts for teams that come on board now. No hidden seat fees.
          </p>
        </div>

        {/* Service tiers */}
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Graduated service pricing
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            One bill, blended across tiers. The first 10 matters land in Starter,
            the next 40 at the Practice rate, and so on — so the average cost per
            matter falls as your caseload grows.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SERVICE_TIERS.map((t) => (
              <div
                key={t.name}
                className={`relative rounded-3xl border bg-card p-6 transition ${
                  t.highlight
                    ? "border-primary/60 shadow-md ring-1 ring-primary/30"
                    : "border-border"
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most common
                  </span>
                )}
                <h3 className="text-lg font-semibold text-card-foreground">{t.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {t.matters}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-foreground">
                    ${t.unitPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">/ matter</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.blended}</p>
                <ul className="mt-5 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-card-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Worked example */}
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
            <p className="text-sm font-medium text-foreground">
              Worked example — 75 matters in a month
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              10 × $79 (Starter) + 40 × $59 (Practice) + 25 × $39 (Firm) ={" "}
              <span className="font-semibold text-foreground">$4,125</span>, a blended{" "}
              <span className="font-semibold text-foreground">$55</span> per matter —
              vs. $5,925 at flat Starter pricing.
            </p>
          </div>
        </section>

        {/* Early-adopter tiers */}
        <section className="mt-16">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Early-adopter pricing
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Cohort-based discounts that apply on top of the graduated service
            pricing above. Each cohort closes when its seat count is reached — once
            it's gone, the next cohort opens at a smaller discount.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {EARLY_TIERS.map((t) => (
              <div
                key={t.cohort}
                className={`rounded-3xl border bg-card p-6 ${
                  t.closed ? "opacity-60" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {t.cohort}
                  </h3>
                  {t.closed ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Closed
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                      Open
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {t.seats}
                </p>
                <p className="mt-4 text-xl font-semibold text-foreground">
                  {t.discount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t.lockIn}</p>
                <ul className="mt-4 space-y-2">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-card-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-3xl border border-border bg-card p-8 text-center">
          <Users className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Ready to lock in a cohort rate?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Pick the portal that fits your role and we'll walk you through onboarding
            with the current early-adopter discount applied.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/portals"
              className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Choose your portal
            </Link>
            <Link
              to="/auth"
              className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Create an account
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}