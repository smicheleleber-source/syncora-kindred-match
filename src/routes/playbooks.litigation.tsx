import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LITIGATION_PLAYBOOK } from "@/lib/playbooks";

type Role = "client" | "professional";

const STORAGE_KEY = "syncora.playbook.litigation.v1";

export const Route = createFileRoute("/playbooks/litigation")({
  head: () => ({
    meta: [
      { title: "Civil Litigation Playbook — Syncora Connect" },
      {
        name: "description",
        content:
          "A systematic, phase-by-phase litigation roadmap for clients and attorneys. Track tasks, deliverables, and red flags from intake to appeal.",
      },
    ],
  }),
  component: LitigationPlaybook,
});

function LitigationPlaybook() {
  const [role, setRole] = useState<Role>("client");
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {}
  }, [done]);

  const pb = LITIGATION_PLAYBOOK;

  const { total, completed } = useMemo(() => {
    let total = 0;
    let completed = 0;
    for (const phase of pb.phases) {
      for (const t of phase.tasks[role]) {
        total++;
        if (done[`${role}:${phase.id}:${t}`]) completed++;
      }
    }
    return { total, completed };
  }, [done, role, pb]);

  function toggle(key: string) {
    setDone((d) => ({ ...d, [key]: !d[key] }));
  }

  function reset() {
    if (confirm("Reset progress for this role?")) {
      setDone((d) => {
        const next = { ...d };
        for (const k of Object.keys(next)) {
          if (k.startsWith(`${role}:`)) delete next[k];
        }
        return next;
      });
    }
  }

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">Syncora Connect</Link>
            <span>/</span>
            <span>Playbooks</span>
            <span>/</span>
            <span className="text-foreground">Civil Litigation</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {pb.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">{pb.summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              {(["client", "professional"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={
                    "rounded-full px-4 py-1.5 text-sm font-medium transition " +
                    (role === r
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {r === "client" ? "I'm the client" : "I'm the professional"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            >
              Reset progress
            </button>
          </div>

          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{role === "client" ? "Client" : "Professional"} progress</span>
              <span>
                {completed} / {total} ({pct}%)
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <ol className="space-y-6">
          {pb.phases.map((phase) => {
            const tasks = phase.tasks[role];
            const phaseDone = tasks.filter(
              (t) => done[`${role}:${phase.id}:${t}`],
            ).length;
            return (
              <li
                key={phase.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-card-foreground">
                    {phase.name}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {phase.typical_duration} · {phaseDone}/{tasks.length} done
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Goal:</span> {phase.goal}
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Your tasks ({role})
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {tasks.map((t) => {
                        const key = `${role}:${phase.id}:${t}`;
                        const checked = !!done[key];
                        return (
                          <li key={t}>
                            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background p-3 text-sm hover:border-primary/40">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(key)}
                                className="mt-0.5 h-4 w-4 accent-primary"
                              />
                              <span
                                className={
                                  checked
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }
                              >
                                {t}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Deliverables
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-foreground">
                        {phase.deliverables.map((d) => (
                          <li key={d}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive">
                        Red flags
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {phase.red_flags.map((d) => (
                          <li key={d}>⚠ {d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          This playbook is a general framework — not legal advice. Use it with a licensed
          attorney to align expectations, deadlines, and deliverables across each phase.
          Want a custom playbook for family law, criminal defense, or M&amp;A?{" "}
          <Link to="/connections" className="font-medium text-primary hover:underline">
            Bring it into a connection →
          </Link>
        </div>
      </main>
    </div>
  );
}