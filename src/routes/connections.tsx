import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  addParameter,
  promoteToLibrary,
  replaceParameters,
  updateConnection,
  useConnections,
  useLibrary,
  type Connection,
  type ConnectionParameter,
} from "@/lib/connections";
import { cleanupParameters } from "@/lib/ai-cleanup.functions";

export const Route = createFileRoute("/connections")({
  head: () => ({
    meta: [
      { title: "Connections — Syncora Connect" },
      {
        name: "description",
        content:
          "Active client ↔ supplier engagements. Add custom parameters and let AI normalize them.",
      },
    ],
  }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const connections = useConnections();
  const library = useLibrary();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Syncora Connect · Connections
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Active engagements
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Clients and suppliers add the parameters that define their relationship —
            scope, deliverables, anything that matters. AI normalizes them so future
            engagements reuse the cleanest version.
          </p>
          <div className="mt-5">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← Back to matching
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            Your connections
          </h2>
          {connections.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
              No connections yet. Match with a provider on the home page and tap
              <span className="mx-1 font-semibold text-foreground">Connect</span>
              to start one.
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {connections.map((c) => (
                <ConnectionCard key={c.id} conn={c} />
              ))}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="text-base font-semibold text-foreground">
            Shared parameter library
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cleaned parameters from every engagement. Future clients and suppliers
            see these as suggested fields.
          </p>
          {library.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-card/40 p-5 text-center text-xs text-muted-foreground">
              Empty for now. Clean up parameters on a connection to grow the library.
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {library.map((p) => (
                <li
                  key={p.key}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">
                      {p.label}
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      ×{p.uses}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {p.key}
                  </div>
                  {p.example && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      e.g. {p.example}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>
    </div>
  );
}

function ConnectionCard({ conn }: { conn: Connection }) {
  const cleanup = useServerFn(cleanupParameters);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [author, setAuthor] = useState<"client" | "supplier">("client");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const trimmedLabel = label.trim().slice(0, 120);
    const param: ConnectionParameter = {
      key: trimmedLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40),
      label: trimmedLabel,
      value: value.trim().slice(0, 500),
      author,
      cleaned: false,
    };
    addParameter(conn.id, param);
    setLabel("");
    setValue("");
  }

  async function runCleanup() {
    if (conn.parameters.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const result = await cleanup({
        data: {
          parameters: conn.parameters.map((p) => ({ label: p.label, value: p.value })),
        },
      });
      if (result.error) {
        setErr(result.error);
      } else {
        const cleaned: ConnectionParameter[] = result.cleaned.map((p, i) => ({
          key: p.key,
          label: p.label,
          value: p.value,
          author: conn.parameters[i]?.author ?? "client",
          cleaned: true,
        }));
        replaceParameters(conn.id, cleaned);
        promoteToLibrary(
          result.cleaned.map((p) => ({ key: p.key, label: p.label, example: p.value })),
        );
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Cleanup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Connection · {new Date(conn.createdAt).toLocaleDateString()}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {conn.providerName}
          </h3>
          <div className="mt-0.5 text-xs capitalize text-primary">
            {conn.category}
          </div>
        </div>
        <select
          value={conn.status}
          onChange={(e) =>
            updateConnection(conn.id, {
              status: e.target.value as Connection["status"],
            })
          }
          className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
        >
          <option value="requested">Requested</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      <p className="mt-3 text-sm text-foreground/80">
        <span className="font-medium">Initial brief:</span>{" "}
        {conn.clientNote || <em className="text-muted-foreground">No note provided.</em>}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {conn.clientLocation} · Budget ${conn.clientBudgetMin.toLocaleString()}–$
        {conn.clientBudgetMax.toLocaleString()}
      </p>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">Parameters</div>
          <button
            type="button"
            onClick={runCleanup}
            disabled={busy || conn.parameters.length === 0}
            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground transition hover:bg-accent/90 disabled:opacity-40"
          >
            {busy ? "Cleaning…" : "✨ Clean with AI"}
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}

        {conn.parameters.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {conn.parameters.map((p, i) => (
              <li
                key={`${p.key}-${i}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{p.label}</span>
                    {p.cleaned && (
                      <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-foreground">
                        cleaned
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {p.key}
                  </div>
                  <div className="mt-0.5 text-sm text-foreground/80">
                    {p.value || <em className="text-muted-foreground">—</em>}
                  </div>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                    (p.author === "client"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  {p.author}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            No parameters yet. Add the first one below.
          </p>
        )}

        <form
          onSubmit={add}
          className="mt-4 grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Parameter (e.g. # of kids, retainer, deadline)"
            maxLength={120}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            maxLength={500}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value as "client" | "supplier")}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="client">Client</option>
            <option value="supplier">Supplier</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Add
          </button>
        </form>
      </div>
    </li>
  );
}
