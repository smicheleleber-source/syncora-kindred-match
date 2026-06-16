import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CATEGORIES_BY_DOMAIN,
  DOMAINS,
  getLicensedStates,
  parseCityFromLocation,
  parseStateFromLocation,
  type Domain,
} from "@/lib/providers";
import { useProviders } from "@/lib/provider-store";
import { useConnections } from "@/lib/connections";

export const Route = createFileRoute("/supply-demand")({
  head: () => ({
    meta: [
      { title: "Supply vs demand by state — Syncora Connect" },
      {
        name: "description",
        content:
          "See where clients need lawyers and where supply is thin, by state and city, so you can decide whether to get licensed in a new jurisdiction.",
      },
    ],
  }),
  component: SupplyDemandPage,
});

interface Row {
  key: string;
  state: string;
  city?: string;
  supply: number;
  demand: number;
}

function ratio(supply: number, demand: number): string {
  if (demand === 0 && supply === 0) return "—";
  if (demand === 0) return "no demand yet";
  return (supply / demand).toFixed(2);
}

function gapBadge(supply: number, demand: number) {
  if (demand === 0 && supply === 0) {
    return <span className="text-xs text-muted-foreground">no signal</span>;
  }
  if (demand === 0) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        supply only
      </span>
    );
  }
  const r = supply / demand;
  if (r < 0.5) {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
        underserved · opportunity
      </span>
    );
  }
  if (r < 1.5) {
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
        balanced
      </span>
    );
  }
  return (
    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
      saturated
    </span>
  );
}

function SupplyDemandPage() {
  const providers = useProviders();
  const connections = useConnections();
  const [domain, setDomain] = useState<Domain>("Legal Services");
  const [category, setCategory] = useState<string>(
    CATEGORIES_BY_DOMAIN["Legal Services"][0],
  );
  const [view, setView] = useState<"state" | "city">("state");

  const { stateRows, cityRows } = useMemo(() => {
    const supplyByState = new Map<string, number>();
    const supplyByCity = new Map<string, { state: string; city: string; n: number }>();
    for (const p of providers) {
      if (p.category !== category) continue;
      for (const st of getLicensedStates(p)) {
        supplyByState.set(st, (supplyByState.get(st) ?? 0) + 1);
      }
      const city = parseCityFromLocation(p.location);
      const stateOfCity = parseStateFromLocation(p.location);
      if (city && stateOfCity) {
        const k = `${city}|${stateOfCity}`;
        const cur = supplyByCity.get(k) ?? { state: stateOfCity, city, n: 0 };
        cur.n += 1;
        supplyByCity.set(k, cur);
      }
    }

    const demandByState = new Map<string, number>();
    const demandByCity = new Map<string, { state: string; city: string; n: number }>();
    for (const c of connections) {
      if (c.category !== category) continue;
      const st = parseStateFromLocation(c.clientLocation);
      const city = parseCityFromLocation(c.clientLocation);
      if (st) demandByState.set(st, (demandByState.get(st) ?? 0) + 1);
      if (city && st) {
        const k = `${city}|${st}`;
        const cur = demandByCity.get(k) ?? { state: st, city, n: 0 };
        cur.n += 1;
        demandByCity.set(k, cur);
      }
    }

    const stateKeys = new Set([...supplyByState.keys(), ...demandByState.keys()]);
    const stateRows: Row[] = Array.from(stateKeys)
      .map((s) => ({
        key: s,
        state: s,
        supply: supplyByState.get(s) ?? 0,
        demand: demandByState.get(s) ?? 0,
      }))
      .sort((a, b) => {
        const ra = a.demand === 0 ? Infinity : a.supply / a.demand;
        const rb = b.demand === 0 ? Infinity : b.supply / b.demand;
        return ra - rb || b.demand - a.demand;
      });

    const cityKeys = new Set([...supplyByCity.keys(), ...demandByCity.keys()]);
    const cityRows: Row[] = Array.from(cityKeys)
      .map((k) => {
        const meta = supplyByCity.get(k) ?? demandByCity.get(k)!;
        return {
          key: k,
          state: meta.state,
          city: meta.city,
          supply: supplyByCity.get(k)?.n ?? 0,
          demand: demandByCity.get(k)?.n ?? 0,
        };
      })
      .sort((a, b) => {
        const ra = a.demand === 0 ? Infinity : a.supply / a.demand;
        const rb = b.demand === 0 ? Infinity : b.supply / b.demand;
        return ra - rb || b.demand - a.demand;
      });

    return { stateRows, cityRows };
  }, [providers, connections, category]);

  const rows = view === "state" ? stateRows : cityRows;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            For professionals · Market intelligence
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Supply vs demand by city &amp; state
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Compare how many vetted professionals are listed in each
            jurisdiction against the volume of client requests in that same
            jurisdiction. Use it to decide whether it's worth getting
            licensed in another state.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link to="/providers/join" className="text-primary hover:underline">
              ← Update the states I'm licensed in
            </Link>
            <Link to="/professionals" className="text-muted-foreground hover:text-foreground">
              For professionals home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Domain
            </span>
            <select
              value={domain}
              onChange={(e) => {
                const d = e.target.value as Domain;
                setDomain(d);
                setCategory(CATEGORIES_BY_DOMAIN[d][0]);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
            >
              {CATEGORIES_BY_DOMAIN[domain].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setView("state")}
              className={
                "rounded-md border px-3 py-2 text-sm font-medium " +
                (view === "state"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:text-foreground")
              }
            >
              By state
            </button>
            <button
              type="button"
              onClick={() => setView("city")}
              className={
                "rounded-md border px-3 py-2 text-sm font-medium " +
                (view === "city"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:text-foreground")
              }
            >
              By city
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">
                  {view === "state" ? "State" : "City, State"}
                </th>
                <th className="px-4 py-3 text-right">Supply (listed pros)</th>
                <th className="px-4 py-3 text-right">Demand (client requests)</th>
                <th className="px-4 py-3 text-right">Supply ÷ Demand</th>
                <th className="px-4 py-3 text-left">Signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No supply or demand recorded for this category yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {view === "state" ? r.state : `${r.city}, ${r.state}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.supply}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.demand}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {ratio(r.supply, r.demand)}
                  </td>
                  <td className="px-4 py-3">{gapBadge(r.supply, r.demand)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          <strong>Supply</strong> counts professionals listed in this category
          and licensed in that jurisdiction (using the states you declared on
          your listing, falling back to your primary office state).{" "}
          <strong>Demand</strong> counts client requests routed through
          Syncora intake for the same category in that jurisdiction. A ratio
          below <em>0.5</em> means roughly two clients per listed
          professional — a strong signal that getting licensed there could
          fill an unmet need.
        </p>
      </main>
    </div>
  );
}