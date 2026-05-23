import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useProviders } from "@/lib/provider-store";
import {
  addReview,
  deleteReview,
  summarizeProvider,
  useReviews,
  type ReviewRating,
} from "@/lib/reviews-store";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Client Reviews — Syncora Connect" },
      {
        name: "description",
        content:
          "Honest reviews from past clients — outcomes, communication, billing, and bar complaints on file.",
      },
    ],
  }),
  component: ReviewsPage,
});

const OUTCOMES: { value: "favorable" | "mixed" | "unfavorable" | "pending"; label: string }[] = [
  { value: "favorable", label: "Favorable" },
  { value: "mixed", label: "Mixed" },
  { value: "unfavorable", label: "Unfavorable" },
  { value: "pending", label: "Pending" },
];

const COMPLAINT_STATUSES: { value: "filed" | "under_review" | "dismissed" | "sanction"; label: string }[] = [
  { value: "filed", label: "Filed" },
  { value: "under_review", label: "Under review" },
  { value: "dismissed", label: "Dismissed" },
  { value: "sanction", label: "Sanction issued" },
];

function ReviewsPage() {
  const providers = useProviders();
  const reviews = useReviews();

  const [providerId, setProviderId] = useState<string>(providers[0]?.id ?? "");
  const [authorName, setAuthorName] = useState("");
  const [matterType, setMatterType] = useState("");
  const [rating, setRating] = useState<ReviewRating>(4);
  const [outcome, setOutcome] = useState<"favorable" | "mixed" | "unfavorable" | "pending">("favorable");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [verifiedClient, setVerifiedClient] = useState(true);
  const [barComplaintFiled, setBarComplaintFiled] = useState(false);
  const [barComplaintBoard, setBarComplaintBoard] = useState("");
  const [barComplaintNumber, setBarComplaintNumber] = useState("");
  const [barComplaintStatus, setBarComplaintStatus] = useState<"filed" | "under_review" | "dismissed" | "sanction">("under_review");
  const [barComplaintNotes, setBarComplaintNotes] = useState("");

  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [onlyBarComplaints, setOnlyBarComplaints] = useState(false);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterProvider !== "all" && r.providerId !== filterProvider) return false;
      if (onlyBarComplaints && !r.barComplaintFiled) return false;
      return true;
    });
  }, [reviews, filterProvider, onlyBarComplaints]);

  function resetForm() {
    setAuthorName("");
    setMatterType("");
    setRating(4);
    setOutcome("favorable");
    setPros("");
    setCons("");
    setBarComplaintFiled(false);
    setBarComplaintBoard("");
    setBarComplaintNumber("");
    setBarComplaintStatus("under_review");
    setBarComplaintNotes("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;
    if (!authorName.trim() || !matterType.trim() || (!pros.trim() && !cons.trim())) return;

    addReview({
      providerId,
      providerName: provider.name,
      authorName: authorName.trim().slice(0, 80),
      matterType: matterType.trim().slice(0, 120),
      rating,
      outcome,
      pros: pros.trim().slice(0, 2000),
      cons: cons.trim().slice(0, 2000),
      verifiedClient,
      barComplaintFiled,
      barComplaintBoard: barComplaintFiled ? barComplaintBoard.trim().slice(0, 160) || undefined : undefined,
      barComplaintNumber: barComplaintFiled ? barComplaintNumber.trim().slice(0, 80) || undefined : undefined,
      barComplaintStatus: barComplaintFiled ? barComplaintStatus : undefined,
      barComplaintNotes: barComplaintFiled ? barComplaintNotes.trim().slice(0, 1000) || undefined : undefined,
    });
    resetForm();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-6 py-10">
          <div>
            <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              ← Back to matcher
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Client Reviews
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Honest, attributable feedback from past clients — the good, the bad, and any bar
              complaints on record. Reviews surface alongside matches so future clients see the
              full picture, not just marketing copy.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[2fr_3fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">Leave a review</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Be specific and factual. Anything submitted is visible to future clients.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <Field label="Provider">
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Your name / handle">
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={80}
                  placeholder="J. Doe or Anonymous"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Matter type">
                <input
                  value={matterType}
                  onChange={(e) => setMatterType(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Custody modification"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>

            <Field label="Rating">
              <div className="flex items-center gap-1">
                {([1, 2, 3, 4, 5] as ReviewRating[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className={
                      "text-2xl leading-none transition " +
                      (n <= rating ? "text-accent" : "text-muted-foreground/40 hover:text-muted-foreground")
                    }
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
              </div>
            </Field>

            <Field label="Outcome">
              <div className="inline-flex w-full rounded-md border border-input bg-background p-1">
                {OUTCOMES.map((o) => {
                  const active = o.value === outcome;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setOutcome(o.value)}
                      className={
                        "flex-1 rounded px-2 py-1.5 text-xs font-medium transition " +
                        (active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground")
                      }
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="What went well">
              <textarea
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Communication, preparation, results…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>

            <Field label="What went poorly">
              <textarea
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Missed deadlines, surprise billing, conflicts…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={verifiedClient}
                onChange={(e) => setVerifiedClient(e.target.checked)}
              />
              I was a paying or pro-bono client of this provider.
            </label>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={barComplaintFiled}
                  onChange={(e) => setBarComplaintFiled(e.target.checked)}
                />
                I have filed a bar complaint regarding this matter
              </label>
              {barComplaintFiled && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Disciplinary board">
                      <input
                        value={barComplaintBoard}
                        onChange={(e) => setBarComplaintBoard(e.target.value)}
                        maxLength={160}
                        placeholder="State Bar — Disciplinary Counsel"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </Field>
                    <Field label="Complaint #">
                      <input
                        value={barComplaintNumber}
                        onChange={(e) => setBarComplaintNumber(e.target.value)}
                        maxLength={80}
                        placeholder="DC-2025-0142"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </Field>
                  </div>
                  <Field label="Status">
                    <select
                      value={barComplaintStatus}
                      onChange={(e) =>
                        setBarComplaintStatus(e.target.value as typeof barComplaintStatus)
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {COMPLAINT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Basis of complaint">
                    <textarea
                      value={barComplaintNotes}
                      onChange={(e) => setBarComplaintNotes(e.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Neglect, commingling of funds, conflict of interest…"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Publish review
            </button>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {filtered.length} review{filtered.length === 1 ? "" : "s"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1.5"
              >
                <option value="all">All providers</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={onlyBarComplaints}
                  onChange={(e) => setOnlyBarComplaints(e.target.checked)}
                />
                Bar complaints only
              </label>
            </div>
          </div>

          {filterProvider !== "all" && (
            <ProviderSummaryCard providerId={filterProvider} reviews={reviews} />
          )}

          <ol className="mt-4 space-y-4">
            {filtered.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
                No reviews match this filter yet.
              </li>
            )}
            {filtered.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {r.providerName}
                    </div>
                    <h3 className="mt-0.5 text-sm font-semibold text-card-foreground">
                      {r.matterType}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        · {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {r.authorName}
                      {r.verifiedClient && (
                        <span className="ml-1 inline-flex rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground ring-1 ring-accent/40">
                          verified client
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-accent">
                      {"★".repeat(r.rating)}
                      <span className="text-muted-foreground/40">
                        {"★".repeat(5 - r.rating)}
                      </span>
                    </div>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize " +
                        (r.outcome === "favorable"
                          ? "bg-accent/15 text-accent-foreground ring-1 ring-accent/40"
                          : r.outcome === "unfavorable"
                            ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
                            : "bg-muted text-muted-foreground")
                      }
                    >
                      {r.outcome}
                    </span>
                  </div>
                </div>

                {r.pros && (
                  <p className="mt-3 text-sm text-foreground/90">
                    <span className="font-medium text-accent-foreground">+ </span>
                    {r.pros}
                  </p>
                )}
                {r.cons && (
                  <p className="mt-2 text-sm text-foreground/90">
                    <span className="font-medium text-destructive">− </span>
                    {r.cons}
                  </p>
                )}

                {r.barComplaintFiled && (
                  <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                    <div className="font-semibold uppercase tracking-wider text-destructive">
                      Bar complaint on record
                    </div>
                    <div className="mt-1 grid gap-1 text-foreground/80 sm:grid-cols-2">
                      {r.barComplaintBoard && (
                        <div><span className="text-muted-foreground">Board:</span> {r.barComplaintBoard}</div>
                      )}
                      {r.barComplaintNumber && (
                        <div><span className="text-muted-foreground">No.:</span> {r.barComplaintNumber}</div>
                      )}
                      {r.barComplaintStatus && (
                        <div className="capitalize">
                          <span className="text-muted-foreground">Status:</span>{" "}
                          {r.barComplaintStatus.replace("_", " ")}
                        </div>
                      )}
                    </div>
                    {r.barComplaintNotes && (
                      <p className="mt-2 text-foreground/80">{r.barComplaintNotes}</p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Remove this review?")) deleteReview(r.id);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

function ProviderSummaryCard({
  providerId,
  reviews,
}: {
  providerId: string;
  reviews: ReturnType<typeof useReviews>;
}) {
  const s = summarizeProvider(providerId, reviews);
  if (s.count === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <div className="text-2xl font-semibold text-foreground">{s.average.toFixed(1)}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">avg rating</div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-foreground">{s.count}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">reviews</div>
      </div>
      <div>
        <div
          className={
            "text-2xl font-semibold " +
            (s.barComplaints > 0 ? "text-destructive" : "text-foreground")
          }
        >
          {s.barComplaints}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">bar complaints</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}