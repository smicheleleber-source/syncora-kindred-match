import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Advertise on Syncora Connect — Reach legal buyers & professionals" },
      {
        name: "description",
        content:
          "Transparent advertising packages for legal tech vendors, expert witnesses, court reporters, and adjacent service providers on Syncora Connect.",
      },
      { property: "og:title", content: "Advertise on Syncora Connect" },
      {
        property: "og:description",
        content:
          "Sponsored placements, category sponsorships, and lead-gen packages with transparent fees.",
      },
    ],
  }),
  component: AdvertisePage,
});

type Tier = {
  id: string;
  name: string;
  tagline: string;
  monthly: number;
  cpm?: number;
  cpl?: number;
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "listing",
    name: "Verified Listing",
    tagline: "For solo practitioners & boutique vendors",
    monthly: 49,
    features: [
      "Verified badge in directory",
      "1 practice area / category",
      "Standard placement in match results",
      "Up to 5 outbound contact requests / month",
      "Basic analytics dashboard",
    ],
  },
  {
    id: "spotlight",
    name: "Category Spotlight",
    tagline: "For growing firms & service providers",
    monthly: 299,
    cpl: 35,
    highlight: true,
    features: [
      "Pinned to top of 1 category for matched users",
      "Up to 3 practice areas / categories",
      "Sponsored card in playbook & matrix sidebars",
      "Lead routing with reply SLAs",
      "$35 per qualified lead (capped monthly)",
      "A/B test up to 3 creatives",
    ],
  },
  {
    id: "sponsor",
    name: "Vertical Sponsor",
    tagline: "Exclusive sponsorship of a domain or workflow",
    monthly: 1499,
    cpm: 12,
    features: [
      "Exclusive logo on a domain (Family, Criminal, Civil, IP…)",
      "Sponsor banner on Litigation Matrix & Playbook",
      "Co-branded resource hub page",
      "$12 CPM on display inventory beyond the included 250k impressions",
      "Quarterly performance review with our team",
      "Right of first refusal on category renewal",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise / API",
    tagline: "For legal tech platforms & national networks",
    monthly: 0,
    features: [
      "Custom integrations (SSO, CRM, intake API)",
      "Multi-state / multi-jurisdiction targeting",
      "Dedicated account manager",
      "Custom data feeds and reporting",
      "Negotiated CPL / CPM / flat-fee blends",
      "Compliance & legal review included",
    ],
  },
];

const ADDONS = [
  { name: "Newsletter sponsorship (weekly digest)", price: "$450 / send" },
  { name: "Case-review page sponsorship", price: "$200 / week" },
  { name: "Featured expert / vendor in playbook step", price: "$75 / step / mo" },
  { name: "Geo-targeting boost (metro)", price: "+$50 / metro / mo" },
  { name: "Retargeting pixel & audience export", price: "$150 / mo" },
];

const POLICIES = [
  "No advertising directly to opposing parties of an active matter.",
  "All legal-service ads must include bar number and admitted jurisdictions.",
  "Expert witness ads require CV on file; no guaranteed-outcome language.",
  "Lead-gen fees are capped — you set a monthly maximum and we stop at the cap.",
  "30-day cancellation; unused prepaid impressions credited to next cycle.",
  "We don't sell user data. Targeting is contextual + self-declared category only.",
];

function AdvertisePage() {
  const [audience, setAudience] = useState(2500);
  const [cpl, setCpl] = useState(35);
  const [convRate, setConvRate] = useState(4);

  const projected = useMemo(() => {
    const leads = Math.round((audience * convRate) / 100);
    const spend = leads * cpl;
    return { leads, spend };
  }, [audience, cpl, convRate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
              ← Syncora Connect
            </Link>
            <h1 className="text-2xl font-semibold mt-1">Advertise on Syncora Connect</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Reach clients actively scoping legal work and professionals building cases — with transparent
              fees, hard spend caps, and a strict ad-quality policy.
            </p>
          </div>
          <Link
            to="/providers/join"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Start as a verified listing →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-12">
        <section className="grid gap-4 md:grid-cols-3">
          <Stat label="Monthly matched intakes" value="12,400+" />
          <Stat label="Active professionals" value="1,850" />
          <Stat label="Avg. lead reply time" value="2h 14m" />
        </section>

        <section>
          <h2 className="text-xl font-semibold">Fee structure</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            All tiers are month-to-month. Lead-gen and CPM components are billed in arrears with a
            user-defined monthly cap. No long-term contract required.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t) => (
              <article
                key={t.id}
                className={`rounded-xl border p-5 flex flex-col ${
                  t.highlight
                    ? "border-primary/60 bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  {t.highlight && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary-foreground">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.tagline}</p>
                <div className="mt-3">
                  {t.monthly > 0 ? (
                    <div>
                      <span className="text-2xl font-semibold">${t.monthly}</span>
                      <span className="text-xs text-muted-foreground"> / month</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-semibold">Custom</div>
                  )}
                  {t.cpl !== undefined && (
                    <div className="text-xs text-muted-foreground">+ ${t.cpl} per qualified lead</div>
                  )}
                  {t.cpm !== undefined && (
                    <div className="text-xs text-muted-foreground">+ ${t.cpm} CPM over included</div>
                  )}
                </div>
                <ul className="mt-4 space-y-1.5 text-sm flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-primary">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-5 rounded-md px-3 py-2 text-sm font-medium ${
                    t.highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {t.id === "enterprise" ? "Talk to sales" : "Get started"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Add-ons</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stack on top of any tier. Charged monthly unless noted.
            </p>
            <ul className="mt-4 divide-y divide-border">
              {ADDONS.map((a) => (
                <li key={a.name} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{a.name}</span>
                  <span className="font-medium">{a.price}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Spend estimator</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quick math for the Category Spotlight tier.
            </p>
            <div className="mt-4 space-y-4 text-sm">
              <Range
                label="Matched users / month in category"
                value={audience}
                min={500}
                max={20000}
                step={500}
                onChange={setAudience}
                format={(v) => v.toLocaleString()}
              />
              <Range
                label="Cost per qualified lead"
                value={cpl}
                min={15}
                max={150}
                step={5}
                onChange={setCpl}
                format={(v) => `$${v}`}
              />
              <Range
                label="Expected conversion rate"
                value={convRate}
                min={1}
                max={15}
                step={1}
                onChange={setConvRate}
                format={(v) => `${v}%`}
              />
              <div className="rounded-md bg-muted p-3 text-sm">
                Projected: <strong>{projected.leads}</strong> qualified leads / mo · estimated spend{" "}
                <strong>${projected.spend.toLocaleString()}</strong> (plus $299 base).
              </div>
              <p className="text-[11px] text-muted-foreground">
                Estimates only. Actual results depend on creative, category competition, and reply
                speed. Set a hard monthly cap in your dashboard at any time.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Ad policy</h2>
          <ul className="mt-3 grid gap-2 md:grid-cols-2 text-sm">
            {POLICIES.map((p) => (
              <li key={p} className="rounded-md border border-border bg-card p-3">
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Ready to advertise?</h2>
            <p className="text-sm text-muted-foreground">
              We review every new advertiser within 1 business day.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="mailto:ads@syncoraconnect.com"
              className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/40 hover:text-primary"
            >
              Email ads@syncoraconnect.com
            </a>
            <Link
              to="/providers/join"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Apply now
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium text-foreground">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1"
      />
    </label>
  );
}