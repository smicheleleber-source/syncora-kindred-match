import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/employee",
    mode:
      s.mode === "signup" || s.mode === "signin"
        ? (s.mode as "signup" | "signin")
        : ("signin" as const),
  }),
  head: () => ({
    meta: [
      { title: "Employee sign in — Syncora Connect" },
      {
        name: "description",
        content:
          "Password-protected sign in for Syncora Connect employees. SoX-aligned role-based access.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, audit } = useAuth();
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 8) {
      return setError("Email and an 8+ character password are required.");
    }
    setBusy(true);
    try {
      const res =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(email, password, displayName);
      if (res.error) return setError(res.error);
      // best-effort audit (no-op if no session yet on signup w/ email confirm)
      void audit({
        action: mode === "signin" ? "auth.sign_in" : "auth.sign_up",
        resource_type: "auth.user",
      });
      navigate({ to: search.redirect });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            ← Syncora Connect
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Employee sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access is restricted. All activity is logged for SoX 404 compliance.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-10">
        <div className="mb-4 inline-flex rounded-full border border-border bg-card p-1 text-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "rounded-full px-4 py-1.5 font-medium transition " +
                (mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          {mode === "signup" && (
            <Field label="Display name">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
          )}
          <Field label="Work email">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@syncoraconnect.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Password (min 8 chars)">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {mode === "signin" && (
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <p className="text-xs text-muted-foreground">
            New accounts start with <strong>viewer</strong> access. The admin
            (<code className="rounded bg-muted px-1">{BOOTSTRAP_ADMIN_EMAIL}</code>)
            delegates roles via Admin → Employees.
          </p>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}