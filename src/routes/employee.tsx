import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ListChecks,
  ShieldAlert,
  FileText,
  Users,
  Gavel,
  Briefcase,
  ScrollText,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/employee")({
  head: () => ({
    meta: [
      { title: "Employee Portal — Syncora Connect" },
      {
        name: "description",
        content:
          "Internal employee portal: dashboard, task queue, court document risk review, audit log, and admin tools for Syncora staff.",
      },
      { property: "og:title", content: "Employee Portal — Syncora Connect" },
      {
        property: "og:description",
        content:
          "Single entry point for Syncora staff workflows — dashboard, task queue, risk review, audit, and admin.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["admin", "approver", "preparer", "auditor", "viewer"]}>
      <PortalShell>
        <PortalLanding />
      </PortalShell>
    </RequireAuth>
  ),
});

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { profile, roles, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-6 py-2 text-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            SoX 404
          </span>
          <span className="text-muted-foreground">
            All activity is logged. Signed in as{" "}
            <strong className="text-foreground">
              {profile?.display_name || profile?.email}
            </strong>{" "}
            · roles: {roles.join(", ") || "none"}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="ml-auto rounded-full border border-border bg-background px-2.5 py-0.5 text-muted-foreground hover:text-destructive"
          >
            Sign out
          </button>
        </div>
      </div>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/employee" className="text-sm font-semibold text-foreground">
            Syncora · Employee Portal
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-xs">
            <PortalNavLink to="/employee">Home</PortalNavLink>
            <PortalNavLink to="/employee/dashboard">Dashboard</PortalNavLink>
            <PortalNavLink to="/employee/tasks">Task queue</PortalNavLink>
            <PortalNavLink to="/court-docs">Risk review</PortalNavLink>
            <PortalNavLink to="/audit-log">Audit log</PortalNavLink>
            <PortalNavLink to="/admin/employees">Admin · Employees</PortalNavLink>
            <PortalNavLink to="/admin/providers">Admin · Providers</PortalNavLink>
            <PortalNavLink to="/admin/judges">Admin · Judges</PortalNavLink>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function PortalNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-transparent px-3 py-1 text-muted-foreground hover:border-border hover:text-foreground"
      activeProps={{ className: "rounded-full border border-border bg-background px-3 py-1 text-foreground" }}
      activeOptions={{ exact: to === "/employee" }}
    >
      {children}
    </Link>
  );
}

type Tile = {
  to: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const TILES: Tile[] = [
  { to: "/employee/dashboard", label: "Dashboard", desc: "Engagement, unmatched potential, matches by service line and month.", icon: LayoutDashboard },
  { to: "/employee/tasks", label: "Task queue", desc: "Personal work queue: intake reviews, follow-ups, escalations.", icon: ListChecks },
  { to: "/court-docs", label: "Court docs & risk", desc: "Upload filings; surface TROs, deadlines, and risk flags.", icon: ShieldAlert },
  { to: "/audit-log", label: "Audit log", desc: "Immutable SoX 404 record of every privileged action.", icon: ScrollText },
  { to: "/admin/employees", label: "Employees", desc: "Delegate roles, manage access, segregation of duties.", icon: Users, roles: ["admin"] },
  { to: "/admin/providers", label: "Providers", desc: "Validate professional specialties claimed by attorneys.", icon: Briefcase, roles: ["admin", "approver"] },
  { to: "/admin/judges", label: "Judges", desc: "Validate jurist experience records.", icon: Gavel, roles: ["admin", "approver"] },
  { to: "/reviews", label: "Reviews", desc: "Client feedback and match quality signals.", icon: FileText },
];

function PortalLanding() {
  const { profile, roles } = useAuth();
  const visible = TILES.filter(
    (t) => !t.roles || t.roles.some((r) => roles.includes(r as never)),
  );
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Employee portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Welcome{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 max-w-3xl text-base text-muted-foreground">
          Your daily workflow tools in one place. Access is gated by the role your administrator
          delegated, and every action is recorded for SoX 404 compliance.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <t.icon className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-card-foreground group-hover:text-primary">
                {t.label}
              </h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Your access</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Signed in as <strong className="text-foreground">{profile?.email}</strong>. Delegated
          roles: <strong className="text-foreground">{roles.join(", ") || "none"}</strong>. If you
          need additional access, request it from your administrator — role grants are logged.
        </p>
      </section>
    </div>
  );
}
