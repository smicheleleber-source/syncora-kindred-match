import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Syncora Connect" },
      {
        name: "description",
        content:
          "Request a one-time code by email or SMS to reset your Syncora Connect password.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (channel === "email") {
      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
        return setError("Enter a valid email address.");
      }
      setBusy(true);
      try {
        // Sends a 6-digit OTP suitable for `verifyOtp({ type: 'recovery' })`.
        const { error: err } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/reset-password`
                : undefined,
          },
        );
        if (err) return setError(err.message);
        navigate({
          to: "/reset-password",
          search: { channel: "email", identifier: cleanEmail },
        });
      } finally {
        setBusy(false);
      }
    } else {
      const cleanPhone = phone.trim().replace(/[^\d+]/g, "");
      if (!/^\+\d{8,15}$/.test(cleanPhone)) {
        return setError(
          "Enter your phone in international format, e.g. +15551234567.",
        );
      }
      setBusy(true);
      try {
        const { error: err } = await supabase.auth.signInWithOtp({
          phone: cleanPhone,
        });
        if (err) return setError(err.message);
        navigate({
          to: "/reset-password",
          search: { channel: "phone", identifier: cleanPhone },
        });
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary">
            ← Back to sign in
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll send a one-time code to your email or phone. Enter it on the
            next screen along with a new password.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-10">
        <div className="mb-4 inline-flex rounded-full border border-border bg-card p-1 text-sm">
          {(["email", "phone"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setChannel(c);
                setError(null);
              }}
              className={
                "rounded-full px-4 py-1.5 font-medium transition " +
                (channel === c
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {c === "email" ? "Email code" : "SMS code"}
            </button>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          {channel === "email" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Work email
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mobile number
              </span>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+15551234567"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Use international format with a leading +.
              </span>
            </label>
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
            {busy ? "Sending…" : "Send code"}
          </button>

          <p className="text-xs text-muted-foreground">
            Codes expire after a few minutes. If you don't receive one, check
            spam (email) or try again.
          </p>
        </form>
      </main>
    </div>
  );
}
