import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  useAuth,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type AppRole,
} from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/admin/employees")({
  head: () => ({
    meta: [
      { title: "Admin · Employee delegation — Syncora Connect" },
      {
        name: "description",
        content:
          "Admin-only: assign and revoke employee roles. SoX-aligned segregation of duties (preparer vs approver).",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["admin"]}>
      <AdminEmployeesPage />
    </RequireAuth>
  ),
});

const ALL_ROLES: AppRole[] = ["admin", "approver", "preparer", "auditor", "viewer"];

type EmployeeRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  title: string | null;
  department: string | null;
  is_active: boolean;
  roles: AppRole[];
};

function AdminEmployeesPage() {
  const { audit, user: me } = useAuth();
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, email, display_name, title, department, is_active")
          .order("email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
    if (pErr || rErr) {
      setError(pErr?.message ?? rErr?.message ?? "Failed to load.");
      setLoading(false);
      return;
    }
    const byUser = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role as AppRole);
      byUser.set(r.user_id, list);
    }
    setRows(
      (profiles ?? []).map((p) => ({
        ...(p as Omit<EmployeeRow, "roles">),
        roles: byUser.get(p.user_id) ?? [],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRole(row: EmployeeRow, role: AppRole) {
    setBusy(row.user_id + ":" + role);
    setError(null);
    const hasIt = row.roles.includes(role);

    // SoX SoD check (client-side hint; the audit log is the system of record)
    if (!hasIt) {
      const conflicts: Record<AppRole, AppRole[]> = {
        preparer: ["approver"],
        approver: ["preparer"],
        admin: [],
        auditor: [],
        viewer: [],
      };
      const conflict = conflicts[role].find((c) => row.roles.includes(c));
      if (
        conflict &&
        !confirm(
          `Sarbanes-Oxley segregation: ${row.email} is already ${conflict}. Granting ${role} creates a duty conflict. Continue anyway?`,
        )
      ) {
        setBusy(null);
        return;
      }
    }

    if (hasIt) {
      // Prevent admin from removing their own admin role and locking everyone out
      if (role === "admin" && row.user_id === me?.id) {
        setError("You cannot remove your own admin role.");
        setBusy(null);
        return;
      }
      const { error: e } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", row.user_id)
        .eq("role", role);
      if (e) setError(e.message);
      else
        await audit({
          action: "role.revoke",
          resource_type: "user_roles",
          resource_id: row.user_id,
          before_state: { role, email: row.email },
        });
    } else {
      const { error: e } = await supabase
        .from("user_roles")
        .insert({ user_id: row.user_id, role, granted_by: me?.id });
      if (e) setError(e.message);
      else
        await audit({
          action: "role.grant",
          resource_type: "user_roles",
          resource_id: row.user_id,
          after_state: { role, email: row.email },
        });
    }
    setBusy(null);
    await load();
  }

  async function toggleActive(row: EmployeeRow) {
    setBusy(row.user_id + ":active");
    const next = !row.is_active;
    const { error: e } = await supabase
      .from("profiles")
      .update({ is_active: next })
      .eq("user_id", row.user_id);
    if (e) setError(e.message);
    else
      await audit({
        action: next ? "employee.reactivate" : "employee.deactivate",
        resource_type: "profiles",
        resource_id: row.user_id,
        before_state: { is_active: row.is_active },
        after_state: { is_active: next },
      });
    setBusy(null);
    await load();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Syncora Connect
            </Link>
            <span>/</span>
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground">Employees</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Employee delegation
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Assign least-privilege roles. Segregate <strong>Preparer</strong> from{" "}
            <strong>Approver</strong> to satisfy SoX § 404 segregation-of-duties.
            Every grant, revoke, and deactivation is written to the audit trail.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link
              to="/audit-log"
              className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground hover:text-primary"
            >
              View audit log →
            </Link>
            <Link
              to="/employee"
              className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground hover:text-primary"
            >
              Employee dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Role legend</h2>
          <ul className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
            {ALL_ROLES.map((r) => (
              <li key={r} className="rounded-lg border border-border bg-background p-3">
                <div className="text-sm font-semibold text-foreground">
                  {ROLE_LABELS[r]}
                </div>
                <div>{ROLE_DESCRIPTIONS[r]}</div>
              </li>
            ))}
          </ul>
        </section>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    No employees yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.user_id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {row.display_name || row.email.split("@")[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                      {row.title && (
                        <div className="text-xs text-muted-foreground">
                          {row.title}
                          {row.department ? ` · ${row.department}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ROLES.map((r) => {
                          const on = row.roles.includes(r);
                          const isBusy = busy === row.user_id + ":" + r;
                          return (
                            <button
                              key={r}
                              type="button"
                              disabled={isBusy}
                              onClick={() => toggleRole(row, r)}
                              className={
                                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-50 " +
                                (on
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/40")
                              }
                              title={ROLE_DESCRIPTIONS[r]}
                            >
                              {on ? "✓ " : "+ "}
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        disabled={busy === row.user_id + ":active"}
                        className={
                          "rounded-full border px-3 py-1 text-xs font-medium " +
                          (row.is_active
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-destructive/40 bg-destructive/10 text-destructive")
                        }
                      >
                        {row.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}