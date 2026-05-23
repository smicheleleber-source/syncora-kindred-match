import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useProviders } from "@/lib/provider-store";
import { useConnections } from "@/lib/connections";

export const Route = createFileRoute("/employee")({
  head: () => ({
    meta: [
      { title: "Employee Dashboard — Syncora Connect" },
      {
        name: "description",
        content:
          "Internal employee dashboard: lawyer engagement penetration, unmatched client potential, and matches made by month and service type.",
      },
    ],
  }),
  component: EmployeeDashboard,
});

// ---- Synthetic baseline so charts render meaningfully in demo state ----
// Real connection data from the live store is layered on top.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SERVICE_BUCKETS = [
  "Family law",
  "Criminal defense",
  "Personal injury",
  "Medical malpractice",
  "Estate planning",
  "Business law",
  "Other",
];

const SEED_MATCHES: Record<string, number[]> = {
  "Family law":          [8, 11, 13, 14, 17, 19, 22, 24, 21, 26, 28, 31],
  "Criminal defense":    [5,  6,  9, 10, 12, 14, 13, 15, 18, 17, 20, 22],
  "Personal injury":     [4,  7,  9, 11, 13, 12, 16, 18, 20, 22, 25, 27],
  "Medical malpractice": [2,  3,  4,  6,  7,  9, 11, 13, 14, 16, 18, 21],
  "Estate planning":     [6,  6,  8,  9, 10, 11, 13, 12, 15, 16, 18, 19],
  "Business law":        [3,  5,  6,  8,  9, 10, 12, 11, 14, 15, 16, 18],
  "Other":               [2,  3,  3,  4,  5,  5,  6,  7,  8,  9, 10, 11],
};

// ---- Litigation duration sample dataset ----
// Avg duration (months) from filing to resolution, by case type.
// `clientInvolved` flags matters where a Syncora-matched client is a party.
type LitigationRow = {
  id: string;
  caption: string;
  type: string;
  classAction: boolean;
  filed: string; // ISO
  resolved: string | null; // ISO or null if active
  status:
    | "filing"
    | "discovery"
    | "motions"
    | "trial"
    | "settlement"
    | "appeal"
    | "closed";
  clientInvolved: boolean;
  clientRole?: "plaintiff" | "class_member" | "defendant" | "intervenor";
};

const LITIGATION: LitigationRow[] = [
  { id: "l1", caption: "In re Northstar Pharma Recall", type: "Pharmacy malpractice", classAction: true,  filed: "2022-04-11", resolved: "2024-09-30", status: "closed",      clientInvolved: true,  clientRole: "class_member" },
  { id: "l2", caption: "Doe v. Mercy Hospital",          type: "Medical malpractice",  classAction: false, filed: "2023-01-22", resolved: null,         status: "discovery",  clientInvolved: true,  clientRole: "plaintiff" },
  { id: "l3", caption: "Patel v. Apex Trucking",         type: "Personal injury",      classAction: false, filed: "2024-06-05", resolved: "2025-08-14", status: "settlement", clientInvolved: true,  clientRole: "plaintiff" },
  { id: "l4", caption: "In re Vertex Data Breach",       type: "Consumer / privacy",   classAction: true,  filed: "2023-09-18", resolved: null,         status: "motions",    clientInvolved: true,  clientRole: "class_member" },
  { id: "l5", caption: "Estate of Reyes",                type: "Estate planning",      classAction: false, filed: "2024-02-09", resolved: "2024-12-20", status: "closed",      clientInvolved: false },
  { id: "l6", caption: "Carter v. Summit Builders",      type: "Construction defect",  classAction: false, filed: "2022-11-30", resolved: null,         status: "trial",      clientInvolved: false },
  { id: "l7", caption: "In re Helios Auto Airbag",       type: "Product liability",    classAction: true,  filed: "2021-07-14", resolved: "2025-03-02", status: "closed",      clientInvolved: true,  clientRole: "class_member" },
  { id: "l8", caption: "Nguyen v. Cascade Bank",         type: "Consumer finance",     classAction: false, filed: "2025-01-08", resolved: null,         status: "filing",     clientInvolved: true,  clientRole: "plaintiff" },
  { id: "l9", caption: "In re Greenfield Wage & Hour",   type: "Employment law",       classAction: true,  filed: "2023-05-21", resolved: null,         status: "discovery",  clientInvolved: false },
  { id: "l10", caption: "Brooks v. State (custody)",     type: "Family law",           classAction: false, filed: "2024-10-02", resolved: "2025-06-11", status: "closed",      clientInvolved: true,  clientRole: "plaintiff" },
  { id: "l11", caption: "In re Atlas Opioid MDL",        type: "Medical malpractice",  classAction: true,  filed: "2020-03-16", resolved: null,         status: "appeal",     clientInvolved: true,  clientRole: "class_member" },
  { id: "l12", caption: "Singh v. Lakeside Dental",      type: "Dental malpractice",   classAction: false, filed: "2024-04-19", resolved: null,         status: "motions",    clientInvolved: true,  clientRole: "plaintiff" },
];

function monthsBetween(a: string, b: string | Date): number {
  const start = new Date(a).getTime();
  const end = (b instanceof Date ? b : new Date(b)).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30.4375));
}

const STATUS_LABEL: Record<LitigationRow["status"], string> = {
  filing: "Filing",
  discovery: "Discovery",
  motions: "Motions",
  trial: "Trial",
  settlement: "Settlement",
  appeal: "Appeal",
  closed: "Closed",
};
const STATUS_TONE: Record<LitigationRow["status"], string> = {
  filing: "bg-muted text-foreground",
  discovery: "bg-primary/15 text-primary",
  motions: "bg-accent/20 text-foreground",
  trial: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  settlement: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  appeal: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  closed: "bg-foreground/10 text-muted-foreground",
};

function bucketFor(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("family")) return "Family law";
  if (c.includes("criminal")) return "Criminal defense";
  if (c.includes("injury")) return "Personal injury";
  if (c.includes("malpractice")) return "Medical malpractice";
  if (c.includes("estate")) return "Estate planning";
  if (c.includes("business") || c.includes("tax") || c.includes("employment")) return "Business law";
  return "Other";
}

function EmployeeDashboard() {
  const providers = useProviders();
  const connections = useConnections();

  // ---- Lawyer engagement penetration ----
  const engagement = useMemo(() => {
    const engagedIds = new Set(
      connections
        .filter((c) => c.status === "accepted" || c.status === "requested")
        .map((c) => c.providerId),
    );
    const total = providers.length;
    const engaged = providers.filter((p) => engagedIds.has(p.id)).length;
    const verified = providers.filter((p) => p.verified).length;
    const accepting = providers.filter(
      (p) => (p.weekly_capacity ?? 0) > 0 || p.next_available,
    ).length;
    const pct = total ? Math.round((engaged / total) * 100) : 0;
    return { total, engaged, verified, accepting, pct };
  }, [providers, connections]);

  // ---- Unmatched client potential ----
  const unmatched = useMemo(() => {
    const requested = connections.filter((c) => c.status === "requested");
    const declined = connections.filter((c) => c.status === "declined");
    const pipelineValue = requested.reduce(
      (sum, c) => sum + (c.clientBudgetMax || c.clientBudgetMin || 0),
      0,
    );
    const byCategory = new Map<string, number>();
    for (const c of requested) {
      byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + 1);
    }
    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return { open: requested.length, declined: declined.length, pipelineValue, topCategories, items: requested.slice(0, 8) };
  }, [connections]);

  // ---- Matches by month × service type (seed + live) ----
  const seriesByService = useMemo(() => {
    const out: Record<string, number[]> = {};
    for (const k of SERVICE_BUCKETS) out[k] = [...SEED_MATCHES[k]];
    for (const c of connections) {
      if (c.status !== "accepted") continue;
      const d = new Date(c.createdAt);
      const m = d.getMonth();
      const b = bucketFor(c.category);
      out[b][m] += 1;
    }
    return out;
  }, [connections]);

  const totalsByMonth = useMemo(
    () => MONTHS.map((_, i) => SERVICE_BUCKETS.reduce((s, k) => s + seriesByService[k][i], 0)),
    [seriesByService],
  );
  const ytdTotal = totalsByMonth.reduce((a, b) => a + b, 0);
  const maxMonthly = Math.max(...totalsByMonth, 1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Internal · Employee Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold">Engagement & Match Operations</h1>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        {/* KPI ROW */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi label="Lawyer penetration" value={`${engagement.pct}%`} sub={`${engagement.engaged} of ${engagement.total} engaged`} />
          <Kpi label="Verified providers" value={engagement.verified} sub="License + board confirmed" />
          <Kpi label="Accepting new matters" value={engagement.accepting} sub="Capacity > 0 this week" />
          <Kpi label="YTD matches" value={ytdTotal} sub="Across all service types" />
        </section>

        {/* PENETRATION */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold">Lawyer engagement penetration</h2>
              <p className="text-sm text-muted-foreground">
                Share of listed providers who have engaged with the matching system.
              </p>
            </div>
            <span className="text-3xl font-semibold tabular-nums">{engagement.pct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${engagement.pct}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <Stat label="Total listed" value={engagement.total} />
            <Stat label="Engaged" value={engagement.engaged} />
            <Stat label="Dormant" value={engagement.total - engagement.engaged} />
          </div>
        </section>

        {/* UNMATCHED CLIENT POTENTIAL */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold">Active unmatched client potential</h2>
              <p className="text-sm text-muted-foreground">
                Clients with open requests not yet accepted by a provider.
              </p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              Professional view
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Kpi label="Open requests" value={unmatched.open} sub="Awaiting acceptance" />
            <Kpi label="Pipeline value" value={`$${unmatched.pipelineValue.toLocaleString()}`} sub="Sum of client max budgets" />
            <Kpi label="Declined" value={unmatched.declined} sub="Reroute candidates" />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Top unmatched categories
              </h3>
              {unmatched.topCategories.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No open requests right now.
                </p>
              ) : (
                <ul className="space-y-2">
                  {unmatched.topCategories.map(([cat, n]) => {
                    const max = unmatched.topCategories[0][1];
                    const pct = Math.round((n / max) * 100);
                    return (
                      <li key={cat}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="capitalize">{cat}</span>
                          <span className="tabular-nums text-muted-foreground">{n}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recent open requests
              </h3>
              {unmatched.items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Nothing waiting.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {unmatched.items.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.providerName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="capitalize">{c.category}</span> · {c.clientLocation}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        ${c.clientBudgetMax.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* MATCHES BY MONTH × SERVICE TYPE */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold">Matches made — by month, by service type</h2>
              <p className="text-sm text-muted-foreground">
                Stacked monthly volume of accepted matches across service categories.
              </p>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">YTD: {ytdTotal}</span>
          </div>

          <StackedBarChart series={seriesByService} months={MONTHS} buckets={SERVICE_BUCKETS} max={maxMonthly} />

          <div className="mt-6 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            {SERVICE_BUCKETS.map((b, i) => (
              <div key={b} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded" style={{ background: colorFor(i) }} />
                <span className="truncate">{b}</span>
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {seriesByService[b].reduce((a, c) => a + c, 0)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

const PALETTE = [
  "oklch(0.65 0.18 250)",
  "oklch(0.7 0.17 30)",
  "oklch(0.7 0.18 145)",
  "oklch(0.68 0.2 330)",
  "oklch(0.78 0.16 85)",
  "oklch(0.6 0.14 200)",
  "oklch(0.55 0.08 280)",
];
function colorFor(i: number) {
  return PALETTE[i % PALETTE.length];
}

function StackedBarChart({
  series,
  months,
  buckets,
  max,
}: {
  series: Record<string, number[]>;
  months: string[];
  buckets: string[];
  max: number;
}) {
  const W = 760;
  const H = 260;
  const padL = 36;
  const padB = 28;
  const padT = 8;
  const innerW = W - padL - 8;
  const innerH = H - padB - padT;
  const bw = innerW / months.length;
  const barW = bw * 0.66;

  const yTicks = 4;
  const tickStep = Math.ceil(max / yTicks / 5) * 5 || 1;
  const yMax = tickStep * yTicks;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = tickStep * i;
          const y = padT + innerH - (v / yMax) * innerH;
          return (
            <g key={i}>
              <line x1={padL} x2={W - 8} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity={0.55}>
                {v}
              </text>
            </g>
          );
        })}

        {months.map((m, i) => {
          let acc = 0;
          const x = padL + i * bw + (bw - barW) / 2;
          return (
            <g key={m}>
              {buckets.map((b, bi) => {
                const v = series[b][i];
                const h = (v / yMax) * innerH;
                const y = padT + innerH - acc - h;
                acc += h;
                return (
                  <rect
                    key={b}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, h)}
                    fill={colorFor(bi)}
                    rx={1}
                  >
                    <title>{`${m} · ${b}: ${v}`}</title>
                  </rect>
                );
              })}
              <text
                x={x + barW / 2}
                y={H - 10}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity={0.65}
              >
                {m}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
