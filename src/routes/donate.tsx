import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useProviders } from "@/lib/provider-store";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate to self-governance alliances — Syncora Connect" },
      {
        name: "description",
        content:
          "Direct your dollars to mutual aid networks, co-ops, tenant unions, and community defense funds in the Syncora Connect directory.",
      },
    ],
  }),
  component: DonatePage,
});

const PRESETS = [25, 50, 100, 250, 500];

const donationSchema = z.object({
  amount: z
    .number()
    .min(1, "Minimum donation is $1")
    .max(100_000, "Contact us for amounts over $100,000"),
  recurring: z.boolean(),
  donor_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120)
    .regex(/^[A-Za-z .'-]+$/, "Letters, spaces, dashes only"),
  donor_email: z.string().trim().email("Enter a valid email").max(255),
  note: z.string().trim().max(400).optional().or(z.literal("")),
});

function DonatePage() {
  const all = useProviders();
  const alliances = useMemo(
    () => all.filter((p) => p.accepts_donations),
    [all],
  );

  const [selectedId, setSelectedId] = useState<string>(alliances[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(50);
  const [recurring, setRecurring] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pledged, setPledged] = useState<null | {
    alliance: string;
    amount: number;
    recurring: boolean;
  }>(null);

  const selected = alliances.find((a) => a.id === selectedId);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPledged(null);
    if (!selected) {
      setErrors({ alliance: "Pick an alliance to support" });
      return;
    }
    const parsed = donationSchema.safeParse({
      amount,
      recurring,
      donor_name: name,
      donor_email: email,
      note,
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path.join(".");
        if (!fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setPledged({
      alliance: selected.name,
      amount: parsed.data.amount,
      recurring: parsed.data.recurring,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-br from-accent/15 via-background to-primary/5">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Syncora Connect · Donate
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Move your money to self-governance.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Pick a mutual aid network, co-op, tenant union, or community defense
            fund. 100% of your pledge is routed to the alliance you choose.
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

      <main className="mx-auto grid max-w-4xl gap-6 px-6 py-10 md:grid-cols-[1fr_1.1fr]">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            Choose an alliance
          </h2>
          {errors.alliance && (
            <p className="mt-1 text-xs text-destructive">{errors.alliance}</p>
          )}
          <ul className="mt-3 space-y-2">
            {alliances.map((a) => {
              const active = a.id === selectedId;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={
                      "w-full rounded-xl border p-4 text-left transition " +
                      (active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5")
                    }
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="font-semibold text-foreground">
                        {a.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.location}
                      </div>
                    </div>
                    <div className="mt-0.5 text-xs capitalize text-primary">
                      {a.category}
                    </div>
                    {a.mission && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {a.mission}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          {pledged ? (
            <div className="rounded-lg border border-accent/40 bg-accent/10 p-5 text-sm">
              <div className="text-base font-semibold text-foreground">
                Thank you, {name.split(" ")[0]}.
              </div>
              <p className="mt-2 text-muted-foreground">
                Your {pledged.recurring ? "monthly" : "one-time"} pledge of{" "}
                <span className="font-semibold text-foreground">
                  ${pledged.amount.toLocaleString()}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {pledged.alliance}
                </span>{" "}
                has been recorded. We'll email{" "}
                <span className="font-mono text-xs">{email}</span> to confirm.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPledged(null);
                  setAmount(50);
                  setRecurring(false);
                  setName("");
                  setEmail("");
                  setNote("");
                }}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Give again →
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-foreground">
                Your pledge
              </h2>
              {selected && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Supporting{" "}
                  <span className="font-semibold text-foreground">
                    {selected.name}
                  </span>
                </p>
              )}

              <div className="mt-4">
                <div className="mb-1.5 text-sm font-medium text-foreground">
                  Amount (USD)
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => {
                    const active = amount === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmount(p)}
                        className={
                          "rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                          (active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                        }
                      >
                        ${p}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.amount}
                  </p>
                )}
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-foreground">Make this monthly</span>
              </label>

              <div className="mt-4 grid gap-4">
                <Field label="Your name" error={errors.donor_name}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label="Email for receipt" error={errors.donor_email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label="Note (optional)" error={errors.note}>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={400}
                    rows={3}
                    placeholder="Tell the alliance why you're giving."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Pledge ${amount.toLocaleString()}
                {recurring ? "/mo" : ""}
              </button>

              <p className="mt-3 text-[11px] text-muted-foreground">
                Pledges are recorded for the alliance. To process real payments
                end-to-end, enable Stripe in your Lovable Cloud settings.
              </p>
            </>
          )}
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}
