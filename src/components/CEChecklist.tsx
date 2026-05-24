import { CE_CHECKLIST, type Provider } from "@/lib/providers";

export function CEChecklist({ provider }: { provider: Provider }) {
  const ce = provider.continuing_education ?? {};
  const completedCount = CE_CHECKLIST.filter((i) => ce[i.key]?.completed).length;
  const totalHours = CE_CHECKLIST.reduce(
    (sum, i) => sum + (ce[i.key]?.completed ? ce[i.key]?.hours ?? 0 : 0),
    0,
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-card-foreground">
          Continuing education (last 12 months)
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {completedCount}/{CE_CHECKLIST.length} · {totalHours} hrs
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Self-reported CLE / continuing-education credits. Hours and providers are
        spot-checked during verification.
      </p>
      <ul className="mt-4 space-y-2">
        {CE_CHECKLIST.map((item) => {
          const entry = ce[item.key];
          const ok = !!entry?.completed;
          const shortHours = ok && (entry?.hours ?? 0) < item.minHours;
          return (
            <li
              key={item.key}
              className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <span
                className={
                  "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " +
                  (ok
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground")
                }
              >
                {ok ? "✓" : "—"}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    min {item.minHours} hr{item.minHours === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {ok && (
                  <p
                    className={
                      "mt-1 text-xs " +
                      (shortHours ? "text-amber-600" : "text-muted-foreground")
                    }
                  >
                    {entry?.hours ?? 0} hr{(entry?.hours ?? 0) === 1 ? "" : "s"}
                    {entry?.completed_on ? ` · ${entry.completed_on}` : ""}
                    {entry?.provider ? ` · ${entry.provider}` : ""}
                    {shortHours && " — below recommended minimum"}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}