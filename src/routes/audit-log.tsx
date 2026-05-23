import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit log — Syncora Connect" },
      {
        name: "description",
        content:
          "Immutable, append-only SoX 404 audit trail of every privileged action.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["admin", "auditor"]}>
      <AuditPage />
    </RequireAuth>
  ),
});

type Entry = {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  before_state: unknown;
  after_state: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

function AuditPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setRows((data ?? []) as Entry[]);
        setLoading(false);
      });
  }, []);

  const filtered = q
    ? rows.filter((r) =>
        [r.actor_email, r.action, r.resource_type, r.resource_id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : rows;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Syncora Connect
            </Link>
            <span>/</span>
            <span className="text-foreground">Audit log</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Sarbanes-Oxley audit trail
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Append-only. Rows cannot be edited or deleted. Visible to admins and
            auditors only.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by email, action, resource…"
            className="mt-4 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Change</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No entries.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.actor_email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-foreground">{r.resource_type}</div>
                      {r.resource_id && (
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {r.resource_id}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.before_state || r.after_state ? (
                        <pre className="max-w-md overflow-auto whitespace-pre-wrap text-[10px]">
                          {JSON.stringify(
                            { before: r.before_state, after: r.after_state },
                            null,
                            2,
                          )}
                        </pre>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}