import { Link, useLocation } from "@tanstack/react-router";
import { useAuth, type AppRole, ROLE_LABELS } from "@/lib/auth";

export function RequireAuth({
  roles,
  children,
}: {
  roles?: AppRole[];
  children: React.ReactNode;
}) {
  const { user, loading, hasAnyRole, roles: myRoles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted to authenticated employees. All activity is
            logged for SoX 404 compliance.
          </p>
          <Link
            to="/auth"
            search={{ redirect: location.pathname, mode: "signin" as const }}
            className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This screen requires one of:{" "}
            <strong>
              {roles.map((r) => ROLE_LABELS[r]).join(", ")}
            </strong>
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your roles:{" "}
            {myRoles.length ? myRoles.join(", ") : "none assigned yet"}. Ask your
            admin to delegate access.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-md border border-border bg-background px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}