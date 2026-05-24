import { ETHICS_CHECKLIST, type Provider } from "@/lib/providers";

export function EthicsChecklist({
  provider,
  soloRequired,
}: {
  provider: Provider;
  soloRequired: boolean;
}) {
  const ethics = provider.ethics ?? {};
  const items = ETHICS_CHECKLIST.filter((i) => (i.soloOnly ? soloRequired : true));
  const attestedCount = items.filter((i) => ethics[i.key]).length;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-card-foreground">
          Professional ethics checklist
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {attestedCount}/{items.length} attested
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Self-attested by the provider on listing. Clients can flag missing items
        during review.
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const ok = !!ethics[item.key];
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
              <div>
                <div className="text-sm font-medium text-foreground">
                  {item.label}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {soloRequired && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
            Backup-coverage firms
          </h4>
          {provider.backup_firms && provider.backup_firms.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              {provider.backup_firms.map((b, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  <span className="font-medium">{b.firm}</span>
                  {b.attorney && (
                    <span className="text-muted-foreground"> · {b.attorney}</span>
                  )}
                  {b.contact && (
                    <span className="text-muted-foreground"> · {b.contact}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-destructive">
              No backup firms on file — required for solo practitioners.
            </p>
          )}
        </div>
      )}
    </section>
  );
}