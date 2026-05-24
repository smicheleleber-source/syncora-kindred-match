import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s) => ({
    channel: s.channel === "phone" ? ("phone" as const) : ("email" as const),
    identifier: typeof s.identifier === "string" ? s.identifier : "",
  }),
  head: () => ({
    meta: [
      { title: "Reset password — Syncora Connect" },
      {
        name: "description",
        content:
          "Enter the one-time code we sent you and set a new password for your Syncora Connect account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = useSearch({ from: "/reset-password" });
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!search.identifier) {
      return setError(
        "Missing email or phone. Go back and request a new code.",
      );
    }
    if (!/^\d{4,8}$/.test(code.trim())) {
      return setError("Enter the numeric code from your email or SMS.");
    }
    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setBusy(true);
    try {
      // Step 1: verify the OTP. This establishes a session for the user.
      const verify =
        search.channel === "phone"
          ? await supabase.auth.verifyOtp({
              phone: search.identifier,
              token: code.trim(),
              type: "sms",
            })
          : await supabase.auth.verifyOtp({
              email: search.identifier,
              token: code.trim(),
              type: "recovery",
            });
      if (verify.error) return setError(verify.error.message);

      // Step 2: with the recovery session active, set the new password.
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) return setError(updateErr.message);

      navigate({ to: "/employee" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link
            to="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            ← Request a different code
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Enter your code
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a one-time code to{" "}
            <span className="font-medium text-foreground">
              {search.identifier || "your account"}
            </span>
            . Enter it below along with a new password.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-10">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              One-time code
            </span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.4em]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              New password (min 8 chars)
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirm new password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

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
            {busy ? "Verifying…" : "Set new password"}
          </button>
        </form>
      </main>
    </div>
  );
}
